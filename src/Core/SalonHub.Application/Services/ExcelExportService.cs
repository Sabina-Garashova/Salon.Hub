using ClosedXML.Excel;
using SalonHub.Application.DTOs.Analytics;
using SalonHub.Application.Interfaces.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SalonHub.Application.Services
{
    public class ExcelExportService : IExcelExportService
    {
        public Task<byte[]> ExportRevenueReportAsync(RevenueReportDto report)
        {
            using var workbook = new XLWorkbook();
            var summarySheet = workbook.Worksheets.Add("Xülasə");

            summarySheet.Cell(1, 1).Value = "Ümumi Gəlir";
            summarySheet.Cell(1, 2).Value = report.TotalRevenue;
            summarySheet.Cell(2, 1).Value = "Orta Sifariş Dəyəri";
            summarySheet.Cell(2, 2).Value = report.AverageOrderValue;

            var pointsSheet = workbook.Worksheets.Add("Dövr üzrə Gəlir");
            pointsSheet.Cell(1, 1).Value = "Dövr";
            pointsSheet.Cell(1, 2).Value = "Gəlir";
            pointsSheet.Cell(1, 3).Value = "Rezervasiya Sayı";

            int row = 2;
            foreach (var point in report.Points)
            {
                pointsSheet.Cell(row, 1).Value = point.Period;
                pointsSheet.Cell(row, 2).Value = point.Revenue;
                pointsSheet.Cell(row, 3).Value = point.ReservationCount;
                row++;
            }

            var salonSheet = workbook.Worksheets.Add("Salon üzrə Gəlir");
            salonSheet.Cell(1, 1).Value = "Salon";
            salonSheet.Cell(1, 2).Value = "Gəlir";
            salonSheet.Cell(1, 3).Value = "Rezervasiya Sayı";

            row = 2;
            foreach (var salon in report.RevenueBySalon)
            {
                salonSheet.Cell(row, 1).Value = salon.SalonName;
                salonSheet.Cell(row, 2).Value = salon.Revenue;
                salonSheet.Cell(row, 3).Value = salon.ReservationCount;
                row++;
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return Task.FromResult(stream.ToArray());
        }
    }
}
