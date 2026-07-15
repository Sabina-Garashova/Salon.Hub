using SalonHub.Application.DTOs.Analytics;
using SalonHub.Application.DTOs.Dashboard;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Domain.Entities;
using SalonHub.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SalonHub.Application.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IServiceProvider _serviceProvider;

        public AnalyticsService(IUnitOfWork unitOfWork, IServiceProvider serviceProvider)
        {
            _unitOfWork = unitOfWork;
            _serviceProvider = serviceProvider;
        }

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(string? salonId = null)
        {
            var reservations = (await _unitOfWork.Reservations.GetAllAsync()).ToList();
            var services = (await _unitOfWork.Services.GetAllAsync()).ToList();
            var reviews = (await _unitOfWork.Reviews.GetAllAsync()).ToList();

            if (!string.IsNullOrEmpty(salonId))
            {
                var salonServices = services
                    .Where(x => x.SalonId.ToString().Equals(salonId, StringComparison.OrdinalIgnoreCase))
                    .Select(x => x.Id.ToString())
                    .ToHashSet();

                reservations = reservations
                    .Where(x => salonServices.Contains(x.ServiceId.ToString()))
                    .ToList();

                reviews = reviews
                    .Where(x => x.SalonId.ToString().Equals(salonId, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            var completedReservations = reservations
                .Where(x => x.Status == ReservationStatus.Completed || x.Status.ToString().Equals("Completed", StringComparison.OrdinalIgnoreCase))
                .ToList();

            decimal totalRevenue = 0;
            foreach (var reservation in completedReservations)
            {
                var service = services.FirstOrDefault(x => x.Id.ToString().Equals(reservation.ServiceId.ToString(), StringComparison.OrdinalIgnoreCase));
                if (service != null)
                    totalRevenue += service.Price;
            }

            var uniqueCustomers = reservations
                .Select(x => x.CustomerId.ToString())
                .Distinct()
                .Count();

            var averageRating = reviews.Any() ? reviews.Average(x => Convert.ToDouble(x.Rating)) : 0;
            var now = DateTime.UtcNow;

            var currentMonthRevenue = completedReservations
                .Where(x => x.ReservationDate.Month == now.Month && x.ReservationDate.Year == now.Year)
                .Sum(x => {
                    var service = services.FirstOrDefault(s => s.Id.ToString().Equals(x.ServiceId.ToString(), StringComparison.OrdinalIgnoreCase));
                    return service?.Price ?? 0;
                });

            var previousMonth = now.AddMonths(-1);
            var previousMonthRevenue = completedReservations
                .Where(x => x.ReservationDate.Month == previousMonth.Month && x.ReservationDate.Year == previousMonth.Year)
                .Sum(x => {
                    var service = services.FirstOrDefault(s => s.Id.ToString().Equals(x.ServiceId.ToString(), StringComparison.OrdinalIgnoreCase));
                    return service?.Price ?? 0;
                });

            decimal growth = 0;
            if (previousMonthRevenue > 0) growth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

            int newCustomersThisMonth = 0;
            try
            {
                dynamic? provider = _serviceProvider;
                var userManagerType = Type.GetType("Microsoft.AspNetCore.Identity.UserManager`1, Microsoft.AspNetCore.Identity");
                var userType = Type.GetType("SalonHub.Persistence.Identity.ApplicationUser, SalonHub.Persistence") 
                               ?? Type.GetType("SalonHub.Persistence.Identity.ApplicationUser, SalonHub.Infrastructure");
                
                if (userManagerType != null && userType != null)
                {
                    var genericManagerType = userManagerType.MakeGenericType(userType);
                    dynamic? mgr = provider?.GetService(genericManagerType);
                    if (mgr != null)
                    {
                        var users = await mgr.GetUsersInRoleAsync("Customer");
                        foreach (dynamic u in users)
                        {
                            if (u.CreatedAt.Month == now.Month && u.CreatedAt.Year == now.Year) newCustomersThisMonth++;
                        }
                    }
                }
            }
            catch { }

            return new DashboardSummaryDto
            {
                TotalRevenue = totalRevenue,
                TotalReservations = reservations.Count,
                CompletedReservations = completedReservations.Count,
                CancelledReservations = reservations.Count(x => x.Status == ReservationStatus.Cancelled || x.Status.ToString().Equals("Cancelled", StringComparison.OrdinalIgnoreCase)),
                TotalCustomers = uniqueCustomers,
                NewCustomersThisMonth = newCustomersThisMonth,
                AverageRating = Math.Round(averageRating, 2),
                RevenueGrowthPercent = Math.Round(growth, 2)
            };
        }

        public async Task<RevenueReportDto> GetRevenueReportAsync(RevenueReportRequestDto request)
        {
            var reservations = (await _unitOfWork.Reservations.GetAllAsync()).ToList();
            var services = (await _unitOfWork.Services.GetAllAsync()).ToList();
            var salons = (await _unitOfWork.Salons.GetAllAsync()).ToList();

            if (request.SalonId.HasValue && request.SalonId.Value > 0)
            {
                var inputIdStr = request.SalonId.Value.ToString();
                var salonServiceIds = services
                    .Where(x => x.SalonId.ToString().Equals(inputIdStr, StringComparison.OrdinalIgnoreCase))
                    .Select(x => x.Id.ToString())
                    .ToHashSet();

                reservations = reservations
                    .Where(x => salonServiceIds.Contains(x.ServiceId.ToString()))
                    .ToList();
            }

            var completed = reservations
                .Where(x => (x.Status == ReservationStatus.Completed || x.Status.ToString().Equals("Completed", StringComparison.OrdinalIgnoreCase)) &&
                            x.ReservationDate.Date >= request.StartDate.Date &&
                            x.ReservationDate.Date <= request.EndDate.Date)
                .ToList();

            decimal totalRevenue = 0;
            var pointsMap = new Dictionary<string, (decimal Revenue, int Count)>();

            foreach (var reservation in completed)
            {
                var service = services.FirstOrDefault(x => x.Id.ToString().Equals(reservation.ServiceId.ToString(), StringComparison.OrdinalIgnoreCase));
                var price = service?.Price ?? 0;
                totalRevenue += price;

                var periodKey = GetPeriodKey(reservation.ReservationDate, request.GroupBy);
                if (pointsMap.TryGetValue(periodKey, out var existing)) pointsMap[periodKey] = (existing.Revenue + price, existing.Count + 1);
                else pointsMap[periodKey] = (price, 1);
            }

            var points = pointsMap
                .OrderBy(x => x.Key)
                .Select(x => new RevenuePointDto { Period = x.Key, Revenue = x.Value.Revenue, ReservationCount = x.Value.Count })
                .ToList();

            var revenueBySalon = completed
                .Select(r => new { Reservation = r, Service = services.FirstOrDefault(s => s.Id.ToString().Equals(r.ServiceId.ToString(), StringComparison.OrdinalIgnoreCase)) })
                .Where(x => x.Service != null)
                .GroupBy(x => x.Service!.SalonId.ToString())
                .Select(g => {
                    var salon = salons.FirstOrDefault(s => s.Id.ToString().Equals(g.Key, StringComparison.OrdinalIgnoreCase));
                    return new SalonRevenueDto { SalonName = salon?.Name ?? "Naməlum salon", Revenue = g.Sum(x => x.Service!.Price), ReservationCount = g.Count() };
                })
                .OrderByDescending(x => x.Revenue)
                .ToList();

            return new RevenueReportDto { TotalRevenue = totalRevenue, AverageOrderValue = completed.Count > 0 ? Math.Round(totalRevenue / completed.Count, 2) : 0, Points = points, RevenueBySalon = revenueBySalon };
        }

        public async Task<ReservationStatsDto> GetReservationStatsAsync(DateTime startDate, DateTime endDate, string? salonId = null)
        {
            var reservations = (await _unitOfWork.Reservations.GetAllAsync()).ToList();
            var services = (await _unitOfWork.Services.GetAllAsync()).ToList();

            if (!string.IsNullOrEmpty(salonId))
            {
                var salonServiceIds = services
                    .Where(x => x.SalonId.ToString().Equals(salonId, StringComparison.OrdinalIgnoreCase))
                    .Select(x => x.Id.ToString())
                    .ToHashSet();

                reservations = reservations
                    .Where(x => salonServiceIds.Contains(x.ServiceId.ToString()))
                    .ToList();
            }

            var filtered = reservations.Where(x => x.ReservationDate.Date >= startDate.Date && x.ReservationDate.Date <= endDate.Date).ToList();
            var total = filtered.Count;
            var completed = filtered.Count(x => x.Status == ReservationStatus.Completed || x.Status.ToString().Equals("Completed", StringComparison.OrdinalIgnoreCase));
            var cancelled = filtered.Count(x => x.Status == ReservationStatus.Cancelled || x.Status.ToString().Equals("Cancelled", StringComparison.OrdinalIgnoreCase));

            return new ReservationStatsDto
            {
                Total = total,
                Pending = filtered.Count(x => x.Status == ReservationStatus.Pending || x.Status.ToString().Equals("Pending", StringComparison.OrdinalIgnoreCase)),
                Confirmed = filtered.Count(x => x.Status == ReservationStatus.Confirmed || x.Status.ToString().Equals("Confirmed", StringComparison.OrdinalIgnoreCase)),
                Completed = completed,
                Cancelled = cancelled,
                Rejected = filtered.Count(x => x.Status == ReservationStatus.Rejected || x.Status.ToString().Equals("Rejected", StringComparison.OrdinalIgnoreCase)),
                CompletionRatePercent = total > 0 ? Math.Round((double)completed / total * 100, 2) : 0,
                CancellationRatePercent = total > 0 ? Math.Round((double)cancelled / total * 100, 2) : 0,
                PeakHours = filtered.GroupBy(x => x.ReservationDate.Hour).Select(g => new HourlyLoadDto { Hour = g.Key, ReservationCount = g.Count() }).OrderBy(x => x.Hour).ToList(),
                LoadByWeekday = filtered.GroupBy(x => x.ReservationDate.DayOfWeek).Select(g => new WeekdayLoadDto { Weekday = g.Key, ReservationCount = g.Count() }).OrderBy(x => (int)x.Weekday).ToList()
            };
        }

        public async Task<List<PopularServiceDto>> GetPopularServicesAsync(DateTime startDate, DateTime endDate, int top = 10)
        {
            var reservations = (await _unitOfWork.Reservations.GetAllAsync()).ToList();
            var services = (await _unitOfWork.Services.GetAllAsync()).ToList();

            return reservations
                .Where(x => (x.Status == ReservationStatus.Completed || x.Status.ToString().Equals("Completed", StringComparison.OrdinalIgnoreCase)) && x.ReservationDate.Date >= startDate.Date && x.ReservationDate.Date <= endDate.Date)
                .GroupBy(x => x.ServiceId.ToString())
                .Select(g => {
                    var service = services.FirstOrDefault(s => s.Id.ToString().Equals(g.Key, StringComparison.OrdinalIgnoreCase));
                    return new PopularServiceDto { ServiceName = service?.Name ?? "Naməlum xidmət", TimesBooked = g.Count(), TotalRevenue = g.Count() * (service?.Price ?? 0) };
                })
                .OrderByDescending(x => x.TimesBooked)
                .Take(top)
                .ToList();
        }

        public async Task<List<PopularSalonDto>> GetPopularSalonsAsync(DateTime startDate, DateTime endDate, int top = 10)
        {
            var reservations = (await _unitOfWork.Reservations.GetAllAsync()).ToList();
            var services = (await _unitOfWork.Services.GetAllAsync()).ToList();
            var salons = (await _unitOfWork.Salons.GetAllAsync()).ToList();
            var reviews = (await _unitOfWork.Reviews.GetAllAsync()).ToList();

            return reservations
                .Where(x => (x.Status == ReservationStatus.Completed || x.Status.ToString().Equals("Completed", StringComparison.OrdinalIgnoreCase)) && x.ReservationDate.Date >= startDate.Date && x.ReservationDate.Date <= endDate.Date)
                .Select(r => new { Reservation = r, Service = services.FirstOrDefault(s => s.Id.ToString().Equals(r.ServiceId.ToString(), StringComparison.OrdinalIgnoreCase)) })
                .Where(x => x.Service != null)
                .GroupBy(x => x.Service!.SalonId.ToString())
                .Select(g => {
                    var salon = salons.FirstOrDefault(s => s.Id.ToString().Equals(g.Key, StringComparison.OrdinalIgnoreCase));
                    var salonReviews = reviews.Where(rv => rv.SalonId.ToString().Equals(g.Key, StringComparison.OrdinalIgnoreCase)).ToList();
                    return new PopularSalonDto { SalonName = salon?.Name ?? "Naməlum salon", TimesBooked = g.Count(), TotalRevenue = g.Sum(x => x.Service!.Price), AverageRating = salonReviews.Any() ? Math.Round(salonReviews.Average(rv => Convert.ToDouble(rv.Rating)), 2) : 0 };
                })
                .OrderByDescending(x => x.TimesBooked)
                .Take(top)
                .ToList();
        }

        public async Task<CustomerAnalyticsDto> GetCustomerAnalyticsAsync(DateTime startDate, DateTime endDate)
        {
            var reservations = (await _unitOfWork.Reservations.GetAllAsync()).ToList();
            var services = (await _unitOfWork.Services.GetAllAsync()).ToList();

            var inRange = reservations.Where(x => x.ReservationDate.Date >= startDate.Date && x.ReservationDate.Date <= endDate.Date).ToList();
            var priorReservationCustomerIds = reservations.Where(x => x.ReservationDate.Date < startDate.Date).Select(x => x.CustomerId.ToString()).ToHashSet();
            var customerIdsInRange = inRange.Select(x => x.CustomerId.ToString()).Distinct().ToList();

            var topCustomers = new List<TopCustomerDto>();
            dynamic? mgr = null;
            try
            {
                dynamic? provider = _serviceProvider;
                var userManagerType = Type.GetType("Microsoft.AspNetCore.Identity.UserManager`1, Microsoft.AspNetCore.Identity");
                var userType = Type.GetType("SalonHub.Persistence.Identity.ApplicationUser, SalonHub.Persistence") ?? Type.GetType("SalonHub.Persistence.Identity.ApplicationUser, SalonHub.Infrastructure");
                if (userManagerType != null && userType != null) mgr = provider?.GetService(userManagerType.MakeGenericType(userType));
            }
            catch { }

            foreach (var customerId in customerIdsInRange)
            {
                var customerReservations = inRange.Where(x => x.CustomerId.ToString().Equals(customerId, StringComparison.OrdinalIgnoreCase)).ToList();
                var totalSpent = customerReservations.Where(x => x.Status == ReservationStatus.Completed || x.Status.ToString().Equals("Completed", StringComparison.OrdinalIgnoreCase))
                    .Sum(x => services.FirstOrDefault(s => s.Id.ToString().Equals(x.ServiceId.ToString(), StringComparison.OrdinalIgnoreCase))?.Price ?? 0);

                string fullName = "Naməlum müştəri";
                if (mgr != null)
                {
                    try
                    {
                        var user = await mgr.FindByIdAsync(customerId);
                        if (user != null) fullName = $"{user.FirstName} {user.LastName}".Trim();
                    }
                    catch { }
                }
                topCustomers.Add(new TopCustomerDto { FullName = fullName, ReservationCount = customerReservations.Count, TotalSpent = totalSpent });
            }

            var totalCustomers = customerIdsInRange.Count;
            var newCustomers = customerIdsInRange.Count(id => !priorReservationCustomerIds.Contains(id));

            return new CustomerAnalyticsDto { TotalCustomers = totalCustomers, NewCustomers = newCustomers, ReturningCustomers = totalCustomers - newCustomers, RetentionRatePercent = totalCustomers > 0 ? Math.Round((double)(totalCustomers - newCustomers) / totalCustomers * 100, 2) : 0, TopCustomers = topCustomers.OrderByDescending(x => x.TotalSpent).Take(10).ToList() };
        }

        public async Task<SiteStatisticsDto> GetSiteStatisticsAsync()
        {
            var allReservations = await _unitOfWork.Reservations.GetAllAsync();
            var completedReservations = allReservations.Where(r => r.Status == SalonHub.Domain.Enums.ReservationStatus.Completed).ToList();

            var totalCustomers = allReservations.Select(r => r.CustomerId).Distinct().Count();

            var allEmployees = await _unitOfWork.Employees.GetAllAsync();
            var allSalons = await _unitOfWork.Salons.GetAllAsync();
            var allReviews = await _unitOfWork.Reviews.GetAllAsync();

            var averageRating = allReviews.Any() ? Math.Round(allReviews.Average(r => r.Rating), 2) : 0;

            return new SiteStatisticsDto
            {
                TotalCustomers = totalCustomers,
                TotalEmployees = allEmployees.Count,
                TotalSalons = allSalons.Count,
                AverageRating = averageRating,
                TotalCompletedReservations = completedReservations.Count
            };
        }

        private static string GetPeriodKey(DateTime date, ReportGroupBy groupBy)
        {
            return groupBy switch
            {
                ReportGroupBy.Day => date.ToString("yyyy-MM-dd"),
                ReportGroupBy.Week => $"{System.Globalization.ISOWeek.GetYear(date)}-W{System.Globalization.ISOWeek.GetWeekOfYear(date):D2}",
                ReportGroupBy.Month => date.ToString("yyyy-MM"),
                ReportGroupBy.Year => date.ToString("yyyy"),
                _ => date.ToString("yyyy-MM-dd")
            };
        }
    }
}








