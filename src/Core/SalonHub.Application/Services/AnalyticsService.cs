using Microsoft.AspNetCore.Identity;
using SalonHub.Application.DTOs.Analytics;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Domain.Entities;
using SalonHub.Domain.Enums;
using SalonHub.Persistence.Identity;
using System.Data;

namespace SalonHub.Application.Services
{


    public class AnalyticsService : IAnalyticsService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly UserManager<ApplicationUser> _userManager;

        public AnalyticsService(
            IUnitOfWork unitOfWork,
            UserManager<ApplicationUser> userManager)
        {
            _unitOfWork = unitOfWork;
            _userManager = userManager;
        }

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(Guid? salonId = null)
        {
            var reservations = (await _unitOfWork.Reservations.GetAllAsync()).ToList();
            var services = (await _unitOfWork.Services.GetAllAsync()).ToList();
            var reviews = (await _unitOfWork.Reviews.GetAllAsync()).ToList();

            if (salonId.HasValue)
            {
                var salonServices = services
                    .Where(x => x.SalonId == salonId.Value)
                    .Select(x => x.Id)
                    .ToHashSet();

                reservations = reservations
                    .Where(x => salonServices.Contains(x.ServiceId))
                    .ToList();

                reviews = reviews
                    .Where(x => x.SalonId == salonId.Value)
                    .ToList();
            }

            var completedReservations = reservations
                .Where(x => x.Status == ReservationStatus.Completed)
                .ToList();

            decimal totalRevenue = 0;

            foreach (var reservation in completedReservations)
            {
                var service = services.FirstOrDefault(x => x.Id == reservation.ServiceId);

                if (service != null)
                    totalRevenue += service.Price;
            }

            var uniqueCustomers = reservations
                .Select(x => x.CustomerId)
                .Distinct()
                .Count();

            var averageRating = reviews.Any()
                ? reviews.Average(x => x.Rating)
                : 0;

            var now = DateTime.UtcNow;

            var currentMonthRevenue = completedReservations
                .Where(x =>
                    x.ReservationDate.Month == now.Month &&
                    x.ReservationDate.Year == now.Year)
                .Sum(x =>
                {
                    var service = services.FirstOrDefault(s => s.Id == x.ServiceId);
                    return service?.Price ?? 0;
                });

            var previousMonth = now.AddMonths(-1);

            var previousMonthRevenue = completedReservations
                .Where(x =>
                    x.ReservationDate.Month == previousMonth.Month &&
                    x.ReservationDate.Year == previousMonth.Year)
                .Sum(x =>
                {
                    var service = services.FirstOrDefault(s => s.Id == x.ServiceId);
                    return service?.Price ?? 0;
                });

            decimal growth = 0;

            if (previousMonthRevenue > 0)
            {
                growth =
                    ((currentMonthRevenue - previousMonthRevenue)
                    / previousMonthRevenue) * 100;
            }

            var customers = await _userManager.GetUsersInRoleAsync(Roles.Customer);

            var newCustomersThisMonth = customers.Count(x =>
                x.CreatedAt.Month == now.Month &&
                x.CreatedAt.Year == now.Year);

            return new DashboardSummaryDto
            {
                TotalRevenue = totalRevenue,
                TotalReservations = reservations.Count,
                CompletedReservations = reservations.Count(x => x.Status == ReservationStatus.Completed),
                CancelledReservations = reservations.Count(x => x.Status == ReservationStatus.Cancelled),
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

            if (request.SalonId.HasValue)
            {
                var salonServiceIds = services
                    .Where(x => x.SalonId == request.SalonId.Value)
                    .Select(x => x.Id)
                    .ToHashSet();

                reservations = reservations
                    .Where(x => salonServiceIds.Contains(x.ServiceId))
                    .ToList();
            }

            var completed = reservations
                .Where(x =>
                    x.Status == ReservationStatus.Completed &&
                    x.ReservationDate.Date >= request.StartDate.Date &&
                    x.ReservationDate.Date <= request.EndDate.Date)
                .ToList();

            decimal totalRevenue = 0;
            var pointsMap = new Dictionary<string, (decimal Revenue, int Count)>();

            foreach (var reservation in completed)
            {
                var service = services.FirstOrDefault(x => x.Id == reservation.ServiceId);
                var price = service?.Price ?? 0;
                totalRevenue += price;

                var periodKey = GetPeriodKey(reservation.ReservationDate, request.GroupBy);

                if (pointsMap.TryGetValue(periodKey, out var existing))
                {
                    pointsMap[periodKey] = (existing.Revenue + price, existing.Count + 1);
                }
                else
                {
                    pointsMap[periodKey] = (price, 1);
                }
            }

            var points = pointsMap
                .OrderBy(x => x.Key)
                .Select(x => new RevenuePointDto
                {
                    Period = x.Key,
                    Revenue = x.Value.Revenue,
                    ReservationCount = x.Value.Count
                })
                .ToList();

            var revenueBySalon = completed
                .Select(r => new
                {
                    Reservation = r,
                    Service = services.FirstOrDefault(s => s.Id == r.ServiceId)
                })
                .Where(x => x.Service != null)
                .GroupBy(x => x.Service!.SalonId)
                .Select(g =>
                {
                    var salon = salons.FirstOrDefault(s => s.Id == g.Key);
                    return new SalonRevenueDto
                    {
                        SalonId = g.Key,
                        SalonName = salon?.Name ?? "Naməlum salon",
                        Revenue = g.Sum(x => x.Service!.Price),
                        ReservationCount = g.Count()
                    };
                })
                .OrderByDescending(x => x.Revenue)
                .ToList();

            var averageOrderValue = completed.Count > 0
                ? totalRevenue / completed.Count
                : 0;

            return new RevenueReportDto
            {
                TotalRevenue = totalRevenue,
                AverageOrderValue = Math.Round(averageOrderValue, 2),
                Points = points,
                RevenueBySalon = revenueBySalon
            };
        }

        public async Task<ReservationStatsDto> GetReservationStatsAsync(
            DateTime startDate, DateTime endDate, Guid? salonId = null)
        {
            var reservations = (await _unitOfWork.Reservations.GetAllAsync()).ToList();
            var services = (await _unitOfWork.Services.GetAllAsync()).ToList();

            if (salonId.HasValue)
            {
                var salonServiceIds = services
                    .Where(x => x.SalonId == salonId.Value)
                    .Select(x => x.Id)
                    .ToHashSet();

                reservations = reservations
                    .Where(x => salonServiceIds.Contains(x.ServiceId))
                    .ToList();
            }

            var filtered = reservations
                .Where(x =>
                    x.ReservationDate.Date >= startDate.Date &&
                    x.ReservationDate.Date <= endDate.Date)
                .ToList();

            var total = filtered.Count;
            var completed = filtered.Count(x => x.Status == ReservationStatus.Completed);
            var cancelled = filtered.Count(x => x.Status == ReservationStatus.Cancelled);

            var peakHours = filtered
                .GroupBy(x => x.ReservationDate.Hour)
                .Select(g => new HourlyLoadDto
                {
                    Hour = g.Key,
                    ReservationCount = g.Count()
                })
                .OrderBy(x => x.Hour)
                .ToList();

            var loadByWeekday = filtered
                .GroupBy(x => x.ReservationDate.DayOfWeek)
                .Select(g => new WeekdayLoadDto
                {
                    Weekday = g.Key,
                    ReservationCount = g.Count()
                })
                .OrderBy(x => (int)x.Weekday)
                .ToList();

            return new ReservationStatsDto
            {
                Total = total,
                Pending = filtered.Count(x => x.Status == ReservationStatus.Pending),
                Confirmed = filtered.Count(x => x.Status == ReservationStatus.Confirmed),
                Completed = completed,
                Cancelled = cancelled,
                Rejected = filtered.Count(x => x.Status == ReservationStatus.Rejected),
                CompletionRatePercent = total > 0 ? Math.Round((double)completed / total * 100, 2) : 0,
                CancellationRatePercent = total > 0 ? Math.Round((double)cancelled / total * 100, 2) : 0,
                PeakHours = peakHours,
                LoadByWeekday = loadByWeekday
            };
        }

        public async Task<List<PopularServiceDto>> GetPopularServicesAsync(
            DateTime startDate, DateTime endDate, int top = 10)
        {
            var reservations = (await _unitOfWork.Reservations.GetAllAsync()).ToList();
            var services = (await _unitOfWork.Services.GetAllAsync()).ToList();

            var completed = reservations
                .Where(x =>
                    x.Status == ReservationStatus.Completed &&
                    x.ReservationDate.Date >= startDate.Date &&
                    x.ReservationDate.Date <= endDate.Date)
                .ToList();

            var result = completed
                .GroupBy(x => x.ServiceId)
                .Select(g =>
                {
                    var service = services.FirstOrDefault(s => s.Id == g.Key);
                    return new PopularServiceDto
                    {
                        ServiceId = g.Key,
                        ServiceName = service?.Name ?? "Naməlum xidmət",
                        TimesBooked = g.Count(),
                        TotalRevenue = g.Count() * (service?.Price ?? 0)
                    };
                })
                .OrderByDescending(x => x.TimesBooked)
                .Take(top)
                .ToList();

            return result;
        }

        public async Task<List<PopularSalonDto>> GetPopularSalonsAsync(
            DateTime startDate, DateTime endDate, int top = 10)
        {
            var reservations = (await _unitOfWork.Reservations.GetAllAsync()).ToList();
            var services = (await _unitOfWork.Services.GetAllAsync()).ToList();
            var salons = (await _unitOfWork.Salons.GetAllAsync()).ToList();
            var reviews = (await _unitOfWork.Reviews.GetAllAsync()).ToList();

            var completed = reservations
                .Where(x =>
                    x.Status == ReservationStatus.Completed &&
                    x.ReservationDate.Date >= startDate.Date &&
                    x.ReservationDate.Date <= endDate.Date)
                .ToList();

            var result = completed
                .Select(r => new
                {
                    Reservation = r,
                    Service = services.FirstOrDefault(s => s.Id == r.ServiceId)
                })
                .Where(x => x.Service != null)
                .GroupBy(x => x.Service!.SalonId)
                .Select(g =>
                {
                    var salon = salons.FirstOrDefault(s => s.Id == g.Key);
                    var salonReviews = reviews.Where(rv => rv.SalonId == g.Key).ToList();

                    return new PopularSalonDto
                    {
                        SalonId = g.Key,
                        SalonName = salon?.Name ?? "Naməlum salon",
                        TimesBooked = g.Count(),
                        TotalRevenue = g.Sum(x => x.Service!.Price),
                        AverageRating = salonReviews.Any()
                            ? Math.Round(salonReviews.Average(rv => rv.Rating), 2)
                            : 0
                    };
                })
                .OrderByDescending(x => x.TimesBooked)
                .Take(top)
                .ToList();

            return result;
        }

        public async Task<CustomerAnalyticsDto> GetCustomerAnalyticsAsync(
            DateTime startDate, DateTime endDate)
        {
            var reservations = (await _unitOfWork.Reservations.GetAllAsync()).ToList();
            var services = (await _unitOfWork.Services.GetAllAsync()).ToList();

            var inRange = reservations
                .Where(x =>
                    x.ReservationDate.Date >= startDate.Date &&
                    x.ReservationDate.Date <= endDate.Date)
                .ToList();

            var priorReservationCustomerIds = reservations
                .Where(x => x.ReservationDate.Date < startDate.Date)
                .Select(x => x.CustomerId)
                .ToHashSet();

            var customerIdsInRange = inRange
                .Select(x => x.CustomerId)
                .Distinct()
                .ToList();

            var totalCustomers = customerIdsInRange.Count;

            var newCustomers = customerIdsInRange
                .Count(id => !priorReservationCustomerIds.Contains(id));

            var returningCustomers = totalCustomers - newCustomers;

            var retentionRate = totalCustomers > 0
                ? Math.Round((double)returningCustomers / totalCustomers * 100, 2)
                : 0;

            var topCustomers = new List<TopCustomerDto>();

            foreach (var customerId in customerIdsInRange)
            {
                var customerReservations = inRange
                    .Where(x => x.CustomerId == customerId)
                    .ToList();

                var totalSpent = customerReservations
                    .Where(x => x.Status == ReservationStatus.Completed)
                    .Sum(x =>
                    {
                        var service = services.FirstOrDefault(s => s.Id == x.ServiceId);
                        return service?.Price ?? 0;
                    });

                var user = await _userManager.FindByIdAsync(customerId.ToString());

                topCustomers.Add(new TopCustomerDto
                {
                    CustomerId = customerId,
                    FullName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "Naməlum müştəri",
                    ReservationCount = customerReservations.Count,
                    TotalSpent = totalSpent
                });
            }

            topCustomers = topCustomers
                .OrderByDescending(x => x.TotalSpent)
                .Take(10)
                .ToList();

            return new CustomerAnalyticsDto
            {
                TotalCustomers = totalCustomers,
                NewCustomers = newCustomers,
                ReturningCustomers = returningCustomers,
                RetentionRatePercent = retentionRate,
                TopCustomers = topCustomers
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

