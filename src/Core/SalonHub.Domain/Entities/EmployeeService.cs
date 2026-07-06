using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Domain.Entities
{
    public class EmployeeService
    {
        public int EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;

        public int ServiceId { get; set; }
        public Service Service { get; set; } = null!;
    }
}
