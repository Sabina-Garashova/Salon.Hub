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
        public string NameAz { get; set; } = string.Empty;
        public string? NameRu { get; set; }
        public string? NameEn { get; set; }
        public string? DescriptionAz { get; set; }
        public string? DescriptionRu { get; set; }
        public string? DescriptionEn { get; set; }
        public decimal Price { get; set; }
        public int DurationMinutes { get; set; }
        public int CategoryId { get; set; }
        public int SalonId { get; set; }
        public int? RequiredEquipmentId { get; set; }
    }

    public class ServiceUpdateDto
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
        public int? RequiredEquipmentId { get; set; }
    }
}
