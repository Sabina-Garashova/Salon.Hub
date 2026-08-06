using System.Collections.Generic;

namespace SalonHub.Application.DTOs.PostCare
{
    public class PostCareGuideRequestDto
    {
        public int ReservationId { get; set; }
    }

    public class PostCareDayDto
    {
        public int Day { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Advice { get; set; } = string.Empty;
    }

    public class PostCareGuideResultDto
    {
        public string ServiceName { get; set; } = string.Empty;
        public string IntroMessage { get; set; } = string.Empty;
        public List<PostCareDayDto> DailyPlan { get; set; } = new();
        public List<string> ProductRecommendations { get; set; } = new();
        public List<string> ThingsToAvoid { get; set; } = new();
    }
}
