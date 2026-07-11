using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.DTOs.StyleRecommendation
{
    public class StyleAnalysisRequestDto
    {
        public string ImageBase64 { get; set; } = string.Empty;
        public int SalonId { get; set; }
    }

    public class StyleAnalysisResultDto
    {
        public string FaceShapeAnalysis { get; set; } = string.Empty;
        public string HairRecommendation { get; set; } = string.Empty;
        public string MakeupRecommendation { get; set; } = string.Empty;
        public string FullExplanation { get; set; } = string.Empty;
        public List<RecommendedImageDto> RecommendedImages { get; set; } = new();
    }

    public class RecommendedImageDto
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
