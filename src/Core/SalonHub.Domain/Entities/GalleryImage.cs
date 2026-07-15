using SalonHub.Domain.Common;
using SalonHub.Domain.Enums;

namespace SalonHub.Domain.Entities
{
    public class GalleryImage : BaseEntity
    {
        public string ImageUrl { get; set; } = string.Empty;
        public string? Description { get; set; }
        public GalleryImageType Type { get; set; }
        public int SalonId { get; set; }
        public Salon Salon { get; set; } = null!;
        public int? EmployeeId { get; set; }
        public Employee? Employee { get; set; }
        public int? PairedImageId { get; set; }
    }
}
