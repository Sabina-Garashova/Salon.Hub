using SalonHub.Application.DTOs.Categories;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.Services
{
    public interface ICategoryService
    {
        Task<IReadOnlyList<CategoryReadDto>> GetAllAsync();
        Task<CategoryReadDto?> GetByIdAsync(int id);
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

        public async Task<IReadOnlyList<CategoryReadDto>> GetAllAsync()
        {
            var categories = await _unitOfWork.Categories.GetAllAsync();
            return categories.Select(MapToReadDto).ToList();
        }

        public async Task<CategoryReadDto?> GetByIdAsync(int id)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(id);
            return category is null ? null : MapToReadDto(category);
        }

        public async Task<CategoryReadDto> CreateAsync(CategoryCreateDto dto)
        {
            var category = new Category
            {
                Name = dto.Name,
                Description = dto.Description
            };

            await _unitOfWork.Categories.AddAsync(category);
            await _unitOfWork.CompleteAsync();

            return MapToReadDto(category);
        }

        public async Task UpdateAsync(int id, CategoryUpdateDto dto)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Kateqoriya tapılmadı: {id}");

            category.Name = dto.Name;
            category.Description = dto.Description;
            category.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Categories.Update(category);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Kateqoriya tapılmadı: {id}");

            _unitOfWork.Categories.Remove(category);
            await _unitOfWork.CompleteAsync();
        }

        private static CategoryReadDto MapToReadDto(Category category) => new()
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description
        };
    }
}
