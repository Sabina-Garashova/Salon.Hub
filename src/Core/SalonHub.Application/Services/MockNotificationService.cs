using Microsoft.Extensions.Logging;
using SalonHub.Application.Interfaces.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.Services
{
    public class MockNotificationService : IEmailService, ISmsService
    {
        private readonly ILogger<MockNotificationService> _logger;

        public MockNotificationService(ILogger<MockNotificationService> logger)
        {
            _logger = logger;
        }

        public Task SendEmailAsync(string to, string subject, string body)
        {
            // Gələcəkdə bura SendGrid və ya MailKit kodları gələcək
            _logger.LogInformation("📧 [EMAIL GÖNDƏRİLDİ] Kimə: {To} | Mövzu: {Subject} | Məzmun: {Body}", to, subject, body);
            return Task.CompletedTask;
        }

        public Task SendSmsAsync(string toPhoneNumber, string message)
        {
            // Gələcəkdə bura Twilio kodu gələcək
            _logger.LogInformation("📱 [SMS GÖNDƏRİLDİ] Nömrə: {To} | Mesaj: {Message}", toPhoneNumber, message);
            return Task.CompletedTask;
        }
    }
}
