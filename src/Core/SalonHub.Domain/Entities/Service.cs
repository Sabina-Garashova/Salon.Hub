using SalonHub.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Domain.Entities
{
    public class Service : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int DurationMinutes { get; set; }

        public int CategoryId { get; set; }
        public Category Category { get; set; } = null!;

        public int SalonId { get; set; }
        public Salon Salon { get; set; } = null!;

        public int? RequiredEquipmentId { get; set; }
        public Equipment? RequiredEquipment { get; set; }

        public ICollection<ServiceTag> ServiceTags { get; set; } = new List<ServiceTag>();
        public ICollection<EmployeeService> EmployeeServices { get; set; } = new List<EmployeeService>();
        public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    }
}
