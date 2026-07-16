using SalonHub.Domain.Common;

namespace SalonHub.Domain.Entities
{
    public class Salon : BaseEntity
    {
        public string NameAz { get; set; } = string.Empty;
        public string? NameRu { get; set; }
        public string? NameEn { get; set; }
        public string? DescriptionAz { get; set; }
        public string? DescriptionRu { get; set; }
        public string? DescriptionEn { get; set; }
        public string Address { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string OwnerId { get; set; } = string.Empty;

        public ICollection<Branch> Branches { get; set; } = new List<Branch>();
        public ICollection<Employee> Employees { get; set; } = new List<Employee>();
        public ICollection<Service> Services { get; set; } = new List<Service>();
        public ICollection<GalleryImage> GalleryImages { get; set; } = new List<GalleryImage>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
