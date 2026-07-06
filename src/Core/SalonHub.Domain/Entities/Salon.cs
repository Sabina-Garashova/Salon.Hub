using SalonHub.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Domain.Entities
{
    public class Salon : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;

        public string OwnerId { get; set; } = string.Empty;

        public ICollection<Branch> Branches { get; set; } = new List<Branch>();
        public ICollection<Service> Services { get; set; } = new List<Service>();
        public ICollection<Employee> Employees { get; set; } = new List<Employee>();
        public ICollection<GalleryImage> GalleryImages { get; set; } = new List<GalleryImage>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
