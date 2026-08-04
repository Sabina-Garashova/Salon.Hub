using SalonHub.Application.DTOs.Analytics;
using SalonHub.Application.DTOs.Dashboard;

namespace SalonHub.Application.Interfaces.Services
{
    public interface IAnalyticsService
    {
        Task<DashboardSummaryDto> GetDashboardSummaryAsync(string? salonId = null);
        Task<RevenueReportDto> GetRevenueReportAsync(RevenueReportRequestDto request);
        Task<ReservationStatsDto> GetReservationStatsAsync(DateTime startDate, DateTime endDate, string? salonId = null);
        Task<List<PopularServiceDto>> GetPopularServicesAsync(DateTime startDate, DateTime endDate, int top = 10, int? salonId = null);
        Task<List<PopularSalonDto>> GetPopularSalonsAsync(DateTime startDate, DateTime endDate, int top = 10, int? salonId = null);
        Task<CustomerAnalyticsDto> GetCustomerAnalyticsAsync(DateTime startDate, DateTime endDate, int? salonId = null);
        Task<SiteStatisticsDto> GetSiteStatisticsAsync();
    }
}
