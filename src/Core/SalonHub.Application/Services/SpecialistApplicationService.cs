using SalonHub.Application.DTOs.SpecialistApplications;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Domain.Entities;

namespace SalonHub.Application.Services
{
    public interface ISpecialistApplicationService
    {
        Task<SpecialistApplicationReadDto> CreateAsync(string applicantUserId, string applicantFullName, string applicantEmail, SpecialistApplicationCreateDto dto);
        Task<IReadOnlyList<SpecialistApplicationReadDto>> GetPendingAsync(string requesterId, bool isSuperAdmin);
        Task<SpecialistApplication> GetEntityByIdAsync(int id);
        Task MarkApprovedAsync(int id, string reviewerId);
        Task MarkRejectedAsync(int id, string reviewerId, string? reason);
    }

    public class SpecialistApplicationService : ISpecialistApplicationService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IUserLookupService _userLookupService;

        public SpecialistApplicationService(IUnitOfWork unitOfWork, IUserLookupService userLookupService)
        {
            _unitOfWork = unitOfWork;
            _userLookupService = userLookupService;
        }

        public async Task<SpecialistApplicationReadDto> CreateAsync(
            string applicantUserId, string applicantFullName, string applicantEmail, SpecialistApplicationCreateDto dto)
        {
            var salon = await _unitOfWork.Salons.GetByIdAsync(dto.SalonId)
                ?? throw new KeyNotFoundException("Salon tapılmadı.");

            if (dto.ExpectedSalaryMin < 0 || dto.ExpectedSalaryMax < 0)
                throw new InvalidOperationException("Maaş aralığı mənfi ola bilməz.");

            if (dto.ExpectedSalaryMin > dto.ExpectedSalaryMax)
                throw new InvalidOperationException("Minimum maaş, maksimumdan böyük ola bilməz.");

            var existingPending = await _unitOfWork.SpecialistApplications.FindAsync(a =>
                a.ApplicantUserId == applicantUserId && a.Status == SpecialistApplicationStatus.Pending);
            if (existingPending.Any())
                throw new InvalidOperationException("Artıq gözləyən bir müraciətiniz var.");

            var application = new SpecialistApplication
            {
                ApplicantUserId = applicantUserId,
                PhoneNumber = dto.PhoneNumber,
                Specialty = dto.Specialty,
                ProfileImageUrl = dto.ProfileImageUrl,
                SalonId = dto.SalonId,
                BranchId = dto.BranchId,
                YearsOfExperience = dto.YearsOfExperience,
                ExpectedSalaryMin = dto.ExpectedSalaryMin,
                ExpectedSalaryMax = dto.ExpectedSalaryMax,
                Bio = dto.Bio,
                Status = SpecialistApplicationStatus.Pending
            };

            if (dto.PortfolioImageUrls is not null)
            {
                foreach (var url in dto.PortfolioImageUrls)
                {
                    application.PortfolioImages.Add(new SpecialistApplicationImage { ImageUrl = url });
                }
            }

            await _unitOfWork.SpecialistApplications.AddAsync(application);
            await _unitOfWork.CompleteAsync();

            return MapToReadDto(application, applicantFullName, applicantEmail, salon.NameAz);
        }

        public async Task<IReadOnlyList<SpecialistApplicationReadDto>> GetPendingAsync(string requesterId, bool isSuperAdmin)
        {
            var pendingIds = await _unitOfWork.SpecialistApplications.FindAsync(
                a => a.Status == SpecialistApplicationStatus.Pending);

            var result = new List<SpecialistApplicationReadDto>();
            foreach (var app in pendingIds)
            {
                var full = await GetEntityByIdAsync(app.Id);

                if (!isSuperAdmin && full.Salon?.OwnerId != requesterId)
                    continue;

                result.Add(MapToReadDto(full, full.ApplicantUserId, string.Empty, full.Salon?.NameAz ?? string.Empty));
            }
            return result;
        }

        public async Task<SpecialistApplication> GetEntityByIdAsync(int id)
        {
            return await _unitOfWork.SpecialistApplications.SingleOrDefaultAsync(
                a => a.Id == id, a => a.PortfolioImages, a => a.Salon)
                ?? throw new KeyNotFoundException("Müraciət tapılmadı.");
        }

        public async Task MarkApprovedAsync(int id, string reviewerId)
        {
            var application = await GetEntityByIdAsync(id);

            if (application.Status != SpecialistApplicationStatus.Pending)
                throw new InvalidOperationException("Bu müraciət artıq nəzərdən keçirilib.");

            application.Status = SpecialistApplicationStatus.Approved;
            application.ReviewedAt = DateTime.UtcNow;
            application.ReviewedByUserId = reviewerId;

            var fullName = await _userLookupService.GetFullNameAsync(application.ApplicantUserId) ?? application.Specialty;
            var employee = new SalonHub.Domain.Entities.Employee
            {
                FullName = fullName,
                PhoneNumber = application.PhoneNumber,
                Bio = application.Bio ?? string.Empty,
                ProfileImageUrl = application.ProfileImageUrl,
                ApplicationUserId = application.ApplicantUserId,
                SalonId = application.SalonId,
                BranchId = application.BranchId,
            };
            await _unitOfWork.Employees.AddAsync(employee);

            await _userLookupService.PromoteToEmployeeAsync(application.ApplicantUserId);

            _unitOfWork.SpecialistApplications.Update(application);
            await _unitOfWork.CompleteAsync();
        }

        public async Task MarkRejectedAsync(int id, string reviewerId, string? reason)
        {
            var application = await GetEntityByIdAsync(id);

            if (application.Status != SpecialistApplicationStatus.Pending)
                throw new InvalidOperationException("Bu müraciət artıq nəzərdən keçirilib.");

            application.Status = SpecialistApplicationStatus.Rejected;
            application.ReviewedAt = DateTime.UtcNow;
            application.ReviewedByUserId = reviewerId;
            application.RejectionReason = reason;

            _unitOfWork.SpecialistApplications.Update(application);
            await _unitOfWork.CompleteAsync();
        }

        private static SpecialistApplicationReadDto MapToReadDto(
            SpecialistApplication a, string applicantFullName, string applicantEmail, string salonName)
        {
            return new SpecialistApplicationReadDto
            {
                Id = a.Id,
                ApplicantUserId = a.ApplicantUserId,
                PhoneNumber = a.PhoneNumber,
                Specialty = a.Specialty,
                ProfileImageUrl = a.ProfileImageUrl,
                ApplicantFullName = applicantFullName,
                ApplicantEmail = applicantEmail,
                SalonId = a.SalonId,
                SalonName = salonName,
                BranchId = a.BranchId,
                YearsOfExperience = a.YearsOfExperience,
                ExpectedSalaryMin = a.ExpectedSalaryMin,
                ExpectedSalaryMax = a.ExpectedSalaryMax,
                Bio = a.Bio,
                PortfolioImageUrls = a.PortfolioImages.Select(p => p.ImageUrl).ToList(),
                Status = a.Status.ToString(),
                CreatedAt = a.CreatedAt,
                ReviewedAt = a.ReviewedAt,
                RejectionReason = a.RejectionReason
            };
        }
    }
}






