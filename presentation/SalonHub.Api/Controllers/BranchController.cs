using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Branches;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BranchController : ControllerBase
    {
        private readonly IBranchService _branchService;

        public BranchController(IBranchService branchService)
        {
            _branchService = branchService;
        }

        private string GetRequesterId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        private bool IsSuperAdmin() => User.IsInRole(Roles.SuperAdmin);

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool scoped = false)
        {
            var isAuthenticated = User.Identity?.IsAuthenticated == true;
            var isSalonAdminOnly = scoped && isAuthenticated && User.IsInRole(Roles.SalonAdmin) && !User.IsInRole(Roles.SuperAdmin);
            var requesterId = isAuthenticated ? GetRequesterId() : null;
            return Ok(await _branchService.GetAllAsync(requesterId, !isSalonAdminOnly));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var branch = await _branchService.GetByIdAsync(id);
            return branch is null ? NotFound() : Ok(branch);
        }

        [HttpPost]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Create(BranchCreateDto dto)
        {
            var created = await _branchService.CreateAsync(dto, GetRequesterId(), IsSuperAdmin());
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Update(int id, BranchUpdateDto dto)
        {
            await _branchService.UpdateAsync(id, dto, GetRequesterId(), IsSuperAdmin());
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _branchService.DeleteAsync(id, GetRequesterId(), IsSuperAdmin());
            return NoContent();
        }
    }
}


