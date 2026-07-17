using SalonHub.Domain.Common;

namespace SalonHub.Domain.Entities
{
    public class Notification : BaseEntity
    {
        public string UserId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;
    }
}
