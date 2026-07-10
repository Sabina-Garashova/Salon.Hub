using SalonHub.Application.DTOs.Reviews;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.Services
{
    public interface IReviewService
    {
        Task<IReadOnlyList<ReviewReadDto>> GetAllAsync();
        Task<ReviewReadDto?> GetByIdAsync(int id);
        Task<ReviewReadDto> CreateAsync(ReviewCreateDto dto, string customerId);
        Task UpdateAsync(int id, ReviewUpdateDto dto, string requesterId, bool isAdmin);
        Task DeleteAsync(int id, string requesterId, bool isAdmin);
    }

    public class ReviewService : IReviewService
    {
        private readonly IUnitOfWork _unitOfWork;
        public ReviewService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IReadOnlyList<ReviewReadDto>> GetAllAsync()
        {
            var reviews = await _unitOfWork.Reviews.GetAllAsync();
            return reviews.Select(MapToReadDto).ToList();
        }

        public async Task<ReviewReadDto?> GetByIdAsync(int id)
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(id);
            return review is null ? null : MapToReadDto(review);
        }

        public async Task<ReviewReadDto> CreateAsync(ReviewCreateDto dto, string customerId)
        {
            if (dto.Rating < 1 || dto.Rating > 5)
                throw new ArgumentException("Reytinq 1 ilə 5 arasında olmalıdır.");

            var salon = await _unitOfWork.Salons.GetByIdAsync(dto.SalonId)
                ?? throw new KeyNotFoundException("Salon tapılmadı.");

            var review = new Review
            {
                CustomerId = customerId,
                SalonId = dto.SalonId,
                EmployeeId = dto.EmployeeId,
                Rating = dto.Rating,
                Comment = dto.Comment
            };
            await _unitOfWork.Reviews.AddAsync(review);
            await _unitOfWork.CompleteAsync();
            return MapToReadDto(review);
        }

        public async Task UpdateAsync(int id, ReviewUpdateDto dto, string requesterId, bool isAdmin)
        {
            if (dto.Rating < 1 || dto.Rating > 5)
                throw new ArgumentException("Reytinq 1 ilə 5 arasında olmalıdır.");

            var review = await _unitOfWork.Reviews.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Rəy tapılmadı: {id}");

            if (!isAdmin && review.CustomerId != requesterId)
                throw new UnauthorizedAccessException("Bu rəyi dəyişmək icazəniz yoxdur.");

            review.Rating = dto.Rating;
            review.Comment = dto.Comment;
            review.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Reviews.Update(review);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id, string requesterId, bool isAdmin)
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Rəy tapılmadı: {id}");

            if (!isAdmin && review.CustomerId != requesterId)
                throw new UnauthorizedAccessException("Bu rəyi silmək icazəniz yoxdur.");

            _unitOfWork.Reviews.Remove(review);
            await _unitOfWork.CompleteAsync();
        }

        private static ReviewReadDto MapToReadDto(Review review) => new()
        {
            Id = review.Id,
            CustomerId = review.CustomerId,
            SalonId = review.SalonId,
            EmployeeId = review.EmployeeId,
            Rating = review.Rating,
            Comment = review.Comment
        };
    }
}