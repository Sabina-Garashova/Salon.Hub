using SalonHub.Application.DTOs.SalonApplications;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;

namespace SalonHub.Application.Services
{
    public interface ISalonApplicationService
    {
        Task<SalonApplicationReadDto> CreateAsync(string applicantUserId, string applicantFullName, string applicantEmail, SalonApplicationCreateDto dto);
        Task<IReadOnlyList<SalonApplicationReadDto>> GetPendingAsync();
        Task<SalonApplication> GetEntityByIdAsync(int id);
        Task<Salon> ApproveAndCreateSalonAsync(int id, string reviewerId);
        Task MarkRejectedAsync(int id, string reviewerId, string? reason);
    }

    public class SalonApplicationService : ISalonApplicationService
    {
        private readonly IUnitOfWork _unitOfWork;

        public SalonApplicationService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<SalonApplicationReadDto> CreateAsync(
            string applicantUserId, string applicantFullName, string applicantEmail, SalonApplicationCreateDto dto)
        {
            var existingPending = await _unitOfWork.SalonApplications.FindAsync(a =>
                a.ApplicantUserId == applicantUserId && a.Status == SalonApplicationStatus.Pending);
            if (existingPending.Any())
                throw new InvalidOperationException("Artıq gözləyən bir müraciətiniz var.");

            var application = new SalonApplication
            {
                ApplicantUserId = applicantUserId,
                PhoneNumber = dto.PhoneNumber,
                ProposedSalonName = dto.ProposedSalonName,
                Address = dto.Address,
                Description = dto.Description,
                LogoImageUrl = dto.LogoImageUrl,
                Status = SalonApplicationStatus.Pending
            };

            await _unitOfWork.SalonApplications.AddAsync(application);
            await _unitOfWork.CompleteAsync();

            return MapToReadDto(application, applicantFullName, applicantEmail);
        }

        public async Task<IReadOnlyList<SalonApplicationReadDto>> GetPendingAsync()
        {
            var pending = await _unitOfWork.SalonApplications.FindAsync(
                a => a.Status == SalonApplicationStatus.Pending);

            return pending.Select(a => MapToReadDto(a, string.Empty, string.Empty)).ToList();
        }

        public async Task<SalonApplication> GetEntityByIdAsync(int id)
        {
            return await _unitOfWork.SalonApplications.SingleOrDefaultAsync(a => a.Id == id)
                ?? throw new KeyNotFoundException("Müraciət tapılmadı.");
        }

        public async Task<Salon> ApproveAndCreateSalonAsync(int id, string reviewerId)
        {
            var application = await GetEntityByIdAsync(id);

            if (application.Status != SalonApplicationStatus.Pending)
                throw new InvalidOperationException("Bu müraciət artıq nəzərdən keçirilib.");

            var salon = new Salon
            {
                NameAz = application.ProposedSalonName,
                Address = application.Address,
                PhoneNumber = application.PhoneNumber,
                OwnerId = application.ApplicantUserId,
                DescriptionAz = application.Description
            };
            await _unitOfWork.Salons.AddAsync(salon);
            await _unitOfWork.CompleteAsync();

            var templateServices = await _unitOfWork.Services.FindAsync(s => s.SalonId == 1);
            foreach (var template in templateServices)
            {
                var copy = new Service
                {
                    NameAz = template.NameAz,
                    NameRu = template.NameRu,
                    NameEn = template.NameEn,
                    DescriptionAz = template.DescriptionAz,
                    DescriptionRu = template.DescriptionRu,
                    DescriptionEn = template.DescriptionEn,
                    Price = template.Price,
                    DurationMinutes = template.DurationMinutes,
                    CategoryId = template.CategoryId,
                    SalonId = salon.Id,
                    DiscountPercent = template.DiscountPercent,
                    OriginalPrice = template.OriginalPrice
                };
                await _unitOfWork.Services.AddAsync(copy);
            }
            await _unitOfWork.CompleteAsync();

            var templateImage = (await _unitOfWork.GalleryImages.FindAsync(g => g.SalonId == 1)).FirstOrDefault();
            if (templateImage is not null)
            {
                await _unitOfWork.GalleryImages.AddAsync(new GalleryImage
                {
                    ImageUrl = templateImage.ImageUrl,
                    Description = templateImage.Description,
                    Type = templateImage.Type,
                    SalonId = salon.Id
                });
                await _unitOfWork.CompleteAsync();
            }

            application.Status = SalonApplicationStatus.Approved;
            application.ReviewedAt = DateTime.UtcNow;
            application.ReviewedByUserId = reviewerId;
            application.CreatedSalonId = salon.Id;

            _unitOfWork.SalonApplications.Update(application);
            await _unitOfWork.CompleteAsync();

            return salon;
        }

        public async Task MarkRejectedAsync(int id, string reviewerId, string? reason)
        {
            var application = await GetEntityByIdAsync(id);

            if (application.Status != SalonApplicationStatus.Pending)
                throw new InvalidOperationException("Bu müraciət artıq nəzərdən keçirilib.");

            application.Status = SalonApplicationStatus.Rejected;
            application.ReviewedAt = DateTime.UtcNow;
            application.ReviewedByUserId = reviewerId;
            application.RejectionReason = reason;

            _unitOfWork.SalonApplications.Update(application);
            await _unitOfWork.CompleteAsync();
        }

        private static SalonApplicationReadDto MapToReadDto(SalonApplication a, string applicantFullName, string applicantEmail)
        {
            return new SalonApplicationReadDto
            {
                Id = a.Id,
                ApplicantUserId = a.ApplicantUserId,
                ApplicantFullName = applicantFullName,
                ApplicantEmail = applicantEmail,
                PhoneNumber = a.PhoneNumber,
                ProposedSalonName = a.ProposedSalonName,
                Address = a.Address,
                Description = a.Description,
                LogoImageUrl = a.LogoImageUrl,
                Status = a.Status.ToString(),
                CreatedAt = a.CreatedAt,
                ReviewedAt = a.ReviewedAt,
                RejectionReason = a.RejectionReason,
                CreatedSalonId = a.CreatedSalonId
            };
        }
    }
}
