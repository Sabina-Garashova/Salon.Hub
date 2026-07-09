using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalonHub.Application.DTOs.Analytics;
using SalonHub.Application.Interfaces.Services;

namespace SalonHub.Api.Controllers
{
    public class AnalyticController : Controller
    {
        [ApiController]
        [Route("api/[controller]")]
        [Authorize(Roles = "Admin,SalonOwner")] // rol idarəetmənizə uyğun dəyişin
        public class AnalyticsController : ControllerBase
        {
            private readonly IAnalyticsService _analyticsService;

            public AnalyticsController(IAnalyticsService analyticsService)
            {
                _analyticsService = analyticsService;
            }

            [HttpGet("dashboard")]
            public async Task<ActionResult<DashboardSummaryDto>> GetDashboard([FromQuery] Guid? salonId)
            {
                var result = await _analyticsService.GetDashboardSummaryAsync(salonId);
                return Ok(result);
            }

            [HttpGet("revenue")]
            public async Task<ActionResult<RevenueReportDto>> GetRevenueReport(
                [FromQuery] DateTime startDate,
                [FromQuery] DateTime endDate,
                [FromQuery] Guid? salonId,
                [FromQuery] ReportGroupBy groupBy = ReportGroupBy.Day)
            {
                if (startDate > endDate)
                    return BadRequest("startDate endDate-dən böyük ola bilməz.");

                var request = new RevenueReportRequestDto
                {
                    StartDate = startDate,
                    EndDate = endDate,
                    SalonId = salonId,
                    GroupBy = groupBy
                };

                var result = await _analyticsService.GetRevenueReportAsync(request);
                return Ok(result);
            }

            [HttpGet("reservations/stats")]
            public async Task<ActionResult<ReservationStatsDto>> GetReservationStats(
                [FromQuery] DateTime startDate,
                [FromQuery] DateTime endDate,
                [FromQuery] Guid? salonId)
            {
                if (startDate > endDate)
                    return BadRequest("startDate endDate-dən böyük ola bilməz.");

                var result = await _analyticsService.GetReservationStatsAsync(startDate, endDate, salonId);
                return Ok(result);
            }

            [HttpGet("services/popular")]
            public async Task<ActionResult> GetPopularServices(
                [FromQuery] DateTime startDate,
                [FromQuery] DateTime endDate,
                [FromQuery] int top = 10)
            {
                var result = await _analyticsService.GetPopularServicesAsync(startDate, endDate, top);
                return Ok(result);
            }

            [HttpGet("salons/popular")]
            public async Task<ActionResult> GetPopularSalons(
                [FromQuery] DateTime startDate,
                [FromQuery] DateTime endDate,
                [FromQuery] int top = 10)
            {
                var result = await _analyticsService.GetPopularSalonsAsync(startDate, endDate, top);
                return Ok(result);
            }

            [HttpGet("customers")]
            public async Task<ActionResult<CustomerAnalyticsDto>> GetCustomerAnalytics(
                [FromQuery] DateTime startDate,
                [FromQuery] DateTime endDate)
            {
                var result = await _analyticsService.GetCustomerAnalyticsAsync(startDate, endDate);
                return Ok(result);
            }
        }
    }
}
