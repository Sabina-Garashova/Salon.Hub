namespace SalonHub.Application.DTOs.Employees;
public class EmployeeReadDto
{
    public int Id { get; set; }
    public string ApplicationUserId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? ProfileImageUrl { get; set; }
    public int SalonId { get; set; }
    public int? BranchId { get; set; }
    public int? AssignedEquipmentId { get; set; }
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public bool IsMonthlyTopEmployee { get; set; }
    public decimal? Salary { get; set; }
}
public class EmployeeCreateDto
{
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string ApplicationUserId { get; set; } = string.Empty;
    public int SalonId { get; set; }
    public int? BranchId { get; set; }
    public int? AssignedEquipmentId { get; set; }
    public decimal? Salary { get; set; }
}
public class EmployeeUpdateDto
{
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? ApplicationUserId { get; set; }
    public int? BranchId { get; set; }
    public int? AssignedEquipmentId { get; set; }
    public decimal? Salary { get; set; }
}

