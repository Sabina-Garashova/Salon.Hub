using SalonHub.Domain.Common;
namespace SalonHub.Domain.Entities
{
    public enum SalonApplicationStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2
    }
    public class SalonApplication : BaseEntity
    {
        public string ApplicantUserId { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string ProposedSalonName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? LogoImageUrl { get; set; }
        public SalonApplicationStatus Status { get; set; } = SalonApplicationStatus.Pending;
        public DateTime? ReviewedAt { get; set; }
        public string? ReviewedByUserId { get; set; }
        public string? RejectionReason { get; set; }
        public int? CreatedSalonId { get; set; }
    }
}
