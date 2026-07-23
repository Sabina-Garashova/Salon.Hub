namespace SalonHub.Application.DTOs.CheckIn
{
    public class QrCheckInDto
    {
        public string CheckInCode { get; set; } = null!;
        public int SalonId { get; set; }
    }
}
