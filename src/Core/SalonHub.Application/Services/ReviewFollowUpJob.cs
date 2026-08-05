using Microsoft.Extensions.Logging;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Interfaces.Services;
using System.Text.Json;

namespace SalonHub.Application.Services
{
    public class ReviewFollowUpJob
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notificationService;
        private readonly ILogger<ReviewFollowUpJob> _logger;

        private const int LowRatingThreshold = 2;
        private const int DaysToWaitForResponse = 2;

        public ReviewFollowUpJob(IUnitOfWork unitOfWork, INotificationService notificationService, ILogger<ReviewFollowUpJob> logger)
        {
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task SendFollowUpsForUnansweredReviews()
        {
            _logger.LogInformation("Rəy qaytarma yoxlaması başladı: {Date}", DateTime.UtcNow);

            var cutoffDate = DateTime.UtcNow.AddDays(-DaysToWaitForResponse);

            var unansweredLowReviews = await _unitOfWork.Reviews.FindAsync(r =>
                r.Rating <= LowRatingThreshold &&
                r.CreatedAt <= cutoffDate &&
                r.Response == null &&
                !r.FollowUpSent);

            var reviewList = unansweredLowReviews.ToList();

            foreach (var review in reviewList)
            {
                try
                {
                    var message = "Narahatlığınız üçün üzr istəyirik. Xidmətimizlə bağlı fikirlərinizi eşitmək və sizinlə əlaqə saxlamaq istərdik. Zəhmət olmasa bizimlə əlaqə saxlayın.";
                    await _notificationService.NotifyReservationChangedAsync(review.CustomerId, message, "notif_review_followup");

                    review.FollowUpSent = true;
                    _unitOfWork.Reviews.Update(review);

                    _logger.LogInformation("Rəy qaytarma mesajı göndərildi: ReviewId={ReviewId}, CustomerId={CustomerId}", review.Id, review.CustomerId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Rəy qaytarma mesajı göndərilərkən xəta: ReviewId={ReviewId}", review.Id);
                }
            }

            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Rəy qaytarma yoxlaması bitdi. Göndərilən mesaj sayı: {Count}", reviewList.Count);
        }
    }
}

