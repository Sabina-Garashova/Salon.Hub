using SalonHub.Domain.Common;

namespace SalonHub.Domain.Entities
{
    public class Tag : BaseEntity
    {
        public string NameAz { get; set; } = string.Empty;
        public string? NameRu { get; set; }
        public string? NameEn { get; set; }
        public ICollection<ServiceTag> ServiceTags { get; set; } = new List<ServiceTag>();
    }
}
