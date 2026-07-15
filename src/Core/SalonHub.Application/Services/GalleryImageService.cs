using SalonHub.Application.DTOs.GalleryImages;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;
using SalonHub.Domain.Enums;

namespace SalonHub.Application.Services
{
    public interface IGalleryImageService
    {
        Task<IReadOnlyList<GalleryImageReadDto>> GetAllAsync();
        Task<GalleryImageReadDto?> GetByIdAsync(int id);
        Task<GalleryImageReadDto> CreateAsync(GalleryImageCreateDto dto, string requesterId, bool isSuperAdmin);
        Task UpdateAsync(int id, GalleryImageUpdateDto dto, string requesterId, bool isSuperAdmin);
        Task DeleteAsync(int id, string requesterId, bool isSuperAdmin);
    }

    public class GalleryImageService : IGalleryImageService
    {
        private readonly IUnitOfWork _unitOfWork;

        public GalleryImageService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<GalleryImageReadDto>> GetAllAsync()
        {
            var images = await _unitOfWork.GalleryImages.GetAllAsync();
            return images.Select(MapToReadDto).ToList();
        }

        public async Task<GalleryImageReadDto?> GetByIdAsync(int id)
        {
            var image = await _unitOfWork.GalleryImages.GetByIdAsync(id);
            return image is null ? null : MapToReadDto(image);
        }

        public async Task<GalleryImageReadDto> CreateAsync(GalleryImageCreateDto dto, string requesterId, bool isSuperAdmin)
        {
            var salon = await _unitOfWork.Salons.GetByIdAsync(dto.SalonId)
                ?? throw new KeyNotFoundException("Salon tapılmadı.");

            if (!isSuperAdmin && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu salona şəkil əlavə etmək icazəniz yoxdur.");

            if (!Enum.TryParse<GalleryImageType>(dto.Type, true, out var type))
                throw new ArgumentException("Şəkil növü düzgün deyil.");

            var image = new GalleryImage
            {
                ImageUrl = dto.ImageUrl,
                Description = dto.Description,
                Type = type,
                SalonId = dto.SalonId,
                EmployeeId = dto.EmployeeId,
                PairedImageId = dto.PairedImageId
            };

            await _unitOfWork.GalleryImages.AddAsync(image);
            await _unitOfWork.CompleteAsync();

            return MapToReadDto(image);
        }

        public async Task UpdateAsync(int id, GalleryImageUpdateDto dto, string requesterId, bool isSuperAdmin)
        {
            var image = await _unitOfWork.GalleryImages.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Şəkil tapılmadı: {id}");

            var salon = await _unitOfWork.Salons.GetByIdAsync(image.SalonId);
            if (!isSuperAdmin && salon is not null && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu şəkli dəyişmək icazəniz yoxdur.");

            if (!Enum.TryParse<GalleryImageType>(dto.Type, true, out var type))
                throw new ArgumentException("Şəkil növü düzgün deyil.");

            image.Description = dto.Description;
            image.Type = type;
            image.PairedImageId = dto.PairedImageId;
            image.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.GalleryImages.Update(image);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id, string requesterId, bool isSuperAdmin)
        {
            var image = await _unitOfWork.GalleryImages.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Şəkil tapılmadı: {id}");

            var salon = await _unitOfWork.Salons.GetByIdAsync(image.SalonId);
            if (!isSuperAdmin && salon is not null && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu şəkli silmək icazəniz yoxdur.");

            _unitOfWork.GalleryImages.Remove(image);
            await _unitOfWork.CompleteAsync();
        }

        private static GalleryImageReadDto MapToReadDto(GalleryImage image) => new()
        {
            Id = image.Id,
            ImageUrl = image.ImageUrl,
            Description = image.Description,
            Type = image.Type.ToString(),
            SalonId = image.SalonId,
            EmployeeId = image.EmployeeId,
            PairedImageId = image.PairedImageId
        };
    }
}
