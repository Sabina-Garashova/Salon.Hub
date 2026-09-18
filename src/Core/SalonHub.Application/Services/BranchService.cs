using SalonHub.Application.DTOs.Branches;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;

namespace SalonHub.Application.Services
{
    public interface IBranchService
    {
        Task<IReadOnlyList<BranchReadDto>> GetAllAsync(string? requesterId = null, bool isSuperAdmin = true);
        Task<BranchReadDto?> GetByIdAsync(int id);
        Task<BranchReadDto> CreateAsync(BranchCreateDto dto, string requesterId, bool isSuperAdmin);
        Task UpdateAsync(int id, BranchUpdateDto dto, string requesterId, bool isSuperAdmin);
        Task DeleteAsync(int id, string requesterId, bool isSuperAdmin);
    }

    public class BranchService : IBranchService
    {
        private readonly IUnitOfWork _unitOfWork;

        public BranchService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<BranchReadDto>> GetAllAsync(string? requesterId = null, bool isSuperAdmin = true)
        {
            var branches = (await _unitOfWork.Branches.GetAllAsync()).Where(b => !b.IsDeleted);
            var result = new List<BranchReadDto>();
            foreach (var b in branches)
            {
                if (!isSuperAdmin && requesterId != null)
                {
                    var salon = await _unitOfWork.Salons.GetByIdAsync(b.SalonId);
                    if (salon is null || salon.OwnerId != requesterId) continue;
                }
                result.Add(MapToReadDto(b));
            }
            return result;
        }

        public async Task<BranchReadDto?> GetByIdAsync(int id)
        {
            var branch = await _unitOfWork.Branches.GetByIdAsync(id);
            return branch is null ? null : MapToReadDto(branch);
        }

        public async Task<BranchReadDto> CreateAsync(BranchCreateDto dto, string requesterId, bool isSuperAdmin)
        {
            var salon = await _unitOfWork.Salons.GetByIdAsync(dto.SalonId)
                ?? throw new KeyNotFoundException("Salon tapılmadı.");

            if (!isSuperAdmin && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu salona filial əlavə etmək icazəniz yoxdur.");

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

        public async Task UpdateAsync(int id, BranchUpdateDto dto, string requesterId, bool isSuperAdmin)
        {
            var branch = await _unitOfWork.Branches.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Filial tapılmadı: {id}");

            var salon = await _unitOfWork.Salons.GetByIdAsync(branch.SalonId);
            if (!isSuperAdmin && salon is not null && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu filialı dəyişmək icazəniz yoxdur.");

            branch.Name = dto.Name;
            branch.Address = dto.Address;
            branch.PhoneNumber = dto.PhoneNumber;
            branch.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Branches.Update(branch);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id, string requesterId, bool isSuperAdmin)
        {
            var branch = await _unitOfWork.Branches.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Filial tapılmadı: {id}");

            var salon = await _unitOfWork.Salons.GetByIdAsync(branch.SalonId);
            if (!isSuperAdmin && salon is not null && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu filialı silmək icazəniz yoxdur.");

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
