using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace YourProject.Services
{
    public class ReservationService : IReservationService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public ReservationService(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<Reservation> ConfirmAsync(int id, string userId)
        {
            var reservation = await _context.Reservations.FindAsync(id);
            if (reservation == null)
                throw new KeyNotFoundException("Rezervasiya tapılmadı.");

            if (reservation.UserId != userId)
                throw new UnauthorizedAccessException("Bu əməliyyatı yerinə yetirmək üçün səlahiyyətiniz yoxdur.");

            reservation.Status = ReservationStatus.Confirmed;
            await _context.SaveChangesAsync();

            await _notificationService.NotifyReservationConfirmedAsync(reservation.Id);

            return reservation;
        }

        public async Task<Reservation> RejectAsync(int id, string reason)
        {
            var reservation = await _context.Reservations.FindAsync(id);
            if (reservation == null)
                throw new KeyNotFoundException("Rezervasiya tapılmadı.");

            reservation.Status = ReservationStatus.Rejected;
            reservation.Notes = string.IsNullOrWhiteSpace(reservation.Notes) 
                ? $"İmtina səbəbi: {reason}" 
                : $"{reservation.Notes} | İmtina səbəbi: {reason}";

            await _context.SaveChangesAsync();
            await _notificationService.NotifyReservationRejectedAsync(reservation.Id, reason);

            return reservation;
        }

        public async Task<Reservation> CompleteAsync(int id)
        {
            var reservation = await _context.Reservations.FindAsync(id);
            if (reservation == null)
                throw new KeyNotFoundException("Rezervasiya tapılmadı.");

            reservation.Status = ReservationStatus.Completed;
            await _context.SaveChangesAsync();

            return reservation;
        }

        public async Task<Reservation> CheckInAsync(int id)
        {
            var reservation = await _context.Reservations.FindAsync(id);
            if (reservation == null)
                throw new KeyNotFoundException("Rezervasiya tapılmadı.");

            reservation.Status = ReservationStatus.CheckedIn;
            await _context.SaveChangesAsync();

            return reservation;
        }

        public async Task<IEnumerable<TimeSpan>> GetAvailableSlotsAsync(DateTime date)
        {
            var bookedSlots = await _context.Reservations
                .Where(r => r.Date.Date == date.Date && r.Status != ReservationStatus.Cancelled)
                .Select(r => r.TimeSlot)
                .ToListAsync();

            var allSlots = new List<TimeSpan>
            {
                new TimeSpan(9, 0, 0),
                new TimeSpan(10, 0, 0),
                new TimeSpan(11, 0, 0),
                new TimeSpan(14, 0, 0),
                new TimeSpan(15, 0, 0),
                new TimeSpan(16, 0, 0)
            };

            return allSlots.Where(slot => !bookedSlots.Contains(slot));
        }

        public async Task<IEnumerable<TimeSpan>> GetTodayAvailabilityAsync()
        {
            return await GetAvailableSlotsAsync(DateTime.Today);
        }

        public async Task<IEnumerable<Reservation>> CreateMultipleAsync(IEnumerable<Reservation> reservations)
        {
            if (reservations == null || !reservations.Any())
                return Enumerable.Empty<Reservation>();

            await _context.Reservations.AddRangeAsync(reservations);
            await _context.SaveChangesAsync();

            return reservations;
        }
    }
}