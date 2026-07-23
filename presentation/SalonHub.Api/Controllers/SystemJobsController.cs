using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;
using SalonHub.Persistence.Services;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public class SystemJobsController : ControllerBase
    {
        private readonly ReservationReminderJob _reminderJob;
        private readonly BirthdayBonusJob _birthdayJob;
        private readonly MonthlyTopPerformerJob _topPerformerJob;
        private readonly ReviewFollowUpJob _reviewFollowUpJob;

        public SystemJobsController(
            ReservationReminderJob reminderJob,
            BirthdayBonusJob birthdayJob,
            MonthlyTopPerformerJob topPerformerJob,
            ReviewFollowUpJob reviewFollowUpJob)
        {
            _reminderJob = reminderJob;
            _birthdayJob = birthdayJob;
            _topPerformerJob = topPerformerJob;
            _reviewFollowUpJob = reviewFollowUpJob;
        }

        [HttpPost("trigger/reminders")]
        public async Task<IActionResult> TriggerReminders()
        {
            await _reminderJob.SendUpcomingReminders();
            return Ok(new { message = "Xatirlatma isi tamamlandi." });
        }

        [HttpPost("trigger/birthday-bonus")]
        public async Task<IActionResult> TriggerBirthdayBonus()
        {
            await _birthdayJob.SendBirthdayBonuses();
            return Ok(new { message = "Dogum gunu bonusu isi tamamlandi." });
        }

        [HttpPost("trigger/monthly-top-performer")]
        public async Task<IActionResult> TriggerMonthlyTopPerformer()
        {
            await _topPerformerJob.SelectMonthlyWinners();
            return Ok(new { message = "Aylig top performer isi tamamlandi." });
        }

        [HttpPost("trigger/review-follow-up")]
        public async Task<IActionResult> TriggerReviewFollowUp()
        {
            await _reviewFollowUpJob.SendFollowUpsForUnansweredReviews();
            return Ok(new { message = "Rey follow-up isi tamamlandi." });
        }
    }
}
