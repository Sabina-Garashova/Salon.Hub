using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Services;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceController : ControllerBase
    {
        private readonly IServiceCrudService _serviceCrudService;

        public ServiceController(IServiceCrudService serviceCrudService)
        {
            _serviceCrudService = serviceCrudService;
        }

        private string? GetLanguage() => Request.Headers["Accept-Language"].FirstOrDefault();
        private string GetRequesterId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        private bool IsSuperAdmin() => User.IsInRole(Roles.SuperAdmin);

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _serviceCrudService.GetAllAsync(GetLanguage()));

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var service = await _serviceCrudService.GetByIdAsync(id, GetLanguage());
            return service is null ? NotFound() : Ok(service);
        }

        [HttpPost]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Create(ServiceCreateDto dto)
        {
            var created = await _serviceCrudService.CreateAsync(dto, GetRequesterId(), IsSuperAdmin());
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Update(int id, ServiceUpdateDto dto)
        {
            await _serviceCrudService.UpdateAsync(id, dto, GetRequesterId(), IsSuperAdmin());
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _serviceCrudService.DeleteAsync(id, GetRequesterId(), IsSuperAdmin());
            return NoContent();
        }

        [HttpPost("{serviceId}/tags/{tagId}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> AddTag(int serviceId, int tagId)
        {
            await _serviceCrudService.AddTagAsync(serviceId, tagId, GetRequesterId(), IsSuperAdmin());
            return NoContent();
        }

        [HttpDelete("{serviceId}/tags/{tagId}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> RemoveTag(int serviceId, int tagId)
        {
            await _serviceCrudService.RemoveTagAsync(serviceId, tagId, GetRequesterId(), IsSuperAdmin());
            return NoContent();
        }
    }
}
