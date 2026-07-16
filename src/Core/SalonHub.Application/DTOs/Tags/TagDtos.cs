namespace SalonHub.Application.DTOs.Tags
{
    public class TagReadDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class TagCreateDto
    {
        public string NameAz { get; set; } = string.Empty;
        public string? NameRu { get; set; }
        public string? NameEn { get; set; }
    }

    public class TagUpdateDto
    {
        public string NameAz { get; set; } = string.Empty;
        public string? NameRu { get; set; }
        public string? NameEn { get; set; }
    }
}
