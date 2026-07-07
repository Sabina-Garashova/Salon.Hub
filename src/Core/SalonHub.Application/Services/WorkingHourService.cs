using SalonHub.Application.DTOs.WorkingHours;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.Services
{
    public interface IWorkingHourService
    {
        Task<IReadOnlyList<WorkingHourReadDto>> GetAllAsync();
        Task<WorkingHourReadDto?> GetByIdAsync(int id);
        Task<WorkingHourReadDto> CreateAsync(WorkingHourCreateDto dto);
        Task UpdateAsync(int id, WorkingHourUpdateDto dto);
        Task DeleteAsync(int id);
    }

    public class WorkingHourService : IWorkingHourService
    {
        private readonly IUnitOfWork _unitOfWork;

        public WorkingHourService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<WorkingHourReadDto>> GetAllAsync()
        {
            var hours = await _unitOfWork.WorkingHours.GetAllAsync();
            return hours.Select(MapToReadDto).ToList();
        }

        public async Task<WorkingHourReadDto?> GetByIdAsync(int id)
        {
            var hour = await _unitOfWork.WorkingHours.GetByIdAsync(id);
            return hour is null ? null : MapToReadDto(hour);
        }

        public async Task<WorkingHourReadDto> CreateAsync(WorkingHourCreateDto dto)
        {
            if (dto.EmployeeId is null && dto.BranchId is null)
                throw new ArgumentException("İş saatı ya işçiyə, ya da filiala aid olmalıdır.");

            var workingHour = new WorkingHour
            {
                DayOfWeek = dto.DayOfWeek,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                IsDayOff = dto.IsDayOff,
                EmployeeId = dto.EmployeeId,
                BranchId = dto.BranchId
            };

            await _unitOfWork.WorkingHours.AddAsync(workingHour);
            await _unitOfWork.CompleteAsync();

            return MapToReadDto(workingHour);
        }

        public async Task UpdateAsync(int id, WorkingHourUpdateDto dto)
        {
            var workingHour = await _unitOfWork.WorkingHours.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"İş saatı tapılmadı: {id}");

            workingHour.StartTime = dto.StartTime;
            workingHour.EndTime = dto.EndTime;
            workingHour.IsDayOff = dto.IsDayOff;
            workingHour.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.WorkingHours.Update(workingHour);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var workingHour = await _unitOfWork.WorkingHours.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"İş saatı tapılmadı: {id}");

            _unitOfWork.WorkingHours.Remove(workingHour);
            await _unitOfWork.CompleteAsync();
        }

        private static WorkingHourReadDto MapToReadDto(WorkingHour wh) => new()
        {
            Id = wh.Id,
            DayOfWeek = wh.DayOfWeek,
            StartTime = wh.StartTime,
            EndTime = wh.EndTime,
            IsDayOff = wh.IsDayOff,
            EmployeeId = wh.EmployeeId,
            BranchId = wh.BranchId
        };
    }
}
