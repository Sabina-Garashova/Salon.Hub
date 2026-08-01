using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.SalonApplications;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SalonApplicationController : ControllerBase
    {
        private readonly ISalonApplicationService _applicationService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly INotificationService _notificationService;

        public SalonApplicationController(
            ISalonApplicationService applicationService,
            UserManager<ApplicationUser> userManager,
            INotificationService notificationService)
        {
            _applicationService = applicationService;
            _userManager = userManager;
            _notificationService = notificationService;
        }

        private string GetRequesterId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create(SalonApplicationCreateDto dto)
        {
            var userId = GetRequesterId();
            var user = await _userManager.FindByIdAsync(userId)
                ?? throw new KeyNotFoundException("İstifadəçi tapılmadı.");

            var result = await _applicationService.CreateAsync(userId, user.FullName, user.Email!, dto);

            var superAdmins = await _userManager.GetUsersInRoleAsync(Roles.SuperAdmin);
            foreach (var admin in superAdmins)
            {
                await _notificationService.NotifyReservationChangedAsync(
                    admin.Id,
                    $"Yeni salon müraciəti: {user.FullName} ({user.Email}) - \"{result.ProposedSalonName}\" salonu üçün.");
            }

            return Ok(result);
        }

        [HttpGet("pending")]
        [Authorize(Roles = Roles.SuperAdmin)]
        public async Task<IActionResult> GetPending()
        {
            var pending = await _applicationService.GetPendingAsync();

            foreach (var app in pending)
            {
                var applicant = await _userManager.FindByIdAsync(app.ApplicantUserId);
                if (applicant is not null)
                {
                    app.ApplicantFullName = applicant.FullName;
                    app.ApplicantEmail = applicant.Email ?? string.Empty;
                }
            }

            return Ok(pending);
        }

        [HttpPost("{id}/approve")]
        [Authorize(Roles = Roles.SuperAdmin)]
        public async Task<IActionResult> Approve(int id)
        {
            var applicationEntity = await _applicationService.GetEntityByIdAsync(id);
            var applicant = await _userManager.FindByIdAsync(applicationEntity.ApplicantUserId)
                ?? throw new KeyNotFoundException("Müraciət edən istifadəçi tapılmadı.");

            var createdSalon = await _applicationService.ApproveAndCreateSalonAsync(id, GetRequesterId());

            if (!await _userManager.IsInRoleAsync(applicant, Roles.SalonAdmin))
                await _userManager.AddToRoleAsync(applicant, Roles.SalonAdmin);

            await _notificationService.NotifyReservationChangedAsync(
                applicant.Id,
                $"🎉 Təbriklər! Salon müraciətiniz təsdiqləndi, \"{createdSalon.NameAz}\" salonu yaradıldı və SalonAdmin səlahiyyətləri sizə verildi.");

            return Ok(new { message = "Müraciət təsdiqləndi, salon yaradıldı.", salonId = createdSalon.Id });
        }

        [HttpPost("{id}/reject")]
        [Authorize(Roles = Roles.SuperAdmin)]
        public async Task<IActionResult> Reject(int id, SalonApplicationRejectDto dto)
        {
            var application = await _applicationService.GetEntityByIdAsync(id);

            await _applicationService.MarkRejectedAsync(id, GetRequesterId(), dto.Reason);

            var message = string.IsNullOrWhiteSpace(dto.Reason)
                ? "Salon müraciətiniz təəssüf ki, rədd edildi."
                : $"Salon müraciətiniz rədd edildi. Səbəb: {dto.Reason}";

            await _notificationService.NotifyReservationChangedAsync(application.ApplicantUserId, message);

            return Ok(new { message = "Müraciət rədd edildi." });
        }
    }
}
