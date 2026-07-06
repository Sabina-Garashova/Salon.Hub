using SalonHub.Domain.Common;
using SalonHub.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
    }
}
