using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Employees;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Application.Services;
using SalonHub.Persistence.Identity;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeeController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly INotificationService _notificationService;

        public EmployeeController(IEmployeeService employeeService, UserManager<ApplicationUser> userManager, INotificationService notificationService)
        {
            _employeeService = employeeService;
            _userManager = userManager;
            _notificationService = notificationService;
        }

        private string GetRequesterId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        private bool IsSuperAdmin() => User.IsInRole(Roles.SuperAdmin);

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool scoped = false)
        {
            var isAuthenticated = User.Identity?.IsAuthenticated == true;
            var isSalonAdminOnly = scoped && isAuthenticated && User.IsInRole(Roles.SalonAdmin) && !User.IsInRole(Roles.SuperAdmin);
            var requesterId = isAuthenticated ? GetRequesterId() : string.Empty;
            return Ok(await _employeeService.GetAllAsync(requesterId, !isSalonAdminOnly));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var employee = await _employeeService.GetByIdAsync(id);
            return employee is null ? NotFound() : Ok(employee);
        }

        [HttpPost]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Create(EmployeeCreateDto dto)
        {
            var created = await _employeeService.CreateAsync(dto, GetRequesterId(), IsSuperAdmin());
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Update(int id, EmployeeUpdateDto dto)
        {
            await _employeeService.UpdateAsync(id, dto, GetRequesterId(), IsSuperAdmin());
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> Delete(int id)
        {
            var employee = await _employeeService.GetByIdAsync(id);

            await _employeeService.DeleteAsync(id, GetRequesterId(), IsSuperAdmin());

            if (employee is not null && !string.IsNullOrEmpty(employee.ApplicationUserId))
            {
                var user = await _userManager.FindByIdAsync(employee.ApplicationUserId);
                if (user is not null)
                {
                    if (await _userManager.IsInRoleAsync(user, Roles.Employee))
                        await _userManager.RemoveFromRoleAsync(user, Roles.Employee);

                    if (!await _userManager.IsInRoleAsync(user, Roles.Customer))
                        await _userManager.AddToRoleAsync(user, Roles.Customer);

                    await _notificationService.NotifyReservationChangedAsync(
                        user.Id,
                        "Salon ile iş münasibətiniz SalonHub sistemində dayandırılıb. Ətraflı məlumat üçün salon rəhbərliyi ilə əlaqə saxlayın.");
                }
            }

            return NoContent();
        }

        [HttpPost("{employeeId}/services/{serviceId}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> AssignService(int employeeId, int serviceId)
        {
            await _employeeService.AssignServiceAsync(employeeId, serviceId, GetRequesterId(), IsSuperAdmin());
            return NoContent();
        }

        [HttpDelete("{employeeId}/services/{serviceId}")]
        [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
        public async Task<IActionResult> RemoveService(int employeeId, int serviceId)
        {
            await _employeeService.RemoveServiceAsync(employeeId, serviceId, GetRequesterId(), IsSuperAdmin());
            return NoContent();
        }
    }
}




