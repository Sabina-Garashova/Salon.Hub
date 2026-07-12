using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.TimeBlocks;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
    public class TimeBlockController : ControllerBase
    {
        private readonly ITimeBlockService _timeBlockService;

        public TimeBlockController(ITimeBlockService timeBlockService)
        {
            _timeBlockService = timeBlockService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _timeBlockService.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var block = await _timeBlockService.GetByIdAsync(id);
            return block is null ? NotFound() : Ok(block);
        }

        [HttpPost]
        public async Task<IActionResult> Create(TimeBlockCreateDto dto)
        {
            var created = await _timeBlockService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _timeBlockService.DeleteAsync(id);
            return NoContent();
        }
    }
}
