using SalonHub.Application.Common;
using SalonHub.Application.DTOs.Tags;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;

namespace SalonHub.Application.Services
{
    public interface ITagService
    {
        Task<IReadOnlyList<TagReadDto>> GetAllAsync(string? language = null);
        Task<TagReadDto?> GetByIdAsync(int id, string? language = null);
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

        public async Task<IReadOnlyList<TagReadDto>> GetAllAsync(string? language = null)
        {
            var tags = await _unitOfWork.Tags.GetAllAsync();
            return tags.Select(t => MapToReadDto(t, language)).ToList();
        }

        public async Task<TagReadDto?> GetByIdAsync(int id, string? language = null)
        {
            var tag = await _unitOfWork.Tags.GetByIdAsync(id);
            return tag is null ? null : MapToReadDto(tag, language);
        }

        public async Task<TagReadDto> CreateAsync(TagCreateDto dto)
        {
            var existing = await _unitOfWork.Tags.FindAsync(t =>
                t.NameAz.ToLower() == dto.NameAz.ToLower());
            if (existing.Any())
                throw new InvalidOperationException($"'{dto.NameAz}' adlı tag artıq mövcuddur.");

            var tag = new Tag { NameAz = dto.NameAz, NameRu = dto.NameRu, NameEn = dto.NameEn };

            await _unitOfWork.Tags.AddAsync(tag);
            await _unitOfWork.CompleteAsync();

            return MapToReadDto(tag, null);
        }

        public async Task UpdateAsync(int id, TagUpdateDto dto)
        {
            var tag = await _unitOfWork.Tags.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Tag tapılmadı: {id}");

            var existing = await _unitOfWork.Tags.FindAsync(t =>
                t.Id != id && t.NameAz.ToLower() == dto.NameAz.ToLower());
            if (existing.Any())
                throw new InvalidOperationException($"'{dto.NameAz}' adlı tag artıq mövcuddur.");

            tag.NameAz = dto.NameAz;
            tag.NameRu = dto.NameRu;
            tag.NameEn = dto.NameEn;
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

        private static TagReadDto MapToReadDto(Tag tag, string? language) => new()
        {
            Id = tag.Id,
            Name = LanguageHelper.Select(tag.NameAz, tag.NameRu, tag.NameEn, language)
        };
    }
}
