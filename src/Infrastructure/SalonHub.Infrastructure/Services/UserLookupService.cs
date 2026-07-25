using Microsoft.AspNetCore.Identity;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Persistence.Identity;
namespace SalonHub.Infrastructure.Services;
public class UserLookupService : IUserLookupService
{
    private readonly UserManager<ApplicationUser> _userManager;
    public UserLookupService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }
    public async Task<string?> GetFullNameAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        return user?.FullName;
    }
    public async Task<int> GetNewCustomersCountInMonthAsync(int month, int year)
    {
        var users = await _userManager.GetUsersInRoleAsync("Customer");
        return users.Count(u => u.CreatedAt.Month == month && u.CreatedAt.Year == year);
    }
}
