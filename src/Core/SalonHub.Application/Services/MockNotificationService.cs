using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SalonHub.Application.Interfaces.Services;

namespace SalonHub.Application.Services
{
    public class MockNotificationService : IEmailService
    {
        private readonly ILogger<MockNotificationService> _logger;
        private readonly IConfiguration _configuration;

        public MockNotificationService(ILogger<MockNotificationService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            var enableRealSending = bool.TryParse(_configuration["NotificationSettings:EnableRealSending"], out var parsedEnable) && parsedEnable;

            if (!enableRealSending)
            {
                _logger.LogInformation("📧 [TEST REJİMİ - EMAIL GÖNDƏRİLMƏDİ] Kimə: {To} | Mövzu: {Subject} | Məzmun: {Body}", to, subject, body);
                return;
            }

            var host = _configuration["Mailtrap:Host"];
            var portString = _configuration["Mailtrap:Port"];
            var username = _configuration["Mailtrap:Username"];
            var password = _configuration["Mailtrap:Password"];
            var fromEmail = _configuration["Mailtrap:FromEmail"] ?? "noreply@salonhub.com";
            var fromName = _configuration["Mailtrap:FromName"] ?? "SalonHub";

            if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                _logger.LogWarning("Mailtrap konfiqurasiyası tam deyil. Email göndərilmədi: {To}", to);
                return;
            }

            var port = int.TryParse(portString, out var parsedPort) ? parsedPort : 2525;

            try
            {
                using var client = new SmtpClient(host, port)
                {
                    Credentials = new NetworkCredential(username, password),
                    EnableSsl = true
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail, fromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(to);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("📧 Email uğurla göndərildi (Mailtrap): {To}", to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Email göndərilərkən xəta baş verdi: {To}", to);
            }
        }
    }
}


