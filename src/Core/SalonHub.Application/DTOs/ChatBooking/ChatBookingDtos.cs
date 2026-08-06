namespace SalonHub.Application.DTOs.ChatBooking
{
    public class ChatTurnDto
    {
        public string Role { get; set; } = "user"; // "user" veya "assistant"
        public string Text { get; set; } = string.Empty;
    }

    public class PreviousSuggestionDto
    {
        public int EmployeeId { get; set; }
        public int ServiceId { get; set; }
        public string StartTime { get; set; } = string.Empty;
    }

    public class ChatBookingMessageDto
    {
        public string Message { get; set; } = string.Empty;
        public List<ChatTurnDto> ConversationHistory { get; set; } = new();
        public int? SalonId { get; set; }
        public List<PreviousSuggestionDto> PreviousSuggestions { get; set; } = new();
    }

    public class SuggestedSlotDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string? EmployeeImageUrl { get; set; }
        public double EmployeeRating { get; set; }
        public int ServiceId { get; set; }
        public string ServiceName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int SalonId { get; set; }
        public string SalonName { get; set; } = string.Empty;
        public int BranchId { get; set; }
        public DateTime Date { get; set; }
        public string StartTime { get; set; } = string.Empty;
    }

    public class ChatBookingResponseDto
    {
        public string ReplyText { get; set; } = string.Empty;
        public List<SuggestedSlotDto> SuggestedSlots { get; set; } = new();
        public List<string> QuickReplies { get; set; } = new();
    }
}
