using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Reservations;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;

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

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _reservationService.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var reservation = await _reservationService.GetByIdAsync(id);
            return reservation is null ? NotFound() : Ok(reservation);
        }

        [HttpPost]
        public async Task<IActionResult> Create(ReservationCreateDto dto)
        {
            var result = await _reservationService.CreateAsync(dto);
            return Ok(result);
        }

        [HttpPost("batch")]
        public async Task<IActionResult> CreateMultiple(MultiServiceReservationCreateDto dto)
        {
            var result = await _reservationService.CreateMultipleAsync(dto);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ReservationUpdateDto dto)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var isAdmin = User.IsInRole(Roles.SalonAdmin) || User.IsInRole(Roles.SuperAdmin);
            var result = await _reservationService.UpdateAsync(id, dto, currentUserId, isAdmin);
            return Ok(result);
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id, [FromBody] string reason)
        {
            var result = await _reservationService.CancelAsync(id, reason);
            return Ok(result);
        }

        [HttpPost("{id}/confirm")]
        public async Task<IActionResult> Confirm(int id)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var isAdmin = User.IsInRole(Roles.SalonAdmin) || User.IsInRole(Roles.SuperAdmin);
            var result = await _reservationService.ConfirmAsync(id, currentUserId, isAdmin);
            return Ok(result);
        }

        [HttpPost("{id}/reject")]
        public async Task<IActionResult> Reject(int id, [FromBody] string reason)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var isAdmin = User.IsInRole(Roles.SalonAdmin) || User.IsInRole(Roles.SuperAdmin);
            var result = await _reservationService.RejectAsync(id, reason, currentUserId, isAdmin);
            return Ok(result);
        }

        [HttpGet("available-slots")]
        public async Task<IActionResult> GetAvailableSlots(int employeeId, int serviceId, DateTime date)
        {
            var slots = await _reservationService.GetAvailableSlotsAsync(employeeId, serviceId, date);
            return Ok(slots);
        }

        [HttpGet("today-availability")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTodayAvailability(int serviceId, int salonId)
        {
            var result = await _reservationService.GetTodayAvailabilityAsync(serviceId, salonId);
            return Ok(result);
        }

        [HttpPost("{id}/complete")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin},{Roles.Employee}")]
        public async Task<IActionResult> Complete(int id)
        {
            var result = await _reservationService.CompleteAsync(id);
            return Ok(result);
        }
    }
}

