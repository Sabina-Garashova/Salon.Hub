using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.DTOs.Reviews
{
    public class ReviewReadDto
    {
        public int Id { get; set; }
        public string CustomerId { get; set; } = string.Empty;
        public int SalonId { get; set; }
        public int? EmployeeId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class ReviewCreateDto
    {
        public string CustomerId { get; set; } = string.Empty;
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
}
