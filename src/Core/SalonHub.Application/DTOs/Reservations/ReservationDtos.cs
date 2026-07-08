using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.DTOs.Reservations
{
    public class ReservationCreateDto
    {
        public string CustomerId { get; set; } = string.Empty;
        public int ServiceId { get; set; }
        public int EmployeeId { get; set; }
        public int BranchId { get; set; }
        public DateTime ReservationDate { get; set; }
        public TimeSpan StartTime { get; set; }
    }

    public class ReservationReadDto
    {
        public int Id { get; set; }
        public string ServiceName { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime ReservationDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string Status { get; set; } = string.Empty;
    }
    public class ReservationUpdateDto
    {
        public int ServiceId { get; set; }
        public int EmployeeId { get; set; }
        public int BranchId { get; set; }
        public DateTime ReservationDate { get; set; }
        public TimeSpan StartTime { get; set; }
    }
}
