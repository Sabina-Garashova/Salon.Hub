namespace SalonHub.Application.DTOs.Reservations
{
    public class ReservationCreateDto
    {
        public string? CustomerFullName { get; set; }
        public string CustomerId { get; set; } = string.Empty;
        public int ServiceId { get; set; }
        public int EmployeeId { get; set; }
        public int BranchId { get; set; }
        public DateTime ReservationDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public string? ReferenceImageUrl { get; set; }
        public string? ReferenceImageUrl2 { get; set; }
        public string? CurrentPhotoUrl { get; set; }
        public string? PaymentMethod { get; set; }
    }

    public class ReservationReadDto
    {
        public string CheckInCode { get; set; } = string.Empty;
        public bool IsCheckedIn { get; set; }
        public int SalonId { get; set; }
        public string PaymentMethod { get; set; } = "Card";
        public string CustomerId { get; set; } = string.Empty;
        public int EmployeeId { get; set; }
        public decimal Price { get; set; }
        public string CustomerFullName { get; set; } = string.Empty;
        public int Id { get; set; }
        public string ServiceName { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime ReservationDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string? ReferenceImageUrl { get; set; }
        public string? ReferenceImageUrl2 { get; set; }
        public string? CurrentPhotoUrl { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal? LoyaltyDiscountApplied { get; set; }
    }

    public class ReservationUpdateDto
    {
        public int ServiceId { get; set; }
        public int EmployeeId { get; set; }
        public int BranchId { get; set; }
        public DateTime ReservationDate { get; set; }
        public TimeSpan StartTime { get; set; }
    }

    public class MultiServiceItemDto
    {
        public int ServiceId { get; set; }
        public int EmployeeId { get; set; }
    }

    public class MultiServiceReservationCreateDto
    {
        public string? CustomerFullName { get; set; }
        public string CustomerId { get; set; } = string.Empty;
        public int BranchId { get; set; }
        public DateTime ReservationDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public List<MultiServiceItemDto> Services { get; set; } = new();
    }
}


