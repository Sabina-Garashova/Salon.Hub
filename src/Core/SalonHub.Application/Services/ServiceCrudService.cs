using SalonHub.Application.DTOs.Services;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.Services
{
    public interface IServiceCrudService
    {
        Task<IReadOnlyList<ServiceReadDto>> GetAllAsync();
        Task<ServiceReadDto?> GetByIdAsync(int id);
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

        public async Task<IReadOnlyList<ServiceReadDto>> GetAllAsync()
        {
            var services = await _unitOfWork.Services.GetAllAsync();
            return services.Select(MapToReadDto).ToList();
        }

        public async Task<ServiceReadDto?> GetByIdAsync(int id)
        {
            var service = await _unitOfWork.Services.GetByIdAsync(id);
            return service is null ? null : MapToReadDto(service);
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

            var service = new Service
            {
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                DurationMinutes = dto.DurationMinutes,
                CategoryId = dto.CategoryId,
                SalonId = dto.SalonId,
                RequiredEquipmentId = dto.RequiredEquipmentId
            };

            await _unitOfWork.Services.AddAsync(service);
            await _unitOfWork.CompleteAsync();

            return MapToReadDto(service);
        }

        public async Task UpdateAsync(int id, ServiceUpdateDto dto)
        {
            var service = await _unitOfWork.Services.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Xidmət tapılmadı: {id}");

            service.Name = dto.Name;
            service.Description = dto.Description;
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

        private static ServiceReadDto MapToReadDto(Service service) => new()
        {
            Id = service.Id,
            Name = service.Name,
            Description = service.Description,
            Price = service.Price,
            DurationMinutes = service.DurationMinutes,
            CategoryId = service.CategoryId,
            SalonId = service.SalonId,
            RequiredEquipmentId = service.RequiredEquipmentId
        };
    }
}
    

