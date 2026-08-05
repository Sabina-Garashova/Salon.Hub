using SalonHub.Application.DTOs.StyleRecommendation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.Interfaces.Services
{
    public interface IStyleRecommendationService
    {
        Task<StyleAnalysisResultDto> AnalyzeAsync(StyleAnalysisRequestDto dto);
        Task<VirtualTryOnResultDto> GenerateTryOnAsync(VirtualTryOnRequestDto dto);
    }
}
