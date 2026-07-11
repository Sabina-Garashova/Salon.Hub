using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.DTOs.Loyalty
{
    public class LoyaltyBalanceDto
    {
        public int SalonId { get; set; }
        public string SalonName { get; set; } = string.Empty;
        public int Points { get; set; }
        public decimal EquivalentDiscount { get; set; }
    }

    public class LoyaltyTransactionDto
    {
        public int Points { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class RedeemPointsDto
    {
        public int SalonId { get; set; }
        public int PointsToRedeem { get; set; }
    }

    public class RedeemPointsResultDto
    {
        public int RemainingPoints { get; set; }
        public decimal DiscountAmount { get; set; }
    }
}
