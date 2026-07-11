using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Loyalty;
using SalonHub.Application.Services;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LoyaltyController : ControllerBase
    {
        private readonly ILoyaltyService _loyaltyService;

        public LoyaltyController(ILoyaltyService loyaltyService)
        {
            _loyaltyService = loyaltyService;
        }

        [HttpGet("balance/{salonId}")]
        public async Task<IActionResult> GetBalance(int salonId)
        {
            // Tamamilə avtomatik: Giriş edən istifadəçinin ID-sini tokendən oxuyur
            var customerId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            var result = await _loyaltyService.GetBalanceAsync(customerId, salonId);
            return Ok(result);
        }

        [HttpGet("history/{salonId}")]
        public async Task<IActionResult> GetHistory(int salonId)
        {
            var customerId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            var result = await _loyaltyService.GetHistoryAsync(customerId, salonId);
            return Ok(result);
        }

        [HttpPost("redeem")]
        public async Task<IActionResult> Redeem(RedeemPointsDto dto)
        {
            var customerId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await _loyaltyService.RedeemPointsAsync(customerId, dto);
            return Ok(result);
        }
    }
}