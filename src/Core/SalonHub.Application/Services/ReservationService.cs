using SalonHub.Domain.Entities;
using SalonHub.Domain.Enums;
using SalonHub.Application.DTOs.Dashboard;
using SalonHub.Application.DTOs.Reservations;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Interfaces.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SalonHub.Application.Services
{
    public interface IReservationService
    {
        Task<List<ReservationReadDto>> GetAllAsync();
        Task<ReservationReadDto?> GetByIdAsync(int id);
        Task<ReservationReadDto> CreateAsync(ReservationCreateDto dto);
        Task<ReservationReadDto> UpdateAsync(int id, ReservationUpdateDto dto, string currentUserId, bool isAdmin);
        Task<ReservationReadDto> CancelAsync(int reservationId, string reason);
        Task<ReservationReadDto> ConfirmAsync(int reservationId, string currentUserId, bool isAdmin);
        Task<ReservationReadDto> RejectAsync(int reservationId, string reason, string currentUserId, bool isAdmin);
        Task<ReservationReadDto> CompleteAsync(int reservationId);
        Task<ReservationReadDto> CheckInAsync(string checkInCode, int salonId);
        Task<List<string>> GetAvailableSlotsAsync(int employeeId, int serviceId, DateTime date);
        Task<List<EmployeeAvailabilityDto>> GetTodayAvailabilityAsync(int serviceId, int salonId);
    }

    public class ReservationService : IReservationService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notificationService;
        private readonly ILoyaltyService _loyaltyService;

        public ReservationService(IUnitOfWork unitOfWork, INotificationService notificationService, ILoyaltyService loyaltyService)
        {
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
            _loyaltyService = loyaltyService;
        }

        private async Task CheckTimeBlockAsync(int employeeId, int branchId, DateTime date, TimeSpan startTime, TimeSpan endTime)
        {
            var employee = await _unitOfWork.Employees.GetByIdAsync(employeeId);

            var blocks = await _unitOfWork.TimeBlocks.FindAsync(tb =>
                (tb.EmployeeId == employeeId || (tb.EmployeeId == null && tb.BranchId == branchId)) &&
                tb.StartDate.Date <= date.Date && tb.EndDate.Date >= date.Date);

            foreach (var block in blocks)
            {
                var blockStart = block.StartTime ?? TimeSpan.Zero;
                var blockEnd = block.EndTime ?? TimeSpan.FromHours(24);

                if (startTime < blockEnd && blockStart < endTime)
                {
                    throw new InvalidOperationException(
                        $"Seçilmiş vaxt bloklanıb. Səbəb: {block.Reason}");
                }
            }
        }

        public async Task<List<ReservationReadDto>> GetAllAsync()
        {
            var reservations = await _unitOfWork.Reservations.GetAllAsync();
            var result = new List<ReservationReadDto>();

            foreach (var r in reservations)
            {
                var service = await _unitOfWork.Services.GetByIdAsync(r.ServiceId);
                var employee = await _unitOfWork.Employees.GetByIdAsync(r.EmployeeId);

                result.Add(new ReservationReadDto
                {
                    Id = r.Id,
                    ServiceName = service?.Name ?? string.Empty,
                    EmployeeName = employee?.FullName ?? string.Empty,
                    ReservationDate = r.ReservationDate,
                    StartTime = r.StartTime,
                    EndTime = r.EndTime,
                    Status = r.Status.ToString()
                });
            }

            return result;
        }

        public async Task<ReservationReadDto?> GetByIdAsync(int id)
        {
            var reservation = await _unitOfWork.Reservations.GetByIdAsync(id);
            if (reservation is null) return null;

            var service = await _unitOfWork.Services.GetByIdAsync(reservation.ServiceId);
            var employee = await _unitOfWork.Employees.GetByIdAsync(reservation.EmployeeId);

            return new ReservationReadDto
            {
                Id = reservation.Id,
                ServiceName = service?.Name ?? string.Empty,
                EmployeeName = employee?.FullName ?? string.Empty,
                ReservationDate = reservation.ReservationDate,
                StartTime = reservation.StartTime,
                EndTime = reservation.EndTime,
                Status = reservation.Status.ToString()
            };
        }

        public async Task<ReservationReadDto> CreateAsync(ReservationCreateDto dto)
        {
            var service = await _unitOfWork.Services.GetByIdAsync(dto.ServiceId)
                ?? throw new KeyNotFoundException("Xidmət tapılmadı.");

            var employee = await _unitOfWork.Employees.SingleOrDefaultAsync(
                e => e.Id == dto.EmployeeId, e => e.EmployeeServices)
                ?? throw new KeyNotFoundException("İşçi tapılmadı.");

            var isAssigned = employee.EmployeeServices.Any(es => es.ServiceId == dto.ServiceId);
            if (!isAssigned)
                throw new InvalidOperationException("Seçilmiş usta bu xidməti göstərmir.");

            var endTime = dto.StartTime.Add(TimeSpan.FromMinutes(service.DurationMinutes));

            await CheckTimeBlockAsync(dto.EmployeeId, dto.BranchId, dto.ReservationDate, dto.StartTime, endTime);

            var employeeReservations = await _unitOfWork.Reservations.FindAsync(r =>
                r.EmployeeId == dto.EmployeeId &&
                r.ReservationDate.Date == dto.ReservationDate.Date &&
                r.Status != ReservationStatus.Cancelled &&
                r.StartTime < endTime && dto.StartTime < r.EndTime);

            if (employeeReservations.Any())
                throw new InvalidOperationException("Seçilmiş usta bu saat aralığında məşğuldur.");

            var customerReservations = await _unitOfWork.Reservations.FindAsync(r =>
                r.CustomerId == dto.CustomerId &&
                r.ReservationDate.Date == dto.ReservationDate.Date &&
                r.Status != ReservationStatus.Cancelled &&
                r.StartTime < endTime && dto.StartTime < r.EndTime);

            if (customerReservations.Any())
                throw new InvalidOperationException("Siz artıq bu saat aralığında başqa bir rezervasiyaya maliksiniz.");

            int? equipmentIdToUse = null;

            if (service.RequiredEquipmentId.HasValue)
            {
                if (!employee.AssignedEquipmentId.HasValue)
                    throw new InvalidOperationException("Seçilmiş işçiyə bu xidmət üçün lazımi avadanlıq təyin olunmayıb.");

                var equipment = await _unitOfWork.Equipments.GetByIdAsync(employee.AssignedEquipmentId.Value)
                    ?? throw new KeyNotFoundException("Tələb olunan avadanlıq tapılmadı.");

                if (equipment.Status is EquipmentStatus.Faulty or EquipmentStatus.InRepair)
                    throw new InvalidOperationException("Tələb olunan avadanlıq hazırda nasazdır və ya təmirdədir.");

                equipmentIdToUse = equipment.Id;

                var equipmentReservations = await _unitOfWork.Reservations.FindAsync(r =>
                    r.EquipmentId == equipmentIdToUse &&
                    r.ReservationDate.Date == dto.ReservationDate.Date &&
                    r.Status != ReservationStatus.Cancelled &&
                    r.StartTime < endTime && dto.StartTime < r.EndTime);

                if (equipmentReservations.Any())
                    throw new InvalidOperationException("Tələb olunan avadanlıq bu saat aralığında məşğuldur.");
            }

            var reservation = new Reservation
            {
                CustomerId = dto.CustomerId,
                ServiceId = dto.ServiceId,
                EmployeeId = dto.EmployeeId,
                BranchId = dto.BranchId,
                EquipmentId = equipmentIdToUse,
                ReservationDate = dto.ReservationDate.Date,
                StartTime = dto.StartTime,
                EndTime = endTime,
                Status = ReservationStatus.Pending,
                SalonId = service.SalonId
            };

            await _unitOfWork.Reservations.AddAsync(reservation);
            await _unitOfWork.CompleteAsync();

            return new ReservationReadDto
            {
                Id = reservation.Id,
                ServiceName = service.Name,
                EmployeeName = employee.FullName,
                ReservationDate = reservation.ReservationDate,
                StartTime = reservation.StartTime,
                EndTime = reservation.EndTime,
                Status = reservation.Status.ToString()
            };
        }

        public async Task<ReservationReadDto> UpdateAsync(int id, ReservationUpdateDto dto, string currentUserId, bool isAdmin)
        {
            var reservation = await _unitOfWork.Reservations.GetByIdAsync(id)
                ?? throw new KeyNotFoundException("Rezervasiya tapılmadı.");

            if (reservation.Status == ReservationStatus.Cancelled)
                throw new InvalidOperationException("Ləğv olunmuş rezervasiya dəyişdirilə bilməz.");

            if (!isAdmin)
            {
                var isOwnerCustomer = reservation.CustomerId == currentUserId;

                var currentEmployee = await _unitOfWork.Employees.SingleOrDefaultAsync(
                    e => e.ApplicationUserId == currentUserId);
                var isAssignedEmployee = currentEmployee is not null && currentEmployee.Id == reservation.EmployeeId;

                if (!isOwnerCustomer && !isAssignedEmployee)
                    throw new UnauthorizedAccessException("Bu rezervasiyanı dəyişmək icazəniz yoxdur.");
            }

            var service = await _unitOfWork.Services.GetByIdAsync(dto.ServiceId)
                ?? throw new KeyNotFoundException("Xidmət tapılmadı.");

            var employee = await _unitOfWork.Employees.SingleOrDefaultAsync(
                e => e.Id == dto.EmployeeId, e => e.EmployeeServices)
                ?? throw new KeyNotFoundException("İşçi tapılmadı.");

            var isAssigned = employee.EmployeeServices.Any(es => es.ServiceId == dto.ServiceId);
            if (!isAssigned)
                throw new InvalidOperationException("Seçilmiş usta bu xidməti göstərmir.");

            var endTime = dto.StartTime.Add(TimeSpan.FromMinutes(service.DurationMinutes));

            await CheckTimeBlockAsync(dto.EmployeeId, dto.BranchId, dto.ReservationDate, dto.StartTime, endTime);

            var employeeReservations = await _unitOfWork.Reservations.FindAsync(r =>
                r.Id != id &&
                r.EmployeeId == dto.EmployeeId &&
                r.ReservationDate.Date == dto.ReservationDate.Date &&
                r.Status != ReservationStatus.Cancelled &&
                r.StartTime < endTime && dto.StartTime < r.EndTime);

            if (employeeReservations.Any())
                throw new InvalidOperationException("Seçilmiş usta bu saat aralığında məşğuldur.");

            var customerReservations = await _unitOfWork.Reservations.FindAsync(r =>
                r.Id != id &&
                r.CustomerId == reservation.CustomerId &&
                r.ReservationDate.Date == dto.ReservationDate.Date &&
                r.Status != ReservationStatus.Cancelled &&
                r.StartTime < endTime && dto.StartTime < r.EndTime);

            if (customerReservations.Any())
                throw new InvalidOperationException("Müştərinin artıq bu saat aralığında başqa bir rezervasiyası var.");

            int? equipmentIdToUse = null;

            if (service.RequiredEquipmentId.HasValue)
            {
                if (!employee.AssignedEquipmentId.HasValue)
                    throw new InvalidOperationException("Seçilmiş işçiyə bu xidmət üçün lazımi avadanlıq təyin olunmayıb.");

                var equipment = await _unitOfWork.Equipments.GetByIdAsync(employee.AssignedEquipmentId.Value)
                    ?? throw new KeyNotFoundException("Tələb olunan avadanlıq tapılmadı.");

                if (equipment.Status is EquipmentStatus.Faulty or EquipmentStatus.InRepair)
                    throw new InvalidOperationException("Tələb olunan avadanlıq hazırda nasazdır və ya təmirdədir.");

                equipmentIdToUse = equipment.Id;

                var equipmentReservations = await _unitOfWork.Reservations.FindAsync(r =>
                    r.Id != id &&
                    r.EquipmentId == equipmentIdToUse &&
                    r.ReservationDate.Date == dto.ReservationDate.Date &&
                    r.Status != ReservationStatus.Cancelled &&
                    r.StartTime < endTime && dto.StartTime < r.EndTime);

                if (equipmentReservations.Any())
                    throw new InvalidOperationException("Tələb olunan avadanlıq bu saat aralığında məşğuldur.");
            }

            var oldDate = reservation.ReservationDate;
            var oldStartTime = reservation.StartTime;

            reservation.ServiceId = dto.ServiceId;
            reservation.EmployeeId = dto.EmployeeId;
            reservation.BranchId = dto.BranchId;
            reservation.EquipmentId = equipmentIdToUse;
            reservation.ReservationDate = dto.ReservationDate.Date;
            reservation.StartTime = dto.StartTime;
            reservation.EndTime = endTime;
            reservation.UpdatedAt = DateTime.UtcNow;

            var timeChanged = oldDate != reservation.ReservationDate || oldStartTime != reservation.StartTime;

            if (timeChanged)
            {
                reservation.Status = ReservationStatus.Pending;
            }

            _unitOfWork.Reservations.Update(reservation);
            await _unitOfWork.CompleteAsync();

            if (timeChanged)
            {
                var message = $"Rezervasiyanız dəyişdirildi. Yeni tarix: {reservation.ReservationDate:dd.MM.yyyy}, saat: {reservation.StartTime:hh\\:mm}. Zəhmət olmasa təsdiqləyin və ya rədd edin.";
                await _notificationService.NotifyReservationChangedAsync(reservation.CustomerId, message);
            }

            return new ReservationReadDto
            {
                Id = reservation.Id,
                ServiceName = service.Name,
                EmployeeName = employee.FullName,
                ReservationDate = reservation.ReservationDate,
                StartTime = reservation.StartTime,
                EndTime = reservation.EndTime,
                Status = reservation.Status.ToString()
            };
        }

        public async Task<ReservationReadDto> CancelAsync(int reservationId, string reason)
        {
            var reservation = await _unitOfWork.Reservations.GetByIdAsync(reservationId)
                ?? throw new KeyNotFoundException("Rezervasiya tapılmadı.");

            reservation.Status = ReservationStatus.Cancelled;
            reservation.CancellationReason = reason;

            _unitOfWork.Reservations.Update(reservation);
            await _unitOfWork.CompleteAsync();

            var service = await _unitOfWork.Services.GetByIdAsync(reservation.ServiceId);
            var employee = await _unitOfWork.Employees.GetByIdAsync(reservation.EmployeeId);

            var message = $"Rezervasiyanız ləğv edildi. Səbəb: {reason}";
            await _notificationService.NotifyReservationChangedAsync(reservation.CustomerId, message);

            return new ReservationReadDto
            {
                Id = reservation.Id,
                ServiceName = service?.Name ?? string.Empty,
                EmployeeName = employee?.FullName ?? string.Empty,
                ReservationDate = reservation.ReservationDate,
                StartTime = reservation.StartTime,
                EndTime = reservation.EndTime,
                Status = reservation.Status.ToString()
            };
        }

        public async Task<ReservationReadDto> ConfirmAsync(int reservationId, string currentUserId, bool isAdmin)
        {
            var reservation = await _unitOfWork.Reservations.GetByIdAsync(reservationId)
                ?? throw new KeyNotFoundException("Rezervasiya tapılmadı.");

            if (!isAdmin && reservation.CustomerId != currentUserId)
                throw new UnauthorizedAccessException("Bu rezervasiyanı təsdiqləmək icazəniz yoxdur.");

            if (reservation.Status == ReservationStatus.Cancelled)
                throw new InvalidOperationException("Ləğv olunmuş rezervasiya təsdiqlənə bilməz.");

            reservation.Status = ReservationStatus.Confirmed;
            reservation.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Reservations.Update(reservation);
            await _unitOfWork.CompleteAsync();

            var service = await _unitOfWork.Services.GetByIdAsync(reservation.ServiceId);
            var employee = await _unitOfWork.Employees.GetByIdAsync(reservation.EmployeeId);

            return new ReservationReadDto
            {
                Id = reservation.Id,
                ServiceName = service?.Name ?? string.Empty,
                EmployeeName = employee?.FullName ?? string.Empty,
                ReservationDate = reservation.ReservationDate,
                StartTime = reservation.StartTime,
                EndTime = reservation.EndTime,
                Status = reservation.Status.ToString()
            };
        }

        public async Task<ReservationReadDto> RejectAsync(int reservationId, string reason, string currentUserId, bool isAdmin)
        {
            var reservation = await _unitOfWork.Reservations.GetByIdAsync(reservationId)
                ?? throw new KeyNotFoundException("Rezervasiya tapılmadı.");

            if (!isAdmin && reservation.CustomerId != currentUserId)
                throw new UnauthorizedAccessException("Bu rezervasiyanı rədd etmək icazəniz yoxdur.");

            reservation.Status = ReservationStatus.Cancelled;
            reservation.CancellationReason = string.IsNullOrWhiteSpace(reason)
                ? "Müştəri dəyişikliyi rədd etdi."
                : reason;
            reservation.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Reservations.Update(reservation);
            await _unitOfWork.CompleteAsync();

            var service = await _unitOfWork.Services.GetByIdAsync(reservation.ServiceId);
            var employee = await _unitOfWork.Employees.GetByIdAsync(reservation.EmployeeId);

            return new ReservationReadDto
            {
                Id = reservation.Id,
                ServiceName = service?.Name ?? string.Empty,
                EmployeeName = employee?.FullName ?? string.Empty,
                ReservationDate = reservation.ReservationDate,
                StartTime = reservation.StartTime,
                EndTime = reservation.EndTime,
                Status = reservation.Status.ToString()
            };
        }

        public async Task<ReservationReadDto> CompleteAsync(int reservationId)
        {
            var reservation = await _unitOfWork.Reservations.GetByIdAsync(reservationId)
                ?? throw new KeyNotFoundException("Rezervasiya tapılmadı.");

            if (reservation.Status == ReservationStatus.Cancelled)
                throw new InvalidOperationException("Ləğv olunmuş rezervasiya tamamlanmış sayıla bilməz.");

            reservation.Status = ReservationStatus.Completed;
            reservation.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Reservations.Update(reservation);
            await _unitOfWork.CompleteAsync();

            await _loyaltyService.AwardPointsForCompletedReservationAsync(reservationId);

            var service = await _unitOfWork.Services.GetByIdAsync(reservation.ServiceId);
            var employee = await _unitOfWork.Employees.GetByIdAsync(reservation.EmployeeId);

            return new ReservationReadDto
            {
                Id = reservation.Id,
                ServiceName = service?.Name ?? string.Empty,
                EmployeeName = employee?.FullName ?? string.Empty,
                ReservationDate = reservation.ReservationDate,
                StartTime = reservation.StartTime,
                EndTime = reservation.EndTime,
                Status = reservation.Status.ToString()
            };
        }

        public async Task<ReservationReadDto> CheckInAsync(string checkInCode, int salonId)
        {
            var reservations = await _unitOfWork.Reservations.FindAsync(r =>
                r.CheckInCode == checkInCode && r.SalonId == salonId);

            var reservation = reservations.FirstOrDefault()
                ?? throw new KeyNotFoundException("Keçərsiz QR kod və ya rezervasiya tapılmadı.");

            if (reservation.IsCheckedIn)
                throw new InvalidOperationException("Bu rezervasiya artıq check-in edilib.");

            if (reservation.Status == ReservationStatus.Cancelled)
                throw new InvalidOperationException("Ləğv olunmuş rezervasiya check-in edilə bilməz.");

            reservation.IsCheckedIn = true;
            reservation.CheckedInAt = DateTime.UtcNow;
            reservation.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Reservations.Update(reservation);
            await _unitOfWork.CompleteAsync();

            var service = await _unitOfWork.Services.GetByIdAsync(reservation.ServiceId);
            var employee = await _unitOfWork.Employees.GetByIdAsync(reservation.EmployeeId);

            return new ReservationReadDto
            {
                Id = reservation.Id,
                ServiceName = service?.Name ?? string.Empty,
                EmployeeName = employee?.FullName ?? string.Empty,
                ReservationDate = reservation.ReservationDate,
                StartTime = reservation.StartTime,
                EndTime = reservation.EndTime,
                Status = reservation.Status.ToString()
            };
        }

        public async Task<List<string>> GetAvailableSlotsAsync(int employeeId, int serviceId, DateTime date)
        {
            var employee = await _unitOfWork.Employees.SingleOrDefaultAsync(
                e => e.Id == employeeId, e => e.EmployeeServices)
                ?? throw new KeyNotFoundException("İşçi tapılmadı.");

            var service = await _unitOfWork.Services.GetByIdAsync(serviceId)
                ?? throw new KeyNotFoundException("Xidmət tapılmadı.");

            var isAssigned = employee.EmployeeServices.Any(es => es.ServiceId == serviceId);
            if (!isAssigned)
                throw new InvalidOperationException("Bu işçi bu xidməti göstərmir.");

            var dayOfWeek = date.DayOfWeek;

            var workingHours = await _unitOfWork.WorkingHours.FindAsync(wh =>
                wh.EmployeeId == employeeId &&
                wh.DayOfWeek == dayOfWeek &&
                !wh.IsDayOff);

            var workingHour = workingHours.FirstOrDefault();
            if (workingHour is null)
                return new List<string>();

            var existingReservations = await _unitOfWork.Reservations.FindAsync(r =>
                r.EmployeeId == employeeId &&
                r.ReservationDate.Date == date.Date &&
                r.Status != ReservationStatus.Cancelled);

            var slots = new List<string>();
            var slotDuration = TimeSpan.FromMinutes(service.DurationMinutes);
            var current = workingHour.StartTime;

            while (current.Add(slotDuration) <= workingHour.EndTime)
            {
                var slotEnd = current.Add(slotDuration);

                var isOverlapping = existingReservations.Any(r =>
                    r.StartTime < slotEnd && current < r.EndTime);

                if (!isOverlapping)
                    slots.Add(current.ToString(@"hh\:mm"));

                current = current.Add(TimeSpan.FromMinutes(30));
            }

            return slots;
        }

        public async Task<List<EmployeeAvailabilityDto>> GetTodayAvailabilityAsync(int serviceId, int salonId)
        {
            var today = DateTime.UtcNow.Date;

            var service = await _unitOfWork.Services.GetByIdAsync(serviceId)
                ?? throw new KeyNotFoundException("Xidmət tapılmadı.");

            var allEmployees = await _unitOfWork.Employees.FindAsync(e => e.SalonId == salonId);

            var eligibleEmployees = new List<Employee>();
            foreach (var emp in allEmployees)
            {
                var fullEmployee = await _unitOfWork.Employees.SingleOrDefaultAsync(
                    e => e.Id == emp.Id, e => e.EmployeeServices);

                if (fullEmployee is not null && fullEmployee.EmployeeServices.Any(es => es.ServiceId == serviceId))
                    eligibleEmployees.Add(fullEmployee);
            }

            var result = new List<EmployeeAvailabilityDto>();

            foreach (var employee in eligibleEmployees)
            {
                try
                {
                    var slots = await GetAvailableSlotsAsync(employee.Id, serviceId, today);
                    if (slots.Any())
                    {
                        result.Add(new EmployeeAvailabilityDto
                        {
                            EmployeeId = employee.Id,
                            EmployeeName = employee.FullName,
                            AvailableSlots = slots
                        });
                    }
                }
                catch
                {
                    // Bu işçi üçün xəta olsa (məs. iş qrafiki yoxdur), sadəcə keçirik
                }
            }

            return result;
        }
    }
}

