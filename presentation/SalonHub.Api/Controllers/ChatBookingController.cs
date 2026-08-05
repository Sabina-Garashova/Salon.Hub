using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.ChatBooking;
using SalonHub.Application.Interfaces.Services;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatBookingController : ControllerBase
    {
        private readonly IChatBookingService _chatBookingService;

        public ChatBookingController(IChatBookingService chatBookingService)
        {
            _chatBookingService = chatBookingService;
        }

        [HttpPost("message")]
        public async Task<IActionResult> SendMessage(ChatBookingMessageDto dto)
        {
            var customerId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await _chatBookingService.ProcessMessageAsync(dto, customerId);
            return Ok(result);
        }
    }
}
