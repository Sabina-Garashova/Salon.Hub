using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.DTOs.Categories
{
    public class CategoryReadDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class CategoryCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class CategoryUpdateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
