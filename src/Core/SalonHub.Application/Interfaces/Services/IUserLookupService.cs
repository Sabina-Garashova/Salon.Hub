namespace SalonHub.Application.Interfaces.Services;
public interface IUserLookupService
{
    Task<string?> GetFullNameAsync(string userId);
    Task<string?> GetEmailAsync(string userId);
    Task<int> GetNewCustomersCountInMonthAsync(int month, int year);
    Task PromoteToEmployeeAsync(string userId);
    Task DemoteFromEmployeeAsync(string userId);
}
