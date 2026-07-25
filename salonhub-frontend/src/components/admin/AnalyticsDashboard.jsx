import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

const TrendingUpIcon = () => (
  <svg className="w-4 h-4 text-emerald-500 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendingDownIcon = () => (
  <svg className="w-4 h-4 text-rose-500 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function AnalyticsDashboard({
  dashboardSummary = {
    totalRevenue: 0,
    revenueGrowth: 0,
    totalReservations: 0,
    customerCount: 0,
    newCustomersThisMonth: 0,
    averageRating: 0,
  },
  revenueReport = { points: [] },
  reservationStats = { statusStats: [], peekHours: [] },
  loadByWeekday = [],
  topServices = [],
  topSalons = [],
  customerAnalytics = {
    newVsReturning: { newCount: 0, returningCount: 0, newPercentage: 0, returningPercentage: 0 },
    topCustomers: [],
  },
  onDateRangeChange,
  onGroupByChange,
  onExportExcel,
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Day');

  const handleQuickDate = (type) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'thisMonth') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (type === 'lastMonth') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (type === 'thisYear') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    }

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    setStartDate(startStr);
    setEndDate(endStr);

    if (onDateRangeChange) {
      onDateRangeChange(startStr, endStr);
    }
  };

  const handleCustomDateChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    if (onDateRangeChange && start && end) {
      onDateRangeChange(start, end);
    }
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    if (onGroupByChange) {
      onGroupByChange(group);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 text-slate-800 font-sans -m-6">
      
      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Analitika Ve Hesabatlar</h1>
          <p className="text-xs md:text-sm text-slate-500">Biznesinizin performans gostericilerini izleyin</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs md:text-sm">
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleCustomDateChange(e.target.value, endDate)}
              className="bg-transparent text-slate-700 outline-none px-1"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleCustomDateChange(startDate, e.target.value)}
              className="bg-transparent text-slate-700 outline-none px-1"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => handleQuickDate('thisMonth')}
              className="px-2.5 py-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
            >
              Bu Ay
            </button>
            <button
              onClick={() => handleQuickDate('lastMonth')}
              className="px-2.5 py-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
            >
              Kecen Ay
            </button>
            <button
              onClick={() => handleQuickDate('thisYear')}
              className="px-2.5 py-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
            >
              Bu Il
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Umumi Gelir</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{dashboardSummary.totalRevenue.toLocaleString()} AZN</span>
            <span className={"text-xs font-bold px-2 py-0.5 rounded-full flex items-center " + (dashboardSummary.revenueGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
              {dashboardSummary.revenueGrowth >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
              {Math.abs(dashboardSummary.revenueGrowth)}%
            </span>
          </div>
          <p className="text-xs text-slate-400">Oten dovrle muqayisede</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Umumi Rezervasiya</span>
          <div className="text-2xl font-extrabold text-slate-900">{dashboardSummary.totalReservations}</div>
          <p className="text-xs text-slate-400">Umumi ugurlu bronlar</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Musteri Sayi</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{dashboardSummary.customerCount}</span>
            <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
              +{dashboardSummary.newCustomersThisMonth} bu ay
            </span>
          </div>
          <p className="text-xs text-slate-400">Aktiv musteri bazasi</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Orta Reytinq</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{dashboardSummary.averageRating}</span>
            <div className="flex items-center">
              <StarIcon />
            </div>
          </div>
          <p className="text-xs text-slate-400">Musteri reyleri esasinda</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Gelir Qrafiki</h2>
            <p className="text-xs text-slate-400">Dovrler uzre gelir dinamikasi</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              {[
                { label: 'Gun', value: 'Day' },
                { label: 'Hefte', value: 'Week' },
                { label: 'Ay', value: 'Month' },
                { label: 'Il', value: 'Year' }
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleGroupSelect(item.value)}
                  className={"px-3 py-1.5 rounded-lg transition " + (selectedGroup === item.value ? 'bg-white text-indigo-600 shadow-sm' : 'hover:text-slate-900')}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={onExportExcel}
              className="flex items-center text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl transition shadow-sm cursor-pointer"
            >
              <DownloadIcon />
              Excel-e Ixrac Et
            </button>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueReport.points}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A227" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#C9A227" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
              <Tooltip formatter={(value) => [value + ' AZN', 'Gelir']} />
              <Area type="monotone" dataKey="amount" stroke="#C9A227" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Rezervasiya Statusu</h2>
            <p className="text-xs text-slate-400">Bronlarin statuslar uzre paylanmasi</p>
          </div>
          <div className="h-64 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reservationStats.statusStats}
                  dataKey="value"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                >
                  {reservationStats.statusStats.map((entry, index) => (
                    <Cell key={"cell-" + index} fill={entry.color || '#3B82F6'} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [val + ' eded', 'Say']} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Peak Saatlar</h2>
            <p className="text-xs text-slate-400">Gun erzinde en cox rezervasiya olunan saatlar</p>
          </div>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reservationStats.peekHours}>
                <XAxis dataKey="hour" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip formatter={(val) => [val + ' rezervasiya', 'Say']} />
                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between lg:col-span-1">
          <div>
            <h2 className="text-base font-bold text-slate-900">Heftelik Yuklenme</h2>
            <p className="text-xs text-slate-400">Heftenin gunlerine gore intensivlik</p>
          </div>
          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loadByWeekday}>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip formatter={(val) => [val + ' musteri', 'Yuklenme']} />
                <Bar dataKey="count" fill="#B8935A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <h2 className="text-base font-bold text-slate-900 mb-4">Populyar Xidmetler ve Salonlar (Top 5)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Xidmetler</h3>
              {topServices.map((service, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>{service.name}</span>
                    <span className="text-slate-400">{service.count} br ({service.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#C9A227] h-full rounded-full transition-all duration-500" style={{ width: service.percentage + '%' }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Salonlar</h3>
              {topSalons.map((salon, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>{salon.name}</span>
                    <span className="text-slate-400">{salon.count} br ({salon.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: salon.percentage + '%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="space-y-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Musteri Nisbeti</h2>
            <p className="text-xs text-slate-400">Yeni ve davamli musterilerin xususi cekisi</p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-indigo-600">Yeni ({customerAnalytics.newVsReturning.newPercentage}%)</span>
              <span className="text-emerald-600">Qayidan ({customerAnalytics.newVsReturning.returningPercentage}%)</span>
            </div>

            <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden">
              <div
                className="bg-indigo-500 h-full"
                style={{ width: customerAnalytics.newVsReturning.newPercentage + '%' }}
              ></div>
              <div
                className="bg-emerald-500 h-full"
                style={{ width: customerAnalytics.newVsReturning.returningPercentage + '%' }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center pt-2">
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="block text-xs text-slate-400">Yeni Musteriler</span>
                <span className="text-sm font-bold text-slate-800">{customerAnalytics.newVsReturning.newCount}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="block text-xs text-slate-400">Qayidan Musteriler</span>
                <span className="text-sm font-bold text-slate-800">{customerAnalytics.newVsReturning.returningCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-base font-bold text-slate-900">Top 5 Musteri</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-2">Musteri</th>
                  <th className="pb-2">Rezervasiya Sayi</th>
                  <th className="pb-2 text-right">Xerclenen Meblegh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {customerAnalytics.topCustomers.map((cust, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 font-medium text-slate-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs">
                        {cust.name.charAt(0)}
                      </div>
                      {cust.name}
                    </td>
                    <td className="py-2.5 text-slate-600">{cust.reservationCount} defe</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">{cust.totalSpent.toLocaleString()} AZN</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
