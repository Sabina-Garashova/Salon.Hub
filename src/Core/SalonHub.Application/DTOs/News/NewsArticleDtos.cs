namespace SalonHub.Application.DTOs.News;

public class NewsArticleReadDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public DateTime PublishedDate { get; set; }
    public int? SalonId { get; set; }
    public string? SalonName { get; set; }
    public int? AuthorEmployeeId { get; set; }
    public string? AuthorEmployeeName { get; set; }
}

public class NewsArticleCreateDto
{
    public string TitleAz { get; set; } = string.Empty;
    public string? TitleRu { get; set; }
    public string? TitleEn { get; set; }
    public string ContentAz { get; set; } = string.Empty;
    public string? ContentRu { get; set; }
    public string? ContentEn { get; set; }
    public string? ImageUrl { get; set; }
    public int? SalonId { get; set; }
    public int? AuthorEmployeeId { get; set; }
}

public class NewsArticleUpdateDto
{
    public string TitleAz { get; set; } = string.Empty;
    public string? TitleRu { get; set; }
    public string? TitleEn { get; set; }
    public string ContentAz { get; set; } = string.Empty;
    public string? ContentRu { get; set; }
    public string? ContentEn { get; set; }
    public string? ImageUrl { get; set; }
}
