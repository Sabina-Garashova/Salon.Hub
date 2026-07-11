using SalonHub.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Domain.Entities
{
    public class LoyaltyAccount : BaseEntity
    {
        public string CustomerId { get; set; } = string.Empty;
        public int SalonId { get; set; }
        public Salon Salon { get; set; } = null!;
        public int Points { get; set; } = 0;

        public ICollection<LoyaltyTransaction> Transactions { get; set; } = new List<LoyaltyTransaction>();
    }
}
