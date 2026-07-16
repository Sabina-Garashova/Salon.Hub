using SalonHub.Domain.Common;

namespace SalonHub.Domain.Entities;

public class NewsArticle : BaseEntity
{
    public string TitleAz { get; set; } = string.Empty;
    public string? TitleRu { get; set; }
    public string? TitleEn { get; set; }
    public string ContentAz { get; set; } = string.Empty;
    public string? ContentRu { get; set; }
    public string? ContentEn { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime PublishedDate { get; set; } = DateTime.UtcNow;

    public int? SalonId { get; set; }
    public Salon? Salon { get; set; }

    public int? AuthorEmployeeId { get; set; }
    public Employee? AuthorEmployee { get; set; }
}
