using SalonHub.Application.DTOs.TimeBlocks;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;

namespace SalonHub.Application.Services
{
    public interface ITimeBlockService
    {
        Task<IReadOnlyList<TimeBlockReadDto>> GetAllAsync();
        Task<TimeBlockReadDto?> GetByIdAsync(int id);
        Task<TimeBlockReadDto> CreateAsync(TimeBlockCreateDto dto);
        Task DeleteAsync(int id);
    }

    public class TimeBlockService : ITimeBlockService
    {
        private readonly IUnitOfWork _unitOfWork;

        public TimeBlockService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<TimeBlockReadDto>> GetAllAsync()
        {
            var blocks = await _unitOfWork.TimeBlocks.GetAllAsync();
            var result = new List<TimeBlockReadDto>();
            foreach (var block in blocks)
                result.Add(await MapToReadDtoAsync(block));
            return result;
        }

        public async Task<TimeBlockReadDto?> GetByIdAsync(int id)
        {
            var block = await _unitOfWork.TimeBlocks.GetByIdAsync(id);
            return block is null ? null : await MapToReadDtoAsync(block);
        }

        public async Task<TimeBlockReadDto> CreateAsync(TimeBlockCreateDto dto)
        {
            if (dto.EndDate < dto.StartDate)
                throw new ArgumentException("Bitmə tarixi başlanğıc tarixindən əvvəl ola bilməz.");

            if (dto.EmployeeId.HasValue)
            {
                var employee = await _unitOfWork.Employees.GetByIdAsync(dto.EmployeeId.Value)
                    ?? throw new KeyNotFoundException("İşçi tapılmadı.");
            }

            if (dto.BranchId.HasValue)
            {
                var branch = await _unitOfWork.Branches.GetByIdAsync(dto.BranchId.Value)
                    ?? throw new KeyNotFoundException("Filial tapılmadı.");
            }

            var timeBlock = new TimeBlock
            {
                EmployeeId = dto.EmployeeId,
                BranchId = dto.BranchId,
                StartDate = dto.StartDate.Date,
                EndDate = dto.EndDate.Date,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Reason = dto.Reason
            };

            await _unitOfWork.TimeBlocks.AddAsync(timeBlock);
            await _unitOfWork.CompleteAsync();

            return await MapToReadDtoAsync(timeBlock);
        }

        public async Task DeleteAsync(int id)
        {
            var block = await _unitOfWork.TimeBlocks.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Bloklanmış vaxt tapılmadı: {id}");

            _unitOfWork.TimeBlocks.Remove(block);
            await _unitOfWork.CompleteAsync();
        }

        private async Task<TimeBlockReadDto> MapToReadDtoAsync(TimeBlock block)
        {
            string? employeeName = null;
            if (block.EmployeeId.HasValue)
            {
                var employee = await _unitOfWork.Employees.GetByIdAsync(block.EmployeeId.Value);
                employeeName = employee?.FullName;
            }

            return new TimeBlockReadDto
            {
                Id = block.Id,
                EmployeeId = block.EmployeeId,
                EmployeeName = employeeName,
                BranchId = block.BranchId,
                StartDate = block.StartDate,
                EndDate = block.EndDate,
                StartTime = block.StartTime,
                EndTime = block.EndTime,
                Reason = block.Reason
            };
        }
    }
}
