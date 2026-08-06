using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.PostCare;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Persistence.Identity;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PostCareController : ControllerBase
    {
        private readonly IPostCareService _postCareService;

        public PostCareController(IPostCareService postCareService)
        {
            _postCareService = postCareService;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> Generate(PostCareGuideRequestDto dto)
        {
            var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var isSuperAdmin = User.IsInRole(Roles.SuperAdmin);
            var isSalonAdmin = !isSuperAdmin && User.IsInRole(Roles.SalonAdmin);
            var result = await _postCareService.GenerateAsync(dto, requesterId, isSuperAdmin, isSalonAdmin);
            return Ok(result);
        }
    }
}
