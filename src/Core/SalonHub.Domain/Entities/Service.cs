using SalonHub.Domain.Common;

namespace SalonHub.Domain.Entities
{
    public class Service : BaseEntity
    {
        public string NameAz { get; set; } = string.Empty;
        public string? NameRu { get; set; }
        public string? NameEn { get; set; }
        public string? DescriptionAz { get; set; }
        public string? DescriptionRu { get; set; }
        public string? DescriptionEn { get; set; }
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
