using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.StyleRecommendation;
using SalonHub.Application.Interfaces.Services;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StyleRecommendationController : ControllerBase
    {
        private readonly IStyleRecommendationService _styleRecommendationService;

        public StyleRecommendationController(IStyleRecommendationService styleRecommendationService)
        {
            _styleRecommendationService = styleRecommendationService;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> Analyze(StyleAnalysisRequestDto dto)
        {
            var result = await _styleRecommendationService.AnalyzeAsync(dto);
            return Ok(result);
        }
    }
}
