using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Auth;
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

        private const int ReferrerBonusPoints = 50;
        private const int NewUserBonusPoints = 20;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            ITokenService tokenService,
            ILoyaltyService loyaltyService,
            INotificationService notificationService,
            IEmailService emailService)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _loyaltyService = loyaltyService;
            _notificationService = notificationService;
            _emailService = emailService;
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
                return BadRequest(result.Errors);

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

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? Roles.Customer;

            var response = _tokenService.GenerateToken(user.Id, user.Email!, user.FullName, role);
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
                var message = $"Şifrənizi sıfırlamaq üçün bu kodu istifadə edin: {token}";
                await _emailService.SendEmailAsync(dto.Email, "SalonHub - Şifrə Sıfırlama", message);
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

