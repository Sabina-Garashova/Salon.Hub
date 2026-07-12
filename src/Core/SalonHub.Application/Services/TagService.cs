using SalonHub.Application.DTOs.Tags;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SalonHub.Application.Services
{
    public interface ITagService
    {
        Task<IReadOnlyList<TagReadDto>> GetAllAsync();
        Task<TagReadDto?> GetByIdAsync(int id);
        Task<TagReadDto> CreateAsync(TagCreateDto dto);
        Task UpdateAsync(int id, TagUpdateDto dto);
        Task DeleteAsync(int id);
    }

    public class TagService : ITagService
    {
        private readonly IUnitOfWork _unitOfWork;

        public TagService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<TagReadDto>> GetAllAsync()
        {
            var tags = await _unitOfWork.Tags.GetAllAsync();
            return tags.Select(MapToReadDto).ToList();
        }

        public async Task<TagReadDto?> GetByIdAsync(int id)
        {
            var tag = await _unitOfWork.Tags.GetByIdAsync(id);
            return tag is null ? null : MapToReadDto(tag);
        }

        public async Task<TagReadDto> CreateAsync(TagCreateDto dto)
        {
            var existing = await _unitOfWork.Tags.FindAsync(t =>
                t.Name.ToLower() == dto.Name.ToLower());
            if (existing.Any())
                throw new InvalidOperationException($"'{dto.Name}' adlı tag artıq mövcuddur.");

            var tag = new Tag { Name = dto.Name };
            await _unitOfWork.Tags.AddAsync(tag);
            await _unitOfWork.CompleteAsync();
            return MapToReadDto(tag);
        }

        public async Task UpdateAsync(int id, TagUpdateDto dto)
        {
            var tag = await _unitOfWork.Tags.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Tag tapılmadı: {id}");

            var existing = await _unitOfWork.Tags.FindAsync(t =>
                t.Id != id && t.Name.ToLower() == dto.Name.ToLower());
            if (existing.Any())
                throw new InvalidOperationException($"'{dto.Name}' adlı tag artıq mövcuddur.");

            tag.Name = dto.Name;
            tag.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Tags.Update(tag);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var tag = await _unitOfWork.Tags.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Tag tapılmadı: {id}");
            _unitOfWork.Tags.Remove(tag);
            await _unitOfWork.CompleteAsync();
        }

        private static TagReadDto MapToReadDto(Tag tag) => new()
        {
            Id = tag.Id,
            Name = tag.Name
        };
    }
}
