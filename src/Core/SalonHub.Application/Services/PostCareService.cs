using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using SalonHub.Application.DTOs.PostCare;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Domain.Enums;

namespace SalonHub.Infrastructure.Services;

public class PostCareService : IPostCareService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public PostCareService(IUnitOfWork unitOfWork, IConfiguration configuration, HttpClient httpClient)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _httpClient = httpClient;
    }

    public async Task<PostCareGuideResultDto> GenerateAsync(PostCareGuideRequestDto dto, string requesterId, bool isSuperAdmin, bool isSalonAdmin)
    {
        var reservation = await _unitOfWork.Reservations.SingleOrDefaultAsync(
            r => r.Id == dto.ReservationId,
            r => r.Service);

        if (reservation is null)
            throw new KeyNotFoundException("Rezervasiya tapılmadı.");

        var allowed = isSuperAdmin || reservation.CustomerId == requesterId;
        if (!allowed && isSalonAdmin)
        {
            var ownSalon = await _unitOfWork.Salons.GetByIdAsync(reservation.SalonId);
            allowed = ownSalon is not null && ownSalon.OwnerId == requesterId;
        }
        if (!allowed)
            throw new UnauthorizedAccessException("Bu rezervasiya üçün qulluq bələdçisi yaratmaq icazəniz yoxdur.");

        if (reservation.Status != ReservationStatus.Completed)
            throw new InvalidOperationException("Qulluq bələdçisi yalnız tamamlanmış rezervasiyalar üçün yaradıla bilər.");

        var serviceName = reservation.Service?.NameAz ?? "";
        var serviceDescription = reservation.Service?.DescriptionAz ?? "";

        var apiKey = _configuration["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini API açarı konfiqurasiya edilməyib.");

        var promptText =
            $"Bir müştəri salonda \"{serviceName}\" xidmətini aldı. Xidmətin təsviri: \"{serviceDescription}\". " +
            "Bu xidmətdən sonrakı 7 gün üçün ev şəraitində qulluq bələdçisi hazırla, Azərbaycan dilində. " +
            "Məsləhətlər real və praktiki olsun (məs. saç boyandısa - sulfatsız şampun, isti alətlərdən çəkinmək; dırnaq edildisə - əl kremi, əlcək taxaraq iş görmək və s). " +
            "CavabI YALNIZ bu JSON formatında ver, başqa heç nə yazma, izahat əlavə etmə: " +
            "{\"introMessage\": \"qısa səmimi giriş cümləsi\", " +
            "\"dailyPlan\": [{\"day\": 1, \"title\": \"...\", \"advice\": \"...\"}, ... 7 günə qədər], " +
            "\"productRecommendations\": [\"...\", \"...\"], " +
            "\"thingsToAvoid\": [\"...\", \"...\"]}";

        var requestBody = new
        {
            contents = new object[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { text = promptText }
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
            throw new InvalidOperationException($"AI qulluq bələdçisi xətası: {responseContent}");

        using var doc = JsonDocument.Parse(responseContent);
        var textContent = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? "{}";

        var cleanJson = textContent.Replace("```json", "").Replace("```", "").Trim();

        var result = new PostCareGuideResultDto { ServiceName = serviceName };

        try
        {
            var parsed = JsonSerializer.Deserialize<JsonElement>(cleanJson);
            result.IntroMessage = parsed.TryGetProperty("introMessage", out var introEl) ? introEl.GetString() ?? "" : "";

            if (parsed.TryGetProperty("dailyPlan", out var planEl) && planEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var day in planEl.EnumerateArray())
                {
                    result.DailyPlan.Add(new PostCareDayDto
                    {
                        Day = day.TryGetProperty("day", out var dayNumEl) ? dayNumEl.GetInt32() : result.DailyPlan.Count + 1,
                        Title = day.TryGetProperty("title", out var titleEl) ? titleEl.GetString() ?? "" : "",
                        Advice = day.TryGetProperty("advice", out var adviceEl) ? adviceEl.GetString() ?? "" : ""
                    });
                }
            }

            result.ProductRecommendations = ExtractStringList(parsed, "productRecommendations");
            result.ThingsToAvoid = ExtractStringList(parsed, "thingsToAvoid");
        }
        catch (Exception)
        {
            result.IntroMessage = textContent;
        }

        return result;
    }

    private static List<string> ExtractStringList(JsonElement parsed, string propertyName)
    {
        var list = new List<string>();
        if (parsed.TryGetProperty(propertyName, out var arrEl) && arrEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in arrEl.EnumerateArray())
            {
                var s = item.GetString();
                if (!string.IsNullOrWhiteSpace(s)) list.Add(s);
            }
        }
        return list;
    }
}
