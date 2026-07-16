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
        Task<ServiceReadDto> CreateAsync(ServiceCreateDto dto);
        Task UpdateAsync(int id, ServiceUpdateDto dto);
        Task DeleteAsync(int id);
        Task AddTagAsync(int serviceId, int tagId);
        Task RemoveTagAsync(int serviceId, int tagId);
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
            return services.Select(s => MapToReadDto(s, language)).ToList();
        }

        public async Task<ServiceReadDto?> GetByIdAsync(int id, string? language = null)
        {
            var service = await _unitOfWork.Services.GetByIdAsync(id);
            return service is null ? null : MapToReadDto(service, language);
        }

        public async Task<ServiceReadDto> CreateAsync(ServiceCreateDto dto)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(dto.CategoryId)
                ?? throw new KeyNotFoundException("Kateqoriya tapılmadı.");

            var salon = await _unitOfWork.Salons.GetByIdAsync(dto.SalonId)
                ?? throw new KeyNotFoundException("Salon tapılmadı.");

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
                RequiredEquipmentId = dto.RequiredEquipmentId
            };

            await _unitOfWork.Services.AddAsync(service);
            await _unitOfWork.CompleteAsync();

            return MapToReadDto(service, null);
        }

        public async Task UpdateAsync(int id, ServiceUpdateDto dto)
        {
            var service = await _unitOfWork.Services.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Xidmət tapılmadı: {id}");

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
            service.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Services.Update(service);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var service = await _unitOfWork.Services.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Xidmət tapılmadı: {id}");

            service.IsDeleted = true;
            _unitOfWork.Services.Update(service);
            await _unitOfWork.CompleteAsync();
        }

        public async Task AddTagAsync(int serviceId, int tagId)
        {
            var service = await _unitOfWork.Services.SingleOrDefaultAsync(
                s => s.Id == serviceId, s => s.ServiceTags)
                ?? throw new KeyNotFoundException("Xidmət tapılmadı.");

            var tag = await _unitOfWork.Tags.GetByIdAsync(tagId)
                ?? throw new KeyNotFoundException("Tag tapılmadı.");

            if (service.ServiceTags.Any(st => st.TagId == tagId))
                throw new InvalidOperationException("Bu tag artıq əlavə olunub.");

            service.ServiceTags.Add(new ServiceTag { ServiceId = serviceId, TagId = tagId });
            await _unitOfWork.CompleteAsync();
        }

        public async Task RemoveTagAsync(int serviceId, int tagId)
        {
            var service = await _unitOfWork.Services.SingleOrDefaultAsync(
                s => s.Id == serviceId, s => s.ServiceTags)
                ?? throw new KeyNotFoundException("Xidmət tapılmadı.");

            var serviceTag = service.ServiceTags.FirstOrDefault(st => st.TagId == tagId)
                ?? throw new KeyNotFoundException("Bu tag bu xidmətə əlavə olunmayıb.");

            service.ServiceTags.Remove(serviceTag);
            await _unitOfWork.CompleteAsync();
        }

        private static ServiceReadDto MapToReadDto(Service service, string? language) => new()
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
            RequiredEquipmentId = service.RequiredEquipmentId
        };
    }
}
