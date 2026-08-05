import React from 'react';
import {
  Building2,
  Scissors,
  Star,
  Users,
  ArrowRight,
  Calendar,
  DollarSign,
  UserCheck,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const HomeStatsSection = ({ stats = { salonCount: 0, employeeCount: 0, avgRating: 0, customerCount: 0 } }) => {
  const { t } = useLanguage();
  const statItems = [
    {
      label: t("home_stats_active_salons"),
      value: stats.salonCount,
      icon: <Building2 className="w-8 h-8 text-[#FAF6F0]" strokeWidth={1.5} />,
      gradient: "from-[#C9A227] to-[#B8935A]"
    },
    {
      label: t("home_stats_professional_masters"),
      value: stats.employeeCount,
      icon: <Scissors className="w-8 h-8 text-[#FAF6F0]" strokeWidth={1.5} />,
      gradient: "from-[#1A1714] to-[#2c2823]"
    },
    {
      label: t("home_stats_avg_rating"),
      value: stats.avgRating,
      icon: <Star className="w-8 h-8 text-[#FAF6F0]" strokeWidth={1.5} />,
      gradient: "from-[#C9A227] to-[#B8935A]"
    },
    {
      label: t("home_stats_happy_customers"),
      value: stats.customerCount,
      icon: <Users className="w-8 h-8 text-[#FAF6F0]" strokeWidth={1.5} />,
      gradient: "from-[#1A1714] to-[#2c2823]"
    }
  ];

  return (
    <section className="py-10 bg-[#1A1714] relative overflow-hidden font-sans rounded-3xl max-w-[1400px] mx-auto">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C9A227] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>

      <div className="mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statItems.map((item, index) => (
            <div
              key={index}
              className="group relative bg-[#FAF6F0]/5 backdrop-blur-sm border border-[#C9A227]/20 rounded-xl p-4 hover:-translate-y-1 transition-all duration-500 hover:shadow-[0_0_20px_rgba(201,162,39,0.15)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${item.gradient} shadow-lg mb-3 group-hover:scale-110 transition-transform duration-500`}>
                {item.icon}
              </div>

              <div className="text-xl font-light text-[#FAF6F0] mb-1 tracking-tight group-hover:text-[#C9A227] transition-colors duration-300">
                {item.value}
              </div>
              <div className="text-sm font-medium text-gray-400 tracking-wide uppercase">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const HomeCTASection = ({ onApplySpecialist, onApplySalon, onlySalon = false }) => {
  const { t } = useLanguage();
  return (
    <section className="py-10 font-sans">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className={onlySalon ? "grid grid-cols-1 gap-5" : "grid grid-cols-1 lg:grid-cols-2 gap-5"}>

          {!onlySalon && (
          <div className="group relative overflow-hidden rounded-2xl bg-[#1A1714] p-6 md:p-7 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-[#C9A227]/20 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150"></div>

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-xl flex items-center justify-center mb-4 text-[#C9A227]">
                  <Scissors className="w-5 h-5" strokeWidth={1.5} />
                </div>

                <h3 className="text-lg md:text-xl font-light text-[#FAF6F0] mb-2 tracking-wide">
                  {t("home_cta_specialist_title_1")} <span className="font-medium text-[#C9A227]">{t("home_cta_specialist_title_2")}</span>
                </h3>

                <p className="text-gray-400 text-xs font-light leading-relaxed mb-5 max-w-md">
                  {t("home_cta_specialist_desc")}
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2.5 text-[#FAF6F0]">
                    <div className="w-7 h-7 rounded-full bg-[#FAF6F0]/5 flex items-center justify-center text-[#C9A227]">
                      <UserCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-light tracking-wide">{t("home_cta_feature_portfolio")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#FAF6F0]">
                    <div className="w-7 h-7 rounded-full bg-[#FAF6F0]/5 flex items-center justify-center text-[#C9A227]">
                      <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-light tracking-wide">{t("home_cta_feature_schedule")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#FAF6F0]">
                    <div className="w-7 h-7 rounded-full bg-[#FAF6F0]/5 flex items-center justify-center text-[#C9A227]">
                      <DollarSign className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-light tracking-wide">{t("home_cta_feature_earnings")}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onApplySpecialist}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#C9A227] text-white px-5 py-2.5 rounded-lg hover:bg-[#B8935A] transition-all duration-300 font-medium text-sm group/btn"
              >
                <span className="tracking-wide">{t("home_cta_specialist_btn")}</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
          )}

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#D4AF37] via-[#AA8232] to-[#6E5223] border border-white/20 shadow-xl p-6 md:p-7 hover:shadow-[0_20px_40px_rgba(110,82,35,0.3)] transition-all duration-500 hover:-translate-y-1">
            <div className="absolute -top-20 -left-20 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150"></div>

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 bg-white/15 border border-white/30 rounded-xl flex items-center justify-center mb-4 text-white shadow-sm">
                  <Building2 className="w-5 h-5" strokeWidth={1.5} />
                </div>

                <h3 className="text-lg md:text-xl font-light text-white mb-2 tracking-wide">
                  {t("home_cta_salon_title_1")} <span className="font-medium text-[#1A1714]">{t("home_cta_salon_title_2")}</span>
                </h3>

                <p className="text-white/80 text-xs font-light leading-relaxed mb-5 max-w-md">
                  {t("home_cta_salon_desc")}
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2.5 text-white">
                    <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white shadow-sm">
                      <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-light tracking-wide">{t("home_cta_feature_customers")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-white">
                    <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white shadow-sm">
                      <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-light tracking-wide">{t("home_cta_feature_analytics")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-white">
                    <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-light tracking-wide">{t("home_cta_feature_premium")}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onApplySalon}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1A1714] text-white px-5 py-2.5 rounded-lg hover:bg-[#2c2823] transition-all duration-300 font-medium text-sm group/btn shadow-md"
              >
                <span className="tracking-wide">{t("home_cta_salon_btn")}</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};



