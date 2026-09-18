using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using SalonHub.Application.DTOs.ChatBooking;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Interfaces.Services;

namespace SalonHub.Infrastructure.Services;

public class AiServiceUnavailableException : Exception
{
    public AiServiceUnavailableException(string message) : base(message) { }
}

public class ChatBookingService : IChatBookingService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private readonly SalonHub.Application.Services.IReservationService _reservationService;

    public ChatBookingService(
        IUnitOfWork unitOfWork,
        IConfiguration configuration,
        HttpClient httpClient,
        SalonHub.Application.Services.IReservationService reservationService)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _httpClient = httpClient;
        _reservationService = reservationService;
    }

    private class IntentResult
    {
        public string Intent { get; set; } = "chitchat";
        public string? ServiceName { get; set; }
        public string? ResolvedDate { get; set; }
        public string? TimePreference { get; set; }
        public string ReplyText { get; set; } = string.Empty;
    }

    public async Task<ChatBookingResponseDto> ProcessMessageAsync(ChatBookingMessageDto dto, string customerId)
    {
        var apiKey = _configuration["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini API açarı konfiqurasiya edilməyib.");

        var allServices = await _unitOfWork.Services.GetAllAsync();
        var serviceNames = allServices.Select(s => s.NameAz).Distinct().Take(40).ToList();

        var today = DateTime.Now;
        var historyText = string.Join("\n", dto.ConversationHistory.TakeLast(6)
            .Select(h => (h.Role == "user" ? "Müştəri: " : "Konsyerj: ") + h.Text));

        var promptText =
            "Sən SalonHub gözəllik salonu üçün nəzakətli, səmimi bir rezervasiya konsyerjisən. " +
            $"Bugünkü tarix: {today:yyyy-MM-dd} ({today:dddd}). " +
            "Mövcud xidmətlər: " + string.Join(", ", serviceNames) + ". " +
            (historyText.Length > 0 ? "Söhbət tarixçəsi:\n" + historyText + "\n" : "") +
            $"Müştərinin son mesajı: \"{dto.Message}\"\n\n" +
            "Bu mesajı analiz et və YALNIZ aşağıdakı JSON formatında cavab ver, başqa heç nə yazma, izahat əlavə etmə: " +
            "{\"intent\": \"search\" (əgər müştəri xidmət axtarır/rezervasiya istəyirsə) və ya \"chitchat\" (salamlaşma, sual, aydın olmayan istək), " +
            "\"serviceName\": mövcud xidmətlərdən DƏQİQ biri (əgər aydındırsa) və ya null, " +
            "\"resolvedDate\": bugünkü tarixə görə hesablanmış \"YYYY-MM-DD\" formatında tarix (əgər müştəri vaxt qeyd edibsə, məs. \"sabah\" -> sabahın tarixi) və ya null, " +
            "\"timePreference\": \"morning\", \"afternoon\", \"evening\" və ya null, " +
            "\"replyText\": müştəriyə veriləcək qısa (1-2 cümlə), nəzakətli, Azərbaycan dilində, salon konsyerjisi tonunda cavab}";

        var requestBody = new
        {
            contents = new object[]
            {
                new { parts = new object[] { new { text = promptText } } }
            }
        };

        var textModel = _configuration["Gemini:TextModel"] ?? "gemini-flash-latest";
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{textModel}:generateContent?key={apiKey}";

        // Gemini 503 (yüksək tələbat) üçün retry: 2 əlavə cəhd, artan gecikmə ilə
        const int maxAttempts = 3;
        HttpResponseMessage? response = null;
        string responseContent = string.Empty;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            response = await _httpClient.SendAsync(request);
            responseContent = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
                break;

            var isRetryable = response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable
                || response.StatusCode == System.Net.HttpStatusCode.TooManyRequests;

            if (!isRetryable || attempt == maxAttempts)
                break;

            await Task.Delay(attempt * 800);
        }

        if (response is null || !response.IsSuccessStatusCode)
            throw new AiServiceUnavailableException(
                "AI konsyerj hazırda məşğuldur, bir neçə saniyə sonra yenidən cəhd edin.");

        using var doc = JsonDocument.Parse(responseContent);
        var textContent = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? "{}";

        var cleanJson = textContent.Replace("```json", "").Replace("```", "").Trim();

        IntentResult intent;
        try
        {
            var parsed = JsonSerializer.Deserialize<JsonElement>(cleanJson);
            intent = new IntentResult
            {
                Intent = parsed.TryGetProperty("intent", out var i) ? i.GetString() ?? "chitchat" : "chitchat",
                ServiceName = parsed.TryGetProperty("serviceName", out var sn) && sn.ValueKind == JsonValueKind.String ? sn.GetString() : null,
                ResolvedDate = parsed.TryGetProperty("resolvedDate", out var rd) && rd.ValueKind == JsonValueKind.String ? rd.GetString() : null,
                TimePreference = parsed.TryGetProperty("timePreference", out var tp) && tp.ValueKind == JsonValueKind.String ? tp.GetString() : null,
                ReplyText = parsed.TryGetProperty("replyText", out var rt) ? rt.GetString() ?? "" : ""
            };
        }
        catch (Exception)
        {
            return new ChatBookingResponseDto
            {
                ReplyText = "Üzr istəyirəm, bunu tam başa düşmədim. Hansı xidmətlə maraqlanırsınız?",
                QuickReplies = DefaultQuickReplies(serviceNames)
            };
        }

        if (intent.Intent != "search" || string.IsNullOrWhiteSpace(intent.ServiceName))
        {
            return new ChatBookingResponseDto
            {
                ReplyText = string.IsNullOrWhiteSpace(intent.ReplyText)
                    ? "Necə kömək edə bilərəm? Hansı xidmətlə maraqlanırsınız?"
                    : intent.ReplyText,
                QuickReplies = DefaultQuickReplies(serviceNames)
            };
        }

        var matchedServices = allServices
            .Where(s => s.NameAz.Contains(intent.ServiceName, StringComparison.OrdinalIgnoreCase))
            .Take(6)
            .ToList();

        if (matchedServices.Count == 0)
        {
            return new ChatBookingResponseDto
            {
                ReplyText = $"Təəssüf ki, \"{intent.ServiceName}\" adlı xidməti tapa bilmədim. Bunlardan birini sınayın:",
                QuickReplies = DefaultQuickReplies(serviceNames)
            };
        }

        DateTime searchDate = DateTime.Today.AddDays(1);
        if (!string.IsNullOrWhiteSpace(intent.ResolvedDate) && DateTime.TryParse(intent.ResolvedDate, out var parsedDate))
            searchDate = parsedDate.Date;

        var allEmployees = await _unitOfWork.Employees.GetAllAsync();
        var allReviews = await _unitOfWork.Reviews.GetAllAsync();
        var ratingByEmployee = allReviews
            .Where(r => r.EmployeeId.HasValue)
            .GroupBy(r => r.EmployeeId!.Value)
            .ToDictionary(g => g.Key, g => Math.Round(g.Average(r => r.Rating), 1));

        var lowerMessage = dto.Message.ToLowerInvariant();
        var wantsOtherEmployees = lowerMessage.Contains("digər usta") || lowerMessage.Contains("başqa usta");
        var wantsOtherTimes = lowerMessage.Contains("başqa saat") || lowerMessage.Contains("digər saat");

        var excludedEmployeeIds = wantsOtherEmployees
            ? dto.PreviousSuggestions.Select(p => p.EmployeeId).Distinct().ToHashSet()
            : new HashSet<int>();

        var excludedTimesByEmployee = wantsOtherTimes
            ? dto.PreviousSuggestions
                .GroupBy(p => p.EmployeeId)
                .ToDictionary(g => g.Key, g => g.Select(p => p.StartTime).ToHashSet())
            : new Dictionary<int, HashSet<string>>();

        var suggestions = new List<SuggestedSlotDto>();

        foreach (var svc in matchedServices)
        {
            if (suggestions.Count >= 3) break;

            foreach (var empStub in allEmployees)
            {
                if (suggestions.Count >= 3) break;
                if (empStub.SalonId != svc.SalonId) continue;
                if (excludedEmployeeIds.Contains(empStub.Id)) continue;

                var emp = await _unitOfWork.Employees.SingleOrDefaultAsync(
                    e => e.Id == empStub.Id, e => e.EmployeeServices, e => e.AssignedEquipment);

                if (emp is null || emp.BranchId is null) continue;
                if (!emp.EmployeeServices.Any(es => es.ServiceId == svc.Id)) continue;

                List<string> slots;
                try
                {
                    slots = await _reservationService.GetAvailableSlotsAsync(emp.Id, svc.Id, searchDate);
                }
                catch
                {
                    continue;
                }

                if (excludedTimesByEmployee.TryGetValue(emp.Id, out var usedTimes))
                    slots = slots.Where(s => !usedTimes.Contains(s)).ToList();

                if (slots.Count == 0) continue;

                var chosenTime = PickBestSlot(slots, intent.TimePreference);
                var salon = await _unitOfWork.Salons.GetByIdAsync(svc.SalonId);

                suggestions.Add(new SuggestedSlotDto
                {
                    EmployeeId = emp.Id,
                    EmployeeName = emp.FullName,
                    EmployeeImageUrl = emp.ProfileImageUrl,
                    EmployeeRating = ratingByEmployee.TryGetValue(emp.Id, out var rating) ? rating : 0,
                    ServiceId = svc.Id,
                    ServiceName = svc.NameAz,
                    Price = svc.Price,
                    SalonId = svc.SalonId,
                    SalonName = salon?.NameAz ?? "",
                    BranchId = emp.BranchId.Value,
                    Date = searchDate,
                    StartTime = chosenTime
                });
            }
        }

        var replyText = suggestions.Count > 0
            ? (string.IsNullOrWhiteSpace(intent.ReplyText) ? "Sizin üçün bu seçimləri tapdım:" : intent.ReplyText)
            : $"Təəssüf ki, {searchDate:dd.MM.yyyy} tarixi üçün \"{intent.ServiceName}\" xidmətinə uyğun boş vaxt tapmadım. Başqa tarix yoxlayaq?";

        return new ChatBookingResponseDto
        {
            ReplyText = replyText,
            SuggestedSlots = suggestions,
            QuickReplies = suggestions.Count > 0
                ? new List<string> { "Başqa saatlar göstər", "Digər ustalar", "Qiyməti nə qədərdir?" }
                : DefaultQuickReplies(serviceNames)
        };
    }

    private static string PickBestSlot(List<string> slots, string? timePreference)
    {
        if (string.IsNullOrEmpty(timePreference)) return slots[slots.Count / 2];

        var withHours = slots.Select(s => new { s, hour = int.Parse(s.Split(':')[0]) }).ToList();
        var filtered = timePreference switch
        {
            "morning" => withHours.Where(x => x.hour < 12).ToList(),
            "afternoon" => withHours.Where(x => x.hour >= 12 && x.hour < 17).ToList(),
            "evening" => withHours.Where(x => x.hour >= 17).ToList(),
            _ => withHours
        };

        return (filtered.Count > 0 ? filtered : withHours).First().s;
    }

    private static List<string> DefaultQuickReplies(List<string> serviceNames) =>
        serviceNames.Take(3).ToList();
}