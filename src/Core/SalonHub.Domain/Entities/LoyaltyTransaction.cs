using SalonHub.Domain.Common;
using SalonHub.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Domain.Entities
{
    public class LoyaltyTransaction : BaseEntity
    {
        public int LoyaltyAccountId { get; set; }
        public LoyaltyAccount LoyaltyAccount { get; set; } = null!;
        public int Points { get; set; }
        public LoyaltyTransactionType Type { get; set; }
        public string Description { get; set; } = string.Empty;
        public int? ReservationId { get; set; }
    }
}
