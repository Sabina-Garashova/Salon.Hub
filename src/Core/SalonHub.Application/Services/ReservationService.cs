using SalonHub.Domain.Entities;
using SalonHub.Domain.Enums;
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
        Task<List<string>> GetAvailableSlotsAsync(int employeeId, int serviceId, DateTime date);
    }

    public class ReservationService : IReservationService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notificationService;

        public ReservationService(IUnitOfWork unitOfWork, INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
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

            var employeeReservations = await _unitOfWork.Reservations.FindAsync(r =>
                r.EmployeeId == dto.EmployeeId &&
                r.ReservationDate.Date == dto.ReservationDate.Date &&
                r.Status != ReservationStatus.Cancelled &&
                r.StartTime < endTime && dto.StartTime < r.EndTime);

            if (employeeReservations.Any())
                throw new InvalidOperationException("Seçilmiş usta bu saat aralığında məşğuldur.");

            if (service.RequiredEquipmentId.HasValue)
            {
                var equipment = await _unitOfWork.Equipments.GetByIdAsync(service.RequiredEquipmentId.Value)
                    ?? throw new KeyNotFoundException("Tələb olunan avadanlıq tapılmadı.");

                if (equipment.Status is EquipmentStatus.Faulty or EquipmentStatus.InRepair)
                    throw new InvalidOperationException("Tələb olunan avadanlıq hazırda nasazdır və ya təmirdədir.");

                var equipmentReservations = await _unitOfWork.Reservations.FindAsync(r =>
                    r.EquipmentId == service.RequiredEquipmentId &&
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
                EquipmentId = service.RequiredEquipmentId,
                ReservationDate = dto.ReservationDate.Date,
                StartTime = dto.StartTime,
                EndTime = endTime,
                Status = ReservationStatus.Pending
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

            // --- Sahiblik yoxlaması ---
            if (!isAdmin)
            {
                var isOwnerCustomer = reservation.CustomerId == currentUserId;

                var currentEmployee = await _unitOfWork.Employees.SingleOrDefaultAsync(
                    e => e.ApplicationUserId == currentUserId);
                var isAssignedEmployee = currentEmployee is not null && currentEmployee.Id == reservation.EmployeeId;

                if (!isOwnerCustomer && !isAssignedEmployee)
                    throw new UnauthorizedAccessException("Bu rezervasiyanı dəyişmək icazəniz yoxdur.");
            }
            // --- Sahiblik yoxlaması bitdi ---

            var service = await _unitOfWork.Services.GetByIdAsync(dto.ServiceId)
                ?? throw new KeyNotFoundException("Xidmət tapılmadı.");

            var employee = await _unitOfWork.Employees.SingleOrDefaultAsync(
                e => e.Id == dto.EmployeeId, e => e.EmployeeServices)
                ?? throw new KeyNotFoundException("İşçi tapılmadı.");

            var isAssigned = employee.EmployeeServices.Any(es => es.ServiceId == dto.ServiceId);
            if (!isAssigned)
                throw new InvalidOperationException("Seçilmiş usta bu xidməti göstərmir.");

            var endTime = dto.StartTime.Add(TimeSpan.FromMinutes(service.DurationMinutes));

            var employeeReservations = await _unitOfWork.Reservations.FindAsync(r =>
                r.Id != id &&
                r.EmployeeId == dto.EmployeeId &&
                r.ReservationDate.Date == dto.ReservationDate.Date &&
                r.Status != ReservationStatus.Cancelled &&
                r.StartTime < endTime && dto.StartTime < r.EndTime);

            if (employeeReservations.Any())
                throw new InvalidOperationException("Seçilmiş usta bu saat aralığında məşğuldur.");

            if (service.RequiredEquipmentId.HasValue)
            {
                var equipment = await _unitOfWork.Equipments.GetByIdAsync(service.RequiredEquipmentId.Value)
                    ?? throw new KeyNotFoundException("Tələb olunan avadanlıq tapılmadı.");

                if (equipment.Status is EquipmentStatus.Faulty or EquipmentStatus.InRepair)
                    throw new InvalidOperationException("Tələb olunan avadanlıq hazırda nasazdır və ya təmirdədir.");

                var equipmentReservations = await _unitOfWork.Reservations.FindAsync(r =>
                    r.Id != id &&
                    r.EquipmentId == service.RequiredEquipmentId &&
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
            reservation.EquipmentId = service.RequiredEquipmentId;
            reservation.ReservationDate = dto.ReservationDate.Date;
            reservation.StartTime = dto.StartTime;
            reservation.EndTime = endTime;
            reservation.UpdatedAt = DateTime.UtcNow;

            var timeChanged = oldDate != reservation.ReservationDate || oldStartTime != reservation.StartTime;

            if (timeChanged)
            {
                // Saat dəyişəndə müştəridən yenidən təsdiq tələb olunur
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
    }
}
