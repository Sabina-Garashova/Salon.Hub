using SalonHub.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Domain.Entities
{
    public class Tag : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public ICollection<ServiceTag> ServiceTags { get; set; } = new List<ServiceTag>();
    }
}
