using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Reservations;
using SalonHub.Application.Services;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReservationController : ControllerBase
    {
        private readonly IReservationService _reservationService;

        public ReservationController(IReservationService reservationService)
        {
            _reservationService = reservationService;
        }

        [HttpPost]
        public async Task<IActionResult> Create(ReservationCreateDto dto)
        {
            var result = await _reservationService.CreateAsync(dto);
            return Ok(result);
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id, [FromBody] string reason)
        {
            await _reservationService.CancelAsync(id, reason);
            return NoContent();
        }
    }
}
