using SalonHub.Application.Common;
using SalonHub.Application.DTOs.Services;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;

namespace SalonHub.Application.Services
{
    public interface IServiceCrudService
    {
        Task<IReadOnlyList<ServiceReadDto>> GetAllAsync(string? language = null);
        Task<ServiceReadDto?> GetByIdAsync(int id, string? language = null);
        Task<ServiceReadDto> CreateAsync(ServiceCreateDto dto, string requesterId, bool isSuperAdmin);
        Task UpdateAsync(int id, ServiceUpdateDto dto, string requesterId, bool isSuperAdmin);
        Task DeleteAsync(int id, string requesterId, bool isSuperAdmin);
        Task AddTagAsync(int serviceId, int tagId, string requesterId, bool isSuperAdmin);
        Task RemoveTagAsync(int serviceId, int tagId, string requesterId, bool isSuperAdmin);
    }

    public class ServiceCrudService : IServiceCrudService
    {
        private readonly IUnitOfWork _unitOfWork;

        public ServiceCrudService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<ServiceReadDto>> GetAllAsync(string? language = null)
        {
            var services = await _unitOfWork.Services.GetAllAsync();
            var allServiceTags = await _unitOfWork.ServiceTags.GetAllAsync();
            var tagsByService = allServiceTags.GroupBy(st => st.ServiceId).ToDictionary(g => g.Key, g => g.Select(st => st.TagId).ToList());
            return services.Select(s => MapToReadDto(s, language, tagsByService.TryGetValue(s.Id, out var tagIds) ? tagIds : new List<int>())).ToList();
        }

        public async Task<ServiceReadDto?> GetByIdAsync(int id, string? language = null)
        {
            var service = await _unitOfWork.Services.SingleOrDefaultAsync(s => s.Id == id, s => s.ServiceTags);
            return service is null ? null : MapToReadDto(service, language);
        }

        public async Task<ServiceReadDto> CreateAsync(ServiceCreateDto dto, string requesterId, bool isSuperAdmin)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(dto.CategoryId)
                ?? throw new KeyNotFoundException("Kateqoriya tapılmadı.");

            var salon = await _unitOfWork.Salons.GetByIdAsync(dto.SalonId)
                ?? throw new KeyNotFoundException("Salon tapılmadı.");

            if (!isSuperAdmin && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu salona xidmət əlavə etmək icazəniz yoxdur.");

            if (dto.RequiredEquipmentId.HasValue)
            {
                var equipment = await _unitOfWork.Equipments.GetByIdAsync(dto.RequiredEquipmentId.Value)
                    ?? throw new KeyNotFoundException("Avadanlıq tapılmadı.");
            }

            var existing = await _unitOfWork.Services.FindAsync(s =>
                s.SalonId == dto.SalonId && s.NameAz.ToLower() == dto.NameAz.ToLower());
            if (existing.Any())
                throw new InvalidOperationException($"'{dto.NameAz}' adlı xidmət bu salonda artıq mövcuddur.");

            var service = new Service
            {
                NameAz = dto.NameAz,
                NameRu = dto.NameRu,
                NameEn = dto.NameEn,
                DescriptionAz = dto.DescriptionAz,
                DescriptionRu = dto.DescriptionRu,
                DescriptionEn = dto.DescriptionEn,
                Price = dto.Price,
                DurationMinutes = dto.DurationMinutes,
                CategoryId = dto.CategoryId,
                SalonId = dto.SalonId,
                RequiredEquipmentId = dto.RequiredEquipmentId,
                DiscountPercent = dto.DiscountPercent,
                OriginalPrice = dto.OriginalPrice
            };

            await _unitOfWork.Services.AddAsync(service);
            await _unitOfWork.CompleteAsync();

            return MapToReadDto(service, null);
        }

