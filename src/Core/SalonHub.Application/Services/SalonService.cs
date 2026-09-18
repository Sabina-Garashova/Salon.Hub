using SalonHub.Application.Common;
using SalonHub.Application.DTOs.Salons;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Domain.Entities;

namespace SalonHub.Application.Services
{
    public interface ISalonService
    {
        Task<IReadOnlyList<SalonReadDto>> GetAllAsync(string? language = null);
        Task<SalonReadDto?> GetByIdAsync(int id, string? language = null);
        Task<SalonReadDto> CreateAsync(SalonCreateDto dto, string ownerId);
        Task UpdateAsync(int id, SalonUpdateDto dto, string requesterId, bool isSuperAdmin);
        Task DeleteAsync(int id, string requesterId, bool isSuperAdmin);
    }

    public class SalonService : ISalonService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notificationService;
        private readonly IUserLookupService _userLookupService;
        public SalonService(IUnitOfWork unitOfWork, INotificationService notificationService, IUserLookupService userLookupService)
        {
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
            _userLookupService = userLookupService;
        }

        public async Task<IReadOnlyList<SalonReadDto>> GetAllAsync(string? language = null)
        {
            var salons = await _unitOfWork.Salons.GetAllAsync();
            var result = new List<SalonReadDto>();
            foreach (var salon in salons)
                result.Add(await MapToReadDtoAsync(salon, language));
            return result;
        }

        public async Task<SalonReadDto?> GetByIdAsync(int id, string? language = null)
        {
            var salon = await _unitOfWork.Salons.GetByIdAsync(id);
            return salon is null ? null : await MapToReadDtoAsync(salon, language);
        }

        public async Task<SalonReadDto> CreateAsync(SalonCreateDto dto, string ownerId)
        {
            var salon = new Salon
            {
                NameAz = dto.NameAz,
                NameRu = dto.NameRu,
                NameEn = dto.NameEn,
                DescriptionAz = dto.DescriptionAz,
                DescriptionRu = dto.DescriptionRu,
                DescriptionEn = dto.DescriptionEn,
                Address = dto.Address,
                PhoneNumber = dto.PhoneNumber,
                OwnerId = ownerId
            };

            await _unitOfWork.Salons.AddAsync(salon);
            await _unitOfWork.CompleteAsync();

            var defaultBranch = new SalonHub.Domain.Entities.Branch
            {
                Name = $"{salon.NameAz} - Esas Filial",
                Address = salon.Address,
                PhoneNumber = salon.PhoneNumber,
                SalonId = salon.Id
            };
            await _unitOfWork.Branches.AddAsync(defaultBranch);
            await _unitOfWork.CompleteAsync();

            return await MapToReadDtoAsync(salon, null);
        }

        public async Task UpdateAsync(int id, SalonUpdateDto dto, string requesterId, bool isSuperAdmin)
        {
            var salon = await _unitOfWork.Salons.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Salon tapılmadı: {id}");

            if (!isSuperAdmin && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu salonu dəyişmək icazəniz yoxdur.");

            salon.NameAz = dto.NameAz;
            salon.NameRu = dto.NameRu;
            salon.NameEn = dto.NameEn;
            salon.DescriptionAz = dto.DescriptionAz;
            salon.DescriptionRu = dto.DescriptionRu;
            salon.DescriptionEn = dto.DescriptionEn;
            salon.Address = dto.Address;
            salon.PhoneNumber = dto.PhoneNumber;
            salon.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Salons.Update(salon);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id, string requesterId, bool isSuperAdmin)
        {
            var salon = await _unitOfWork.Salons.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Salon tapılmadı: {id}");

            if (!isSuperAdmin && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu salonu silmək icazəniz yoxdur.");

            var ownerId = salon.OwnerId;
            var salonName = salon.NameAz;

            salon.IsDeleted = true;
            _unitOfWork.Salons.Update(salon);
            await _unitOfWork.CompleteAsync();

            var deletedBySomeoneElse = !string.Equals(ownerId, requesterId, StringComparison.Ordinal);
            if (!string.IsNullOrWhiteSpace(ownerId) && deletedBySomeoneElse)
            {
                await _notificationService.NotifyReservationChangedAsync(
                    ownerId,
                    $"Salonunuz (\"{salonName}\") sistem administratoru tərəfindən silindi.");
            }
        }

        private async Task<SalonReadDto> MapToReadDtoAsync(Salon salon, string? language)
        {
            var reviews = await _unitOfWork.Reviews.FindAsync(r => r.SalonId == salon.Id);
            var reviewList = reviews.ToList();

            var branches = await _unitOfWork.Branches.FindAsync(b => b.SalonId == salon.Id);
            var mainBranch = branches.OrderBy(b => b.Id).FirstOrDefault();
            var currentAddress = mainBranch?.Address ?? salon.Address;

            string? ownerFullName = null;
            string? ownerEmail = null;
            if (!string.IsNullOrWhiteSpace(salon.OwnerId))
            {
                ownerFullName = await _userLookupService.GetFullNameAsync(salon.OwnerId);
                ownerEmail = await _userLookupService.GetEmailAsync(salon.OwnerId);
            }

            return new SalonReadDto
            {
                Id = salon.Id,
                Name = LanguageHelper.Select(salon.NameAz, salon.NameRu, salon.NameEn, language),
                Description = LanguageHelper.Select(
                    salon.DescriptionAz ?? string.Empty,
                    salon.DescriptionRu,
                    salon.DescriptionEn,
                    language),
                Address = currentAddress,
                PhoneNumber = salon.PhoneNumber,
                AverageRating = reviewList.Count > 0 ? Math.Round(reviewList.Average(r => r.Rating), 2) : 0,
                ReviewCount = reviewList.Count,
                IsMonthlyTopSalon = salon.IsMonthlyTopSalon,
                OwnerId = salon.OwnerId,
                OwnerFullName = ownerFullName,
                OwnerEmail = ownerEmail
            };
        }
    }
}






