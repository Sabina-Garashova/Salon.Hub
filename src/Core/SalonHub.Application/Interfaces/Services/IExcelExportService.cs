using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.Interfaces.Services
{
    public interface IExcelExportService
    {
        Task<byte[]> ExportRevenueReportAsync(DTOs.Analytics.RevenueReportDto report);
    }
}
