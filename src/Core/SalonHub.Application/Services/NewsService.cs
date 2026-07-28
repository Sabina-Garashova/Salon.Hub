using SalonHub.Application.Common;
using SalonHub.Application.DTOs.News;
using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;

namespace SalonHub.Application.Services
{
    public interface INewsService
    {
        Task<List<NewsArticleReadDto>> GetAllAsync(string? language = null);
        Task<NewsArticleReadDto?> GetByIdAsync(int id, string? language = null);
        Task<NewsArticleReadDto> CreateAsync(NewsArticleCreateDto dto);
        Task UpdateAsync(int id, NewsArticleUpdateDto dto, string requesterId, bool isAdmin);
        Task DeleteAsync(int id, string requesterId, bool isAdmin);
    }

    public class NewsService : INewsService
    {
        private readonly IUnitOfWork _unitOfWork;

        public NewsService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<List<NewsArticleReadDto>> GetAllAsync(string? language = null)
        {
            var articles = await _unitOfWork.NewsArticles.GetAllAsync();
            var result = new List<NewsArticleReadDto>();

            foreach (var article in articles.OrderByDescending(a => a.PublishedDate))
                result.Add(await MapToReadDtoAsync(article, language));

            return result;
        }

        public async Task<NewsArticleReadDto?> GetByIdAsync(int id, string? language = null)
        {
            var article = await _unitOfWork.NewsArticles.GetByIdAsync(id);
            return article is null ? null : await MapToReadDtoAsync(article, language);
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
                TitleAz = dto.TitleAz,
                TitleRu = dto.TitleRu,
                TitleEn = dto.TitleEn,
                ContentAz = dto.ContentAz,
                ContentRu = dto.ContentRu,
                ContentEn = dto.ContentEn,
                ImageUrl = dto.ImageUrl,
                SalonId = dto.SalonId,
                AuthorEmployeeId = dto.AuthorEmployeeId,
                PublishedDate = DateTime.UtcNow
            };

            await _unitOfWork.NewsArticles.AddAsync(article);
            await _unitOfWork.CompleteAsync();

            return await MapToReadDtoAsync(article, null);
        }

        public async Task UpdateAsync(int id, NewsArticleUpdateDto dto, string requesterId, bool isAdmin)
        {
            var article = await _unitOfWork.NewsArticles.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Xəbər tapılmadı: {id}");

            if (!isAdmin)
            {
                var requesterEmployee = (await _unitOfWork.Employees.FindAsync(e => e.ApplicationUserId == requesterId)).FirstOrDefault();
                if (requesterEmployee is null || article.AuthorEmployeeId != requesterEmployee.Id)
                    throw new UnauthorizedAccessException("Bu xəbəri redaktə etmək icazəniz yoxdur.");
            }

            article.TitleAz = dto.TitleAz;
            article.TitleRu = dto.TitleRu;
            article.TitleEn = dto.TitleEn;
            article.ContentAz = dto.ContentAz;
            article.ContentRu = dto.ContentRu;
            article.ContentEn = dto.ContentEn;
            article.ImageUrl = dto.ImageUrl;
            article.SalonId = dto.SalonId;
            article.AuthorEmployeeId = dto.AuthorEmployeeId;
            article.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.NewsArticles.Update(article);
            await _unitOfWork.CompleteAsync();
        }

        public async Task DeleteAsync(int id, string requesterId, bool isAdmin)
        {
            var article = await _unitOfWork.NewsArticles.GetByIdAsync(id)
                ?? throw new KeyNotFoundException($"Xəbər tapılmadı: {id}");

            if (!isAdmin)
            {
                var requesterEmployee = (await _unitOfWork.Employees.FindAsync(e => e.ApplicationUserId == requesterId)).FirstOrDefault();
                if (requesterEmployee is null || article.AuthorEmployeeId != requesterEmployee.Id)
                    throw new UnauthorizedAccessException("Bu xəbəri silmək icazəniz yoxdur.");
            }

            _unitOfWork.NewsArticles.Remove(article);
            await _unitOfWork.CompleteAsync();
        }

        private async Task<NewsArticleReadDto> MapToReadDtoAsync(NewsArticle article, string? language)
        {
            string? salonName = null;
            if (article.SalonId.HasValue)
            {
                var salon = await _unitOfWork.Salons.GetByIdAsync(article.SalonId.Value);
                salonName = salon is null ? null : LanguageHelper.Select(salon.NameAz, salon.NameRu, salon.NameEn, language);
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
                Title = LanguageHelper.Select(article.TitleAz, article.TitleRu, article.TitleEn, language),
                Content = LanguageHelper.Select(article.ContentAz, article.ContentRu, article.ContentEn, language),
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




