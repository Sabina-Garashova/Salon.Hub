using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.DTOs.Analytics
{
    public class DashboardSummaryDto
    {
        public decimal TotalRevenue { get; set; }
        public int TotalReservations { get; set; }
        public int CompletedReservations { get; set; }
        public int CancelledReservations { get; set; }
        public int TotalCustomers { get; set; }
        public int NewCustomersThisMonth { get; set; }
        public double AverageRating { get; set; }
        public decimal RevenueGrowthPercent { get; set; }
    }

    // ============ 2. Gəlir Hesabatı ============
    public class RevenueReportRequestDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public Guid? SalonId { get; set; }
        public ReportGroupBy GroupBy { get; set; } = ReportGroupBy.Day;
    }

    public enum ReportGroupBy
    {
        Day,
        Week,
        Month,
        Year
    }

    public class RevenuePointDto
    {
        public string Period { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int ReservationCount { get; set; }
    }

    public class RevenueReportDto
    {
        public decimal TotalRevenue { get; set; }
        public decimal AverageOrderValue { get; set; }
        public List<RevenuePointDto> Points { get; set; } = new();
        public List<SalonRevenueDto> RevenueBySalon { get; set; } = new();
    }

    public class SalonRevenueDto
    {
        public Guid SalonId { get; set; }
        public string SalonName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int ReservationCount { get; set; }
    }

    // ============ 3. Rezervasiya Statistikası ============
    public class ReservationStatsDto
    {
        public int Total { get; set; }
        public int Pending { get; set; }
        public int Confirmed { get; set; }
        public int Completed { get; set; }
        public int Cancelled { get; set; }
        public int Rejected { get; set; }
        public double CompletionRatePercent { get; set; }
        public double CancellationRatePercent { get; set; }
        public List<HourlyLoadDto> PeakHours { get; set; } = new();
        public List<WeekdayLoadDto> LoadByWeekday { get; set; } = new();
    }

    public class HourlyLoadDto
    {
        public int Hour { get; set; }
        public int ReservationCount { get; set; }
    }

    public class WeekdayLoadDto
    {
        public DayOfWeek Weekday { get; set; }
        public int ReservationCount { get; set; }
    }

    // ============ 4. Populyar Xidmətlər / Salonlar ============
    public class PopularServiceDto
    {
        public Guid ServiceId { get; set; }
        public string ServiceName { get; set; } = string.Empty;
        public int TimesBooked { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class PopularSalonDto
    {
        public Guid SalonId { get; set; }
        public string SalonName { get; set; } = string.Empty;
        public int TimesBooked { get; set; }
        public decimal TotalRevenue { get; set; }
        public double AverageRating { get; set; }
    }

    // ============ 5. Müştəri Analitikası ============
    public class CustomerAnalyticsDto
    {
        public int TotalCustomers { get; set; }
        public int NewCustomers { get; set; }
        public int ReturningCustomers { get; set; }
        public double RetentionRatePercent { get; set; }
        public List<TopCustomerDto> TopCustomers { get; set; } = new();
    }

    public class TopCustomerDto
    {
        public Guid CustomerId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public int ReservationCount { get; set; }
        public decimal TotalSpent { get; set; }
    }
}

