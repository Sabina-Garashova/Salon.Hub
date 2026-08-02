import React from 'react';
import { Building2, TrendingUp, Users, ArrowRight, Sparkles } from 'lucide-react';
const SalonRegistrationCTA = ({ onApply }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#FAF6F0] border border-[#C9A227]/20 p-8 md:p-10 shadow-sm hover:shadow-md transition-all duration-300 w-full font-sans">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#C9A227]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="flex-1">
          <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 border border-[#C9A227]/20 text-[#C9A227]">
            <Building2 className="w-7 h-7" strokeWidth={1.5} />
          </div>

          <h3 className="text-2xl md:text-3xl font-medium text-[#1A1714] mb-3 tracking-wide">
            Sahibkarsınız? Öz Salonunuzu Açın
          </h3>

          <p className="text-gray-600 leading-relaxed mb-6 max-w-2xl font-light">
            SalonHub platformasında öz salonunuzu qeydiyyatdan keçirin, minlərlə müştəriyə çatın, tam idarəetmə sistemindən faydalanın. Biznesinizi növbəti səviyyəyə qaldırın.
          </p>
          <div className="flex flex-wrap gap-5 md:gap-8">
            <div className="flex items-center gap-2.5 text-[#1A1714]">
              <Users className="w-5 h-5 text-[#C9A227]" strokeWidth={1.5} />
              <span className="text-sm font-medium tracking-wide">Geniş Müştəri Bazası</span>
            </div>
            <div className="flex items-center gap-2.5 text-[#1A1714]">
              <TrendingUp className="w-5 h-5 text-[#C9A227]" strokeWidth={1.5} />
              <span className="text-sm font-medium tracking-wide">Asan İdarəetmə</span>
            </div>
            <div className="flex items-center gap-2.5 text-[#1A1714]">
              <Sparkles className="w-5 h-5 text-[#C9A227]" strokeWidth={1.5} />
              <span className="text-sm font-medium tracking-wide">Premium Xidmət</span>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-auto shrink-0 mt-4 lg:mt-0">
          <button
            onClick={onApply}
            className="w-full lg:w-auto flex items-center justify-center gap-3 bg-[#1A1714] text-white px-8 py-4 rounded-xl hover:bg-[#2c2823] active:scale-95 transition-all duration-300 font-medium group shadow-md"
          >
            <span className="tracking-wide">Salon Müraciəti Göndər</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default SalonRegistrationCTA;
