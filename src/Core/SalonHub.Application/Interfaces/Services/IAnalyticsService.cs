using SalonHub.Application.DTOs.Analytics;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.Interfaces.Services
{
    public interface IAnalyticsService
    {
        Task<DashboardSummaryDto> GetDashboardSummaryAsync(Guid? salonId = null);

        Task<RevenueReportDto> GetRevenueReportAsync(RevenueReportRequestDto request);

        Task<ReservationStatsDto> GetReservationStatsAsync(DateTime startDate, DateTime endDate, Guid? salonId = null);

        Task<List<PopularServiceDto>> GetPopularServicesAsync(DateTime startDate, DateTime endDate, int top = 10);

        Task<List<PopularSalonDto>> GetPopularSalonsAsync(DateTime startDate, DateTime endDate, int top = 10);

        Task<CustomerAnalyticsDto> GetCustomerAnalyticsAsync(DateTime startDate, DateTime endDate);
    }
}
