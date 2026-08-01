namespace SalonHub.Application.DTOs.SalonApplications
{
    public class SalonApplicationCreateDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string ProposedSalonName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? LogoImageUrl { get; set; }
    }
    public class SalonApplicationReadDto
    {
        public int Id { get; set; }
        public string ApplicantUserId { get; set; } = string.Empty;
        public string ApplicantFullName { get; set; } = string.Empty;
        public string ApplicantEmail { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string ProposedSalonName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? LogoImageUrl { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? RejectionReason { get; set; }
        public int? CreatedSalonId { get; set; }
    }
    public class SalonApplicationRejectDto
    {
        public string? Reason { get; set; }
    }
}
