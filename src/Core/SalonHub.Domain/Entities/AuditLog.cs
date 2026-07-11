using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Domain.Entities
{
    public class AuditLog
    {
        public int Id { get; set; }
        public string? UserId { get; set; } // Kim etdi (Token-dən gələcək)
        public string Type { get; set; } = string.Empty; // Create, Update, Delete
        public string TableName { get; set; } = string.Empty; // Hansı cədvəl
        public DateTime DateTime { get; set; } // Nə vaxt
        public string? OldValues { get; set; } // Köhnə data (JSON)
        public string? NewValues { get; set; } // Yeni data (JSON)
        public string? AffectedColumns { get; set; } // Hansı sütunlar dəyişdi
        public string? PrimaryKey { get; set; } // Hansı Id-li sətir
    }
}
