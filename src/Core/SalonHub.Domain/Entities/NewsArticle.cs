using SalonHub.Domain.Common;

namespace SalonHub.Domain.Entities;

public class NewsArticle : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public DateTime PublishedDate { get; set; } = DateTime.UtcNow;

    public int? SalonId { get; set; }
    public Salon? Salon { get; set; }

    public int? AuthorEmployeeId { get; set; }
    public Employee? AuthorEmployee { get; set; }
}
