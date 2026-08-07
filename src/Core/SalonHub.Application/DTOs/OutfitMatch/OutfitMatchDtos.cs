using System.Collections.Generic;

namespace SalonHub.Application.DTOs.OutfitMatch
{
    public class OutfitMatchRequestDto
    {
        public string ImageBase64 { get; set; } = string.Empty;
        public int SalonId { get; set; }
    }

    public class RecommendedServiceDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string CategoryName { get; set; } = string.Empty;
    }

    public class RecommendedImageDto
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class OutfitMatchResultDto
    {
        public string StyleSummary { get; set; } = string.Empty;
        public string HairSuggestion { get; set; } = string.Empty;
        public string MakeupSuggestion { get; set; } = string.Empty;
        public string ManicureSuggestion { get; set; } = string.Empty;
        public List<string> StyleKeywords { get; set; } = new();
        public List<RecommendedServiceDto> RecommendedServices { get; set; } = new();
        public List<RecommendedImageDto> RecommendedImages { get; set; } = new();
    }
}