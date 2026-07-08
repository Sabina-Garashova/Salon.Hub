using Microsoft.Extensions.Logging;
using SalonHub.Application.Interfaces.Services;

namespace SalonHub.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ILogger<NotificationService> logger)
    {
        _logger = logger;
    }

    public Task NotifyReservationChangedAsync(string customerId, string message)
    {
        _logger.LogInformation("BİLDİRİŞ [Müştəri: {CustomerId}]: {Message}", customerId, message);
        return Task.CompletedTask;
    }
}