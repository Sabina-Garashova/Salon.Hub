using SalonHub.Domain.Common;

namespace SalonHub.Domain.Entities
{
    public enum SpecialistApplicationStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2
    }

    public class SpecialistApplication : BaseEntity
    {
        public string ApplicantUserId { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Specialty { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }

        public int SalonId { get; set; }
        public Salon Salon { get; set; } = null!;

        public int? BranchId { get; set; }
        public Branch? Branch { get; set; }

        public int YearsOfExperience { get; set; }
        public decimal ExpectedSalaryMin { get; set; }
        public decimal ExpectedSalaryMax { get; set; }
        public string? Bio { get; set; }

        public ICollection<SpecialistApplicationImage> PortfolioImages { get; set; } = new List<SpecialistApplicationImage>();

        public SpecialistApplicationStatus Status { get; set; } = SpecialistApplicationStatus.Pending;
        public DateTime? ReviewedAt { get; set; }
        public string? ReviewedByUserId { get; set; }
        public string? RejectionReason { get; set; }
    }

    public class SpecialistApplicationImage : BaseEntity
    {
        public int SpecialistApplicationId { get; set; }
        public SpecialistApplication SpecialistApplication { get; set; } = null!;
        public string ImageUrl { get; set; } = string.Empty;
    }
}


