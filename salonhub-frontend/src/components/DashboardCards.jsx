import React from 'react';
import { QrCode, Calendar, TrendingUp, ChevronRight } from 'lucide-react';

export const TodayAppointmentsTable = ({ appointments = [], onShowQr, role }) => {
  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === 'tamamlanıb' || s === 'tamamlandı') {
      return 'bg-green-50 text-green-600 border-green-200';
    }
    if (s === 'ləğv edilib' || s === 'ləğv edildi') {
      return 'bg-red-50 text-red-600 border-red-200';
    }
    return 'bg-[#FAF6F0] text-[#B8935A] border-[#C9A227]/30';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 font-sans flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-[#1A1714] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#C9A227]" />
          Bugünkü Görüşlər
        </h2>
        <a
          href="#"
          className="text-sm font-medium text-[#B8935A] hover:text-[#1A1714] transition-colors flex items-center gap-1 group"
        >
          Hamısına bax
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      <div className="flex-grow flex flex-col">
        {appointments && appointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  {role !== "Customer" && <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Müştəri</th>}
                  {role !== "Employee" && <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Usta</th>}
                  <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Xidmət</th>
                  <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Saat</th>
                  <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Qiymət</th>
                  <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  {role === "Customer" && <th className="pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">QR</th>}
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt, idx) => (
                  <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-[#FAF6F0]/50 transition-colors">
                    {role !== "Customer" && (
                      <td className="py-4 text-sm font-medium text-[#1A1714] whitespace-nowrap pr-4">
                        {appt.customerFullName || "Müştəri"}
                      </td>
                    )}
                    {role !== "Employee" && (
                      <td className="py-4 text-sm text-gray-600 whitespace-nowrap pr-4">
                        {appt.employeeName}
                      </td>
                    )}
                    <td className="py-4 text-sm text-gray-600 whitespace-nowrap pr-4">
                      {appt.serviceName}
                    </td>
                    <td className="py-4 text-sm text-[#1A1714] font-medium whitespace-nowrap pr-4">
                      {appt.time}
                    </td>
                    <td className="py-4 text-sm text-gray-600 whitespace-nowrap pr-4">
                      {appt.price}
                    </td>
                    <td className="py-4 whitespace-nowrap pr-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadge(appt.status)}`}>
                        {appt.status}
                      </span>
                    </td>
                    {role === "Customer" && (
                      <td className="py-4 whitespace-nowrap text-right pl-4">
                        <button
                          onClick={() => onShowQr && onShowQr(appt)}
                          className="p-1.5 text-gray-400 hover:text-[#C9A227] hover:bg-[#FAF6F0] rounded-md transition-all outline-none"
                          title="QR Kodu Göstər"
                        >
                          <QrCode className="w-5 h-5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-[#FAF6F0] rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-[#C9A227]/50" strokeWidth={1.5} />
            </div>
            <p className="text-gray-500 font-medium">Bu gün üçün rezervasiya yoxdur</p>
            <p className="text-sm text-gray-400 mt-1">Yeni görüşlər əlavə edildikdə burada görünəcək.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const TopServicesChart = ({ services = [] }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 font-sans h-full">
      <div className="flex items-center gap-2 mb-8">
        <TrendingUp className="w-5 h-5 text-[#C9A227]" />
        <h2 className="text-xl font-medium text-[#1A1714]">Ən Çox Tələb Olunan Xidmətlər</h2>
      </div>

      <div className="space-y-6">
        {services && services.length > 0 ? (
          services.map((service, idx) => (
            <div key={idx} className="group">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#1A1714] group-hover:text-[#B8935A] transition-colors">
                  {service.name}
                </span>
                <span className="text-sm font-medium text-gray-500">
                  {service.percentage}%
                </span>
              </div>
              <div className="w-full bg-[#FAF6F0] rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#C9A227] to-[#B8935A] h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${service.percentage}%` }}
                ></div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500 text-sm">
            Kifayət qədər məlumat yoxdur
          </div>
        )}
      </div>
    </div>
  );
};


