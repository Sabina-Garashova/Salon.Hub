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

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _serviceCrudService.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var service = await _serviceCrudService.GetByIdAsync(id);
            return service is null ? NotFound() : Ok(service);
        }

        [HttpPost]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Create(ServiceCreateDto dto)
        {
            var created = await _serviceCrudService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Update(int id, ServiceUpdateDto dto)
        {
            await _serviceCrudService.UpdateAsync(id, dto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _serviceCrudService.DeleteAsync(id);
            return NoContent();
        }
        [HttpPost("{serviceId}/tags/{tagId}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> AddTag(int serviceId, int tagId)
        {
            await _serviceCrudService.AddTagAsync(serviceId, tagId);
            return NoContent();
        }

        [HttpDelete("{serviceId}/tags/{tagId}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> RemoveTag(int serviceId, int tagId)
        {
            await _serviceCrudService.RemoveTagAsync(serviceId, tagId);
            return NoContent();
        }
    }
}
