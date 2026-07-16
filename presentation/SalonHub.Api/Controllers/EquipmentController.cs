using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Equipments;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EquipmentController : ControllerBase
    {
        private readonly IEquipmentService _equipmentService;

        public EquipmentController(IEquipmentService equipmentService)
        {
            _equipmentService = equipmentService;
        }

        private string GetRequesterId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        private bool IsSuperAdmin() => User.IsInRole(Roles.SuperAdmin);

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _equipmentService.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var equipment = await _equipmentService.GetByIdAsync(id);
            return equipment is null ? NotFound() : Ok(equipment);
        }

        [HttpPost]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Create(EquipmentCreateDto dto)
        {
            var created = await _equipmentService.CreateAsync(dto, GetRequesterId(), IsSuperAdmin());
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Update(int id, EquipmentUpdateDto dto)
        {
            await _equipmentService.UpdateAsync(id, dto, GetRequesterId(), IsSuperAdmin());
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _equipmentService.DeleteAsync(id, GetRequesterId(), IsSuperAdmin());
            return NoContent();
        }
    }
}
