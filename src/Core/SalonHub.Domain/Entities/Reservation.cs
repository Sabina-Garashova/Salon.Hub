using SalonHub.Domain.Common;
using SalonHub.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SalonHub.Domain.Entities;




namespace SalonHub.Domain.Entities
{
    public class Reservation : BaseEntity
    {
        public string CustomerId { get; set; } = string.Empty;

        public int ServiceId { get; set; }
        public Service Service { get; set; } = null!;

        public int EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;

        public int BranchId { get; set; }
        public Branch Branch { get; set; } = null!;

        public int? EquipmentId { get; set; }
        public Equipment? Equipment { get; set; }

        public DateTime ReservationDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }

        public ReservationStatus Status { get; set; } = ReservationStatus.Pending;
        public string? CancellationReason { get; set; }
    }
}
