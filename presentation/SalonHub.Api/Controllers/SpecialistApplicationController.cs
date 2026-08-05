using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Employees;
using SalonHub.Application.DTOs.SpecialistApplications;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;
using System.Text.Json;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SpecialistApplicationController : ControllerBase
    {
        private readonly ISpecialistApplicationService _applicationService;
        private readonly IEmployeeService _employeeService;
        private readonly IServiceCrudService _serviceCrudService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly INotificationService _notificationService;
        private readonly IEmailService _emailService;

        private const string DefaultStaffPassword = "Test1234!";

        public SpecialistApplicationController(
            ISpecialistApplicationService applicationService,
            IEmployeeService employeeService,
            IServiceCrudService serviceCrudService,
            UserManager<ApplicationUser> userManager,
            INotificationService notificationService,
            IEmailService emailService)
        {
            _applicationService = applicationService;
            _employeeService = employeeService;
            _serviceCrudService = serviceCrudService;
            _userManager = userManager;
            _notificationService = notificationService;
            _emailService = emailService;
        }

        private static string Transliterate(string input)
        {
            var map = new Dictionary<char, char>
            {
                ['ə'] = 'e', ['Ə'] = 'e',
                ['ö'] = 'o', ['Ö'] = 'o',
                ['ü'] = 'u', ['Ü'] = 'u',
                ['ç'] = 'c', ['Ç'] = 'c',
                ['ş'] = 's', ['Ş'] = 's',
                ['ğ'] = 'g', ['Ğ'] = 'g',
                ['ı'] = 'i', ['I'] = 'i',
                ['İ'] = 'i',
            };

            var sb = new System.Text.StringBuilder();
            foreach (var ch in input)
            {
                if (map.TryGetValue(ch, out var replacement))
                    sb.Append(replacement);
                else if (char.IsLetterOrDigit(ch))
                    sb.Append(char.ToLowerInvariant(ch));
            }
            return sb.ToString();
        }

        private async Task<string> GenerateStaffEmailAsync(string fullName)
        {
            var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var firstName = parts.Length > 0 ? Transliterate(parts[0]) : "usta";
            var lastName = parts.Length > 1 ? Transliterate(parts[^1]) : string.Empty;

            var baseLocal = string.IsNullOrEmpty(lastName) ? firstName : $"{firstName}.{lastName}";
            if (string.IsNullOrWhiteSpace(baseLocal))
                baseLocal = "usta";

            var candidate = $"{baseLocal}@salonhub.com";
            var suffix = 1;
            while (await _userManager.FindByEmailAsync(candidate) is not null)
            {
                suffix++;
                candidate = $"{baseLocal}{suffix}@salonhub.com";
            }

            return candidate;
        }

        private string GetRequesterId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        private bool IsSuperAdmin() => User.IsInRole(Roles.SuperAdmin);

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create(SpecialistApplicationCreateDto dto)
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
                    $"Yeni usta müraciəti: {user.FullName} ({user.Email}) - {result.YearsOfExperience} il təcrübə, {result.ExpectedSalaryMin}-{result.ExpectedSalaryMax} AZN gözləntisi.");
            }

            return Ok(result);
        }

        [HttpGet("pending")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> GetPending()
        {
            var pending = await _applicationService.GetPendingAsync(GetRequesterId(), IsSuperAdmin());

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
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Approve(int id, SpecialistApplicationApproveDto? dto)
        {
            var application = await _applicationService.GetEntityByIdAsync(id);

            if (!IsSuperAdmin() && application.Salon?.OwnerId != GetRequesterId())
                return Forbid();

            if (application.Status != SalonHub.Domain.Entities.SpecialistApplicationStatus.Pending)
                return BadRequest(new { message = "Bu müraciət artıq nəzərdən keçirilib." });

            var applicant = await _userManager.FindByIdAsync(application.ApplicantUserId)
                ?? throw new KeyNotFoundException("Müraciət edən istifadəçi tapılmadı.");

            var employeeDto = new EmployeeCreateDto
            {
                FullName = applicant.FullName,
                PhoneNumber = !string.IsNullOrWhiteSpace(application.PhoneNumber) ? application.PhoneNumber : (applicant.PhoneNumber ?? string.Empty),
                Bio = application.Bio,
                ProfileImageUrl = application.ProfileImageUrl,
                ApplicationUserId = applicant.Id,
                SalonId = application.SalonId,
                BranchId = application.BranchId,
                AssignedEquipmentId = null,
                Salary = dto?.AgreedSalary
            };

            var createdEmployee = await _employeeService.CreateAsync(employeeDto, GetRequesterId(), isSuperAdmin: true);

            if (!string.IsNullOrWhiteSpace(application.Specialty))
            {
                var allServices = await _serviceCrudService.GetAllAsync(null, null, true);
                var matchedService = allServices.FirstOrDefault(s => s.SalonId == application.SalonId && s.Name == application.Specialty);
                if (matchedService is not null)
                {
                    await _employeeService.AssignServiceAsync(createdEmployee.Id, matchedService.Id, GetRequesterId(), isSuperAdmin: true);
                }
            }

            if (!string.IsNullOrWhiteSpace(application.Specialty))
            {
                var salonServices = await _serviceCrudService.GetAllAsync(null);
                var matchingServices = salonServices.Where(s =>
                    s.SalonId == application.SalonId &&
                    s.Name.Contains(application.Specialty, StringComparison.OrdinalIgnoreCase));

                foreach (var svc in matchingServices)
                {
                    try
                    {
                        await _employeeService.AssignServiceAsync(createdEmployee.Id, svc.Id, GetRequesterId(), isSuperAdmin: true);
                    }
                    catch
                    {
                        // Uygunsuzluq olarsa sessizce kecirik
                    }
                }
            }

            if (!await _userManager.IsInRoleAsync(applicant, Roles.Employee))
                await _userManager.AddToRoleAsync(applicant, Roles.Employee);

            // Ustaya rəsmi SalonHub iş email-i və standart şifrə təhkim edilir
            var staffEmail = await GenerateStaffEmailAsync(applicant.FullName);
            var setEmailResult = await _userManager.SetEmailAsync(applicant, staffEmail);
            var setUserNameResult = await _userManager.SetUserNameAsync(applicant, staffEmail);
            applicant.EmailConfirmed = true;

            var removePasswordResult = await _userManager.RemovePasswordAsync(applicant);
            var addPasswordResult = await _userManager.AddPasswordAsync(applicant, DefaultStaffPassword);

            await _userManager.UpdateAsync(applicant);

            await _applicationService.MarkApprovedAsync(id, GetRequesterId());

            var approvalMessage = dto?.AgreedSalary.HasValue == true
                ? $"🎉 Təbriklər! Usta müraciətiniz təsdiqləndi, artıq SalonHub komandasının bir hissəsisiniz. Razılaşdırılan aylıq maaşınız: {dto.AgreedSalary.Value} AZN. Yeni iş email-iniz: {staffEmail} (şifrə: {DefaultStaffPassword})"
                : $"🎉 Təbriklər! Usta müraciətiniz təsdiqləndi, artıq SalonHub komandasının bir hissəsisiniz. Yeni iş email-iniz: {staffEmail} (şifrə: {DefaultStaffPassword})";

            await _notificationService.NotifyReservationChangedAsync(
                applicant.Id,
                approvalMessage);

            var emailBody = $"Salam {applicant.FullName},\n\nSalonHub komandasına xoş gəlmisiniz! Sistemə daxil olmaq üçün yeni iş hesabınız yaradıldı:\n\nEmail: {staffEmail}\nŞifrə: {DefaultStaffPassword}\n\nZəhmət olmasa ilk daxilolmadan sonra şifrənizi dəyişin.\n\nSalonHub komandası";
            await _emailService.SendEmailAsync(staffEmail, "SalonHub - İş Hesabınız Yaradıldı", emailBody);

            return Ok(new
            {
                message = "Müraciət təsdiqləndi, işçi qeydi yaradıldı.",
                staffEmail,
                staffPassword = DefaultStaffPassword
            });
        }

        [HttpPost("{id}/reject")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Reject(int id, SpecialistApplicationRejectDto dto)
        {
            var application = await _applicationService.GetEntityByIdAsync(id);

            if (!IsSuperAdmin() && application.Salon?.OwnerId != GetRequesterId())
                return Forbid();

            if (application.Status != SalonHub.Domain.Entities.SpecialistApplicationStatus.Pending)
                return BadRequest(new { message = "Bu müraciət artıq nəzərdən keçirilib." });

            await _applicationService.MarkRejectedAsync(id, GetRequesterId(), dto.Reason);

            var message = string.IsNullOrWhiteSpace(dto.Reason)
                ? "Usta müraciətiniz təəssüf ki, rədd edildi."
                : $"Usta müraciətiniz rədd edildi. Səbəb: {dto.Reason}";

            await _notificationService.NotifyReservationChangedAsync(application.ApplicantUserId, message);

            return Ok(new { message = "Müraciət rədd edildi." });
        }
    }
}










