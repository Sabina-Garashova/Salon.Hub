using SalonHub.Domain.Entities;

namespace SalonHub.Application.Interfaces.Repositories
{
    public interface IUnitOfWork : IDisposable
    {
        IGenericRepository<Salon> Salons { get; }
        IGenericRepository<Branch> Branches { get; }
        IGenericRepository<Category> Categories { get; }
        IGenericRepository<Service> Services { get; }
        IGenericRepository<Tag> Tags { get; }
        IGenericRepository<Employee> Employees { get; }
        IGenericRepository<Equipment> Equipments { get; }
        IGenericRepository<Reservation> Reservations { get; }
        IGenericRepository<Review> Reviews { get; }
        IGenericRepository<GalleryImage> GalleryImages { get; }
        IGenericRepository<WorkingHour> WorkingHours { get; }
        IGenericRepository<LoyaltyAccount> LoyaltyAccounts { get; }
        IGenericRepository<LoyaltyTransaction> LoyaltyTransactions { get; }
        IGenericRepository<TimeBlock> TimeBlocks { get; }

        Task<int> CompleteAsync();
    }
}
