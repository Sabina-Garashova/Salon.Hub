namespace SalonHub.Application.DTOs.TimeBlocks;

public class TimeBlockReadDto
{
    public int Id { get; set; }
    public int? EmployeeId { get; set; }
    public string? EmployeeName { get; set; }
    public int? BranchId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class TimeBlockCreateDto
{
    public int? EmployeeId { get; set; }
    public int? BranchId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public string Reason { get; set; } = string.Empty;
}
