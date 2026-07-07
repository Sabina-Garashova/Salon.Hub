using SalonHub.Application.DTOs.Employees;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.Services
{
    public interface IEmployeeService
    {
        Task<IReadOnlyList<EmployeeReadDto>> GetAllAsync();
        Task<EmployeeReadDto?> GetByIdAsync(int id);
        Task<EmployeeReadDto> CreateAsync(EmployeeCreateDto dto);
        Task UpdateAsync(int id, EmployeeUpdateDto dto);
        Task DeleteAsync(int id);
    }

    public class EmployeeService : IEmployeeService
    {
        private readonly IUnitOfWork _unitOfWork;

        public EmployeeService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<EmployeeReadDto>> GetAllAsync()
        {
            var employees = await _unitOfWork.Employees.GetAllAsync();
            return employees.Select(MapToReadDto).ToList();
        }

        public async Task<EmployeeReadDto?> GetByIdAsync(int id)
        {
            var employee = await _unitOfWork.Employees.GetByIdAsync(id);
            return employee is null ? null : MapToReadDto(employee);
        }

        public async Task<EmployeeReadDto> CreateAsync(EmployeeCreateDto dto)
        {
            var salon = await _unitOfWork.Salons.GetByIdAsync(dto.SalonId)
                ?? throw new KeyNotFoundException("Salon tapılmadı.");

            var employee = new Employee
            {
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                Bio = dto.Bio,
                ApplicationUserId = dto.ApplicationUserId,
                SalonId = dto.SalonId,
                BranchId = dto.BranchId
            };

            await _unitOfWork.Employees.AddAsync(employee);
            await _unitOfWork.CompleteAsync();

            return MapToReadDto(employee);
        }

        public async Task UpdateAsync(int id, EmployeeUpdateDto dto)
        {
            var employee = await _unitOfWork.Employees.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"İşçi tapılmadı: {id}");

            employee.FullName = dto.FullName;
            employee.PhoneNumber = dto.PhoneNumber;
            employee.Bio = dto.Bio;
            employee.BranchId = dto.BranchId;
            employee.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Employees.Update(employee);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var employee = await _unitOfWork.Employees.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"İşçi tapılmadı: {id}");

            employee.IsDeleted = true;
            _unitOfWork.Employees.Update(employee);
            await _unitOfWork.CompleteAsync();
        }

        private static EmployeeReadDto MapToReadDto(Employee employee) => new()
        {
            Id = employee.Id,
            FullName = employee.FullName,
            PhoneNumber = employee.PhoneNumber,
            Bio = employee.Bio,
            SalonId = employee.SalonId,
            BranchId = employee.BranchId
        };
    }

}
