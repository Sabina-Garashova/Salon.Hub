using SalonHub.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Domain.Entities
{
    public class Employee : BaseEntity
    {
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Bio { get; set; }

        public string ApplicationUserId { get; set; } = string.Empty;

        public int SalonId { get; set; }
        public Salon Salon { get; set; } = null!;

        public int? BranchId { get; set; }
        public Branch? Branch { get; set; }

        public ICollection<EmployeeService> EmployeeServices { get; set; } = new List<EmployeeService>();
        public ICollection<WorkingHour> WorkingHours { get; set; } = new List<WorkingHour>();
        public ICollection<GalleryImage> PortfolioImages { get; set; } = new List<GalleryImage>();
        public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
