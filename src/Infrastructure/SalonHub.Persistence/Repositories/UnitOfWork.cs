using SalonHub.Application.Interfaces.Repositories;
using SalonHub.Domain.Entities;

namespace SalonHub.Persistence.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;

        public UnitOfWork(AppDbContext context)
        {
            _context = context;
            Salons = new GenericRepository<Salon>(_context);
            Branches = new GenericRepository<Branch>(_context);
            Categories = new GenericRepository<Category>(_context);
            Services = new GenericRepository<Service>(_context);
            ServiceTags = new GenericRepository<ServiceTag>(_context);
            Tags = new GenericRepository<Tag>(_context);
            Employees = new GenericRepository<Employee>(_context);
            Equipments = new GenericRepository<Equipment>(_context);
            Reservations = new GenericRepository<Reservation>(_context);
            Reviews = new GenericRepository<Review>(_context);
            WorkingHours = new GenericRepository<WorkingHour>(_context);
            GalleryImages = new GenericRepository<GalleryImage>(_context);
            LoyaltyAccounts = new GenericRepository<LoyaltyAccount>(_context);
            LoyaltyTransactions = new GenericRepository<LoyaltyTransaction>(_context);
            TimeBlocks = new GenericRepository<TimeBlock>(_context);
            NewsArticles = new GenericRepository<NewsArticle>(_context);
            SpecialistApplications = new GenericRepository<SpecialistApplication>(_context);
            Notifications = new GenericRepository<Notification>(_context);
        }

        public IGenericRepository<Salon> Salons { get; }
        public IGenericRepository<Branch> Branches { get; }
        public IGenericRepository<Category> Categories { get; }
        public IGenericRepository<GalleryImage> GalleryImages { get; }
        public IGenericRepository<Service> Services { get; }
        public IGenericRepository<ServiceTag> ServiceTags { get; }
        public IGenericRepository<Tag> Tags { get; }
        public IGenericRepository<Employee> Employees { get; }
        public IGenericRepository<Equipment> Equipments { get; }
        public IGenericRepository<Reservation> Reservations { get; }
        public IGenericRepository<Review> Reviews { get; }
        public IGenericRepository<WorkingHour> WorkingHours { get; }
        public IGenericRepository<LoyaltyAccount> LoyaltyAccounts { get; }
        public IGenericRepository<LoyaltyTransaction> LoyaltyTransactions { get; }
        public IGenericRepository<TimeBlock> TimeBlocks { get; }
        public IGenericRepository<NewsArticle> NewsArticles { get; }
        public IGenericRepository<SpecialistApplication> SpecialistApplications { get; }
        public IGenericRepository<Notification> Notifications { get; }

        public async Task<int> CompleteAsync() => await _context.SaveChangesAsync();

        public void Dispose() => _context.Dispose();
    }
}




