using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.DTOs.Employees
{
    public class EmployeeReadDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public int SalonId { get; set; }
        public int? BranchId { get; set; }
    }

    public class EmployeeCreateDto
    {
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public string ApplicationUserId { get; set; } = string.Empty;
        public int SalonId { get; set; }
        public int? BranchId { get; set; }
    }

    public class EmployeeUpdateDto
    {
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public int? BranchId { get; set; }
    }
}
