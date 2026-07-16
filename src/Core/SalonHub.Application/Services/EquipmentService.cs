using SalonHub.Application.DTOs.Equipments;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;
using SalonHub.Domain.Enums;

namespace SalonHub.Application.Services
{
    public interface IEquipmentService
    {
        Task<IReadOnlyList<EquipmentReadDto>> GetAllAsync();
        Task<EquipmentReadDto?> GetByIdAsync(int id);
        Task<EquipmentReadDto> CreateAsync(EquipmentCreateDto dto, string requesterId, bool isSuperAdmin);
        Task UpdateAsync(int id, EquipmentUpdateDto dto, string requesterId, bool isSuperAdmin);
        Task DeleteAsync(int id, string requesterId, bool isSuperAdmin);
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

        private async Task<bool> IsOwnerOfBranchAsync(int branchId, string requesterId)
        {
            var branch = await _unitOfWork.Branches.GetByIdAsync(branchId);
            if (branch is null) return false;

            var salon = await _unitOfWork.Salons.GetByIdAsync(branch.SalonId);
            return salon is not null && salon.OwnerId == requesterId;
        }

        public async Task<EquipmentReadDto> CreateAsync(EquipmentCreateDto dto, string requesterId, bool isSuperAdmin)
        {
            if (!isSuperAdmin && !await IsOwnerOfBranchAsync(dto.BranchId, requesterId))
                throw new UnauthorizedAccessException("Bu filiala avadanlıq əlavə etmək icazəniz yoxdur.");

            var existing = await _unitOfWork.Equipments.FindAsync(e =>
                e.BranchId == dto.BranchId && e.Name.ToLower() == dto.Name.ToLower());
            if (existing.Any())
                throw new InvalidOperationException($"'{dto.Name}' adlı avadanlıq bu filialda artıq mövcuddur.");

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

        public async Task UpdateAsync(int id, EquipmentUpdateDto dto, string requesterId, bool isSuperAdmin)
        {
            var equipment = await _unitOfWork.Equipments.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Avadanlıq tapılmadı: {id}");

            if (!isSuperAdmin && !await IsOwnerOfBranchAsync(equipment.BranchId, requesterId))
                throw new UnauthorizedAccessException("Bu avadanlığı dəyişmək icazəniz yoxdur.");

            if (!Enum.TryParse<EquipmentStatus>(dto.Status, true, out var status))
                throw new ArgumentException("Status düzgün deyil. Active, Busy, Faulty və ya InRepair olmalıdır.");

            var existing = await _unitOfWork.Equipments.FindAsync(e =>
                e.Id != id && e.BranchId == equipment.BranchId && e.Name.ToLower() == dto.Name.ToLower());
            if (existing.Any())
                throw new InvalidOperationException($"'{dto.Name}' adlı avadanlıq bu filialda artıq mövcuddur.");

            equipment.Name = dto.Name;
            equipment.Type = dto.Type;
            equipment.Status = status;
            equipment.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Equipments.Update(equipment);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id, string requesterId, bool isSuperAdmin)
        {
            var equipment = await _unitOfWork.Equipments.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Avadanlıq tapılmadı: {id}");

            if (!isSuperAdmin && !await IsOwnerOfBranchAsync(equipment.BranchId, requesterId))
                throw new UnauthorizedAccessException("Bu avadanlığı silmək icazəniz yoxdur.");

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
