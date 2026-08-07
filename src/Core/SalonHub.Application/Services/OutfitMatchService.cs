using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using SalonHub.Application.DTOs.OutfitMatch;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Interfaces.Services;

namespace SalonHub.Infrastructure.Services;

public class OutfitMatchService : IOutfitMatchService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    private static readonly string[] HairKeywords = { "sac", "hair" };
    private static readonly string[] MakeupKeywords = { "makyaj", "makeup" };
    private static readonly string[] ManicureKeywords = { "manikur", "manicure", "dirnaq", "nail" };

    public OutfitMatchService(IUnitOfWork unitOfWork, IConfiguration configuration, HttpClient httpClient)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _httpClient = httpClient;
    }

    public async Task<OutfitMatchResultDto> AnalyzeAsync(OutfitMatchRequestDto dto)
    {
        var apiKey = _configuration["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini API acari konfiqurasiya edilmeyib.");

        var promptText =
            "Bu sekildeki geyimi analiz et: reng palitrasini, uslubunu (mes. resmi, gundelik, aksam geyimi), yaxa formasini ve umumi tesiri. " +
            "Bu geyime uygun sac duzumu, makyaj ve dirnaq (manikur) stili teklif et, Azerbaycan dilinde. " +
            "Cavabi YALNIZ bu JSON formatinda ver, basqa hec ne yazma, izahat elave etme: " +
            "{\"styleSummary\": \"geyimin qisa tesviri\", \"hairSuggestion\": \"...\", \"makeupSuggestion\": \"...\", \"manicureSuggestion\": \"...\", " +
            "\"styleKeywords\": [\"3-4 Ingilis dilinde qisa acar soz, xidmet axtarisi ucun\"]}";

        var imageData = dto.ImageBase64.Contains(",") ? dto.ImageBase64.Split(",")[1] : dto.ImageBase64;

        var requestBody = new
        {
            contents = new object[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { text = promptText },
                        new
                        {
                            inline_data = new
                            {
                                mime_type = "image/jpeg",
                                data = imageData
                            }
                        }
                    }
                }
            }
        };

        var visionModel = _configuration["Gemini:VisionModel"] ?? "gemini-3.6-flash";
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{visionModel}:generateContent?key={apiKey}";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        var responseContent = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"AI geyim analizi xetasi: {responseContent}");

        using var doc = JsonDocument.Parse(responseContent);
        var textContent = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? "{}";

        var cleanJson = textContent.Replace("```json", "").Replace("```", "").Trim();

        var result = new OutfitMatchResultDto();

        try
        {
            var parsed = JsonSerializer.Deserialize<JsonElement>(cleanJson);
            result.StyleSummary = parsed.TryGetProperty("styleSummary", out var s1) ? s1.GetString() ?? "" : "";
            result.HairSuggestion = parsed.TryGetProperty("hairSuggestion", out var s2) ? s2.GetString() ?? "" : "";
            result.MakeupSuggestion = parsed.TryGetProperty("makeupSuggestion", out var s3) ? s3.GetString() ?? "" : "";
            result.ManicureSuggestion = parsed.TryGetProperty("manicureSuggestion", out var s4) ? s4.GetString() ?? "" : "";

            if (parsed.TryGetProperty("styleKeywords", out var kwEl) && kwEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var kw in kwEl.EnumerateArray())
                {
                    var v = kw.GetString();
                    if (!string.IsNullOrWhiteSpace(v)) result.StyleKeywords.Add(v);
                }
            }
        }
        catch (Exception)
        {
            result.StyleSummary = textContent;
        }

        var services = await _unitOfWork.Services.FindAsync(sv => sv.SalonId == dto.SalonId);
        var categories = await _unitOfWork.Categories.GetAllAsync();
        var categoryLookup = categories.ToDictionary(c => c.Id, c => c);

        var recommended = new List<RecommendedServiceDto>();
        AddTopMatches(services, categoryLookup, HairKeywords, recommended, 2);
        AddTopMatches(services, categoryLookup, MakeupKeywords, recommended, 2);
        AddTopMatches(services, categoryLookup, ManicureKeywords, recommended, 2);

        result.RecommendedServices = recommended;

        var salonPortfolio = await _unitOfWork.GalleryImages.FindAsync(img =>
            img.SalonId == dto.SalonId && img.Type == SalonHub.Domain.Enums.GalleryImageType.Portfolio);

        var pool = salonPortfolio.ToList();
        if (pool.Count == 0)
        {
            var allPortfolio = await _unitOfWork.GalleryImages.FindAsync(img => img.Type == SalonHub.Domain.Enums.GalleryImageType.Portfolio);
            pool = allPortfolio.ToList();
        }

        var keywordMatches = result.StyleKeywords.Count > 0
            ? pool.Where(img => !string.IsNullOrEmpty(img.Description) &&
                result.StyleKeywords.Any(kw => img.Description.Contains(kw, StringComparison.OrdinalIgnoreCase))).ToList()
            : new List<SalonHub.Domain.Entities.GalleryImage>();

        result.RecommendedImages = keywordMatches
            .Take(5)
            .Select(img => new RecommendedImageDto { Id = img.Id, ImageUrl = img.ImageUrl, Description = img.Description })
            .ToList();

        if (result.RecommendedImages.Count < 3 && result.StyleKeywords.Count > 0)
        {
            try
            {
                var unsplashKey = _configuration["Unsplash:AccessKey"];
                if (!string.IsNullOrEmpty(unsplashKey))
                {
                    var needed = 5 - result.RecommendedImages.Count;
                    var query = Uri.EscapeDataString(string.Join(" ", result.StyleKeywords.Take(2)));
                    var unsplashUrl = $"https://api.unsplash.com/search/photos?query={query}&per_page={needed}&client_id={unsplashKey}";
                    var unsplashResponse = await _httpClient.GetAsync(unsplashUrl);
                    if (unsplashResponse.IsSuccessStatusCode)
                    {
                        var unsplashContent = await unsplashResponse.Content.ReadAsStringAsync();
                        using var unsplashDoc = JsonDocument.Parse(unsplashContent);
                        if (unsplashDoc.RootElement.TryGetProperty("results", out var resultsEl))
                        {
                            var idx = 0;
                            foreach (var photo in resultsEl.EnumerateArray())
                            {
                                var imgUrl = photo.GetProperty("urls").GetProperty("regular").GetString() ?? "";
                                if (string.IsNullOrWhiteSpace(imgUrl)) continue;
                                var desc = photo.TryGetProperty("alt_description", out var descEl) ? descEl.GetString() : null;
                                result.RecommendedImages.Add(new RecommendedImageDto
                                {
                                    Id = -(idx + 1),
                                    ImageUrl = imgUrl,
                                    Description = desc ?? string.Join(", ", result.StyleKeywords)
                                });
                                idx++;
                            }
                        }
                    }
                }
            }
            catch (Exception) { }
        }

        return result;
    }

    private static void AddTopMatches(
        IReadOnlyList<SalonHub.Domain.Entities.Service> services,
        Dictionary<int, SalonHub.Domain.Entities.Category> categoryLookup,
        string[] keywords,
        List<RecommendedServiceDto> target,
        int take)
    {
        var matches = services
            .Where(sv => categoryLookup.TryGetValue(sv.CategoryId, out var cat) &&
                keywords.Any(kw =>
                    (cat.NameAz?.Contains(kw, StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (cat.NameEn?.Contains(kw, StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (cat.NameRu?.Contains(kw, StringComparison.OrdinalIgnoreCase) ?? false)))
            .Take(take);

        foreach (var sv in matches)
        {
            var categoryName = categoryLookup.TryGetValue(sv.CategoryId, out var cat) ? cat.NameAz : "";
            target.Add(new RecommendedServiceDto
            {
                Id = sv.Id,
                Name = sv.NameAz,
                Price = sv.Price,
                CategoryName = categoryName ?? ""
            });
        }
    }
}