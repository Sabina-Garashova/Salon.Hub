using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.Interfaces.Services;

namespace SalonHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestNotificationController : ControllerBase
{
    private readonly ISmsService _smsService;
    private readonly IEmailService _emailService;

    public TestNotificationController(ISmsService smsService, IEmailService emailService)
    {
        _smsService = smsService;
        _emailService = emailService;
    }

    [HttpPost("test-sms")]
    public async Task<IActionResult> TestSms([FromQuery] string phoneNumber)
    {
        await _smsService.SendSmsAsync(phoneNumber, "SalonHub-dan test mesajı: SMS inteqrasiyası işləyir!");
        return Ok(new { message = "SMS göndərmə cəhdi edildi, log-a baxın." });
    }

    [HttpPost("test-email")]
    public async Task<IActionResult> TestEmail([FromQuery] string toEmail)
    {
        await _emailService.SendEmailAsync(toEmail, "SalonHub Test Email", "Bu, SalonHub-dan göndərilən test email mesajıdır. Email inteqrasiyası işləyir!");
        return Ok(new { message = "Email göndərmə cəhdi edildi, Mailtrap inbox-una baxın." });
    }
}