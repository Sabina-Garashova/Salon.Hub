using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Analytics;
using SalonHub.Application.Interfaces.Services;
using System;
using System.Threading.Tasks;

namespace SalonHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;

        public AnalyticController(IAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        [HttpGet("dashboard-summary")]
        public async Task<IActionResult> GetDashboardSummary([FromQuery] string? salonId = null)
        {
            var result = await _analyticsService.GetDashboardSummaryAsync(salonId);
            return Ok(result);
        }

        [HttpPost("revenue-report")]
        public async Task<IActionResult> GetRevenueReport([FromBody] RevenueReportRequestDto request)
        {
            var result = await _analyticsService.GetRevenueReportAsync(request);
            return Ok(result);
        }

        [HttpGet("reservation-stats")]
        public async Task<IActionResult> GetReservationStats([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] string? salonId = null)
        {
            var result = await _analyticsService.GetReservationStatsAsync(startDate, endDate, salonId);
            return Ok(result);
        }

        [HttpGet("popular-services")]
        public async Task<IActionResult> GetPopularServices([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] int top = 10)
        {
            var result = await _analyticsService.GetPopularServicesAsync(startDate, endDate, top);
            return Ok(result);
        }

        [HttpGet("popular-salons")]
        public async Task<IActionResult> GetPopularSalons([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] int top = 10)
        {
            var result = await _analyticsService.GetPopularSalonsAsync(startDate, endDate, top);
            return Ok(result);
        }

        [HttpGet("customer-analytics")]
        public async Task<IActionResult> GetCustomerAnalytics([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var result = await _analyticsService.GetCustomerAnalyticsAsync(startDate, endDate);
            return Ok(result);
        }
    }
}

