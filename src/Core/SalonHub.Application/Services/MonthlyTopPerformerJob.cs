using Microsoft.Extensions.Logging;
using SalonHub.Application.Interfaces.Repositories;

namespace SalonHub.Application.Services
{
    public class MonthlyTopPerformerJob
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<MonthlyTopPerformerJob> _logger;

        public MonthlyTopPerformerJob(IUnitOfWork unitOfWork, ILogger<MonthlyTopPerformerJob> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task SelectMonthlyWinners()
        {
            _logger.LogInformation("Aylıq qalib seçimi başladı: {Date}", DateTime.UtcNow);

            var now = DateTime.UtcNow;
            var startOfLastMonth = new DateTime(now.Year, now.Month, 1).AddMonths(-1);
            var endOfLastMonth = new DateTime(now.Year, now.Month, 1).AddDays(-1);

            var allReviews = await _unitOfWork.Reviews.FindAsync(r =>
                r.CreatedAt >= startOfLastMonth && r.CreatedAt <= endOfLastMonth);

            var reviewList = allReviews.ToList();

            // --- Ən yaxşı işçini tapaq ---
            var allEmployees = await _unitOfWork.Employees.GetAllAsync();

            foreach (var emp in allEmployees.Where(e => e.IsMonthlyTopEmployee))
            {
                emp.IsMonthlyTopEmployee = false;
                _unitOfWork.Employees.Update(emp);
            }

            var employeeRatings = reviewList
                .Where(r => r.EmployeeId.HasValue)
                .GroupBy(r => r.EmployeeId!.Value)
                .Select(g => new { EmployeeId = g.Key, AvgRating = g.Average(r => r.Rating), Count = g.Count() })
                .Where(x => x.Count >= 1)
                .OrderByDescending(x => x.AvgRating)
                .ThenByDescending(x => x.Count)
                .FirstOrDefault();

            if (employeeRatings is not null)
            {
                var topEmployee = await _unitOfWork.Employees.GetByIdAsync(employeeRatings.EmployeeId);
                if (topEmployee is not null)
                {
                    topEmployee.IsMonthlyTopEmployee = true;
                    _unitOfWork.Employees.Update(topEmployee);
                    _logger.LogInformation("Ayın Ustası seçildi: {Name}, Ortalama: {Rating}", topEmployee.FullName, employeeRatings.AvgRating);
                }
            }

            // --- Ən yaxşı salonu tapaq ---
            var allSalons = await _unitOfWork.Salons.GetAllAsync();

            foreach (var salon in allSalons.Where(s => s.IsMonthlyTopSalon))
            {
                salon.IsMonthlyTopSalon = false;
                _unitOfWork.Salons.Update(salon);
            }

            var salonRatings = reviewList
                .GroupBy(r => r.SalonId)
                .Select(g => new { SalonId = g.Key, AvgRating = g.Average(r => r.Rating), Count = g.Count() })
                .Where(x => x.Count >= 1)
                .OrderByDescending(x => x.AvgRating)
                .ThenByDescending(x => x.Count)
                .FirstOrDefault();

            if (salonRatings is not null)
            {
                var topSalon = await _unitOfWork.Salons.GetByIdAsync(salonRatings.SalonId);
                if (topSalon is not null)
                {
                    topSalon.IsMonthlyTopSalon = true;
                    _unitOfWork.Salons.Update(topSalon);
                    _logger.LogInformation("Ayın Salonu seçildi: {Name}, Ortalama: {Rating}", topSalon.NameAz, salonRatings.AvgRating);
                }
            }

            await _unitOfWork.CompleteAsync();

            _logger.LogInformation("Aylıq qalib seçimi bitdi.");
        }
    }
}
