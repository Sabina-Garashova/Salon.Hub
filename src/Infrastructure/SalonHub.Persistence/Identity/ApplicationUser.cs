using Microsoft.AspNetCore.Identity;

namespace SalonHub.Persistence.Identity
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string ReferralCode { get; set; } = string.Empty;
        public string? ReferredByUserId { get; set; }
    }

    public static class Roles
    {
        public const string SuperAdmin = "SuperAdmin";
        public const string SalonAdmin = "SalonAdmin";
        public const string Employee = "Employee";
        public const string Customer = "Customer";

        public static readonly string[] All = { SuperAdmin, SalonAdmin, Employee, Customer };
    }
}
