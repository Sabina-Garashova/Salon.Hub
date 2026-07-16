using FluentValidation;
using SalonHub.Application.DTOs.Auth;
using SalonHub.Application.DTOs.Reservations;
using SalonHub.Application.DTOs.Salons;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.Validators
{
    public class SalonCreateValidator : AbstractValidator<SalonCreateDto>
    {
        public SalonCreateValidator()
        {
            RuleFor(x => x.NameAz).NotEmpty().MaximumLength(150);
            RuleFor(x => x.Address).NotEmpty().MaximumLength(250);
            RuleFor(x => x.PhoneNumber).NotEmpty().Matches(@"^\+?[0-9\s\-]{7,15}$")
                .WithMessage("Telefon nömrəsi düzgün formatda deyil.");
        }
    }

    public class ReservationCreateValidator : AbstractValidator<ReservationCreateDto>
    {
        public ReservationCreateValidator()
        {
            RuleFor(x => x.ServiceId).GreaterThan(0);
            RuleFor(x => x.EmployeeId).GreaterThan(0);
            RuleFor(x => x.BranchId).GreaterThan(0);
            RuleFor(x => x.CustomerId).NotEmpty();
            RuleFor(x => x.ReservationDate.Date)
                .GreaterThanOrEqualTo(DateTime.UtcNow.Date)
                .WithMessage("Keçmiş tarixə rezervasiya yaratmaq olmaz.");
        }
    }

    public class RegisterValidator : AbstractValidator<RegisterDto>
    {
        public RegisterValidator()
        {
            RuleFor(x => x.FullName).NotEmpty().MaximumLength(100);
            RuleFor(x => x.Email).NotEmpty().EmailAddress();
            RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
            RuleFor(x => x.Role).Must(r => new[] { "SuperAdmin", "SalonAdmin", "Employee", "Customer" }.Contains(r))
                .WithMessage("Rol düzgün deyil.");
        }
    }
}

