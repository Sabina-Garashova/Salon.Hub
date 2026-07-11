using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
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
            ?? throw new InvalidOperationException("Gemini API açarı konfiqurasiya edilməyib.");

        var promptText =
            "Bu şəkildəki insanın üz formasını, dəri tonunu və mövcud saç xüsusiyyətlərini analiz et. " +
            "Ona uyğun saç düzümü və makyaj stilini Azərbaycan dilində tövsiyə et. " +
            "Cavabı YALNIZ bu JSON formatında ver, başqa heç nə yazma, izahat əlavə etmə: " +
            "{\"faceShapeAnalysis\": \"...\", \"hairRecommendation\": \"...\", \"makeupRecommendation\": \"...\", \"fullExplanation\": \"...\"}";

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
            throw new InvalidOperationException($"AI analiz xətası: {responseContent}");

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
                FullExplanation = parsed.GetProperty("fullExplanation").GetString() ?? ""
            };
        }
        catch (Exception)
        {
            result = new StyleAnalysisResultDto
            {
                FullExplanation = textContent
            };
        }

        var portfolioImages = await _unitOfWork.GalleryImages.FindAsync(img =>
            img.SalonId == dto.SalonId && img.Type == GalleryImageType.Portfolio);

        result.RecommendedImages = portfolioImages
            .Take(5)
            .Select(img => new RecommendedImageDto
            {
                Id = img.Id,
                ImageUrl = img.ImageUrl,
                Description = img.Description
            })
            .ToList();

        return result;
    }
}