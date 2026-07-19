namespace SalonHub.Application.DTOs.Auth
{
    public class RegisterDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "Customer";
        public DateTime? DateOfBirth { get; set; }
        public string? ReferredByCode { get; set; }
    }

    public class ForgotPasswordDto
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class FixFullNameDto
    {
        public string Email { get; set; } = string.Empty;
        public string NewFullName { get; set; } = string.Empty;
    }
    public class ReferralCodeDto
    {
        public string ReferralCode { get; set; } = string.Empty;
    }
}


