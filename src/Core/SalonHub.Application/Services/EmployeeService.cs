using SalonHub.Application.DTOs.Employees;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Domain.Entities;

namespace SalonHub.Application.Services
{
    public interface IEmployeeService
    {
        Task<IReadOnlyList<EmployeeReadDto>> GetAllAsync();
        Task<EmployeeReadDto?> GetByIdAsync(int id);
        Task<EmployeeReadDto> CreateAsync(EmployeeCreateDto dto, string requesterId, bool isSuperAdmin);
        Task UpdateAsync(int id, EmployeeUpdateDto dto, string requesterId, bool isSuperAdmin);
        Task DeleteAsync(int id, string requesterId, bool isSuperAdmin);
        Task AssignServiceAsync(int employeeId, int serviceId, string requesterId, bool isSuperAdmin);
        Task RemoveServiceAsync(int employeeId, int serviceId, string requesterId, bool isSuperAdmin);
    }

    public class EmployeeService : IEmployeeService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IUserLookupService _userLookupService;

        public EmployeeService(IUnitOfWork unitOfWork, IUserLookupService userLookupService)
        {
            _unitOfWork = unitOfWork;
            _userLookupService = userLookupService;
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

        public async Task<EmployeeReadDto> CreateAsync(EmployeeCreateDto dto, string requesterId, bool isSuperAdmin)
        {
            var salon = await _unitOfWork.Salons.GetByIdAsync(dto.SalonId)
                ?? throw new KeyNotFoundException("Salon tapılmadı.");

            if (!isSuperAdmin && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu salona işçi əlavə etmək icazəniz yoxdur.");

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
                AssignedEquipmentId = dto.AssignedEquipmentId,
                Salary = dto.Salary
            };

            await _unitOfWork.Employees.AddAsync(employee);
            await _unitOfWork.CompleteAsync();

            return await MapToReadDtoAsync(employee);
        }

        public async Task UpdateAsync(int id, EmployeeUpdateDto dto, string requesterId, bool isSuperAdmin)
        {
            var employee = await _unitOfWork.Employees.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"İşçi tapılmadı: {id}");

            var salon = await _unitOfWork.Salons.GetByIdAsync(employee.SalonId);
            if (!isSuperAdmin && salon is not null && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu işçini dəyişmək icazəniz yoxdur.");

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

        public async Task DeleteAsync(int id, string requesterId, bool isSuperAdmin)
        {
            var employee = await _unitOfWork.Employees.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"İşçi tapılmadı: {id}");

            var salon = await _unitOfWork.Salons.GetByIdAsync(employee.SalonId);
            if (!isSuperAdmin && salon is not null && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu işçini silmək icazəniz yoxdur.");
            employee.IsDeleted = true;
            _unitOfWork.Employees.Update(employee);
            await _unitOfWork.CompleteAsync();

            if (!string.IsNullOrEmpty(employee.ApplicationUserId))
            {
                var otherActiveRecords = await _unitOfWork.Employees.FindAsync(e => e.ApplicationUserId == employee.ApplicationUserId && e.Id != employee.Id && !e.IsDeleted);
                if (!otherActiveRecords.Any())
                    await _userLookupService.DemoteFromEmployeeAsync(employee.ApplicationUserId);
            }
            await _unitOfWork.CompleteAsync();
        }

        public async Task AssignServiceAsync(int employeeId, int serviceId, string requesterId, bool isSuperAdmin)
        {
            var employee = await _unitOfWork.Employees.SingleOrDefaultAsync(
                e => e.Id == employeeId, e => e.EmployeeServices)
                ?? throw new KeyNotFoundException("İşçi tapılmadı.");

            var salon = await _unitOfWork.Salons.GetByIdAsync(employee.SalonId);
            if (!isSuperAdmin && salon is not null && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu işçiyə xidmət təyin etmək icazəniz yoxdur.");

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

        public async Task RemoveServiceAsync(int employeeId, int serviceId, string requesterId, bool isSuperAdmin)
        {
            var employee = await _unitOfWork.Employees.SingleOrDefaultAsync(
                e => e.Id == employeeId, e => e.EmployeeServices)
                ?? throw new KeyNotFoundException("İşçi tapılmadı.");

            var salon = await _unitOfWork.Salons.GetByIdAsync(employee.SalonId);
            if (!isSuperAdmin && salon is not null && salon.OwnerId != requesterId)
                throw new UnauthorizedAccessException("Bu işçidən xidmət silmək icazəniz yoxdur.");

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
                ApplicationUserId = employee.ApplicationUserId,
                FullName = employee.FullName,
                PhoneNumber = employee.PhoneNumber,
                Bio = employee.Bio,
                ProfileImageUrl = employee.ProfileImageUrl,
                SalonId = employee.SalonId,
                BranchId = employee.BranchId,
                AssignedEquipmentId = employee.AssignedEquipmentId,
                AverageRating = reviewList.Count > 0 ? Math.Round(reviewList.Average(r => r.Rating), 2) : 0,
                ReviewCount = reviewList.Count,
                IsMonthlyTopEmployee = employee.IsMonthlyTopEmployee,
                ServiceIds = (await _unitOfWork.Employees.SingleOrDefaultAsync(e => e.Id == employee.Id, e => e.EmployeeServices))?.EmployeeServices.Select(es => es.ServiceId).ToList() ?? new List<int>(),
                Salary = employee.Salary
            };
        }
    }
}






