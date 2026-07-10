using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.GalleryImages;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;
using System.Security.Claims;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GalleryImageController : ControllerBase
    {
        private readonly IGalleryImageService _galleryImageService;
        public GalleryImageController(IGalleryImageService galleryImageService)
        {
            _galleryImageService = galleryImageService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _galleryImageService.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var image = await _galleryImageService.GetByIdAsync(id);
            return image is null ? NotFound() : Ok(image);
        }

        [HttpPost]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Create(GalleryImageCreateDto dto)
        {
            var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var isSuperAdmin = User.IsInRole(Roles.SuperAdmin);
            var created = await _galleryImageService.CreateAsync(dto, requesterId, isSuperAdmin);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Update(int id, GalleryImageUpdateDto dto)
        {
            var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var isSuperAdmin = User.IsInRole(Roles.SuperAdmin);
            await _galleryImageService.UpdateAsync(id, dto, requesterId, isSuperAdmin);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Delete(int id)
        {
            var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var isSuperAdmin = User.IsInRole(Roles.SuperAdmin);
            await _galleryImageService.DeleteAsync(id, requesterId, isSuperAdmin);
            return NoContent();
        }
    }
}