        public async Task UpdateAsync(int id, ServiceUpdateDto dto, string requesterId, bool isSuperAdmin)
        {
            var service = await _unitOfWork.Services.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Xidmət tapılmadı: {id}");

            var salon = await _unitOfWork.Salons.GetByIdAsync(service.SalonId);
            if (!isSuperAdmin && salon is not null && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu xidməti dəyişmək icazəniz yoxdur.");

            var existing = await _unitOfWork.Services.FindAsync(s =>
                s.Id != id && s.SalonId == service.SalonId && s.NameAz.ToLower() == dto.NameAz.ToLower());
            if (existing.Any())
                throw new InvalidOperationException($"'{dto.NameAz}' adlı xidmət bu salonda artıq mövcuddur.");

            service.NameAz = dto.NameAz;
            service.NameRu = dto.NameRu;
            service.NameEn = dto.NameEn;
            service.DescriptionAz = dto.DescriptionAz;
            service.DescriptionRu = dto.DescriptionRu;
            service.DescriptionEn = dto.DescriptionEn;
            service.Price = dto.Price;
            service.DurationMinutes = dto.DurationMinutes;
            service.CategoryId = dto.CategoryId;
            service.RequiredEquipmentId = dto.RequiredEquipmentId;
            service.DiscountPercent = dto.DiscountPercent;
            service.OriginalPrice = dto.OriginalPrice;
            service.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Services.Update(service);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id, string requesterId, bool isSuperAdmin)
        {
            var service = await _unitOfWork.Services.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Xidmət tapılmadı: {id}");

            var salon = await _unitOfWork.Salons.GetByIdAsync(service.SalonId);
            if (!isSuperAdmin && salon is not null && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu xidməti silmək icazəniz yoxdur.");

            service.IsDeleted = true;
            _unitOfWork.Services.Update(service);
            await _unitOfWork.CompleteAsync();
        }

        public async Task AddTagAsync(int serviceId, int tagId, string requesterId, bool isSuperAdmin)
        {
            var service = await _unitOfWork.Services.SingleOrDefaultAsync(
                s => s.Id == serviceId, s => s.ServiceTags)
                ?? throw new KeyNotFoundException("Xidmət tapılmadı.");

            var salon = await _unitOfWork.Salons.GetByIdAsync(service.SalonId);
            if (!isSuperAdmin && salon is not null && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu xidmətə tag əlavə etmək icazəniz yoxdur.");

            var tag = await _unitOfWork.Tags.GetByIdAsync(tagId)
                ?? throw new KeyNotFoundException("Tag tapılmadı.");

            if (service.ServiceTags.Any(st => st.TagId == tagId))
                throw new InvalidOperationException("Bu tag artıq əlavə olunub.");

            service.ServiceTags.Add(new ServiceTag { ServiceId = serviceId, TagId = tagId });
            await _unitOfWork.CompleteAsync();
        }

        public async Task RemoveTagAsync(int serviceId, int tagId, string requesterId, bool isSuperAdmin)
        {
            var service = await _unitOfWork.Services.SingleOrDefaultAsync(
                s => s.Id == serviceId, s => s.ServiceTags)
                ?? throw new KeyNotFoundException("Xidmət tapılmadı.");

            var salon = await _unitOfWork.Salons.GetByIdAsync(service.SalonId);
            if (!isSuperAdmin && salon is not null && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu xidmətdən tag silmək icazəniz yoxdur.");

            var serviceTag = service.ServiceTags.FirstOrDefault(st => st.TagId == tagId)
                ?? throw new KeyNotFoundException("Bu tag bu xidmətə əlavə olunmayıb.");

            service.ServiceTags.Remove(serviceTag);
            await _unitOfWork.CompleteAsync();
        }

        private static ServiceReadDto MapToReadDto(Service service, string? language, List<int>? tagIdsOverride = null) => new()
        {
            Id = service.Id,
            Name = LanguageHelper.Select(service.NameAz, service.NameRu, service.NameEn, language),
            Description = LanguageHelper.Select(
                service.DescriptionAz ?? string.Empty,
                service.DescriptionRu,
                service.DescriptionEn,
                language),
            Price = service.Price,
            DurationMinutes = service.DurationMinutes,
            CategoryId = service.CategoryId,
            SalonId = service.SalonId,
            RequiredEquipmentId = service.RequiredEquipmentId,
            DiscountPercent = service.DiscountPercent,
            OriginalPrice = service.OriginalPrice,
            TagIds = tagIdsOverride ?? (service.ServiceTags != null ? service.ServiceTags.Select(st => st.TagId).ToList() : new List<int>())
        };
    }
}





