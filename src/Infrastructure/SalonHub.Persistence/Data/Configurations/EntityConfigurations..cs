using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonHub.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Persistence.Data.Configurations
{
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
                .OnDelete(DeleteBehavior.Cascade);

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
                .HasForeignKey(x => x.ServiceId);

            builder.HasOne(x => x.Tag)
                .WithMany(t => t.ServiceTags)
                .HasForeignKey(x => x.TagId);
        }
    }

    public class EmployeeServiceConfiguration : IEntityTypeConfiguration<EmployeeService>
    {
        public void Configure(EntityTypeBuilder<EmployeeService> builder)
        {
            builder.HasKey(x => new { x.EmployeeId, x.ServiceId });

            builder.HasOne(x => x.Employee)
                .WithMany(e => e.EmployeeServices)
                .HasForeignKey(x => x.EmployeeId);

            builder.HasOne(x => x.Service)
                .WithMany(s => s.EmployeeServices)
                .HasForeignKey(x => x.ServiceId);
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
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class BranchConfiguration : IEntityTypeConfiguration<Branch>
    {
        public void Configure(EntityTypeBuilder<Branch> builder)
        {
            builder.HasOne(x => x.Salon)
                .WithMany(s => s.Branches)
                .HasForeignKey(x => x.SalonId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
