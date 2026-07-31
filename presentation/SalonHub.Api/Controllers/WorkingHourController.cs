using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.WorkingHours;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WorkingHourController : ControllerBase
    {
        private readonly IWorkingHourService _workingHourService;

        public WorkingHourController(IWorkingHourService workingHourService)
        {
            _workingHourService = workingHourService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _workingHourService.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var hour = await _workingHourService.GetByIdAsync(id);
            return hour is null ? NotFound() : Ok(hour);
        }

        [HttpPost]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin},{Roles.Employee}")]
        public async Task<IActionResult> Create(WorkingHourCreateDto dto)
        {
            var created = await _workingHourService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin},{Roles.Employee}")]
        public async Task<IActionResult> Update(int id, WorkingHourUpdateDto dto)
        {
            await _workingHourService.UpdateAsync(id, dto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin},{Roles.Employee}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _workingHourService.DeleteAsync(id);
            return NoContent();
        }
    }
}


