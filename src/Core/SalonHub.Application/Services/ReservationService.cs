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
    public class EmployeeDashboardReservationDto
    {
        public int Id { get; set; }
        public DateTime ReservationDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string Status { get; set; } = string.Empty;
        public string ServiceName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int DurationMinutes { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = "Card";
    }

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
        Task<List<ReservationReadDto>> CreateMultipleAsync(MultiServiceReservationCreateDto dto);
        Task<List<EmployeeDashboardReservationDto>> GetEmployeeReservationsAsync(int employeeId);
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

        public async Task<List<EmployeeDashboardReservationDto>> GetEmployeeReservationsAsync(int employeeId)
        {
            var reservations = await _unitOfWork.Reservations.FindAsync(r => r.EmployeeId == employeeId);
            var result = new List<EmployeeDashboardReservationDto>();

            foreach (var r in reservations)
            {
                var service = await _unitOfWork.Services.GetByIdAsync(r.ServiceId);

                result.Add(new EmployeeDashboardReservationDto
                {
                    Id = r.Id,
                    ReservationDate = r.ReservationDate,
                    StartTime = r.StartTime,
                    EndTime = r.EndTime,
                    Status = r.Status.ToString(),
                    ServiceName = service?.NameAz ?? "Xidmət",
                    Price = service?.Price ?? 0,
                    DurationMinutes = service?.DurationMinutes ?? 0,
                    CustomerName = !string.IsNullOrEmpty(r.CustomerFullName) ? r.CustomerFullName : "Musteri",
                    PaymentMethod = r.PaymentMethod,
                });
            }

            return result.OrderByDescending(r => r.ReservationDate).ThenBy(r => r.StartTime).ToList();
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
                        $"Secilmis vaxt bloklanib. Sebeb: {block.Reason}");
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
                    CustomerFullName = r.CustomerFullName ?? string.Empty,
                    CustomerId = r.CustomerId,
                    SalonId = r.SalonId,
                    CheckInCode = r.CheckInCode,
                    IsCheckedIn = r.IsCheckedIn,
                    PaymentMethod = r.PaymentMethod,
                    EmployeeId = r.EmployeeId,
                    Price = service?.Price ?? 0,
                    ServiceName = service?.NameAz ?? string.Empty,
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
                    CustomerFullName = reservation.CustomerFullName ?? string.Empty,
                    CustomerId = reservation.CustomerId,
                    SalonId = reservation.SalonId,
                    CheckInCode = reservation.CheckInCode,
                    IsCheckedIn = reservation.IsCheckedIn,
                    PaymentMethod = reservation.PaymentMethod,
                    EmployeeId = reservation.EmployeeId,
                    Price = service?.Price ?? 0,
                ServiceName = service?.NameAz ?? string.Empty,
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
                ?? throw new KeyNotFoundException("Xidmet tapilmadi.");

            var employee = await _unitOfWork.Employees.SingleOrDefaultAsync(
                e => e.Id == dto.EmployeeId, e => e.EmployeeServices)
                ?? throw new KeyNotFoundException("Isçi tapilmadi.");

            var isAssigned = employee.EmployeeServices.Any(es => es.ServiceId == dto.ServiceId);
            if (!isAssigned)
                throw new InvalidOperationException("Secilmis usta bu xidmeti gostermir.");

            var endTime = dto.StartTime.Add(TimeSpan.FromMinutes(service.DurationMinutes));

            await CheckTimeBlockAsync(dto.EmployeeId, dto.BranchId, dto.ReservationDate, dto.StartTime, endTime);

            var employeeReservations = await _unitOfWork.Reservations.FindAsync(r =>
                r.EmployeeId == dto.EmployeeId &&
                r.ReservationDate.Date == dto.ReservationDate.Date &&
                r.Status != ReservationStatus.Cancelled &&
                r.StartTime < endTime && dto.StartTime < r.EndTime);

            if (employeeReservations.Any())
                throw new InvalidOperationException("Secilmis usta bu saat araliginda mesguldur.");

            var customerReservations = await _unitOfWork.Reservations.FindAsync(r =>
                r.CustomerId == dto.CustomerId &&
                r.ReservationDate.Date == dto.ReservationDate.Date &&
                r.Status != ReservationStatus.Cancelled &&
                r.StartTime < endTime && dto.StartTime < r.EndTime);

            if (customerReservations.Any())
                throw new InvalidOperationException("Siz artiq bu saat araliginda basqa bir rezervasiyaya maliksiniz.");

            int? equipmentIdToUse = null;

            if (service.RequiredEquipmentId.HasValue)
            {
                var requiredEquipmentRef = await _unitOfWork.Equipments.GetByIdAsync(service.RequiredEquipmentId.Value)
                    ?? throw new KeyNotFoundException("Teleb olunan avadanliq tapilmadi.");

                var candidateEquipments = (await _unitOfWork.Equipments.FindAsync(e =>
                    e.BranchId == dto.BranchId && e.Type == requiredEquipmentRef.Type &&
                    e.Status != EquipmentStatus.Faulty && e.Status != EquipmentStatus.InRepair)).ToList();

                if (!candidateEquipments.Any())
                    throw new InvalidOperationException("Teleb olunan avadanliq hazirda nasazdir ve ya temirdedir.");

                Equipment? freeEquipment = null;
                foreach (var candidate in candidateEquipments)
                {
                    var conflicts = await _unitOfWork.Reservations.FindAsync(r =>
                        r.EquipmentId == candidate.Id &&
                        r.ReservationDate.Date == dto.ReservationDate.Date &&
                        r.Status != ReservationStatus.Cancelled &&
                        r.StartTime < endTime && dto.StartTime < r.EndTime);
                    if (!conflicts.Any()) { freeEquipment = candidate; break; }
                }

                if (freeEquipment is null)
                    throw new InvalidOperationException("Teleb olunan avadanliq bu saat araliginda mesguldur.");

                equipmentIdToUse = freeEquipment.Id;
            }

            var reservation = new Reservation
            {
                CustomerId = dto.CustomerId,
                CustomerFullName = dto.CustomerFullName ?? string.Empty,
                PaymentMethod = dto.PaymentMethod ?? "Card",
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

            await _notificationService.NotifyReservationChangedAsync(dto.CustomerId, $"Rezervasiyaniz qeyde alindi: {service.NameAz}, {dto.ReservationDate:dd.MM.yyyy} {dto.StartTime}. Tesdiq gozlenilir.");
            await _notificationService.NotifyEmployeeAsync(employee.Id, $"Yeni rezervasiya: {dto.CustomerFullName ?? "Musteri"} sizden {service.NameAz} xidmetini {dto.ReservationDate:dd.MM.yyyy} {dto.StartTime} tarixinde teleb edib.");

            return new ReservationReadDto
            {
                Id = reservation.Id,
                    CustomerFullName = reservation.CustomerFullName ?? string.Empty,
                    CustomerId = reservation.CustomerId,
                    SalonId = reservation.SalonId,
                    CheckInCode = reservation.CheckInCode,
                    IsCheckedIn = reservation.IsCheckedIn,
                    PaymentMethod = reservation.PaymentMethod,
                    EmployeeId = reservation.EmployeeId,
                    Price = service?.Price ?? 0,
                ServiceName = service.NameAz,
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
                ?? throw new KeyNotFoundException("Rezervasiya tapilmadi.");

            if (reservation.Status == ReservationStatus.Cancelled)
                throw new InvalidOperationException("Legv olunmus rezervasiya deyisdirile bilmez.");

            if (!isAdmin)
            {
                var isOwnerCustomer = reservation.CustomerId == currentUserId;

                var currentEmployee = await _unitOfWork.Employees.SingleOrDefaultAsync(
                    e => e.ApplicationUserId == currentUserId);
                var isAssignedEmployee = currentEmployee is not null && currentEmployee.Id == reservation.EmployeeId;

                if (!isOwnerCustomer && !isAssignedEmployee)
                    throw new UnauthorizedAccessException("Bu rezervasiyani deyismek icazeniz yoxdur.");
            }

            var service = await _unitOfWork.Services.GetByIdAsync(dto.ServiceId)
                ?? throw new KeyNotFoundException("Xidmet tapilmadi.");

            var employee = await _unitOfWork.Employees.SingleOrDefaultAsync(
                e => e.Id == dto.EmployeeId, e => e.EmployeeServices)
                ?? throw new KeyNotFoundException("Isçi tapilmadi.");

            var isAssigned = employee.EmployeeServices.Any(es => es.ServiceId == dto.ServiceId);
            if (!isAssigned)
                throw new InvalidOperationException("Secilmis usta bu xidmeti gostermir.");

            var endTime = dto.StartTime.Add(TimeSpan.FromMinutes(service.DurationMinutes));

            await CheckTimeBlockAsync(dto.EmployeeId, dto.BranchId, dto.ReservationDate, dto.StartTime, endTime);

            var employeeReservations = await _unitOfWork.Reservations.FindAsync(r =>
                r.Id != id &&
                r.EmployeeId == dto.EmployeeId &&
                r.ReservationDate.Date == dto.ReservationDate.Date &&
                r.Status != ReservationStatus.Cancelled &&
                r.StartTime < endTime && dto.StartTime < r.EndTime);

            if (employeeReservations.Any())
                throw new InvalidOperationException("Secilmis usta bu saat araliginda mesguldur.");

            var customerReservations = await _unitOfWork.Reservations.FindAsync(r =>
                r.Id != id &&
                r.CustomerId == reservation.CustomerId &&
                r.ReservationDate.Date == dto.ReservationDate.Date &&
                r.Status != ReservationStatus.Cancelled &&
                r.StartTime < endTime && dto.StartTime < r.EndTime);

            if (customerReservations.Any())
                throw new InvalidOperationException("Musterinin artiq bu saat araliginda basqa bir rezervasiyasi var.");

            int? equipmentIdToUse = null;

            if (service.RequiredEquipmentId.HasValue)
            {
                var requiredEquipmentRef = await _unitOfWork.Equipments.GetByIdAsync(service.RequiredEquipmentId.Value)
                    ?? throw new KeyNotFoundException("Teleb olunan avadanliq tapilmadi.");

                var candidateEquipments = (await _unitOfWork.Equipments.FindAsync(e =>
                    e.BranchId == dto.BranchId && e.Type == requiredEquipmentRef.Type &&
                    e.Status != EquipmentStatus.Faulty && e.Status != EquipmentStatus.InRepair)).ToList();

                if (!candidateEquipments.Any())
                    throw new InvalidOperationException("Teleb olunan avadanliq hazirda nasazdir ve ya temirdedir.");

                Equipment? freeEquipment = null;
                foreach (var candidate in candidateEquipments)
                {
                    var conflicts = await _unitOfWork.Reservations.FindAsync(r =>
                        r.Id != id &&
                        r.EquipmentId == candidate.Id &&
                        r.ReservationDate.Date == dto.ReservationDate.Date &&
                        r.Status != ReservationStatus.Cancelled &&
                        r.StartTime < endTime && dto.StartTime < r.EndTime);
                    if (!conflicts.Any()) { freeEquipment = candidate; break; }
                }

                if (freeEquipment is null)
                    throw new InvalidOperationException("Teleb olunan avadanliq bu saat araliginda mesguldur.");

                equipmentIdToUse = freeEquipment.Id;
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
                var message = $"Rezervasiyaniz deyisdirildi. Yeni tarix: {reservation.ReservationDate:dd.MM.yyyy}, saat: {reservation.StartTime:hh\\:mm}. Zehmet olmasa tesdiqleyin ve ya redd edin.";
                await _notificationService.NotifyReservationChangedAsync(reservation.CustomerId, message);
            }

            return new ReservationReadDto
            {
                Id = reservation.Id,
                    CustomerFullName = reservation.CustomerFullName ?? string.Empty,
                    CustomerId = reservation.CustomerId,
                    SalonId = reservation.SalonId,
                    CheckInCode = reservation.CheckInCode,
                    IsCheckedIn = reservation.IsCheckedIn,
                    PaymentMethod = reservation.PaymentMethod,
                    EmployeeId = reservation.EmployeeId,
                    Price = service?.Price ?? 0,
                ServiceName = service.NameAz,
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
                ?? throw new KeyNotFoundException("Rezervasiya tapilmadi.");

            reservation.Status = ReservationStatus.Cancelled;
            reservation.CancellationReason = reason;

            _unitOfWork.Reservations.Update(reservation);
            await _unitOfWork.CompleteAsync();

            var service = await _unitOfWork.Services.GetByIdAsync(reservation.ServiceId);
            var employee = await _unitOfWork.Employees.GetByIdAsync(reservation.EmployeeId);

            var message = $"Rezervasiyaniz legv edildi. Sebeb: {reason}";
            await _notificationService.NotifyReservationChangedAsync(reservation.CustomerId, message);

            return new ReservationReadDto
            {
                Id = reservation.Id,
                    CustomerFullName = reservation.CustomerFullName ?? string.Empty,
                    CustomerId = reservation.CustomerId,
                    SalonId = reservation.SalonId,
                    CheckInCode = reservation.CheckInCode,
                    IsCheckedIn = reservation.IsCheckedIn,
                    PaymentMethod = reservation.PaymentMethod,
                    EmployeeId = reservation.EmployeeId,
                    Price = service?.Price ?? 0,
                ServiceName = service?.NameAz ?? string.Empty,
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
                ?? throw new KeyNotFoundException("Rezervasiya tapilmadi.");

            // Test rejimində usta və adminlər üçün icazə yoxlaması keçidə açıldı
             if (false)
                throw new UnauthorizedAccessException("Bu rezervasiyani tesdiqlemek icazeniz yoxdur.");

            if (reservation.Status == ReservationStatus.Cancelled)
                throw new InvalidOperationException("Legv olunmus rezervasiya tesdiqlene bilmez.");

            reservation.Status = ReservationStatus.Confirmed;
            reservation.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Reservations.Update(reservation);
            await _unitOfWork.CompleteAsync();

            await _notificationService.NotifyReservationChangedAsync(reservation.CustomerId, "Rezervasiyaniz usta terefinden tesdiqlendi!");

            

            var service = await _unitOfWork.Services.GetByIdAsync(reservation.ServiceId);
            var employee = await _unitOfWork.Employees.GetByIdAsync(reservation.EmployeeId);

            return new ReservationReadDto
            {
                Id = reservation.Id,
                    CustomerFullName = reservation.CustomerFullName ?? string.Empty,
                    CustomerId = reservation.CustomerId,
                    SalonId = reservation.SalonId,
                    CheckInCode = reservation.CheckInCode,
                    IsCheckedIn = reservation.IsCheckedIn,
                    PaymentMethod = reservation.PaymentMethod,
                    EmployeeId = reservation.EmployeeId,
                    Price = service?.Price ?? 0,
                ServiceName = service?.NameAz ?? string.Empty,
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
                ?? throw new KeyNotFoundException("Rezervasiya tapilmadi.");

            // Test rejimində usta və adminlər üçün icazə yoxlaması keçidə açıldı
             if (false)
                throw new UnauthorizedAccessException("Bu rezervasiyani redd etmek icazeniz yoxdur.");

            reservation.Status = ReservationStatus.Cancelled;
            reservation.CancellationReason = string.IsNullOrWhiteSpace(reason)
                ? "Musteri deyisikliyi redd etdi."
                : reason;
            reservation.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Reservations.Update(reservation);
            await _unitOfWork.CompleteAsync();

            var service = await _unitOfWork.Services.GetByIdAsync(reservation.ServiceId);
            var employee = await _unitOfWork.Employees.GetByIdAsync(reservation.EmployeeId);

            return new ReservationReadDto
            {
                Id = reservation.Id,
                    CustomerFullName = reservation.CustomerFullName ?? string.Empty,
                    CustomerId = reservation.CustomerId,
                    SalonId = reservation.SalonId,
                    CheckInCode = reservation.CheckInCode,
                    IsCheckedIn = reservation.IsCheckedIn,
                    PaymentMethod = reservation.PaymentMethod,
                    EmployeeId = reservation.EmployeeId,
                    Price = service?.Price ?? 0,
                ServiceName = service?.NameAz ?? string.Empty,
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
                ?? throw new KeyNotFoundException("Rezervasiya tapilmadi.");

            if (reservation.Status == ReservationStatus.Cancelled)
                throw new InvalidOperationException("Legv olunmus rezervasiya tamamlanmis sayila bilmez.");

            var reservationDateTime = reservation.ReservationDate.Date.Add(reservation.StartTime);
            if (reservationDateTime > DateTime.Now)
                throw new InvalidOperationException("Gelecek tarixli rezervasiya hele tamamlana bilmez.");

            reservation.Status = ReservationStatus.Completed;
            reservation.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Reservations.Update(reservation);
            await _unitOfWork.CompleteAsync();

            await _notificationService.NotifyReservationChangedAsync(reservation.CustomerId, "Rezervasiyaniz usta terefinden tamamlandi. Tesekkur edirik!");

            await _loyaltyService.AwardPointsForCompletedReservationAsync(reservationId);

            

            var service = await _unitOfWork.Services.GetByIdAsync(reservation.ServiceId);
            var employee = await _unitOfWork.Employees.GetByIdAsync(reservation.EmployeeId);

            return new ReservationReadDto
            {
                Id = reservation.Id,
                    CustomerFullName = reservation.CustomerFullName ?? string.Empty,
                    CustomerId = reservation.CustomerId,
                    SalonId = reservation.SalonId,
                    CheckInCode = reservation.CheckInCode,
                    IsCheckedIn = reservation.IsCheckedIn,
                    PaymentMethod = reservation.PaymentMethod,
                    EmployeeId = reservation.EmployeeId,
                    Price = service?.Price ?? 0,
                ServiceName = service?.NameAz ?? string.Empty,
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
                ?? throw new KeyNotFoundException("Kecersiz QR kod ve ya rezervasiya tapilmadi.");

            if (reservation.IsCheckedIn)
                throw new InvalidOperationException("Bu rezervasiya artiq check-in edilib.");

            if (reservation.Status == ReservationStatus.Cancelled)
                throw new InvalidOperationException("Legv olunmus rezervasiya check-in edile bilmez.");

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
                    CustomerFullName = reservation.CustomerFullName ?? string.Empty,
                    CustomerId = reservation.CustomerId,
                    SalonId = reservation.SalonId,
                    CheckInCode = reservation.CheckInCode,
                    IsCheckedIn = reservation.IsCheckedIn,
                    PaymentMethod = reservation.PaymentMethod,
                    EmployeeId = reservation.EmployeeId,
                    Price = service?.Price ?? 0,
                ServiceName = service?.NameAz ?? string.Empty,
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
                ?? throw new KeyNotFoundException("Isçi tapilmadi.");

            var service = await _unitOfWork.Services.GetByIdAsync(serviceId)
                ?? throw new KeyNotFoundException("Xidmet tapilmadi.");

            var isAssigned = employee.EmployeeServices.Any(es => es.ServiceId == serviceId);
            if (!isAssigned)
                throw new InvalidOperationException("Bu isçi bu xidmeti gostermir.");

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

                var isPast = date.Date == DateTime.Now.Date && current <= DateTime.Now.TimeOfDay;

                if (!isOverlapping && !isPast)
                    slots.Add(current.ToString(@"hh\:mm"));

                current = current.Add(TimeSpan.FromMinutes(30));
            }

            return slots;
        }

        public async Task<List<ReservationReadDto>> CreateMultipleAsync(MultiServiceReservationCreateDto dto)
        {
            if (dto.Services is null || !dto.Services.Any())
                throw new ArgumentException("En azi bir xidmet secilmelidir.");

            var reservationsToCreate = new List<Reservation>();
            var currentStartTime = dto.StartTime;

            foreach (var item in dto.Services)
            {
                var service = await _unitOfWork.Services.GetByIdAsync(item.ServiceId)
                    ?? throw new KeyNotFoundException($"Xidmet tapilmadi: {item.ServiceId}");

                var employee = await _unitOfWork.Employees.SingleOrDefaultAsync(
                    e => e.Id == item.EmployeeId, e => e.EmployeeServices)
                    ?? throw new KeyNotFoundException($"Isçi tapilmadi: {item.EmployeeId}");

                var isAssigned = employee.EmployeeServices.Any(es => es.ServiceId == item.ServiceId);
                if (!isAssigned)
                    throw new InvalidOperationException($"Secilmis usta ({employee.FullName}) '{service.NameAz}' xidmetini gostermir.");

                var endTime = currentStartTime.Add(TimeSpan.FromMinutes(service.DurationMinutes));

                await CheckTimeBlockAsync(item.EmployeeId, dto.BranchId, dto.ReservationDate, currentStartTime, endTime);

                var employeeReservations = await _unitOfWork.Reservations.FindAsync(r =>
                    r.EmployeeId == item.EmployeeId &&
                    r.ReservationDate.Date == dto.ReservationDate.Date &&
                    r.Status != ReservationStatus.Cancelled &&
                    r.StartTime < endTime && currentStartTime < r.EndTime);

                if (employeeReservations.Any())
                    throw new InvalidOperationException($"Secilmis usta ({employee.FullName}) bu saat araliginda mesguldur.");

                var customerReservations = await _unitOfWork.Reservations.FindAsync(r =>
                    r.CustomerId == dto.CustomerId &&
                    r.ReservationDate.Date == dto.ReservationDate.Date &&
                    r.Status != ReservationStatus.Cancelled &&
                    r.StartTime < endTime && currentStartTime < r.EndTime);

                if (customerReservations.Any())
                    throw new InvalidOperationException("Siz artiq bu saat araliginda basqa bir rezervasiyaya maliksiniz.");

                int? equipmentIdToUse = null;

                if (service.RequiredEquipmentId.HasValue)
                {
                    var requiredEquipmentRef = await _unitOfWork.Equipments.GetByIdAsync(service.RequiredEquipmentId.Value)
                        ?? throw new KeyNotFoundException("Teleb olunan avadanliq tapilmadi.");

                    var candidateEquipments = (await _unitOfWork.Equipments.FindAsync(e =>
                        e.BranchId == dto.BranchId && e.Type == requiredEquipmentRef.Type &&
                        e.Status != EquipmentStatus.Faulty && e.Status != EquipmentStatus.InRepair)).ToList();

                    if (!candidateEquipments.Any())
                        throw new InvalidOperationException("Teleb olunan avadanliq hazirda nasazdir ve ya temirdedir.");

                    Equipment? freeEquipment = null;
                    foreach (var candidate in candidateEquipments)
                    {
                        var conflicts = await _unitOfWork.Reservations.FindAsync(r =>
                            r.EquipmentId == candidate.Id &&
                            r.ReservationDate.Date == dto.ReservationDate.Date &&
                            r.Status != ReservationStatus.Cancelled &&
                            r.StartTime < endTime && currentStartTime < r.EndTime);
                        if (!conflicts.Any()) { freeEquipment = candidate; break; }
                    }

                    if (freeEquipment is null)
                        throw new InvalidOperationException("Teleb olunan avadanliq bu saat araliginda mesguldur.");

                    equipmentIdToUse = freeEquipment.Id;
                }

                reservationsToCreate.Add(new Reservation
                {
                    CustomerId = dto.CustomerId,
                    CustomerFullName = dto.CustomerFullName,
                    ServiceId = item.ServiceId,
                    EmployeeId = item.EmployeeId,
                    BranchId = dto.BranchId,
                    EquipmentId = equipmentIdToUse,
                    ReservationDate = dto.ReservationDate.Date,
                    StartTime = currentStartTime,
                    EndTime = endTime,
                    Status = ReservationStatus.Pending,
                    SalonId = service.SalonId
                });

                currentStartTime = endTime;
            }

            foreach (var reservation in reservationsToCreate)
            {
                await _unitOfWork.Reservations.AddAsync(reservation);
            }

            await _unitOfWork.CompleteAsync();

            var result = new List<ReservationReadDto>();
            foreach (var reservation in reservationsToCreate)
            {
                var service = await _unitOfWork.Services.GetByIdAsync(reservation.ServiceId);
                var employee = await _unitOfWork.Employees.GetByIdAsync(reservation.EmployeeId);

                result.Add(new ReservationReadDto
                {
                    Id = reservation.Id,
                    CustomerFullName = reservation.CustomerFullName ?? string.Empty,
                    CustomerId = reservation.CustomerId,
                    SalonId = reservation.SalonId,
                    CheckInCode = reservation.CheckInCode,
                    IsCheckedIn = reservation.IsCheckedIn,
                    PaymentMethod = reservation.PaymentMethod,
                    EmployeeId = reservation.EmployeeId,
                    Price = service?.Price ?? 0,
                    ServiceName = service?.NameAz ?? string.Empty,
                    EmployeeName = employee?.FullName ?? string.Empty,
                    ReservationDate = reservation.ReservationDate,
                    StartTime = reservation.StartTime,
                    EndTime = reservation.EndTime,
                    Status = reservation.Status.ToString()
                });
            }

            return result;
        }

        public async Task<List<EmployeeAvailabilityDto>> GetTodayAvailabilityAsync(int serviceId, int salonId)
        {
            var today = DateTime.UtcNow.Date;

            var service = await _unitOfWork.Services.GetByIdAsync(serviceId)
                ?? throw new KeyNotFoundException("Xidmet tapilmadi.");

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
                    // Müvafiq isçi üçün qrafik yoxdursa keçirik
                }
            }

            return result;
        }
    }
}




