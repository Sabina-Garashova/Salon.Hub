using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Analytics;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Persistence.Identity;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = $"{Roles.SalonAdmin},{Roles.SuperAdmin}")]
    public class AnalyticController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;
        private readonly IExcelExportService _excelExportService;
        private readonly IUnitOfWork _unitOfWork;

        public AnalyticController(IAnalyticsService analyticsService, IExcelExportService excelExportService, IUnitOfWork unitOfWork)
        {
            _analyticsService = analyticsService;
            _excelExportService = excelExportService;
            _unitOfWork = unitOfWork;
        }

        private string GetRequesterId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        private bool IsSuperAdmin() => User.IsInRole(Roles.SuperAdmin);

        // SuperAdmin: ne gonderilibse (ve ya umumi ucun null) o istifade olunur.
        // SalonAdmin: gonderilen deyer nezere alinmir, hemise ozunun sahibi oldugu salona qeydiyyatli.
        private async Task<int?> ResolveSalonIdAsync(int? requestedSalonId)
        {
            if (IsSuperAdmin())
                return requestedSalonId;

            var ownSalons = await _unitOfWork.Salons.FindAsync(s => s.OwnerId == GetRequesterId());
            var ownSalon = ownSalons.FirstOrDefault();
            return ownSalon?.Id ?? -1; // salonu olmayan SalonAdmin ucun hec bir netice qaytarmayan deyer
        }

        private static int? ParseSalonId(string? salonId) =>
            int.TryParse(salonId, out var parsed) ? parsed : (int?)null;

        [HttpGet("dashboard-summary")]
        public async Task<IActionResult> GetDashboardSummary([FromQuery] string? salonId = null)
        {
            var effectiveSalonId = await ResolveSalonIdAsync(ParseSalonId(salonId));
            var result = await _analyticsService.GetDashboardSummaryAsync(effectiveSalonId?.ToString());
            return Ok(result);
        }

        [HttpPost("revenue-report")]
        public async Task<IActionResult> GetRevenueReport([FromBody] RevenueReportRequestDto request)
        {
            request.SalonId = await ResolveSalonIdAsync(request.SalonId);
            var result = await _analyticsService.GetRevenueReportAsync(request);
            return Ok(result);
        }

        [HttpPost("revenue-report/export")]
        public async Task<IActionResult> ExportRevenueReport([FromBody] RevenueReportRequestDto request)
        {
            request.SalonId = await ResolveSalonIdAsync(request.SalonId);
            var report = await _analyticsService.GetRevenueReportAsync(request);
            var fileBytes = await _excelExportService.ExportRevenueReportAsync(report);
            return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "gelir-hesabati.xlsx");
        }

        [HttpGet("reservation-stats")]
        public async Task<IActionResult> GetReservationStats([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] string? salonId = null)
        {
            var effectiveSalonId = await ResolveSalonIdAsync(ParseSalonId(salonId));
            var result = await _analyticsService.GetReservationStatsAsync(startDate, endDate, effectiveSalonId?.ToString());
            return Ok(result);
        }

        [HttpGet("popular-services")]
        public async Task<IActionResult> GetPopularServices([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] int top = 10, [FromQuery] string? salonId = null)
        {
            var effectiveSalonId = await ResolveSalonIdAsync(ParseSalonId(salonId));
            var result = await _analyticsService.GetPopularServicesAsync(startDate, endDate, top, effectiveSalonId);
            return Ok(result);
        }

        [HttpGet("popular-salons")]
        public async Task<IActionResult> GetPopularSalons([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] int top = 10, [FromQuery] string? salonId = null)
        {
            var effectiveSalonId = await ResolveSalonIdAsync(ParseSalonId(salonId));
            var result = await _analyticsService.GetPopularSalonsAsync(startDate, endDate, top, effectiveSalonId);
            return Ok(result);
        }

        [HttpGet("customer-analytics")]
        public async Task<IActionResult> GetCustomerAnalytics([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] string? salonId = null)
        {
            var effectiveSalonId = await ResolveSalonIdAsync(ParseSalonId(salonId));
            var result = await _analyticsService.GetCustomerAnalyticsAsync(startDate, endDate, effectiveSalonId);
            return Ok(result);
        }

        [HttpGet("site-statistics")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSiteStatistics()
        {
            var result = await _analyticsService.GetSiteStatisticsAsync();
            return Ok(result);
        }
    }
}

