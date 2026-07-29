import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Award, 
  History, 
  ChevronDown, 
  ChevronUp, 
  Gift, 
  ArrowRightLeft, 
  Sparkles, 
  Calendar,
  PlusCircle,
  MinusCircle,
  X,
  CreditCard
} from 'lucide-react';

export default function LoyaltyProgram({ 
  balances = [], 
  history = [], 
  expandedSalonId = null, 
  onViewHistory = () => {}, 
  onRedeem = () => {},
  isLoading = false,
  onBookNow = () => {},
  reservations = []
}) {
  const { t, language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [selectedReservationId, setSelectedReservationId] = useState('');

  const openRedeemModal = (salon) => {
    setSelectedSalon(salon);
    setPointsToRedeem(Math.min(salon.points, 10));
    setSelectedReservationId('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSalon(null);
    setPointsToRedeem(0);
  };

  const calculateAznEquivalent = (salon, points) => {
    if (!salon || salon.points === 0) return 0;
    const rate = salon.equivalentDiscount / salon.points;
    return (points * rate).toFixed(2);
  };

  const handleRedeemSubmit = () => {
    if (!selectedSalon) return;
    if (!selectedReservationId) { alert(t("lp_select_reservation_alert")); return; }
    const aznAmount = calculateAznEquivalent(selectedSalon, pointsToRedeem);
    onRedeem(selectedSalon.salonId, parseFloat(aznAmount), selectedReservationId);
    closeModal();
  };

  const salonReservations = selectedSalon
    ? reservations.filter((r) => r.salonId === selectedSalon.salonId && (r.status === 'Pending' || r.status === 'Confirmed'))
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] p-4 md:p-8 font-sans">
        <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!balances || balances.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-[#B8935A]/20 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#FAF6F0] text-[#C9A227] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#B8935A]/10">
            <Gift className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-[#1A1714] mb-3">
            {t("lp_no_points_title")}
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {t("lp_no_points_desc")}
          </p>
          <button 
            onClick={onBookNow}
            className="w-full bg-[#1A1714] text-[#F0D68A] hover:bg-[#2A2420] transition-colors py-3 rounded-xl font-medium tracking-wide shadow-md flex items-center justify-center gap-2 group"
          >
            <span>{t("lp_first_booking")}</span>
            <Sparkles className="w-4 h-4 text-[#C9A227] group-hover:animate-spin" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] p-4 md:p-8 font-sans text-[#1A1714]">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-10 text-center md:text-left">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#B8935A] bg-[#B8935A]/10 px-3 py-1 rounded-full">
            SalonHub Privilege
          </span>
          <h1 className="text-3xl md:text-4xl font-bold font-serif mt-3 tracking-wide text-[#1A1714]">
            {t("lp_program_title")}
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-xl">
            {t("lp_program_sub")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {balances.map((salon) => {
            const isExpanded = expandedSalonId === salon.salonId;
            
            return (
              <div 
                key={salon.salonId} 
                className="flex flex-col bg-white rounded-2xl border border-[#B8935A]/20 shadow-md hover:shadow-lg transition-all overflow-hidden duration-300"
              >
                <div className="relative p-6 bg-gradient-to-br from-[#1A1714] via-[#2D2622] to-[#1A1714] text-white overflow-hidden group">
                  <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-[#C9A227]/10 rounded-full blur-2xl group-hover:bg-[#C9A227]/20 transition-all duration-500"></div>
                  <div className="absolute left-[-40px] bottom-[-40px] w-40 h-40 bg-[#B8935A]/5 rounded-full blur-xl"></div>
                  
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#FAF6F0]/10 rounded-lg backdrop-blur-sm border border-[#F0D68A]/20">
                        <Award className="w-5 h-5 text-[#F0D68A]" />
                      </div>
                      <span className="text-xs tracking-wider font-medium text-[#F0D68A] uppercase">SalonHub Membership</span>
                    </div>
                    <div className="w-8 h-6 bg-gradient-to-r from-[#F0D68A]/30 to-[#B8935A]/40 rounded-md border border-[#F0D68A]/30 flex items-center justify-between px-1 opacity-80">
                      <CreditCard className="w-4 h-4 text-[#F0D68A]/40 mx-auto" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold font-serif tracking-wide line-clamp-1 mb-6 relative z-10 text-white group-hover:text-[#F0D68A] transition-colors">
                    {salon.salonName}
                  </h3>

                  <div className="flex items-baseline gap-2 mb-4 relative z-10">
                    <span className="text-4xl font-extrabold font-serif tracking-tight text-[#F0D68A]">
                      {salon.points}
                    </span>
                    <span className="text-xs text-gray-300 uppercase font-medium tracking-widest">{t("lp_points_label")}</span>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-300 relative z-10">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-[#B8935A]" /> {t("lp_equivalent_discount")}
                    </span>
                    <span className="font-bold text-[#F0D68A] text-sm">
                      {salon.equivalentDiscount.toFixed(2)} AZN
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3">
                  <button
                    onClick={() => openRedeemModal(salon)}
                    disabled={salon.points <= 0}
                    className={"flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all tracking-wide text-center uppercase " + (
                      salon.points > 0
                        ? 'bg-[#C9A227] text-white hover:bg-[#B8935A] shadow-sm'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    {t("lp_use_points")}
                  </button>

                  <button
                    onClick={() => onViewHistory(salon.salonId)}
                    className={"p-2.5 rounded-xl border transition-all flex items-center justify-center gap-1 text-xs font-medium " + (
                      isExpanded
                        ? 'bg-[#1A1714] border-[#1A1714] text-[#F0D68A]'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-[#FAF6F0]'
                    )}
                    title={t("lp_history_tooltip")}
                  >
                    <History className="w-4 h-4" />
                    <span>{isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</span>
                  </button>
                </div>

                {isExpanded && (
                  <div className="bg-[#FAF6F0]/50 border-t border-gray-100 p-5 max-h-[280px] overflow-y-auto transition-all duration-300">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" /> {t("lp_history_title")}
                    </h4>
                    
                    {history && history.length > 0 ? (
                      <div className="relative border-l border-[#B8935A]/30 ml-2 space-y-5">
                        {history.map((item, idx) => (
                          <div key={idx} className="relative pl-5 group/item">
                            <div className={"absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full border transition-transform group-hover/item:scale-125 " + (
                              item.type === 'Earned' 
                                ? 'bg-emerald-500 border-white ring-2 ring-emerald-100' 
                                : 'bg-red-500 border-white ring-2 ring-red-100'
                            )} />
                            
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-gray-800 line-clamp-1">
                                  {item.description || (item.type === 'Earned' ? t("lp_earned") : t("lp_spent"))}
                                </span>
                                <span className={"text-xs font-bold whitespace-nowrap " + (
                                  item.type === 'Earned' ? 'text-emerald-600' : 'text-red-600'
                                )}>
                                  {item.type === 'Earned' ? '+' + item.points : '-' + item.points} {t("lp_points_suffix")}
                                </span>
                              </div>
                              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> 
                                {new Date(item.createdAt).toLocaleDateString((language === "en" ? "en-US" : language === "ru" ? "ru-RU" : "az-AZ"), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-center text-gray-400 py-4 italic">{t("lp_no_history")}</p>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>

        {isModalOpen && selectedSalon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1714]/60 backdrop-blur-sm transition-opacity duration-300">
            <div className="relative w-full max-w-md bg-white border border-[#B8935A]/30 rounded-2xl p-6 shadow-2xl">
              
              <button 
                onClick={closeModal}
                className="absolute right-4 top-4 p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-bold font-serif text-[#1A1714] pr-6">
                  {t("lp_convert_title")}
                </h3>
                <p className="text-xs text-[#B8935A] mt-1 font-medium">{selectedSalon.salonName}</p>
              </div>

              <div className="bg-[#FAF6F0] rounded-xl p-4 border border-gray-100 flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-gray-400">{t("lp_current_balance")}</p>
                  <p className="text-xl font-black font-serif text-[#1A1714] mt-0.5">{selectedSalon.points} {t("lp_points_suffix")}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{t("lp_max_discount")}</p>
                  <p className="text-base font-bold text-emerald-600 mt-1">{selectedSalon.equivalentDiscount.toFixed(2)} AZN</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">{t("lp_which_reservation")}</label>
                {salonReservations.length === 0 ? (
                  <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg">{t("lp_no_pending")}</p>
                ) : (
                  <select
                    value={selectedReservationId}
                    onChange={(e) => setSelectedReservationId(e.target.value)}
                    className="w-full text-sm p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                  >
                    <option value="">{t("lp_select_reservation")}</option>
                    {salonReservations.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.serviceName} - {r.reservationDate?.split("T")[0]} {r.startTime?.slice(0,5)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t("lp_points_to_use")}</label>
                  <span className="text-sm font-bold bg-[#1A1714] text-[#F0D68A] px-2.5 py-1 rounded-lg">
                    {pointsToRedeem} {t("lp_points_suffix")}
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max={selectedSalon.points}
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(parseInt(e.target.value) || 0)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#C9A227]"
                />

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setPointsToRedeem(prev => Math.max(1, prev - 5))}
                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    title="-5 bal"
                  >
                    <MinusCircle className="w-4 h-4" />
                  </button>
                  
                  <div className="flex-1 bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 text-center">
                    <p className="text-[11px] text-gray-500 font-medium">{t("lp_discount_amount")}</p>
                    <p className="text-lg font-black text-[#C9A227] mt-0.5">
                      {calculateAznEquivalent(selectedSalon, pointsToRedeem)} AZN
                    </p>
                  </div>

                  <button
                    onClick={() => setPointsToRedeem(prev => Math.min(selectedSalon.points, prev + 5))}
                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    title="+5 bal"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors text-center"
                >{t("btn_cancel")}</button>
                <button
                  onClick={handleRedeemSubmit}
                  disabled={pointsToRedeem <= 0}
                  className="flex-1 py-3 px-4 bg-[#1A1714] text-[#F0D68A] font-bold rounded-xl text-sm hover:bg-[#2A2420] transition-colors text-center shadow-md shadow-black/10"
                >
                  {t("lp_confirm_convert")}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}


