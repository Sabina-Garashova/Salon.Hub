using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Reviews;
using SalonHub.Application.Services;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Persistence.Identity;
namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly INotificationService _notificationService;
        public ReviewController(IReviewService reviewService, UserManager<ApplicationUser> userManager, INotificationService notificationService)
        {
            _reviewService = reviewService;
            _userManager = userManager;
            _notificationService = notificationService;
        }
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var reviews = await _reviewService.GetAllAsync();
            foreach (var r in reviews)
            {
                var user = await _userManager.FindByIdAsync(r.CustomerId);
                if (user is not null) r.CustomerFullName = user.FullName;
            }
            return Ok(reviews);
        }
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

            var superAdmins = await _userManager.GetUsersInRoleAsync(Roles.SuperAdmin);
            Console.WriteLine($"DEBUG: SuperAdmin sayi tapildi: {superAdmins.Count}");
            var reviewerUser = await _userManager.FindByIdAsync(customerId);
            var reviewerName = reviewerUser?.FullName ?? "Bir musteri";
            foreach (var admin in superAdmins)
            {
                await _notificationService.NotifyReservationChangedAsync(admin.Id, $"{reviewerName} yeni bir rey yazdi ({created.Rating} ulduz).");
            }

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
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin},{Roles.Employee}")]
        public async Task<IActionResult> Respond(int id, ReviewResponseDto dto)
        {
            var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var isSuperAdmin = User.IsInRole(Roles.SuperAdmin);
            await _reviewService.RespondAsync(id, dto, requesterId, isSuperAdmin);

            var review = await _reviewService.GetByIdAsync(id);
            if (review is not null)
            {
                await _notificationService.NotifyReservationChangedAsync(review.CustomerId, "Yazdiginiz reye salon terefinden cavab verildi.");
            }

            return NoContent();
        }
    }
}
