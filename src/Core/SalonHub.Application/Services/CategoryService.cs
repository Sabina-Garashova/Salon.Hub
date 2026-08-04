using SalonHub.Application.Common;
using SalonHub.Application.DTOs.Categories;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;

namespace SalonHub.Application.Services
{
    public interface ICategoryService
    {
        Task<IReadOnlyList<CategoryReadDto>> GetAllAsync(string? language = null, int? salonId = null);
        Task<CategoryReadDto?> GetByIdAsync(int id, string? language = null);
        Task<CategoryReadDto> CreateAsync(CategoryCreateDto dto);
        Task UpdateAsync(int id, CategoryUpdateDto dto);
        Task DeleteAsync(int id);
    }

    public class CategoryService : ICategoryService
    {
        private readonly IUnitOfWork _unitOfWork;

        public CategoryService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<CategoryReadDto>> GetAllAsync(string? language = null, int? salonId = null)
        {
            var categories = await _unitOfWork.Categories.GetAllAsync();

            if (salonId.HasValue)
            {
                var services = await _unitOfWork.Services.FindAsync(s => s.SalonId == salonId.Value);
                var usedCategoryIds = services.Select(s => s.CategoryId).ToHashSet();
                categories = categories.Where(c => usedCategoryIds.Contains(c.Id)).ToList();
            }

            return categories.Select(c => MapToReadDto(c, language)).ToList();
        }

        public async Task<CategoryReadDto?> GetByIdAsync(int id, string? language = null)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(id);
            return category is null ? null : MapToReadDto(category, language);
        }

        public async Task<CategoryReadDto> CreateAsync(CategoryCreateDto dto)
        {
            var existing = await _unitOfWork.Categories.FindAsync(c =>
                c.NameAz.ToLower() == dto.NameAz.ToLower());
            if (existing.Any())
                throw new InvalidOperationException($"'{dto.NameAz}' adlı kateqoriya artıq mövcuddur.");

            var category = new Category
            {
                NameAz = dto.NameAz,
                NameRu = dto.NameRu,
                NameEn = dto.NameEn,
                DescriptionAz = dto.DescriptionAz,
                DescriptionRu = dto.DescriptionRu,
                DescriptionEn = dto.DescriptionEn
            };

            await _unitOfWork.Categories.AddAsync(category);
            await _unitOfWork.CompleteAsync();

            return MapToReadDto(category, null);
        }

        public async Task UpdateAsync(int id, CategoryUpdateDto dto)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Kateqoriya tapılmadı: {id}");

            var existing = await _unitOfWork.Categories.FindAsync(c =>
                c.Id != id && c.NameAz.ToLower() == dto.NameAz.ToLower());
            if (existing.Any())
                throw new InvalidOperationException($"'{dto.NameAz}' adlı kateqoriya artıq mövcuddur.");

            category.NameAz = dto.NameAz;
            category.NameRu = dto.NameRu;
            category.NameEn = dto.NameEn;
            category.DescriptionAz = dto.DescriptionAz;
            category.DescriptionRu = dto.DescriptionRu;
            category.DescriptionEn = dto.DescriptionEn;
            category.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Categories.Update(category);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Kateqoriya tapılmadı: {id}");

            var relatedServices = await _unitOfWork.Services.FindAsync(s => s.CategoryId == id);
            if (relatedServices.Any())
                throw new InvalidOperationException("Bu kateqoriyaya bagli xidmetler var. Evvelce onlari silin ve ya baska kateqoriyaya kocurun.");

            _unitOfWork.Categories.Remove(category);
            await _unitOfWork.CompleteAsync();
        }

        private static CategoryReadDto MapToReadDto(Category category, string? language) => new()
        {
            Id = category.Id,
            Name = LanguageHelper.Select(category.NameAz, category.NameRu, category.NameEn, language),
            Description = LanguageHelper.Select(
                category.DescriptionAz ?? string.Empty,
                category.DescriptionRu,
                category.DescriptionEn,
                language)
        };
    }
}
