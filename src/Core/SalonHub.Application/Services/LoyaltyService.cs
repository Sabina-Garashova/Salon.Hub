using SalonHub.Application.DTOs.Loyalty;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;
using SalonHub.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.Services
{
    public interface ILoyaltyService
    {
        Task<LoyaltyBalanceDto> GetBalanceAsync(string customerId, int salonId);
        Task<List<LoyaltyTransactionDto>> GetHistoryAsync(string customerId, int salonId);
        Task AwardPointsForCompletedReservationAsync(int reservationId);
        Task<RedeemPointsResultDto> RedeemPointsAsync(string customerId, RedeemPointsDto dto);
    }

    public class LoyaltyService : ILoyaltyService
    {
        private readonly IUnitOfWork _unitOfWork;

        private const int PointsPerCurrencyUnit = 1;
        private const int PointsRequiredPerDiscountUnit = 10;

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

            int targetSalonId = service.SalonId;
            if (targetSalonId <= 0)
            {
                var branch = await _unitOfWork.Branches.GetByIdAsync(reservation.BranchId);
                targetSalonId = branch?.SalonId ?? 1;
            }

            // ÖNƏMLİ DƏYİŞİKLİK: Əgər xidmətin qiyməti 0-dırsa, müştəriyə standart 10 xal veririk,
            // qiymət varsa qiymət qədər xal hesablayırıq. Beləcə metod əsla 'return' olub sıfırlanmır!
            int pointsToAward = (int)(service.Price * PointsPerCurrencyUnit);
            if (pointsToAward <= 0)
            {
                pointsToAward = 10; // Qiymət tapılmadıqda və ya 0 olduqda standart bonus xal
            }

            var account = await GetOrCreateAccountAsync(reservation.CustomerId, targetSalonId);

            // Xalı artırırıq
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

            // Bütün dəyişiklikləri tək səfərdə bazaya yazırıq
            await _unitOfWork.CompleteAsync();
        }

        public async Task<RedeemPointsResultDto> RedeemPointsAsync(string customerId, RedeemPointsDto dto)
        {
            if (dto.PointsToRedeem <= 0)
                throw new ArgumentException("Ərinən xal sayı müsbət olmalıdır.");

            var account = await GetOrCreateAccountAsync(customerId, dto.SalonId);

            if (account.Points < dto.PointsToRedeem)
                throw new InvalidOperationException("Kifayət qədər xalınız yoxdur.");

            account.Points -= dto.PointsToRedeem;
            account.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.LoyaltyAccounts.Update(account);

            var discountAmount = Math.Round((decimal)dto.PointsToRedeem / PointsRequiredPerDiscountUnit, 2);

            var transaction = new LoyaltyTransaction
            {
                LoyaltyAccountId = account.Id,
                Points = -dto.PointsToRedeem,
                Type = LoyaltyTransactionType.Redeemed,
                Description = $"{dto.PointsToRedeem} xal ərinərək {discountAmount} AZN endirim əldə edildi"
            };

            await _unitOfWork.LoyaltyTransactions.AddAsync(transaction);
            await _unitOfWork.CompleteAsync();

            return new RedeemPointsResultDto
            {
                RemainingPoints = account.Points,
                DiscountAmount = discountAmount
            };
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
                Points = 0,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.LoyaltyAccounts.AddAsync(newAccount);

            // ÖNƏMLİ DƏYİŞİKLİK: Yeni hesab yaranan kimi bazaya yazılsın ki, Id-si 0 olaraq qalmasın!
            await _unitOfWork.CompleteAsync();

            return newAccount;
        }
    }
}