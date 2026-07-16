using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Tags;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TagController : ControllerBase
    {
        private readonly ITagService _tagService;

        public TagController(ITagService tagService)
        {
            _tagService = tagService;
        }

        private string? GetLanguage() => Request.Headers["Accept-Language"].FirstOrDefault();

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _tagService.GetAllAsync(GetLanguage()));

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var tag = await _tagService.GetByIdAsync(id, GetLanguage());
            return tag is null ? NotFound() : Ok(tag);
        }

        [HttpPost]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Create(TagCreateDto dto)
        {
            var created = await _tagService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Update(int id, TagUpdateDto dto)
        {
            await _tagService.UpdateAsync(id, dto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = $"{Roles.SuperAdmin}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _tagService.DeleteAsync(id);
            return NoContent();
        }
    }
}
