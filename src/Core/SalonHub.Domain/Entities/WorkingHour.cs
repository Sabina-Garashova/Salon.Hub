using SalonHub.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Domain.Entities
{
    public class WorkingHour : BaseEntity
    {
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public bool IsDayOff { get; set; } = false;

        public int? EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        public int? BranchId { get; set; }
        public Branch? Branch { get; set; }
    }
}
