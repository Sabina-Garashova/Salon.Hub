namespace SalonHub.Application.DTOs.Reviews
{
    public class ReviewReadDto
    {
        public int Id { get; set; }
        public string CustomerId { get; set; } = string.Empty;
        public string CustomerFullName { get; set; } = string.Empty;
        public int SalonId { get; set; }
        public int? EmployeeId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public string? Response { get; set; }
        public DateTime? RespondedAt { get; set; }
    }

    public class ReviewCreateDto
    {
        public int SalonId { get; set; }
        public int? EmployeeId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class ReviewUpdateDto
    {
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class ReviewResponseDto
    {
        public string Response { get; set; } = string.Empty;
    }
}
