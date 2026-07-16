using SalonHub.Domain.Common;

namespace SalonHub.Domain.Entities
{
    public class Category : BaseEntity
    {
        public string NameAz { get; set; } = string.Empty;
        public string? NameRu { get; set; }
        public string? NameEn { get; set; }
        public string? DescriptionAz { get; set; }
        public string? DescriptionRu { get; set; }
        public string? DescriptionEn { get; set; }
        public ICollection<Service> Services { get; set; } = new List<Service>();
    }
}
