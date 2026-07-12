using Amazon;
using Amazon.SimpleNotificationService;
using Amazon.SimpleNotificationService.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SalonHub.Application.Interfaces.Services;

namespace SalonHub.Infrastructure.Services
{
    public class AwsSnsSmsService : ISmsService
    {
        private readonly ILogger<AwsSnsSmsService> _logger;
        private readonly IConfiguration _configuration;

        public AwsSnsSmsService(ILogger<AwsSnsSmsService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public async Task SendSmsAsync(string toPhoneNumber, string message)
        {
            var accessKey = _configuration["AwsSns:AccessKey"];
            var secretKey = _configuration["AwsSns:SecretKey"];
            var region = _configuration["AwsSns:Region"] ?? "us-east-1";

            if (string.IsNullOrEmpty(accessKey) || string.IsNullOrEmpty(secretKey))
            {
                _logger.LogWarning("AWS SNS konfiqurasiyası tam deyil. SMS göndərilmədi: {ToPhoneNumber}", toPhoneNumber);
                return;
            }

            try
            {
                using var client = new AmazonSimpleNotificationServiceClient(
                    accessKey, secretKey, RegionEndpoint.GetBySystemName(region));

                var request = new PublishRequest
                {
                    Message = message,
                    PhoneNumber = toPhoneNumber,
                    MessageAttributes = new Dictionary<string, MessageAttributeValue>
                    {
                        {
                            "AWS.SNS.SMS.SMSType",
                            new MessageAttributeValue { DataType = "String", StringValue = "Transactional" }
                        }
                    }
                };

                var response = await client.PublishAsync(request);
                _logger.LogInformation("📱 SMS uğurla göndərildi: {ToPhoneNumber}, MessageId: {MessageId}", toPhoneNumber, response.MessageId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SMS göndərilərkən xəta baş verdi: {ToPhoneNumber}", toPhoneNumber);
            }
        }
    }
}
