using Microsoft.Extensions.DependencyInjection;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Application.Services;
using SalonHub.Infrastructure.Services;

namespace SalonHub.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
        {
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<INotificationService, NotificationService>();
            services.AddScoped<IEmailService, MockNotificationService>();
            services.AddScoped<ISmsService, AwsSnsSmsService>();
            services.AddHttpClient<IStyleRecommendationService, StyleRecommendationService>();
            return services;
        }
    }
}
