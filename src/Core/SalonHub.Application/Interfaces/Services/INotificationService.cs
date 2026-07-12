namespace SalonHub.Application.Interfaces.Services;

public interface INotificationService
{
    Task NotifyReservationChangedAsync(string customerId, string message);
    Task NotifyEmployeeAsync(int employeeId, string message);
}
