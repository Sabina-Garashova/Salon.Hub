using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SalonHub.Application.DTOs.Auth;


namespace SalonHub.Application.Interfaces.Services
{
    public interface ITokenService
    {
        AuthResponseDto GenerateToken(string userId, string email, string fullName, string role);
    }
}
