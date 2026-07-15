namespace SalonHub.Application.DTOs.Dashboard;

public class EmployeeAvailabilityDto
{
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public List<string> AvailableSlots { get; set; } = new();
}

public class SiteStatisticsDto
{
    public int TotalCustomers { get; set; }
    public int TotalEmployees { get; set; }
    public int TotalSalons { get; set; }
    public double AverageRating { get; set; }
    public int TotalCompletedReservations { get; set; }
}
