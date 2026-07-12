using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Persistence.Identity;

namespace SalonHub.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ILogger<NotificationService> _logger;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IEmailService _emailService;
    private readonly ISmsService _smsService;
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(
        ILogger<NotificationService> logger,
        UserManager<ApplicationUser> userManager,
        IEmailService emailService,
        ISmsService smsService,
        IUnitOfWork unitOfWork)
    {
        _logger = logger;
        _userManager = userManager;
        _emailService = emailService;
        _smsService = smsService;
        _unitOfWork = unitOfWork;
    }

    public async Task NotifyReservationChangedAsync(string customerId, string message)
    {
        _logger.LogInformation("BİLDİRİŞ [Müştəri: {CustomerId}]: {Message}", customerId, message);

        try
        {
            var user = await _userManager.FindByIdAsync(customerId);
            if (user is null)
            {
                _logger.LogWarning("Bildiriş göndərmək üçün istifadəçi tapılmadı: {CustomerId}", customerId);
                return;
            }

            if (!string.IsNullOrEmpty(user.Email))
            {
                await _emailService.SendEmailAsync(user.Email, "SalonHub - Rezervasiya Bildirişi", message);
            }

            if (!string.IsNullOrEmpty(user.PhoneNumber))
            {
                await _smsService.SendSmsAsync(user.PhoneNumber, message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bildiriş göndərilərkən xəta baş verdi. Müştəri: {CustomerId}", customerId);
        }
    }

    public async Task NotifyEmployeeAsync(int employeeId, string message)
    {
        _logger.LogInformation("BİLDİRİŞ [İşçi ID: {EmployeeId}]: {Message}", employeeId, message);

        try
        {
            var employee = await _unitOfWork.Employees.GetByIdAsync(employeeId);
            if (employee is null || string.IsNullOrEmpty(employee.ApplicationUserId))
            {
                _logger.LogWarning("Bildiriş göndərmək üçün işçi və ya istifadəçi hesabı tapılmadı: {EmployeeId}", employeeId);
                return;
            }

            var user = await _userManager.FindByIdAsync(employee.ApplicationUserId);
            if (user is null)
            {
                _logger.LogWarning("İşçinin istifadəçi hesabı tapılmadı: {EmployeeId}", employeeId);
                return;
            }

            if (!string.IsNullOrEmpty(user.Email))
            {
                await _emailService.SendEmailAsync(user.Email, "SalonHub - İşçi Bildirişi", message);
            }

            if (!string.IsNullOrEmpty(user.PhoneNumber))
            {
                await _smsService.SendSmsAsync(user.PhoneNumber, message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "İşçiyə bildiriş göndərilərkən xəta baş verdi. İşçi ID: {EmployeeId}", employeeId);
        }
    }
}
