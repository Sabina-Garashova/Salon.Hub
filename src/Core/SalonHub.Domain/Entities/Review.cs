using SalonHub.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Domain.Entities
{
    public class Review : BaseEntity
    {
        public string CustomerId { get; set; } = string.Empty;

        public int SalonId { get; set; }
        public Salon Salon { get; set; } = null!;

        public int? EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}


