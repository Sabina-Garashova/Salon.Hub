using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SalonHub.Application.DTOs.Auth;
using SalonHub.Application.Interfaces.Services;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Infrastructure.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;

        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public AuthResponseDto GenerateToken(string userId, string email, string fullName, string role)
        {
            var jwtSection = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, fullName),
            new(ClaimTypes.Role, role)
        };

            var expiresAt = DateTime.UtcNow.AddHours(double.Parse(jwtSection["ExpiryHours"] ?? "8"));

            var token = new JwtSecurityToken(
                issuer: jwtSection["Issuer"],
                audience: jwtSection["Audience"],
                claims: claims,
                expires: expiresAt,
                signingCredentials: creds);

            return new AuthResponseDto
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                ExpiresAt = expiresAt,
                FullName = fullName,
                Role = role
            };
        }
    }
}
