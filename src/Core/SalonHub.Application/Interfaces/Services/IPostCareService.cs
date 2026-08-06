using System.Threading.Tasks;
using SalonHub.Application.DTOs.PostCare;

namespace SalonHub.Application.Interfaces.Services
{
    public interface IPostCareService
    {
        Task<PostCareGuideResultDto> GenerateAsync(PostCareGuideRequestDto dto, string requesterId, bool isSuperAdmin, bool isSalonAdmin);
    }
}
