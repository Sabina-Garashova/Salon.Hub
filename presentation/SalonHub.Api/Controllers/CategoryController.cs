using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Categories;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _categoryService;
        private readonly IUnitOfWork _unitOfWork;

        public CategoryController(ICategoryService categoryService, IUnitOfWork unitOfWork)
        {
            _categoryService = categoryService;
            _unitOfWork = unitOfWork;
        }

        private string? GetLanguage() => Request.Headers["Accept-Language"].FirstOrDefault();

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool scoped = false)
        {
            int? salonId = null;

            var isAuthenticated = User.Identity?.IsAuthenticated == true;
            var isSalonAdminOnly = scoped && isAuthenticated && User.IsInRole(Roles.SalonAdmin) && !User.IsInRole(Roles.SuperAdmin);

            if (isSalonAdminOnly)
            {
                var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
                var ownSalons = await _unitOfWork.Salons.FindAsync(s => s.OwnerId == requesterId);
                salonId = ownSalons.FirstOrDefault()?.Id ?? -1;
            }

            return Ok(await _categoryService.GetAllAsync(GetLanguage(), salonId));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _categoryService.GetByIdAsync(id, GetLanguage());
            return category is null ? NotFound() : Ok(category);
        }

        [HttpPost]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Create(CategoryCreateDto dto)
        {
            var created = await _categoryService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Update(int id, CategoryUpdateDto dto)
        {
            await _categoryService.UpdateAsync(id, dto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = $"{Roles.SuperAdmin}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _categoryService.DeleteAsync(id);
            return NoContent();
        }
    }
}
