using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.DTOs.Tags
{
    public class TagReadDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class TagCreateDto
    {
        public string Name { get; set; } = string.Empty;
    }

    public class TagUpdateDto
    {
        public string Name { get; set; } = string.Empty;
    }
}
