using System.Threading.Tasks;
using SalonHub.Application.DTOs.OutfitMatch;

namespace SalonHub.Application.Interfaces.Services
{
    public interface IOutfitMatchService
    {
        Task<OutfitMatchResultDto> AnalyzeAsync(OutfitMatchRequestDto dto);
    }
}
