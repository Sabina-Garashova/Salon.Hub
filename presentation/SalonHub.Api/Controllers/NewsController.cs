using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.News;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NewsController : ControllerBase
    {
        private readonly INewsService _newsService;

        public NewsController(INewsService newsService)
        {
            _newsService = newsService;
        }

        private string? GetLanguage() => Request.Headers["Accept-Language"].FirstOrDefault();

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? salonId = null, [FromQuery] bool publicOnly = false) =>
            Ok(await _newsService.GetAllAsync(GetLanguage(), salonId, publicOnly));

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var article = await _newsService.GetByIdAsync(id, GetLanguage());
            return article is null ? NotFound() : Ok(article);
        }

        [HttpPost]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin},{Roles.Employee}")]
        public async Task<IActionResult> Create(NewsArticleCreateDto dto)
        {
            var created = await _newsService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin},{Roles.Employee}")]
        public async Task<IActionResult> Update(int id, NewsArticleUpdateDto dto)
        {
            var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var isAdmin = User.IsInRole(Roles.SalonAdmin) || User.IsInRole(Roles.SuperAdmin);
            await _newsService.UpdateAsync(id, dto, requesterId, isAdmin);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin},{Roles.Employee}")]
        public async Task<IActionResult> Delete(int id)
        {
            var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var isAdmin = User.IsInRole(Roles.SalonAdmin) || User.IsInRole(Roles.SuperAdmin);
            await _newsService.DeleteAsync(id, requesterId, isAdmin);
            return NoContent();
        }
    }
}


