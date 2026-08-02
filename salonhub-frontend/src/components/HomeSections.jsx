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

export const HomeStatsSection = ({ stats = { salonCount: 0, employeeCount: 0, avgRating: 0, customerCount: 0 } }) => {
  const statItems = [
    {
      label: "Aktiv Salonlar",
      value: stats.salonCount,
      icon: <Building2 className="w-8 h-8 text-[#FAF6F0]" strokeWidth={1.5} />,
      gradient: "from-[#C9A227] to-[#B8935A]"
    },
    {
      label: "Peşəkar Ustalar",
      value: stats.employeeCount,
      icon: <Scissors className="w-8 h-8 text-[#FAF6F0]" strokeWidth={1.5} />,
      gradient: "from-[#1A1714] to-[#2c2823]"
    },
    {
      label: "Orta Reytinq",
      value: stats.avgRating,
      icon: <Star className="w-8 h-8 text-[#FAF6F0]" strokeWidth={1.5} />,
      gradient: "from-[#C9A227] to-[#B8935A]"
    },
    {
      label: "Məmnun Müştəri",
      value: stats.customerCount,
      icon: <Users className="w-8 h-8 text-[#FAF6F0]" strokeWidth={1.5} />,
      gradient: "from-[#1A1714] to-[#2c2823]"
    }
  ];

  return (
    <section className="py-20 bg-[#1A1714] relative overflow-hidden font-sans rounded-3xl">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C9A227] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {statItems.map((item, index) => (
            <div
              key={index}
              className="group relative bg-[#FAF6F0]/5 backdrop-blur-sm border border-[#C9A227]/20 rounded-2xl p-8 hover:-translate-y-2 transition-all duration-500 hover:shadow-[0_0_30px_rgba(201,162,39,0.15)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

              <div className={`w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br ${item.gradient} shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500`}>
                {item.icon}
              </div>

              <div className="text-4xl font-light text-[#FAF6F0] mb-2 tracking-tight group-hover:text-[#C9A227] transition-colors duration-300">
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

export const HomeCTASection = ({ onApplySpecialist, onApplySalon }) => {
  return (
    <section className="py-10 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <div className="group relative overflow-hidden rounded-2xl bg-[#1A1714] p-6 md:p-7 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
            <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-[#C9A227]/20 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150"></div>

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-xl flex items-center justify-center mb-4 text-[#C9A227]">
                  <Scissors className="w-5 h-5" strokeWidth={1.5} />
                </div>

                <h3 className="text-lg md:text-xl font-light text-[#FAF6F0] mb-2 tracking-wide">
                  Ustasınız? <span className="font-medium text-[#C9A227]">Bizə Qoşulun</span>
                </h3>

                <p className="text-gray-400 text-xs font-light leading-relaxed mb-5 max-w-md">
                  Öz müştəri bazanızı yaradın, fərdi profilinizlə tanının və gəlirinizi asanlıqla idarə edin.
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2.5 text-[#FAF6F0]">
                    <div className="w-7 h-7 rounded-full bg-[#FAF6F0]/5 flex items-center justify-center text-[#C9A227]">
                      <UserCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-light tracking-wide">Fərdi portfel və profil</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#FAF6F0]">
                    <div className="w-7 h-7 rounded-full bg-[#FAF6F0]/5 flex items-center justify-center text-[#C9A227]">
                      <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-light tracking-wide">Rahat cədvəl idarəetməsi</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#FAF6F0]">
                    <div className="w-7 h-7 rounded-full bg-[#FAF6F0]/5 flex items-center justify-center text-[#C9A227]">
                      <DollarSign className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-light tracking-wide">Yüksək qazanc imkanı</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onApplySpecialist}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#C9A227] text-white px-5 py-2.5 rounded-lg hover:bg-[#B8935A] transition-all duration-300 font-medium text-sm group/btn"
              >
                <span className="tracking-wide">Usta Müraciəti Göndər</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-white border border-[#C9A227]/15 p-6 md:p-7 hover:shadow-[0_20px_40px_rgba(201,162,39,0.08)] transition-all duration-500 hover:-translate-y-1">
            <div className="absolute -top-20 -left-20 w-56 h-56 bg-[#C9A227]/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150"></div>

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 bg-[#FAF6F0] border border-[#C9A227]/20 rounded-xl flex items-center justify-center mb-4 text-[#C9A227] shadow-sm">
                  <Building2 className="w-5 h-5" strokeWidth={1.5} />
                </div>

                <h3 className="text-lg md:text-xl font-light text-[#1A1714] mb-2 tracking-wide">
                  Sahibkarsınız? <span className="font-medium text-[#C9A227]">Salon Açın</span>
                </h3>

                <p className="text-gray-600 text-xs font-light leading-relaxed mb-5 max-w-md">
                  SalonHub platformasında öz salonunuzu qeydiyyatdan keçirin, biznesinizi tam avtomatlaşdırın.
                </p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2.5 text-[#1A1714]">
                    <div className="w-7 h-7 rounded-full bg-[#FAF6F0] flex items-center justify-center text-[#C9A227] shadow-sm">
                      <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-light tracking-wide">Geniş müştəri bazası</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#1A1714]">
                    <div className="w-7 h-7 rounded-full bg-[#FAF6F0] flex items-center justify-center text-[#C9A227] shadow-sm">
                      <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-light tracking-wide">Asan idarəetmə və analitika</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#1A1714]">
                    <div className="w-7 h-7 rounded-full bg-[#FAF6F0] flex items-center justify-center text-[#C9A227] shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-light tracking-wide">Premium xidmət standartı</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onApplySalon}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1A1714] text-white px-5 py-2.5 rounded-lg hover:bg-[#2c2823] transition-all duration-300 font-medium text-sm group/btn shadow-md"
              >
                <span className="tracking-wide">Salon Müraciəti Göndər</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
