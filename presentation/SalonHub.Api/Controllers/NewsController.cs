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
        public async Task<IActionResult> GetAll() => Ok(await _newsService.GetAllAsync(GetLanguage()));

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
            await _newsService.UpdateAsync(id, dto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _newsService.DeleteAsync(id);
            return NoContent();
        }
    }
}
