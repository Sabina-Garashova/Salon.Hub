using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.DTOs.WorkingHours
{
    public class WorkingHourReadDto
    {
        public int Id { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public bool IsDayOff { get; set; }
        public int? EmployeeId { get; set; }
        public int? BranchId { get; set; }
    }

    public class WorkingHourCreateDto
    {
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public bool IsDayOff { get; set; } = false;
        public int? EmployeeId { get; set; }
        public int? BranchId { get; set; }
    }

    public class WorkingHourUpdateDto
    {
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public bool IsDayOff { get; set; }
    }
}
