using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SalonHub.Domain.Entities;
using SalonHub.Persistence.Identity;

namespace SalonHub.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Salon> Salons => Set<Salon>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<ServiceTag> ServiceTags => Set<ServiceTag>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<EmployeeService> EmployeeServices => Set<EmployeeService>();
    public DbSet<Equipment> Equipments => Set<Equipment>();
    public DbSet<WorkingHour> WorkingHours => Set<WorkingHour>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<GalleryImage> GalleryImages => Set<GalleryImage>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<TimeBlock> TimeBlocks => Set<TimeBlock>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<LoyaltyAccount> LoyaltyAccounts => Set<LoyaltyAccount>();
    public DbSet<LoyaltyTransaction> LoyaltyTransactions => Set<LoyaltyTransaction>();
    public DbSet<NewsArticle> NewsArticles => Set<NewsArticle>();
    public DbSet<SpecialistApplication> SpecialistApplications => Set<SpecialistApplication>();
    public DbSet<SpecialistApplicationImage> SpecialistApplicationImages => Set<SpecialistApplicationImage>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        builder.Entity<Salon>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<Service>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<Employee>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<SpecialistApplication>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<Reservation>().HasQueryFilter(x => !x.IsDeleted);
    }
}


