namespace SalonHub.Application.DTOs.SpecialistApplications
{
    public class SpecialistApplicationCreateDto
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string Specialty { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public int SalonId { get; set; }
        public int? BranchId { get; set; }
        public int YearsOfExperience { get; set; }
        public decimal ExpectedSalaryMin { get; set; }
        public decimal ExpectedSalaryMax { get; set; }
        public string? Bio { get; set; }
        public List<string>? PortfolioImageUrls { get; set; }
    }

    public class SpecialistApplicationReadDto
    {
        public int Id { get; set; }
        public string ApplicantUserId { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Specialty { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public string ApplicantFullName { get; set; } = string.Empty;
        public string ApplicantEmail { get; set; } = string.Empty;
        public int SalonId { get; set; }
        public string SalonName { get; set; } = string.Empty;
        public int? BranchId { get; set; }
        public int YearsOfExperience { get; set; }
        public decimal ExpectedSalaryMin { get; set; }
        public decimal ExpectedSalaryMax { get; set; }
        public string? Bio { get; set; }
        public List<string> PortfolioImageUrls { get; set; } = new();
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? RejectionReason { get; set; }
    }

    public class SpecialistApplicationRejectDto
    {
        public string? Reason { get; set; }
    }

    public class SpecialistApplicationApproveDto
    {
        public decimal? AgreedSalary { get; set; }
    }
}



