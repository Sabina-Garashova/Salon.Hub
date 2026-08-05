using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;

namespace SalonHub.Application.Services
{
    public class ReservationReminderJob
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notificationService;

        public ReservationReminderJob(IUnitOfWork unitOfWork, INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
        }

        public async Task SendUpcomingReminders()
        {
            var now = DateTime.UtcNow;
            var windowStart = now.AddMinutes(15);
            var windowEnd = now.AddMinutes(15).AddMinutes(5);

            var reservations = await _unitOfWork.Reservations.FindAsync(r =>
                r.Status == ReservationStatus.Confirmed &&
                r.ReservationDate.Date == now.Date);

            foreach (var reservation in reservations)
            {
                var reservationDateTime = reservation.ReservationDate.Date + reservation.StartTime;
                if (reservationDateTime >= windowStart && reservationDateTime <= windowEnd)
                {
                    var message = $"Xatırlatma: {reservation.StartTime:hh\\:mm} saatında rezervasiyanız var.";
                    await _notificationService.NotifyReservationChangedAsync(reservation.CustomerId, message);
                }
            }
        }
    }
}

