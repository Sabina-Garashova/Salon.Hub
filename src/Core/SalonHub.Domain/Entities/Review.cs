using SalonHub.Domain.Common;

namespace SalonHub.Domain.Entities
{
    public class Review : BaseEntity
    {
        public string CustomerId { get; set; } = string.Empty;
        public int SalonId { get; set; }
        public Salon Salon { get; set; } = null!;
        public int? EmployeeId { get; set; }
        public Employee? Employee { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public string? Response { get; set; }
        public DateTime? RespondedAt { get; set; }
        public bool FollowUpSent { get; set; } = false;
    }
}
