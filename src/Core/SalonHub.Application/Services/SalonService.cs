using SalonHub.Application.DTOs.Salons;
using SalonHub.Application.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SalonHub.Domain.Entities;


namespace SalonHub.Application.Services
{
    public interface ISalonService
    {
        Task<IReadOnlyList<SalonReadDto>> GetAllAsync();
        Task<SalonReadDto?> GetByIdAsync(int id);
        Task<SalonReadDto> CreateAsync(SalonCreateDto dto, string ownerId);
        Task UpdateAsync(int id, SalonUpdateDto dto);
        Task DeleteAsync(int id);
    }

    public class SalonService : ISalonService
    {
        private readonly IUnitOfWork _unitOfWork;

        public SalonService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<SalonReadDto>> GetAllAsync()
        {
            var salons = await _unitOfWork.Salons.GetAllAsync();
            return salons.Select(MapToReadDto).ToList();
        }

        public async Task<SalonReadDto?> GetByIdAsync(int id)
        {
            var salon = await _unitOfWork.Salons.GetByIdAsync(id);
            return salon is null ? null : MapToReadDto(salon);
        }

        public async Task<SalonReadDto> CreateAsync(SalonCreateDto dto, string ownerId)
        {
            var salon = new Salon
            {
                Name = dto.Name,
                Description = dto.Description,
                Address = dto.Address,
                PhoneNumber = dto.PhoneNumber,
                OwnerId = ownerId
            };

            await _unitOfWork.Salons.AddAsync(salon);
            await _unitOfWork.CompleteAsync();

            return MapToReadDto(salon);
        }

        public async Task UpdateAsync(int id, SalonUpdateDto dto)
        {
            var salon = await _unitOfWork.Salons.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Salon tapılmadı: {id}");

            salon.Name = dto.Name;
            salon.Description = dto.Description;
            salon.Address = dto.Address;
            salon.PhoneNumber = dto.PhoneNumber;
            salon.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Salons.Update(salon);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var salon = await _unitOfWork.Salons.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Salon tapılmadı: {id}");

            salon.IsDeleted = true;
            _unitOfWork.Salons.Update(salon);
            await _unitOfWork.CompleteAsync();
        }

        private static SalonReadDto MapToReadDto(Salon salon) => new()
        {
            Id = salon.Id,
            Name = salon.Name,
            Description = salon.Description,
            Address = salon.Address,
            PhoneNumber = salon.PhoneNumber
        };
    }
}
