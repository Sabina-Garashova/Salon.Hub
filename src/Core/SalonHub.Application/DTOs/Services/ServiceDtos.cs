using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.DTOs.Services
{
    public class ServiceReadDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int DurationMinutes { get; set; }
        public int CategoryId { get; set; }
        public int SalonId { get; set; }
        public int? RequiredEquipmentId { get; set; }
    }

    public class ServiceCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int DurationMinutes { get; set; }
        public int CategoryId { get; set; }
        public int SalonId { get; set; }
        public int? RequiredEquipmentId { get; set; }
    }

    public class ServiceUpdateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int DurationMinutes { get; set; }
        public int CategoryId { get; set; }
        public int? RequiredEquipmentId { get; set; }
    }
}
