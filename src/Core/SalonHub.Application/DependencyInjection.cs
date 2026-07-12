using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SalonHub.Application.Interfaces.Services;
using SalonHub.Application.Services;

namespace SalonHub.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
            services.AddScoped<ISalonService, SalonService>();
            services.AddScoped<ICategoryService, CategoryService>();
            services.AddScoped<IEmployeeService, EmployeeService>();
            services.AddScoped<IEquipmentService, EquipmentService>();
            services.AddScoped<IBranchService, BranchService>();
            services.AddScoped<ITagService, TagService>();
            services.AddScoped<IServiceCrudService, ServiceCrudService>();
            services.AddScoped<IWorkingHourService, WorkingHourService>();
            services.AddScoped<IReservationService, ReservationService>();
            services.AddScoped<IGalleryImageService, GalleryImageService>();
            services.AddScoped<IReviewService, ReviewService>();
            services.AddScoped<IExcelExportService, ExcelExportService>();
            services.AddScoped<ReservationReminderJob>();
            services.AddScoped<ILoyaltyService, LoyaltyService>();
            services.AddScoped<ITimeBlockService, TimeBlockService>();
            return services;
        }
    }
}
