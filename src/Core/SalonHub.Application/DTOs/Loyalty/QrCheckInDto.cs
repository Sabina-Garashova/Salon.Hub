namespace SalonHub.Application.DTOs.Loyalty
{
    public class QrCheckInDto
    {
        public string CheckInCode { get; set; } = null!;
        public int SalonId { get; set; }
    }
}
