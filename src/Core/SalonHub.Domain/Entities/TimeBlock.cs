using SalonHub.Domain.Common;

namespace SalonHub.Domain.Entities;

public class TimeBlock : BaseEntity
{
    public int? EmployeeId { get; set; }
    public Employee? Employee { get; set; }

    public int? BranchId { get; set; }
    public Branch? Branch { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }

    public string Reason { get; set; } = string.Empty;
}
