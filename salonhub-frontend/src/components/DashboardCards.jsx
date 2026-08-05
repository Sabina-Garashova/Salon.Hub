import React from 'react';
import { QrCode, Calendar, TrendingUp, ChevronRight, Wand2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const TodayAppointmentsTable = ({ appointments = [], onShowQr, role, onShowAll }) => {
  const { t } = useLanguage();
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

  const methodLabel = (method) => (method === 'Card' ? t("dc_pay_card") : method === 'Cash' ? t("dc_pay_cash") : method === 'LoyaltyPoints' ? t("dc_pay_loyalty") : method || '');

  const renderPayment = (appt) => {
    const raw = Number(appt.rawPrice ?? appt.price) || 0;
    const loyalty = Number(appt.loyaltyDiscountApplied) || 0;
    if (loyalty > 0 && loyalty < raw) {
      const remainder = (raw - loyalty).toFixed(2);
      return (
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-purple-700">{t("dc_pay_loyalty")}: {loyalty.toFixed(2)} AZN</span>
          <span className="text-[11px] text-[#6B5D45]">{methodLabel(appt.paymentMethod)}: {remainder} AZN</span>
        </div>
      );
    }
    if (loyalty > 0 && loyalty >= raw) {
      return <span className="text-[11px] font-semibold text-purple-700">{t("dc_pay_full_loyalty")}</span>;
    }
    return <span className="text-xs text-[#6B5D45]">{methodLabel(appt.paymentMethod)}</span>;
  };

  return (
    <div className="bg-gradient-to-br from-[#F6EAD3] via-[#F1E2C5] to-[#E9D5A8] rounded-2xl shadow-md border border-amber-300/30 p-6 font-sans flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-[#1A1714] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#C9A227]" />
          {t("dc_todays_appointments")}
        </h2>
        {onShowAll && (
          <button
            type="button"
            onClick={onShowAll}
            className="text-sm font-medium text-[#B8935A] hover:text-[#1A1714] transition-colors flex items-center gap-1 group"
          >
            {t("dc_view_all")}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      <div className="flex-grow flex flex-col">
        {appointments && appointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  {role !== "Customer" && <th className="pb-3 text-xs font-medium text-[#7A6A50] uppercase tracking-wider">{t("dc_customer")}</th>}
                  {role !== "Employee" && <th className="pb-3 text-xs font-medium text-[#7A6A50] uppercase tracking-wider">{t("dc_employee")}</th>}
                  <th className="pb-3 text-xs font-medium text-[#7A6A50] uppercase tracking-wider">{t("dc_service")}</th>
                  <th className="pb-3 text-xs font-medium text-[#7A6A50] uppercase tracking-wider">{t("dc_time")}</th>
                  <th className="pb-3 text-xs font-medium text-[#7A6A50] uppercase tracking-wider">{t("dc_price")}</th>
                  <th className="pb-3 text-xs font-medium text-[#7A6A50] uppercase tracking-wider">{t("dc_payment")}</th>
                  {role !== "SalonAdmin" && role !== "SuperAdmin" && (
                    <th className="pb-3 text-xs font-medium text-[#7A6A50] uppercase tracking-wider">{t("dc_look")}</th>
                  )}
                  <th className="pb-3 text-xs font-medium text-[#7A6A50] uppercase tracking-wider">{t("dc_status")}</th>
                  {role === "Customer" && <th className="pb-3 text-xs font-medium text-[#7A6A50] uppercase tracking-wider text-right">QR</th>}
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt, idx) => (
                  <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-[#FAF6F0]/50 transition-colors">
                    {role !== "Customer" && (
                      <td className="py-4 text-sm font-medium text-[#1A1714] whitespace-nowrap pr-4">
                        {appt.customerFullName || t("dc_customer")}
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
                      {renderPayment(appt)}
                    </td>
                    {role !== "SalonAdmin" && role !== "SuperAdmin" && (
                      <td className="py-4 whitespace-nowrap pr-4">
                        {(appt.currentPhotoUrl || appt.referenceImageUrl || appt.referenceImageUrl2) ? (
                          <div className="flex items-center -space-x-2">
                            {appt.currentPhotoUrl && (
                              <a href={appt.currentPhotoUrl} target="_blank" rel="noreferrer" title={t("dc_current_look")}>
                                <img src={appt.currentPhotoUrl} alt={t("dc_current_look")} className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm hover:z-10 hover:scale-125 transition-transform" />
                              </a>
                            )}
                            {appt.referenceImageUrl && (
                              <a href={appt.referenceImageUrl} target="_blank" rel="noreferrer" title={t("dc_desired_look")}>
                                <img src={appt.referenceImageUrl} alt={t("dc_desired_look")} className="w-8 h-8 rounded-full object-cover border-2 border-[#C9A227] shadow-sm hover:z-10 hover:scale-125 transition-transform" />
                              </a>
                            )}
                            {appt.referenceImageUrl2 && (
                              <a href={appt.referenceImageUrl2} target="_blank" rel="noreferrer" title={t("dc_desired_look_2")}>
                                <img src={appt.referenceImageUrl2} alt={t("dc_desired_look_2")} className="w-8 h-8 rounded-full object-cover border-2 border-[#C9A227] shadow-sm hover:z-10 hover:scale-125 transition-transform" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <Wand2 className="w-4 h-4 text-gray-200" />
                        )}
                      </td>
                    )}
                    <td className="py-4 whitespace-nowrap pr-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadge(appt.status)}`}>
                        {appt.status}
                      </span>
                    </td>
                    {role === "Customer" && (
                      <td className="py-4 whitespace-nowrap text-right pl-4">
                        <button
                          onClick={() => onShowQr && onShowQr(appt)}
                          className="p-1.5 text-[#7A6A50] hover:text-[#C9A227] hover:bg-[#FAF6F0] rounded-md transition-all outline-none"
                          title={t("dc_show_qr")}
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
            <p className="text-[#6B5D45] font-medium">{t("dc_no_reservations_today")}</p>
            <p className="text-sm text-[#7A6A50] mt-1">{t("dc_new_appointments_hint")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const TopServicesChart = ({ services = [] }) => {
  const { t } = useLanguage();
  return (
    <div className="bg-gradient-to-br from-[#F6EAD3] via-[#F1E2C5] to-[#E9D5A8] rounded-2xl shadow-md border border-amber-300/30 p-6 font-sans h-full">
      <div className="flex items-center gap-2 mb-8">
        <TrendingUp className="w-5 h-5 text-[#C9A227]" />
        <h2 className="text-xl font-medium text-[#1A1714]">{t("dc_top_services")}</h2>
      </div>

      <div className="space-y-6">
        {services && services.length > 0 ? (
          services.map((service, idx) => (
            <div key={idx} className="group">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#1A1714] group-hover:text-[#B8935A] transition-colors">
                  {service.name}
                </span>
                <span className="text-sm font-medium text-[#6B5D45]">
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
          <div className="py-8 text-center text-[#6B5D45] text-sm">
            {t("dc_not_enough_data")}
          </div>
        )}
      </div>
    </div>
  );
};


