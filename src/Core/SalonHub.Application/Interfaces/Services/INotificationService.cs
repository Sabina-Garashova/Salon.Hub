namespace SalonHub.Application.Interfaces.Services;

public interface INotificationService
{
    Task NotifyReservationChangedAsync(string customerId, string message, string? typeKey = null, string? paramsJson = null);
    Task NotifyEmployeeAsync(int employeeId, string message, string? typeKey = null, string? paramsJson = null);
}



