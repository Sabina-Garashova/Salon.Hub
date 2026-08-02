using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Salons;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;
namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SalonController : ControllerBase
    {
        private readonly ISalonService _salonService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly UserManager<ApplicationUser> _userManager;

        public SalonController(ISalonService salonService, IUnitOfWork unitOfWork, UserManager<ApplicationUser> userManager)
        {
            _salonService = salonService;
            _unitOfWork = unitOfWork;
            _userManager = userManager;
        }

        private string? GetLanguage() => Request.Headers["Accept-Language"].FirstOrDefault();
        private string GetRequesterId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        private bool IsSuperAdmin() => User.IsInRole(Roles.SuperAdmin);

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _salonService.GetAllAsync(GetLanguage()));

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var salon = await _salonService.GetByIdAsync(id, GetLanguage());
            return salon is null ? NotFound() : Ok(salon);
        }

        [HttpPost]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Create(SalonCreateDto dto)
        {
            var ownerId = GetRequesterId();
            var created = await _salonService.CreateAsync(dto, ownerId);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Update(int id, SalonUpdateDto dto)
        {
            await _salonService.UpdateAsync(id, dto, GetRequesterId(), IsSuperAdmin());
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Delete(int id)
        {
            var salon = await _unitOfWork.Salons.GetByIdAsync(id);
            var ownerId = salon?.OwnerId;

            await _salonService.DeleteAsync(id, GetRequesterId(), IsSuperAdmin());

            if (!string.IsNullOrWhiteSpace(ownerId))
            {
                var owner = await _userManager.FindByIdAsync(ownerId);
                if (owner is not null && await _userManager.IsInRoleAsync(owner, Roles.SalonAdmin))
                {
                    var otherSalons = await _unitOfWork.Salons.FindAsync(s => s.OwnerId == ownerId && s.Id != id && !s.IsDeleted);
                    if (!otherSalons.Any())
                    {
                        await _userManager.RemoveFromRoleAsync(owner, Roles.SalonAdmin);
                        await _userManager.UpdateSecurityStampAsync(owner);
                    }
                }
            }

            return NoContent();
        }
    }
}
