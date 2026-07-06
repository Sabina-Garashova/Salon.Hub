using SalonHub.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Domain.Entities
{
    public class Branch : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;

        public int SalonId { get; set; }
        public Salon Salon { get; set; } = null!;

        public ICollection<Employee> Employees { get; set; } = new List<Employee>();
        public ICollection<Equipment> Equipments { get; set; } = new List<Equipment>();
        public ICollection<WorkingHour> WorkingHours { get; set; } = new List<WorkingHour>();
        public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    }
}
