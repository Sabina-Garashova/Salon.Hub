using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.Interfaces.Repositories;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public NotificationController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        private string GetRequesterId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        [HttpGet("mine")]
        public async Task<IActionResult> GetMine()
        {
            var userId = GetRequesterId();
            var notifications = await _unitOfWork.Notifications.FindAsync(n => n.UserId == userId);

            var result = notifications
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.Id,
                    n.Message,
                    n.IsRead,
                    n.CreatedAt
                });

            return Ok(result);
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = GetRequesterId();
            var notifications = await _unitOfWork.Notifications.FindAsync(n => n.UserId == userId && !n.IsRead);
            return Ok(new { count = notifications.Count });
        }

        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = GetRequesterId();
            var notification = await _unitOfWork.Notifications.GetByIdAsync(id);

            if (notification is null || notification.UserId != userId)
                return NotFound();

            notification.IsRead = true;
            _unitOfWork.Notifications.Update(notification);
            await _unitOfWork.CompleteAsync();

            return Ok(new { message = "Oxundu kimi isarelendi." });
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = GetRequesterId();
            var notifications = await _unitOfWork.Notifications.FindAsync(n => n.UserId == userId && !n.IsRead);

            foreach (var n in notifications)
            {
                n.IsRead = true;
                _unitOfWork.Notifications.Update(n);
            }
            await _unitOfWork.CompleteAsync();

            return Ok(new { message = "Hamisi oxundu kimi isarelendi." });
        }
    }
}
