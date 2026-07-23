using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.CheckIn;
using SalonHub.Application.Services;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CheckInController : ControllerBase
    {
        private readonly IReservationService _reservationService;

        public CheckInController(IReservationService reservationService)
        {
            _reservationService = reservationService;
        }

        [HttpPost("scan")]
        public async Task<IActionResult> ScanQrCode([FromBody] QrCheckInDto dto)
        {
            var result = await _reservationService.CheckInAsync(dto.CheckInCode, dto.SalonId);
            return Ok(new { message = "Müştəri uğurla check-in olundu! ✅", reservation = result });
        }
    }
}

