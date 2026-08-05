using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SalonHub.Application.DTOs.StyleRecommendation;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Domain.Enums;

namespace SalonHub.Infrastructure.Services;

public class StyleRecommendationService : IStyleRecommendationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public StyleRecommendationService(IUnitOfWork unitOfWork, IConfiguration configuration, HttpClient httpClient)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _httpClient = httpClient;
    }

    public async Task<StyleAnalysisResultDto> AnalyzeAsync(StyleAnalysisRequestDto dto)
    {
        var apiKey = _configuration["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini API aÃ§arÄ± konfiqurasiya edilmÉ™yib.");

        var promptText =
            "Bu ÅŸÉ™kildÉ™ki insanÄ±n Ã¼z formasÄ±nÄ±, dÉ™ri tonunu vÉ™ mÃ¶vcud saÃ§ xÃ¼susiyyÉ™tlÉ™rini analiz et. " +
            "Ona uyÄŸun saÃ§ dÃ¼zÃ¼mÃ¼ vÉ™ makyaj stilini AzÉ™rbaycan dilindÉ™ tÃ¶vsiyÉ™ et. " +
            "CavabÄ± YALNIZ bu JSON formatÄ±nda ver, baÅŸqa heÃ§ nÉ™ yazma, izahat É™lavÉ™ etmÉ™: " +
            "Bu tÃ¶vsiyÉ™lÉ™rÉ™ uyÄŸun 3-4 Ä°ngilis dilindÉ™, qÄ±sa, ÅŸÉ™kil axtarÄ±ÅŸÄ± Ã¼Ã§Ã¼n mÃ¼nasib aÃ§ar sÃ¶z dÉ™ ver (mÉ™sÉ™lÉ™n: \"layered bob haircut\", \"bronze glow makeup\"). " +
            "{\"faceShapeAnalysis\": \"...\", \"hairRecommendation\": \"...\", \"makeupRecommendation\": \"...\", \"fullExplanation\": \"...\", \"styleKeywords\": [\"...\", \"...\"]}";

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
            throw new InvalidOperationException($"AI analiz xÉ™tasÄ±: {responseContent}");

        using var doc = JsonDocument.Parse(responseContent);
        var textContent = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? "{}";

        var cleanJson = textContent.Replace("```json", "").Replace("```", "").Trim();

        StyleAnalysisResultDto result;
        try
        {
            var parsed = JsonSerializer.Deserialize<JsonElement>(cleanJson);
            result = new StyleAnalysisResultDto
            {
                FaceShapeAnalysis = parsed.GetProperty("faceShapeAnalysis").GetString() ?? "",
                HairRecommendation = parsed.GetProperty("hairRecommendation").GetString() ?? "",
                MakeupRecommendation = parsed.GetProperty("makeupRecommendation").GetString() ?? "",
                FullExplanation = parsed.GetProperty("fullExplanation").GetString() ?? "",
                StyleKeywords = ExtractKeywords(parsed)
            };
        }
        catch (Exception)
        {
            result = new StyleAnalysisResultDto
            {
                FullExplanation = textContent
            };
        }

        var salonPortfolio = await _unitOfWork.GalleryImages.FindAsync(img =>
            img.SalonId == dto.SalonId && img.Type == GalleryImageType.Portfolio);

        var pool = salonPortfolio.ToList();
        if (pool.Count == 0)
        {
            var allPortfolio = await _unitOfWork.GalleryImages.FindAsync(img => img.Type == GalleryImageType.Portfolio);
            pool = allPortfolio.ToList();
        }

        var keywordMatches = result.StyleKeywords.Count > 0
            ? pool.Where(img => !string.IsNullOrEmpty(img.Description) &&
                result.StyleKeywords.Any(kw => img.Description.Contains(kw, StringComparison.OrdinalIgnoreCase))).ToList()
            : new List<SalonHub.Domain.Entities.GalleryImage>();

        var finalPool = keywordMatches.Count > 0 ? keywordMatches : pool;

        result.RecommendedImages = finalPool
            .Take(5)
            .Select(img => new RecommendedImageDto
            {
                Id = img.Id,
                ImageUrl = img.ImageUrl,
                Description = img.Description
            })
            .ToList();

        if (result.RecommendedImages.Count == 0 && result.StyleKeywords.Count > 0)
        {
            try
            {
                var unsplashKey = _configuration["Unsplash:AccessKey"];
                if (!string.IsNullOrEmpty(unsplashKey))
                {
                    var query = Uri.EscapeDataString(string.Join(" ", result.StyleKeywords.Take(2)));
                    var unsplashUrl = $"https://api.unsplash.com/search/photos?query={query}&per_page=5&client_id={unsplashKey}";
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
                                var desc = photo.TryGetProperty("alt_description", out var descEl) ? descEl.GetString() : null;
                                result.RecommendedImages.Add(new RecommendedImageDto
                                {
                                    Id = idx++,
                                    ImageUrl = imgUrl,
                                    Description = desc ?? string.Join(", ", result.StyleKeywords)
                                });
                            }
                        }
                    }
                }
            }
            catch (Exception)
            {
                // Unsplash ugursuz olsa, sadece acar sozlerle davam et
            }
        }

        return result;
    }

    public async Task<VirtualTryOnResultDto> GenerateTryOnAsync(VirtualTryOnRequestDto dto)
    {
        var apiKey = _configuration["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini API açarı konfiqurasiya edilməyib.");

        var imageModel = _configuration["Gemini:ImageModel"] ?? "gemini-2.5-flash-image";

        var promptText =
            "Bu şəkildəki insanın üzünü, kimliyini, üz cizgilərini VƏ şəklin fonunu tam olaraq eyni saxla. " +
            "YALNIZ saç düzümünü/saç rəngini bu təsvirə uyğun dəyişdir: \"" + dto.StyleDescription + "\". " +
            "Nəticə fotorealistik olmalıdır, sanki eyni insan sadəcə salondan yeni saç düzümü ilə çıxıb. " +
            "Başqa heç bir dəyişiklik etmə (geyim, fon, işıq eyni qalsın).";

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
            },
            generationConfig = new
            {
                responseModalities = new[] { "TEXT", "IMAGE" }
            }
        };

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{imageModel}:generateContent?key={apiKey}";

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        var responseContent = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"AI şəkil generasiyası xətası: {responseContent}");

        using var doc = JsonDocument.Parse(responseContent);
        var parts = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts");

        foreach (var part in parts.EnumerateArray())
        {
            if (part.TryGetProperty("inline_data", out var inlineData) ||
                part.TryGetProperty("inlineData", out inlineData))
            {
                var mimeType = inlineData.TryGetProperty("mime_type", out var mt) ? mt.GetString()
                    : inlineData.TryGetProperty("mimeType", out var mt2) ? mt2.GetString()
                    : "image/png";
                var data = inlineData.GetProperty("data").GetString() ?? "";
                return new VirtualTryOnResultDto
                {
                    GeneratedImageBase64 = data,
                    MimeType = mimeType ?? "image/png"
                };
            }
        }

        throw new InvalidOperationException("AI şəkil generasiya edə bilmədi. Zəhmət olmasa başqa cəhd edin.");
    }

    private static List<string> ExtractKeywords(JsonElement parsed)
    {
        var keywords = new List<string>();
        if (parsed.TryGetProperty("styleKeywords", out var kwEl) && kwEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var kw in kwEl.EnumerateArray())
            {
                var s = kw.GetString();
                if (!string.IsNullOrWhiteSpace(s)) keywords.Add(s);
            }
        }
        return keywords;
    }
}

