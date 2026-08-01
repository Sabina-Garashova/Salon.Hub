using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using SalonHub.Domain.Entities;
using SalonHub.Persistence.Identity;
using System.Security.Claims;
using System.Text.Json;

namespace SalonHub.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    private readonly IHttpContextAccessor? _httpContextAccessor;

    public AppDbContext(DbContextOptions<AppDbContext> options, IHttpContextAccessor? httpContextAccessor = null) : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
    }

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
    public DbSet<SalonApplication> SalonApplications => Set<SalonApplication>();
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
        builder.Entity<Equipment>().HasQueryFilter(x => !x.IsDeleted);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var userId = _httpContextAccessor?.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "System_User";
        var auditEntries = new List<AuditLog>();

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is AuditLog) continue;
            if (entry.State == EntityState.Detached || entry.State == EntityState.Unchanged) continue;

            var audit = new AuditLog
            {
                UserId = userId,
                Type = entry.State.ToString(),
                TableName = entry.Metadata.GetTableName() ?? entry.Entity.GetType().Name,
                DateTime = DateTime.UtcNow
            };

            var primaryKey = new Dictionary<string, object?>();
            var oldValues = new Dictionary<string, object?>();
            var newValues = new Dictionary<string, object?>();
            var affectedColumns = new List<string>();

            foreach (var property in entry.Properties)
            {
                var propertyName = property.Metadata.Name;
                if (property.Metadata.IsPrimaryKey())
                    primaryKey[propertyName] = property.CurrentValue;

                switch (entry.State)
                {
                    case EntityState.Added:
                        newValues[propertyName] = property.CurrentValue;
                        break;
                    case EntityState.Deleted:
                        oldValues[propertyName] = property.OriginalValue;
                        break;
                    case EntityState.Modified:
                        if (property.IsModified)
                        {
                            affectedColumns.Add(propertyName);
                            oldValues[propertyName] = property.OriginalValue;
                            newValues[propertyName] = property.CurrentValue;
                        }
                        break;
                }
            }

            audit.PrimaryKey = JsonSerializer.Serialize(primaryKey);
            if (oldValues.Any()) audit.OldValues = JsonSerializer.Serialize(oldValues);
            if (newValues.Any()) audit.NewValues = JsonSerializer.Serialize(newValues);
            if (affectedColumns.Any()) audit.AffectedColumns = JsonSerializer.Serialize(affectedColumns);

            auditEntries.Add(audit);
        }

        if (auditEntries.Any())
            AuditLogs.AddRange(auditEntries);

        return await base.SaveChangesAsync(cancellationToken);
    }
}






