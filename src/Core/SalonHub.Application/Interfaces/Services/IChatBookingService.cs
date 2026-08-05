using SalonHub.Application.DTOs.ChatBooking;

namespace SalonHub.Application.Interfaces.Services
{
    public interface IChatBookingService
    {
        Task<ChatBookingResponseDto> ProcessMessageAsync(ChatBookingMessageDto dto, string customerId);
    }
}
