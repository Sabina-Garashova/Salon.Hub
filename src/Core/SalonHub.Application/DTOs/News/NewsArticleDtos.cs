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
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int? SalonId { get; set; }
    public int? AuthorEmployeeId { get; set; }
}

public class NewsArticleUpdateDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}
