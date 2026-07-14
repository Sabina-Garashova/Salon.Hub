using SalonHub.Application.DTOs.Loyalty;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;
using SalonHub.Domain.Enums;

namespace SalonHub.Application.Services
{
    public interface ILoyaltyService
    {
        Task<LoyaltyBalanceDto> GetBalanceAsync(string customerId, int salonId);
        Task<List<LoyaltyTransactionDto>> GetHistoryAsync(string customerId, int salonId);
        Task AwardPointsForCompletedReservationAsync(int reservationId);
        Task<RedeemPointsResultDto> RedeemPointsAsync(string customerId, RedeemPointsDto dto);
        Task<bool> AwardBirthdayBonusAsync(string customerId, int points);
    }

    public class LoyaltyService : ILoyaltyService
    {
        private readonly IUnitOfWork _unitOfWork;

        private const int PointsPerCurrencyUnit = 1;
        private const int PointsRequiredPerDiscountUnit = 10;
        private const string BirthdayBonusDescription = "Ad günü hədiyyəsi 🎉";

        public LoyaltyService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<LoyaltyBalanceDto> GetBalanceAsync(string customerId, int salonId)
        {
            var account = await GetOrCreateAccountAsync(customerId, salonId);
            var salon = await _unitOfWork.Salons.GetByIdAsync(salonId);

            return new LoyaltyBalanceDto
            {
                SalonId = salonId,
                SalonName = salon?.Name ?? string.Empty,
                Points = account.Points,
                EquivalentDiscount = Math.Round((decimal)account.Points / PointsRequiredPerDiscountUnit, 2)
            };
        }

        public async Task<List<LoyaltyTransactionDto>> GetHistoryAsync(string customerId, int salonId)
        {
            var account = await GetOrCreateAccountAsync(customerId, salonId);

            var transactions = await _unitOfWork.LoyaltyTransactions.FindAsync(t =>
                t.LoyaltyAccountId == account.Id);

            return transactions
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new LoyaltyTransactionDto
                {
                    Points = t.Points,
                    Type = t.Type.ToString(),
                    Description = t.Description,
                    CreatedAt = t.CreatedAt
                })
                .ToList();
        }

        public async Task AwardPointsForCompletedReservationAsync(int reservationId)
        {
            var reservation = await _unitOfWork.Reservations.GetByIdAsync(reservationId)
                ?? throw new KeyNotFoundException("Rezervasiya tapılmadı.");

            var service = await _unitOfWork.Services.GetByIdAsync(reservation.ServiceId)
                ?? throw new KeyNotFoundException("Xidmət tapılmadı.");

            var pointsToAward = (int)(service.Price * PointsPerCurrencyUnit);
            if (pointsToAward <= 0) return;

            var account = await GetOrCreateAccountAsync(reservation.CustomerId, service.SalonId);
            account.Points += pointsToAward;
            account.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.LoyaltyAccounts.Update(account);

            var transaction = new LoyaltyTransaction
            {
                LoyaltyAccountId = account.Id,
                Points = pointsToAward,
                Type = LoyaltyTransactionType.Earned,
                Description = $"'{service.Name}' xidmətinə görə qazanılan xallar",
                ReservationId = reservation.Id
            };

            await _unitOfWork.LoyaltyTransactions.AddAsync(transaction);
            await _unitOfWork.CompleteAsync();
        }

        public async Task<RedeemPointsResultDto> RedeemPointsAsync(string customerId, RedeemPointsDto dto)
        {
            if (dto.DiscountAmount <= 0)
                throw new ArgumentException("Endirim məbləği müsbət olmalıdır.");

            var pointsToRedeem = (int)(dto.DiscountAmount * PointsRequiredPerDiscountUnit);

            var account = await GetOrCreateAccountAsync(customerId, dto.SalonId);

            if (account.Points < pointsToRedeem)
                throw new InvalidOperationException("Kifayət qədər xalınız yoxdur.");

            account.Points -= pointsToRedeem;
            account.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.LoyaltyAccounts.Update(account);

            var transaction = new LoyaltyTransaction
            {
                LoyaltyAccountId = account.Id,
                Points = -pointsToRedeem,
                Type = LoyaltyTransactionType.Redeemed,
                Description = $"{dto.DiscountAmount} AZN endirim üçün {pointsToRedeem} xal ərinildi"
            };

            await _unitOfWork.LoyaltyTransactions.AddAsync(transaction);
            await _unitOfWork.CompleteAsync();

            return new RedeemPointsResultDto
            {
                RemainingPoints = account.Points,
                DiscountAmount = dto.DiscountAmount
            };
        }

        public async Task<bool> AwardBirthdayBonusAsync(string customerId, int points)
        {
            var accounts = await _unitOfWork.LoyaltyAccounts.FindAsync(a => a.CustomerId == customerId);
            var accountList = accounts.ToList();

            if (!accountList.Any())
                return false;

            var currentYear = DateTime.UtcNow.Year;
            var alreadyAwardedThisYear = false;

            foreach (var account in accountList)
            {
                var existingBirthdayTransactions = await _unitOfWork.LoyaltyTransactions.FindAsync(t =>
                    t.LoyaltyAccountId == account.Id &&
                    t.Description == BirthdayBonusDescription &&
                    t.CreatedAt.Year == currentYear);

                if (existingBirthdayTransactions.Any())
                {
                    alreadyAwardedThisYear = true;
                    continue;
                }

                account.Points += points;
                account.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.LoyaltyAccounts.Update(account);

                var transaction = new LoyaltyTransaction
                {
                    LoyaltyAccountId = account.Id,
                    Points = points,
                    Type = LoyaltyTransactionType.Earned,
                    Description = BirthdayBonusDescription
                };

                await _unitOfWork.LoyaltyTransactions.AddAsync(transaction);
            }

            await _unitOfWork.CompleteAsync();

            return !alreadyAwardedThisYear;
        }

        private async Task<LoyaltyAccount> GetOrCreateAccountAsync(string customerId, int salonId)
        {
            var existing = await _unitOfWork.LoyaltyAccounts.FindAsync(a =>
                a.CustomerId == customerId && a.SalonId == salonId);

            var account = existing.FirstOrDefault();
            if (account is not null)
                return account;

            var newAccount = new LoyaltyAccount
            {
                CustomerId = customerId,
                SalonId = salonId,
                Points = 0
            };

            await _unitOfWork.LoyaltyAccounts.AddAsync(newAccount);
            await _unitOfWork.CompleteAsync();

            return newAccount;
        }
    }
}
