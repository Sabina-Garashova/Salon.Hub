using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Auth;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ITokenService _tokenService;
        private readonly ILoyaltyService _loyaltyService;
        private readonly INotificationService _notificationService;
        private readonly IEmailService _emailService;
        private readonly IUnitOfWork _unitOfWork;

        private const int ReferrerBonusPoints = 50;
        private const int NewUserBonusPoints = 20;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            ITokenService tokenService,
            ILoyaltyService loyaltyService,
            INotificationService notificationService,
            IEmailService emailService,
            IUnitOfWork unitOfWork)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _loyaltyService = loyaltyService;
            _notificationService = notificationService;
            _emailService = emailService;
            _unitOfWork = unitOfWork;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            string? referredByUserId = null;

            if (!string.IsNullOrWhiteSpace(dto.ReferredByCode))
            {
                var referrer = _userManager.Users.FirstOrDefault(u => u.ReferralCode == dto.ReferredByCode);
                if (referrer is not null)
                {
                    referredByUserId = referrer.Id;
                }
            }

            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName,
                DateOfBirth = dto.DateOfBirth,
                ReferralCode = GenerateReferralCode(),
                ReferredByUserId = referredByUserId
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                var isDuplicate = result.Errors.Any(e =>
                    e.Code == "DuplicateUserName" || e.Code == "DuplicateEmail");

                var message = isDuplicate
                    ? "Bu email artıq istifadə olunub. Zəhmət olmasa başqa email daxil edin və ya daxil olun."
                    : string.Join(" ", result.Errors.Select(e => e.Description));

                return BadRequest(new { message });
            }

            await _userManager.AddToRoleAsync(user, dto.Role);

            var welcomeMessage = $"Xoş gəldiniz, {user.FullName}! Sizin şəxsi dəvət kodunuz: {user.ReferralCode}. Bu kodu dostlarınızla paylaşın, hər ikiniz bonus qazanın! 🎁";
            await _notificationService.NotifyReservationChangedAsync(user.Id, welcomeMessage);

            if (referredByUserId is not null)
            {
                try
                {
                    await _loyaltyService.AwardReferralBonusAsync(referredByUserId, ReferrerBonusPoints);
                    await _loyaltyService.AwardReferralBonusAsync(user.Id, NewUserBonusPoints);

                    var referrer = await _userManager.FindByIdAsync(referredByUserId);
                    if (referrer is not null)
                    {
                        var message = $"🎁 Dostunuz {user.FullName} sizin dəvət kodunuzla qeydiyyatdan keçdi! Sizə {ReferrerBonusPoints} bonus xal hədiyyə edildi.";
                        await _notificationService.NotifyReservationChangedAsync(referrer.Id, message);
                    }
                }
                catch
                {
                    // Referral bonusu uğursuz olsa belə, qeydiyyatın özü uğurlu qalmalıdır
                }
            }

            var response = _tokenService.GenerateToken(user.Id, user.Email!, user.FullName, dto.Role);
            return Ok(response);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user is null || !await _userManager.CheckPasswordAsync(user, dto.Password))
                return Unauthorized(new { message = "Email və ya şifrə yanlışdır." });

            if (await _userManager.IsLockedOutAsync(user))
                return Unauthorized(new { message = "Hesabınız bloklanıb. Zəhmət olmasa SuperAdmin ilə əlaqə saxlayın." });

            var roles = await _userManager.GetRolesAsync(user);

            // Öz-özünü düzəldən yoxlama: istifadəçi aktiv bir Employee qeydinə bağlıdırsa,
            // amma hələ Employee roluna sahib deyilsə (məsələn, köhnə/əvvəlki əlaqələndirmə
            // üçün rol heç vaxt verilməyibsə), rolu burada tamamlayırıq.
            if (!roles.Contains(Roles.Employee))
            {
                var activeEmployeeRecords = await _unitOfWork.Employees.FindAsync(e => e.ApplicationUserId == user.Id && !e.IsDeleted);
                if (activeEmployeeRecords.Any())
                {
                    await _userManager.AddToRoleAsync(user, Roles.Employee);
                    roles = await _userManager.GetRolesAsync(user);
                }
            }

            var rolePriority = new[] { Roles.SuperAdmin, Roles.SalonAdmin, Roles.Employee, Roles.Customer };
            var role = rolePriority.FirstOrDefault(r => roles.Contains(r)) ?? Roles.Customer;

            // İşçi kabinetdə/header-də göstərilən ad hesabın qeydiyyat adı (ApplicationUser.FullName)
            // yox, admin panelindən "İşçi adı" olaraq yazılmış Employee.FullName olsun.
            var displayName = user.FullName;
            if (role == Roles.Employee)
            {
                var myEmployeeRecords = await _unitOfWork.Employees.FindAsync(e => e.ApplicationUserId == user.Id && !e.IsDeleted);
                var myEmployee = myEmployeeRecords.FirstOrDefault();
                if (myEmployee is not null && !string.IsNullOrWhiteSpace(myEmployee.FullName))
                    displayName = myEmployee.FullName;
            }

            var response = _tokenService.GenerateToken(user.Id, user.Email!, displayName, role);
            return Ok(response);
        }

        [HttpGet("my-referral-code")]
        [Authorize]
        public async Task<IActionResult> GetMyReferralCode()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var user = await _userManager.FindByIdAsync(userId);

            if (user is null)
                return NotFound();

            return Ok(new ReferralCodeDto { ReferralCode = user.ReferralCode });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);

            if (user is not null)
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var encodedToken = Uri.EscapeDataString(token);
                var encodedEmail = Uri.EscapeDataString(dto.Email);
                var resetLink = $"http://localhost:5173/reset-password?email={encodedEmail}&token={encodedToken}";

                var emailBody = $@"
                    <div style='font-family: Arial, sans-serif; padding: 20px;'>
                        <h2 style='color: #C9A227;'>SalonHub - Şifrə Sıfırlama</h2>
                        <p>Şifrənizi yeniləmək üçün aşağıdakı düyməyə klikləyin:</p>
                        <a href='{resetLink}' style='padding: 10px 18px; background-color: #C9A227; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;'>Şifrəni Yenilə</a>
                    </div>";

                await _emailService.SendEmailAsync(user.Email!, "SalonHub - Şifrə Sıfırlama", emailBody);
            }

            // Təhlükəsizlik üçün, email mövcud olsa da olmasa da eyni cavabı veririk
            return Ok(new { message = "Əgər bu email sistemdə mövcuddursa, şifrə sıfırlama kodu göndərildi." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email)
                ?? throw new KeyNotFoundException("İstifadəçi tapılmadı.");

            var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok(new { message = "Şifrəniz uğurla yeniləndi." });
        }

        [HttpPost("request-specialist")]
        [Authorize]
        public async Task<IActionResult> RequestSpecialist()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var user = await _userManager.FindByIdAsync(userId);

            if (user is null)
                return NotFound();

            var superAdmins = await _userManager.GetUsersInRoleAsync(Roles.SuperAdmin);

            if (!superAdmins.Any())
                return Ok(new { message = "Tələbiniz qeydə alındı, amma hazırda sistemdə SuperAdmin tapılmadı." });

            var subject = "SalonHub - Yeni Usta Tələbi";
            var body = $"İstifadəçi {user.FullName} ({user.Email}) usta/ixtisas sahibi olmaq istəyir. Zəhmət olmasa SuperAdmin panelindən nəzərdən keçirin.";

            foreach (var admin in superAdmins)
            {
                await _emailService.SendEmailAsync(admin.Email!, subject, body);
            }

            return Ok(new { message = "Tələbiniz SuperAdmin-ə göndərildi." });
        }

        [HttpGet("whoami")]
        [Authorize]
        public IActionResult WhoAmI()
        {
            var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
            return Ok(claims);
        }

        [HttpPost("users/{id}/remove-role")]
        [Authorize(Roles = Roles.SuperAdmin)]
        public async Task<IActionResult> RemoveRole(string id, [FromBody] RemoveRoleDto dto)
        {
            var user = await _userManager.FindByIdAsync(id)
                ?? throw new KeyNotFoundException("Istifadeci tapilmadi.");

            if (await _userManager.IsInRoleAsync(user, dto.Role))
            {
                await _userManager.RemoveFromRoleAsync(user, dto.Role);
                await _userManager.UpdateSecurityStampAsync(user);
            }

            return Ok(new { message = "Rol silindi." });
        }

        [HttpPost("fix-fullname")]
        [Authorize(Roles = Roles.SuperAdmin)]
        public async Task<IActionResult> FixFullName([FromBody] FixFullNameDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email)
                ?? throw new KeyNotFoundException("Istifadeci tapilmadi.");
            user.FullName = dto.NewFullName;
            await _userManager.UpdateAsync(user);
            return Ok(new { message = "Ad yenilendi." });
        }

        [HttpGet("search-users")]
        [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.SalonAdmin}")]
        public IActionResult SearchUsers([FromQuery] string name)
        {
            var matches = _userManager.Users
                .Where(u => u.FullName.Contains(name))
                .Select(u => new { u.Id, u.FullName, u.Email })
                .ToList();
            return Ok(matches);
        }

        public class UpdateFullNameDto { public string FullName { get; set; } = string.Empty; }
        public class CreatePlaceholderUserDto { public string Id { get; set; } = string.Empty; public string FullName { get; set; } = string.Empty; }

        [HttpPost("users/placeholder")]
        [Authorize(Roles = Roles.SuperAdmin)]
        public async Task<IActionResult> CreatePlaceholderUser([FromBody] CreatePlaceholderUserDto dto)
        {
            var existing = await _userManager.FindByIdAsync(dto.Id);
            if (existing is not null)
            {
                existing.FullName = dto.FullName;
                await _userManager.UpdateAsync(existing);
                return Ok(new { message = "Movcud istifadeci yenilendi." });
            }

            var user = new ApplicationUser
            {
                Id = dto.Id,
                FullName = dto.FullName,
                UserName = $"{dto.Id}@placeholder.salonhub.com",
                Email = $"{dto.Id}@placeholder.salonhub.com",
                EmailConfirmed = true
            };
            var result = await _userManager.CreateAsync(user, "Placeholder123!");
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });

            await _userManager.AddToRoleAsync(user, Roles.Customer);
            return Ok(new { message = "Yaradildi." });
        }

        [HttpPut("users/{id}/fullname")]
        [Authorize(Roles = Roles.SuperAdmin)]
        public async Task<IActionResult> UpdateFullName(string id, [FromBody] UpdateFullNameDto dto)
        {
            var user = await _userManager.FindByIdAsync(id)
                ?? throw new KeyNotFoundException("Istifadeci tapilmadi.");
            user.FullName = dto.FullName;
            await _userManager.UpdateAsync(user);
            return Ok(new { message = "Ad yenilendi." });
        }

        private static string GenerateReferralCode()
        {
            var random = new Random();
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            var code = new char[6];
            for (int i = 0; i < code.Length; i++)
                code[i] = chars[random.Next(chars.Length)];

            return "SALON-" + new string(code);
        }
    }
}







