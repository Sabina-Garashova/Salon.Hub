using SalonHub.Application.DTOs.Employees;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;

namespace SalonHub.Application.Services
{
    public interface IEmployeeService
    {
        Task<IReadOnlyList<EmployeeReadDto>> GetAllAsync();
        Task<EmployeeReadDto?> GetByIdAsync(int id);
        Task<EmployeeReadDto> CreateAsync(EmployeeCreateDto dto);
        Task UpdateAsync(int id, EmployeeUpdateDto dto);
        Task DeleteAsync(int id);
        Task AssignServiceAsync(int employeeId, int serviceId);
        Task RemoveServiceAsync(int employeeId, int serviceId);
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
            var result = new List<EmployeeReadDto>();
            foreach (var employee in employees)
                result.Add(await MapToReadDtoAsync(employee));
            return result;
        }

        public async Task<EmployeeReadDto?> GetByIdAsync(int id)
        {
            var employee = await _unitOfWork.Employees.GetByIdAsync(id);
            return employee is null ? null : await MapToReadDtoAsync(employee);
        }

        public async Task<EmployeeReadDto> CreateAsync(EmployeeCreateDto dto)
        {
            var salon = await _unitOfWork.Salons.GetByIdAsync(dto.SalonId)
                ?? throw new KeyNotFoundException("Salon tapılmadı.");

            var existingWithSameUser = await _unitOfWork.Employees.FindAsync(e =>
                e.ApplicationUserId == dto.ApplicationUserId);
            if (existingWithSameUser.Any())
                throw new InvalidOperationException("Bu istifadəçi hesabı artıq bir işçiyə bağlıdır.");

            if (dto.AssignedEquipmentId.HasValue)
            {
                var equipment = await _unitOfWork.Equipments.GetByIdAsync(dto.AssignedEquipmentId.Value)
                    ?? throw new KeyNotFoundException("Avadanlıq tapılmadı.");

                if (dto.BranchId.HasValue && equipment.BranchId != dto.BranchId.Value)
                    throw new InvalidOperationException("Seçilmiş avadanlıq bu filiala aid deyil.");

                var alreadyAssigned = await _unitOfWork.Employees.FindAsync(e =>
                    e.AssignedEquipmentId == dto.AssignedEquipmentId.Value);

                if (alreadyAssigned.Any())
                    throw new InvalidOperationException("Bu avadanlıq artıq başqa bir işçiyə təyin olunub.");
            }

            var employee = new Employee
            {
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                Bio = dto.Bio,
                ProfileImageUrl = dto.ProfileImageUrl,
                ApplicationUserId = dto.ApplicationUserId,
                SalonId = dto.SalonId,
                BranchId = dto.BranchId,
                AssignedEquipmentId = dto.AssignedEquipmentId
            };

            await _unitOfWork.Employees.AddAsync(employee);
            await _unitOfWork.CompleteAsync();

            return await MapToReadDtoAsync(employee);
        }

        public async Task UpdateAsync(int id, EmployeeUpdateDto dto)
        {
            var employee = await _unitOfWork.Employees.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"İşçi tapılmadı: {id}");

            if (!string.IsNullOrEmpty(dto.ApplicationUserId) && dto.ApplicationUserId != employee.ApplicationUserId)
            {
                var existingWithSameUser = await _unitOfWork.Employees.FindAsync(e =>
                    e.Id != id && e.ApplicationUserId == dto.ApplicationUserId);
                if (existingWithSameUser.Any())
                    throw new InvalidOperationException("Bu istifadəçi hesabı artıq başqa bir işçiyə bağlıdır.");

                employee.ApplicationUserId = dto.ApplicationUserId;
            }

            if (dto.AssignedEquipmentId.HasValue)
            {
                var equipment = await _unitOfWork.Equipments.GetByIdAsync(dto.AssignedEquipmentId.Value)
                    ?? throw new KeyNotFoundException("Avadanlıq tapılmadı.");

                var effectiveBranchId = dto.BranchId ?? employee.BranchId;
                if (effectiveBranchId.HasValue && equipment.BranchId != effectiveBranchId.Value)
                    throw new InvalidOperationException("Seçilmiş avadanlıq bu filiala aid deyil.");

                var alreadyAssigned = await _unitOfWork.Employees.FindAsync(e =>
                    e.Id != id && e.AssignedEquipmentId == dto.AssignedEquipmentId.Value);

                if (alreadyAssigned.Any())
                    throw new InvalidOperationException("Bu avadanlıq artıq başqa bir işçiyə təyin olunub.");
            }

            employee.FullName = dto.FullName;
            employee.PhoneNumber = dto.PhoneNumber;
            employee.Bio = dto.Bio;
            employee.ProfileImageUrl = dto.ProfileImageUrl;
            employee.BranchId = dto.BranchId;
            employee.AssignedEquipmentId = dto.AssignedEquipmentId;
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

        public async Task AssignServiceAsync(int employeeId, int serviceId)
        {
            var employee = await _unitOfWork.Employees.SingleOrDefaultAsync(
                e => e.Id == employeeId, e => e.EmployeeServices)
                ?? throw new KeyNotFoundException("İşçi tapılmadı.");

            var service = await _unitOfWork.Services.GetByIdAsync(serviceId)
                ?? throw new KeyNotFoundException("Xidmət tapılmadı.");

            if (employee.EmployeeServices.Any(es => es.ServiceId == serviceId))
                throw new InvalidOperationException("Bu xidmət artıq bu işçiyə təyin olunub.");

            employee.EmployeeServices.Add(new SalonHub.Domain.Entities.EmployeeService
            {
                EmployeeId = employeeId,
                ServiceId = serviceId
            });
            await _unitOfWork.CompleteAsync();
        }

        public async Task RemoveServiceAsync(int employeeId, int serviceId)
        {
            var employee = await _unitOfWork.Employees.SingleOrDefaultAsync(
                e => e.Id == employeeId, e => e.EmployeeServices)
                ?? throw new KeyNotFoundException("İşçi tapılmadı.");

            var employeeService = employee.EmployeeServices.FirstOrDefault(es => es.ServiceId == serviceId)
                ?? throw new KeyNotFoundException("Bu xidmət bu işçiyə təyin olunmayıb.");

            employee.EmployeeServices.Remove(employeeService);
            await _unitOfWork.CompleteAsync();
        }

        private async Task<EmployeeReadDto> MapToReadDtoAsync(Employee employee)
        {
            var reviews = await _unitOfWork.Reviews.FindAsync(r => r.EmployeeId == employee.Id);
            var reviewList = reviews.ToList();

            return new EmployeeReadDto
            {
                Id = employee.Id,
                FullName = employee.FullName,
                PhoneNumber = employee.PhoneNumber,
                Bio = employee.Bio,
                ProfileImageUrl = employee.ProfileImageUrl,
                SalonId = employee.SalonId,
                BranchId = employee.BranchId,
                AssignedEquipmentId = employee.AssignedEquipmentId,
                AverageRating = reviewList.Count > 0 ? Math.Round(reviewList.Average(r => r.Rating), 2) : 0,
                ReviewCount = reviewList.Count
            };
        }
    }
}
