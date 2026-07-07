using SalonHub.Application.DTOs.Equipments;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;
using SalonHub.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.Services
{
    public interface IEquipmentService
    {
        Task<IReadOnlyList<EquipmentReadDto>> GetAllAsync();
        Task<EquipmentReadDto?> GetByIdAsync(int id);
        Task<EquipmentReadDto> CreateAsync(EquipmentCreateDto dto);
        Task UpdateAsync(int id, EquipmentUpdateDto dto);
        Task DeleteAsync(int id);
    }

    public class EquipmentService : IEquipmentService
    {
        private readonly IUnitOfWork _unitOfWork;

        public EquipmentService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<EquipmentReadDto>> GetAllAsync()
        {
            var equipments = await _unitOfWork.Equipments.GetAllAsync();
            return equipments.Select(MapToReadDto).ToList();
        }

        public async Task<EquipmentReadDto?> GetByIdAsync(int id)
        {
            var equipment = await _unitOfWork.Equipments.GetByIdAsync(id);
            return equipment is null ? null : MapToReadDto(equipment);
        }

        public async Task<EquipmentReadDto> CreateAsync(EquipmentCreateDto dto)
        {
            var equipment = new Equipment
            {
                Name = dto.Name,
                Type = dto.Type,
                BranchId = dto.BranchId,
                Status = EquipmentStatus.Active
            };

            await _unitOfWork.Equipments.AddAsync(equipment);
            await _unitOfWork.CompleteAsync();

            return MapToReadDto(equipment);
        }

        public async Task UpdateAsync(int id, EquipmentUpdateDto dto)
        {
            var equipment = await _unitOfWork.Equipments.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Avadanlıq tapılmadı: {id}");

            if (!Enum.TryParse<EquipmentStatus>(dto.Status, true, out var status))
                throw new ArgumentException("Status düzgün deyil. Active, Busy, Faulty və ya InRepair olmalıdır.");

            equipment.Name = dto.Name;
            equipment.Type = dto.Type;
            equipment.Status = status;
            equipment.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Equipments.Update(equipment);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var equipment = await _unitOfWork.Equipments.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Avadanlıq tapılmadı: {id}");

            equipment.IsDeleted = true;
            _unitOfWork.Equipments.Update(equipment);
            await _unitOfWork.CompleteAsync();
        }

        private static EquipmentReadDto MapToReadDto(Equipment equipment) => new()
        {
            Id = equipment.Id,
            Name = equipment.Name,
            Type = equipment.Type,
            Status = equipment.Status.ToString(),
            BranchId = equipment.BranchId
        };
    }
}
