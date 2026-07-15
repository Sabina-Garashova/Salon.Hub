using SalonHub.Application.DTOs.News;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;

namespace SalonHub.Application.Services
{
    public interface INewsService
    {
        Task<List<NewsArticleReadDto>> GetAllAsync();
        Task<NewsArticleReadDto?> GetByIdAsync(int id);
        Task<NewsArticleReadDto> CreateAsync(NewsArticleCreateDto dto);
        Task UpdateAsync(int id, NewsArticleUpdateDto dto);
        Task DeleteAsync(int id);
    }

    public class NewsService : INewsService
    {
        private readonly IUnitOfWork _unitOfWork;

        public NewsService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<List<NewsArticleReadDto>> GetAllAsync()
        {
            var articles = await _unitOfWork.NewsArticles.GetAllAsync();
            var result = new List<NewsArticleReadDto>();

            foreach (var article in articles.OrderByDescending(a => a.PublishedDate))
                result.Add(await MapToReadDtoAsync(article));

            return result;
        }

        public async Task<NewsArticleReadDto?> GetByIdAsync(int id)
        {
            var article = await _unitOfWork.NewsArticles.GetByIdAsync(id);
            return article is null ? null : await MapToReadDtoAsync(article);
        }

        public async Task<NewsArticleReadDto> CreateAsync(NewsArticleCreateDto dto)
        {
            if (dto.SalonId.HasValue)
            {
                var salon = await _unitOfWork.Salons.GetByIdAsync(dto.SalonId.Value)
                    ?? throw new KeyNotFoundException("Salon tapılmadı.");
            }

            if (dto.AuthorEmployeeId.HasValue)
            {
                var employee = await _unitOfWork.Employees.GetByIdAsync(dto.AuthorEmployeeId.Value)
                    ?? throw new KeyNotFoundException("İşçi tapılmadı.");
            }

            var article = new NewsArticle
            {
                Title = dto.Title,
                Content = dto.Content,
                ImageUrl = dto.ImageUrl,
                SalonId = dto.SalonId,
                AuthorEmployeeId = dto.AuthorEmployeeId,
                PublishedDate = DateTime.UtcNow
            };

            await _unitOfWork.NewsArticles.AddAsync(article);
            await _unitOfWork.CompleteAsync();

            return await MapToReadDtoAsync(article);
        }

        public async Task UpdateAsync(int id, NewsArticleUpdateDto dto)
        {
            var article = await _unitOfWork.NewsArticles.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Xəbər tapılmadı: {id}");

            article.Title = dto.Title;
            article.Content = dto.Content;
            article.ImageUrl = dto.ImageUrl;
            article.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.NewsArticles.Update(article);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var article = await _unitOfWork.NewsArticles.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Xəbər tapılmadı: {id}");

            _unitOfWork.NewsArticles.Remove(article);
            await _unitOfWork.CompleteAsync();
        }

        private async Task<NewsArticleReadDto> MapToReadDtoAsync(NewsArticle article)
        {
            string? salonName = null;
            if (article.SalonId.HasValue)
            {
                var salon = await _unitOfWork.Salons.GetByIdAsync(article.SalonId.Value);
                salonName = salon?.Name;
            }

            string? authorName = null;
            if (article.AuthorEmployeeId.HasValue)
            {
                var employee = await _unitOfWork.Employees.GetByIdAsync(article.AuthorEmployeeId.Value);
                authorName = employee?.FullName;
            }

            return new NewsArticleReadDto
            {
                Id = article.Id,
                Title = article.Title,
                Content = article.Content,
                ImageUrl = article.ImageUrl,
                PublishedDate = article.PublishedDate,
                SalonId = article.SalonId,
                SalonName = salonName,
                AuthorEmployeeId = article.AuthorEmployeeId,
                AuthorEmployeeName = authorName
            };
        }
    }
}
