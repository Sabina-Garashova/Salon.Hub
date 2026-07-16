using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Reviews;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _reviewService.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var review = await _reviewService.GetByIdAsync(id);
            return review is null ? NotFound() : Ok(review);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create(ReviewCreateDto dto)
        {
            var customerId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var created = await _reviewService.CreateAsync(dto, customerId);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, ReviewUpdateDto dto)
        {
            var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var isAdmin = User.IsInRole(Roles.SalonAdmin) || User.IsInRole(Roles.SuperAdmin);
            await _reviewService.UpdateAsync(id, dto, requesterId, isAdmin);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var isAdmin = User.IsInRole(Roles.SalonAdmin) || User.IsInRole(Roles.SuperAdmin);
            await _reviewService.DeleteAsync(id, requesterId, isAdmin);
            return NoContent();
        }

        [HttpPost("{id}/respond")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Respond(int id, ReviewResponseDto dto)
        {
            var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var isSuperAdmin = User.IsInRole(Roles.SuperAdmin);
            await _reviewService.RespondAsync(id, dto, requesterId, isSuperAdmin);
            return NoContent();
        }
    }
}
