using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;

namespace SalonHub.Persistence.Services
{
    public class BirthdayBonusJob
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILoyaltyService _loyaltyService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<BirthdayBonusJob> _logger;

        private const int BirthdayBonusPoints = 100;

        public BirthdayBonusJob(
            UserManager<ApplicationUser> userManager,
            ILoyaltyService loyaltyService,
            INotificationService notificationService,
            ILogger<BirthdayBonusJob> logger)
        {
            _userManager = userManager;
            _loyaltyService = loyaltyService;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task SendBirthdayBonuses()
        {
            var today = DateTime.UtcNow;
            _logger.LogInformation("Doğum günü bonusu yoxlaması başladı: {Date}", today.Date);

            var allUsers = _userManager.Users
                .Where(u => u.DateOfBirth.HasValue)
                .ToList();

            var birthdayUsers = allUsers
                .Where(u => u.DateOfBirth!.Value.Month == today.Month && u.DateOfBirth.Value.Day == today.Day)
                .ToList();

            foreach (var user in birthdayUsers)
            {
                try
                {
                    var wasAwarded = await _loyaltyService.AwardBirthdayBonusAsync(user.Id, BirthdayBonusPoints);

                    if (wasAwarded)
                    {
                        var message = $"🎉 Ad günün mübarək, {user.FullName}! Sənə {BirthdayBonusPoints} bonus xal hədiyyə etdik.";
                        await _notificationService.NotifyReservationChangedAsync(user.Id, message);
                        _logger.LogInformation("Doğum günü bonusu verildi: {UserId}, {FullName}", user.Id, user.FullName);
                    }
                    else
                    {
                        _logger.LogInformation("Bu il artıq bonus verilib, təkrar verilmədi: {UserId}, {FullName}", user.Id, user.FullName);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Doğum günü bonusu verilərkən xəta baş verdi: {UserId}", user.Id);
                }
            }

            _logger.LogInformation("Doğum günü bonusu yoxlaması bitdi. Tapılan istifadəçi sayı: {Count}", birthdayUsers.Count);
        }
    }
}
