using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.OutfitMatch;
using SalonHub.Application.Interfaces.Services;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OutfitMatchController : ControllerBase
    {
        private readonly IOutfitMatchService _outfitMatchService;

        public OutfitMatchController(IOutfitMatchService outfitMatchService)
        {
            _outfitMatchService = outfitMatchService;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> Analyze(OutfitMatchRequestDto dto)
        {
            var result = await _outfitMatchService.AnalyzeAsync(dto);
            return Ok(result);
        }
    }
}
