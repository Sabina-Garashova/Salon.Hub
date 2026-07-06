using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Persistence.Identity
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
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
