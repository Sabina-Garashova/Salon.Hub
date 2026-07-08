using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.DTOs.GalleryImages
{
    public class GalleryImageReadDto
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Type { get; set; } = string.Empty;
        public int SalonId { get; set; }
        public int? EmployeeId { get; set; }
    }

    public class GalleryImageCreateDto
    {
        public string ImageUrl { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Type { get; set; } = string.Empty;
        public int SalonId { get; set; }
        public int? EmployeeId { get; set; }
    }

    public class GalleryImageUpdateDto
    {
        public string? Description { get; set; }
        public string Type { get; set; } = string.Empty;
    }
}
