using SalonHub.Application.DTOs.Branches;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.Services
{
    public interface IBranchService
    {
        Task<IReadOnlyList<BranchReadDto>> GetAllAsync();
        Task<BranchReadDto?> GetByIdAsync(int id);
        Task<BranchReadDto> CreateAsync(BranchCreateDto dto);
        Task UpdateAsync(int id, BranchUpdateDto dto);
        Task DeleteAsync(int id);
    }

    public class BranchService : IBranchService
    {
        private readonly IUnitOfWork _unitOfWork;

        public BranchService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<BranchReadDto>> GetAllAsync()
        {
            var branches = await _unitOfWork.Branches.GetAllAsync();
            return branches.Select(MapToReadDto).ToList();
        }

        public async Task<BranchReadDto?> GetByIdAsync(int id)
        {
            var branch = await _unitOfWork.Branches.GetByIdAsync(id);
            return branch is null ? null : MapToReadDto(branch);
        }

        public async Task<BranchReadDto> CreateAsync(BranchCreateDto dto)
        {
            var salon = await _unitOfWork.Salons.GetByIdAsync(dto.SalonId)
                ?? throw new KeyNotFoundException("Salon tapılmadı.");

            var branch = new Branch
            {
                Name = dto.Name,
                Address = dto.Address,
                PhoneNumber = dto.PhoneNumber,
                SalonId = dto.SalonId
            };

            await _unitOfWork.Branches.AddAsync(branch);
            await _unitOfWork.CompleteAsync();

            return MapToReadDto(branch);
        }

        public async Task UpdateAsync(int id, BranchUpdateDto dto)
        {
            var branch = await _unitOfWork.Branches.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Filial tapılmadı: {id}");

            branch.Name = dto.Name;
            branch.Address = dto.Address;
            branch.PhoneNumber = dto.PhoneNumber;
            branch.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Branches.Update(branch);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var branch = await _unitOfWork.Branches.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Filial tapılmadı: {id}");

            branch.IsDeleted = true;
            _unitOfWork.Branches.Update(branch);
            await _unitOfWork.CompleteAsync();
        }

        private static BranchReadDto MapToReadDto(Branch branch) => new()
        {
            Id = branch.Id,
            Name = branch.Name,
            Address = branch.Address,
            PhoneNumber = branch.PhoneNumber,
            SalonId = branch.SalonId
        };
    }
}
