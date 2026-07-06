using SalonHub.Domain.Entities;   
using SalonHub.Domain.Enums;      
using SalonHub.Application.DTOs.Reservations;
using SalonHub.Application.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.Services
{
    public interface IReservationService
    {
        Task<ReservationReadDto> CreateAsync(ReservationCreateDto dto);
        Task CancelAsync(int reservationId, string reason);
    }

    public class ReservationService : IReservationService
    {
        private readonly IUnitOfWork _unitOfWork;

        public ReservationService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<ReservationReadDto> CreateAsync(ReservationCreateDto dto)
        {
            var service = await _unitOfWork.Services.GetByIdAsync(dto.ServiceId)
                ?? throw new KeyNotFoundException("Xidmət tapılmadı.");

            var employee = await _unitOfWork.Employees.GetByIdAsync(dto.EmployeeId)
                ?? throw new KeyNotFoundException("İşçi tapılmadı.");

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

        public async Task CancelAsync(int reservationId, string reason)
        {
            var reservation = await _unitOfWork.Reservations.GetByIdAsync(reservationId)
                ?? throw new KeyNotFoundException("Rezervasiya tapılmadı.");

            reservation.Status = ReservationStatus.Cancelled;
            reservation.CancellationReason = reason;

            _unitOfWork.Reservations.Update(reservation);
            await _unitOfWork.CompleteAsync();
        }
    }
}
