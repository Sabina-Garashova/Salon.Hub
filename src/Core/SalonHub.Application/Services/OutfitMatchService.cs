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

    private static readonly string[] HairKeywords = { "saç", "hair", "волос" };
    private static readonly string[] MakeupKeywords = { "makyaj", "makeup", "макияж" };
    private static readonly string[] ManicureKeywords = { "manikür", "manicure", "dırnaq", "nail", "маникюр", "ноготь" };

    public OutfitMatchService(IUnitOfWork unitOfWork, IConfiguration configuration, HttpClient httpClient)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _httpClient = httpClient;
    }

    public async Task<OutfitMatchResultDto> AnalyzeAsync(OutfitMatchRequestDto dto)
    {
        var apiKey = _configuration["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini API açarı konfiqurasiya edilməyib.");

        var promptText =
            "Bu şəkildəki geyimi analiz et: rəng palitrasını, üslubunu (məs. rəsmi, gündəlik, axşam geyimi), yaxa formasını və ümumi təsiri. " +
            "Bu geyimə uyğun saç düzümü, makyaj vƏ dırnaq (manikür) stili təklif et, Azərbaycan dilində. " +
            "Cavabı YALNIZ bu JSON formatında ver, başqa heç nə yazma, izahat əlavə etmə: " +
            "{\"styleSummary\": \"geyimin qısa təsviri\", \"hairSuggestion\": \"...\", \"makeupSuggestion\": \"...\", \"manicureSuggestion\": \"...\", " +
            "\"styleKeywords\": [\"3-4 İngilis dilində qısa açar söz, xidmət axtarışı üçün\"]}";

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
                                data = dto.ImageBase64
                            }
                        }
                    }
                }
            }
        };

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={apiKey}";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        var responseContent = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"AI geyim analizi xətası: {responseContent}");

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

        // Salonun xidmətlərini kateqoriyalarına görə saç/makyaj/manikür qruplarına ayırıb
        // hər qrupdan uyğun 1-2 xidmət tövsiyə edirik. Category-də ayrıca "tip" sahəsi
        // olmadığından, kateqoriya adı üzərindən açar sözlərlə uyğunlaşdırırıq.
        var services = await _unitOfWork.Services.FindAsync(sv => sv.SalonId == dto.SalonId);
        var categories = await _unitOfWork.Categories.GetAllAsync();
        var categoryLookup = categories.ToDictionary(c => c.Id, c => c);

        var recommended = new List<RecommendedServiceDto>();
        AddTopMatches(services, categoryLookup, HairKeywords, recommended, 2);
        AddTopMatches(services, categoryLookup, MakeupKeywords, recommended, 2);
        AddTopMatches(services, categoryLookup, ManicureKeywords, recommended, 2);

        result.RecommendedServices = recommended;

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
