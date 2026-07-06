using SalonHub.Domain.Common;
using SalonHub.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Domain.Entities
{
    public class Equipment : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public EquipmentStatus Status { get; set; } = EquipmentStatus.Active;

        public int BranchId { get; set; }
        public Branch Branch { get; set; } = null!;

        public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    }
}
