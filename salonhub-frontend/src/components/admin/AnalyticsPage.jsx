import React, { useState, useEffect, useCallback } from "react";
import AnalyticsDashboard from "./AnalyticsDashboard";
import api from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";

const WEEKDAY_NAMES = ["B.", "B.E.", "ÇA.", "Ç.", "CA.", "C.", "Ş."];

function getMonthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function toIso(d) {
  return d.toISOString().split("T")[0];
}

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [startDate, setStartDate] = useState(toIso(getMonthStart()));
  const [endDate, setEndDate] = useState(toIso(new Date()));
  const [groupBy, setGroupBy] = useState("Day");

  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [revenueReport, setRevenueReport] = useState({ points: [] });
  const [reservationStats, setReservationStats] = useState({ statusStats: [], peekHours: [] });
  const [loadByWeekday, setLoadByWeekday] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [topSalons, setTopSalons] = useState([]);
  const [customerAnalytics, setCustomerAnalytics] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [summaryRes, revenueRes, statsRes, servicesRes, salonsRes, custRes] = await Promise.all([
        api.get("/Analytic/dashboard-summary"),
        api.post("/Analytic/revenue-report", { startDate, endDate, groupBy: { Day: 0, Week: 1, Month: 2, Year: 3 }[groupBy] }),
        api.get("/Analytic/reservation-stats", { params: { startDate, endDate } }),
        api.get("/Analytic/popular-services", { params: { startDate, endDate, top: 5 } }),
        api.get("/Analytic/popular-salons", { params: { startDate, endDate, top: 5 } }),
        api.get("/Analytic/customer-analytics", { params: { startDate, endDate } }),
      ]);

      const s = summaryRes.data;
      setDashboardSummary({
        totalRevenue: s.totalRevenue || 0,
        revenueGrowth: s.revenueGrowthPercent || 0,
        totalReservations: s.totalReservations || 0,
        customerCount: s.totalCustomers || 0,
        newCustomersThisMonth: s.newCustomersThisMonth || 0,
        averageRating: s.averageRating || 0,
      });

      const r = revenueRes.data;
      setRevenueReport({
        points: (r.points || []).map((p) => ({ date: p.period, amount: p.revenue })),
      });

      const rs = statsRes.data;
      setReservationStats({
        statusStats: [
          { status: "Tamamlanmis", value: rs.completed || 0, color: "#10B981" },
          { status: "Gozleyen", value: (rs.pending || 0) + (rs.confirmed || 0), color: "#F59E0B" },
          { status: "Legv edilmis", value: (rs.cancelled || 0) + (rs.rejected || 0), color: "#EF4444" },
        ],
        peekHours: (rs.peakHours || []).map((h) => ({ hour: h.hour + ":00", count: h.reservationCount })),
      });
      setLoadByWeekday((rs.loadByWeekday || []).map((w) => ({ day: WEEKDAY_NAMES[w.weekday] || w.weekday, count: w.reservationCount })));

      const svcList = servicesRes.data || [];
      const maxSvc = Math.max(1, ...svcList.map((x) => x.timesBooked || 0));
      setTopServices(svcList.map((x) => ({ name: x.serviceName, count: x.timesBooked, percentage: Math.round(((x.timesBooked || 0) / maxSvc) * 100) })));

      const salonList = salonsRes.data || [];
      const maxSalon = Math.max(1, ...salonList.map((x) => x.timesBooked || 0));
      setTopSalons(salonList.map((x) => ({ name: x.salonName, count: x.timesBooked, percentage: Math.round(((x.timesBooked || 0) / maxSalon) * 100) })));

      const c = custRes.data;
      const totalC = (c.newCustomers || 0) + (c.returningCustomers || 0);
      setCustomerAnalytics({
        newVsReturning: {
          newCount: c.newCustomers || 0,
          returningCount: c.returningCustomers || 0,
          newPercentage: totalC > 0 ? Math.round(((c.newCustomers || 0) / totalC) * 100) : 0,
          returningPercentage: totalC > 0 ? Math.round(((c.returningCustomers || 0) / totalC) * 100) : 0,
        },
        topCustomers: (c.topCustomers || []).map((x) => ({ name: x.fullName, reservationCount: x.reservationCount, totalSpent: x.totalSpent })),
      });
    } catch (err) {
      console.error("Analitika yuklenmedi", err);
    }
  }, [startDate, endDate, groupBy]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleExportExcel = async () => {
    try {
      const res = await api.post(
        "/Analytic/revenue-report/export",
        { startDate, endDate, groupBy: { Day: 0, Week: 1, Month: 2, Year: 3 }[groupBy] },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "gelir-hesabati.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast(t("admin_excel_export_error"), "error");
    }
  };

  if (!dashboardSummary || !customerAnalytics) {
    return <div className="p-8 text-center text-sm text-gray-400">Analitika yuklenir...</div>;
  }

  return (
    <AnalyticsDashboard
      dashboardSummary={dashboardSummary}
      revenueReport={revenueReport}
      reservationStats={reservationStats}
      loadByWeekday={loadByWeekday}
      topServices={topServices}
      topSalons={topSalons}
      customerAnalytics={customerAnalytics}
      onDateRangeChange={(s, e) => { setStartDate(s); setEndDate(e); }}
      onGroupByChange={(g) => setGroupBy(g)}
      onExportExcel={handleExportExcel}
    />
  );
}


