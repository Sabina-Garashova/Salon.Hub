using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonHub.Domain.Entities;

namespace SalonHub.Persistence.Configurations;

public class ServiceConfiguration : IEntityTypeConfiguration<Service>
{
    public void Configure(EntityTypeBuilder<Service> builder)
    {
        builder.Property(x => x.Name).IsRequired().HasMaxLength(150);
        builder.Property(x => x.Price).HasColumnType("decimal(10,2)");

        builder.HasOne(x => x.Category)
            .WithMany(c => c.Services)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Salon)
            .WithMany(s => s.Services)
            .HasForeignKey(x => x.SalonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.RequiredEquipment)
            .WithMany()
            .HasForeignKey(x => x.RequiredEquipmentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class ServiceTagConfiguration : IEntityTypeConfiguration<ServiceTag>
{
    public void Configure(EntityTypeBuilder<ServiceTag> builder)
    {
        builder.HasKey(x => new { x.ServiceId, x.TagId });

        builder.HasOne(x => x.Service)
            .WithMany(s => s.ServiceTags)
            .HasForeignKey(x => x.ServiceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Tag)
            .WithMany(t => t.ServiceTags)
            .HasForeignKey(x => x.TagId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class EmployeeServiceConfiguration : IEntityTypeConfiguration<EmployeeService>
{
    public void Configure(EntityTypeBuilder<EmployeeService> builder)
    {
        builder.HasKey(x => new { x.EmployeeId, x.ServiceId });

        builder.HasOne(x => x.Employee)
            .WithMany(e => e.EmployeeServices)
            .HasForeignKey(x => x.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Service)
            .WithMany(s => s.EmployeeServices)
            .HasForeignKey(x => x.ServiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ReservationConfiguration : IEntityTypeConfiguration<Reservation>
{
    public void Configure(EntityTypeBuilder<Reservation> builder)
    {
        builder.HasOne(x => x.Service)
            .WithMany(s => s.Reservations)
            .HasForeignKey(x => x.ServiceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Employee)
            .WithMany(e => e.Reservations)
            .HasForeignKey(x => x.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Branch)
            .WithMany(b => b.Reservations)
            .HasForeignKey(x => x.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Equipment)
            .WithMany(eq => eq.Reservations)
            .HasForeignKey(x => x.EquipmentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class EquipmentConfiguration : IEntityTypeConfiguration<Equipment>
{
    public void Configure(EntityTypeBuilder<Equipment> builder)
    {
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasOne(x => x.Branch)
            .WithMany(b => b.Equipments)
            .HasForeignKey(x => x.BranchId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        builder.HasOne(x => x.Salon)
            .WithMany(s => s.Branches)
            .HasForeignKey(x => x.SalonId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.HasOne(x => x.Salon)
            .WithMany(s => s.Employees)
            .HasForeignKey(x => x.SalonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Branch)
            .WithMany(b => b.Employees)
            .HasForeignKey(x => x.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.AssignedEquipment)
            .WithMany()
            .HasForeignKey(x => x.AssignedEquipmentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class WorkingHourConfiguration : IEntityTypeConfiguration<WorkingHour>
{
    public void Configure(EntityTypeBuilder<WorkingHour> builder)
    {
        builder.HasOne(x => x.Employee)
            .WithMany(e => e.WorkingHours)
            .HasForeignKey(x => x.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Branch)
            .WithMany(b => b.WorkingHours)
            .HasForeignKey(x => x.BranchId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class GalleryImageConfiguration : IEntityTypeConfiguration<GalleryImage>
{
    public void Configure(EntityTypeBuilder<GalleryImage> builder)
    {
        builder.HasOne(x => x.Salon)
            .WithMany(s => s.GalleryImages)
            .HasForeignKey(x => x.SalonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Employee)
            .WithMany(e => e.PortfolioImages)
            .HasForeignKey(x => x.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasOne(x => x.Salon)
            .WithMany(s => s.Reviews)
            .HasForeignKey(x => x.SalonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Employee)
            .WithMany(e => e.Reviews)
            .HasForeignKey(x => x.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
