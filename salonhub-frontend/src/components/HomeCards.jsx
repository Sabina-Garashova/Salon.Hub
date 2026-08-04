import React from 'react';
import { Star, MapPin, Phone, Calendar, Quote, ArrowRight, Building2, ChevronRight, Scissors, Crown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const SalonCard = ({ salon, onClick, onBook }) => {
  const { t } = useLanguage();
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer relative bg-gradient-to-br from-[#F6EAD3] via-[#F1E2C5] to-[#E9D5A8] rounded-3xl overflow-hidden shadow-[0_4px_18px_rgba(26,23,20,0.18)] hover:shadow-[0_20px_50px_rgba(26,23,20,0.28)] transition-all duration-500 border-2 border-[#FDF8ED] hover:border-[#C9A227]/40 flex flex-col h-full"
    >
      <div className="relative h-60 w-full overflow-hidden bg-gradient-to-br from-[#1A1714] to-[#2c2823]">
        {salon?.imageUrl ? (
          <img
            src={salon.imageUrl}
            alt={salon?.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F0]/20 to-transparent"></div>
        )}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
          <Star className="w-3.5 h-3.5 text-[#C9A227] fill-current" />
          <span className="text-[#1A1714] text-xs font-semibold">
            {salon?.averageRating?.toFixed(1) || '0.0'} <span className="text-[#1A1714]/50 font-normal">({salon?.reviewCount || 0})</span>
          </span>
        </div>
        {salon?.isMonthlyTopSalon && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-sm" title="Ayin en yaxsi salonu">
            <Crown className="w-4 h-4 text-[#C9A227] fill-[#C9A227]" />
          </div>
        )}
      </div>

      <div className="p-6 flex-grow flex flex-col bg-gradient-to-b from-[#F6EAD3] via-[#F1E2C5] to-[#E9D5A8] relative">
        <div className="absolute top-0 right-6 -translate-y-1/2 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#FAF6F0]">
          <Building2 className="w-5 h-5 text-[#B8935A]" />
        </div>

        <h3 className="text-xl font-serif font-medium text-[#1A1714] mb-4 pr-8 line-clamp-2 leading-tight">
          {salon?.name}
        </h3>

        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3 text-[#1A1714]/70 text-sm">
            <MapPin className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-relaxed">{salon?.address}</span>
          </div>
          <div className="flex items-center gap-3 text-[#1A1714]/70 text-sm">
            <Phone className="w-4 h-4 text-[#C9A227] shrink-0" />
            <span>{salon?.phoneNumber}</span>
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onBook?.(); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#1A1714] to-[#2A2622] text-[#FAF6F0] text-sm font-medium hover:shadow-lg hover:shadow-[#1A1714]/25 transition-all duration-300 group/btn"
          >
            <span>{t("home_book_now")}</span>
            <ChevronRight className="w-4 h-4 text-[#C9A227] group-hover/btn:translate-x-1.5 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const EmployeeCard = ({ employee, workPhotos = [] }) => {
  const { t } = useLanguage();
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="group bg-gradient-to-br from-[#F6EAD3] via-[#F1E2C5] to-[#E9D5A8] rounded-2xl p-6 text-center border-2 border-[#FDF8ED] shadow-[0_4px_18px_rgba(26,23,20,0.18)] hover:border-[#C9A227]/40 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
      <div className="relative inline-block mb-5">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#FAF6F0] group-hover:border-[#C9A227] transition-colors duration-500 p-1">
          {employee?.profileImageUrl ? (
            <img
              src={employee.profileImageUrl}
              alt={employee?.fullName}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full bg-[#FAF6F0] text-[#C9A227] rounded-full flex items-center justify-center font-serif text-2xl">
              {getInitials(employee?.fullName)}
            </div>
          )}
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#1A1714] text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 text-xs shadow-md">
          <Star className="w-3 h-3 text-[#C9A227] fill-[#C9A227]" />
          <span>{employee?.averageRating?.toFixed(1) || '0.0'}</span>
        </div>
      </div>

      <h4 className="font-serif text-lg text-[#1A1714] break-words leading-snug">{employee?.fullName}</h4>
      <p className="text-sm text-gray-500 font-sans mt-1">{employee?.specialty || t("home_professional_masters")}</p>
      {workPhotos.length > 0 && (
        <div className="flex gap-1.5 mt-3 justify-center">
          {workPhotos.slice(0, 3).map((url, idx) => (
            <img key={idx} src={url} alt="Is nomunesi" className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
          ))}
        </div>
      )}
    </div>
  );
};

export const NewsCard = ({ news, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group bg-gradient-to-br from-[#F6EAD3] via-[#F1E2C5] to-[#E9D5A8] rounded-2xl overflow-hidden border-2 border-[#FDF8ED] shadow-[0_4px_18px_rgba(26,23,20,0.18)] hover:shadow-lg transition-all duration-500 cursor-pointer flex flex-col h-full"
    >
      <div className="h-48 overflow-hidden relative bg-[#FAF6F0]">
        {news?.imageUrl && (
          <img
            src={news.imageUrl}
            alt={news?.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        )}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm text-sm text-[#1A1714] font-sans">
          <Calendar className="w-4 h-4 text-[#C9A227]" />
          {news?.date}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="font-serif text-xl text-[#1A1714] mb-3 leading-snug group-hover:text-[#C9A227] transition-colors line-clamp-2">
          {news?.title}
        </h3>
        <p className="text-gray-600 font-sans text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
          {news?.excerpt}
        </p>

        <div className="flex items-center gap-2 text-[#B8935A] font-medium text-sm mt-auto group-hover:text-[#1A1714] transition-colors">
          <span>Ətraflı oxu</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};

export const ReviewCard = ({ review }) => {
  return (
    <div className="bg-gradient-to-br from-[#F6EAD3] via-[#F1E2C5] to-[#E9D5A8] rounded-2xl p-8 relative border-2 border-[#FDF8ED] shadow-[0_4px_18px_rgba(26,23,20,0.18)] hover:border-[#C9A227]/40 hover:shadow-lg transition-all duration-500 h-full flex flex-col">
      <Quote className="absolute top-6 right-6 w-12 h-12 text-[#C9A227]/10 rotate-180" />

      <div className="flex gap-1 mb-6">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < (review?.rating || 0) ? 'text-[#C9A227] fill-[#C9A227]' : 'text-gray-300'}`}
          />
        ))}
      </div>

      <p className="text-[#1A1714]/80 font-sans italic text-base leading-relaxed mb-8 flex-grow relative z-10">
        "{review?.comment}"
      </p>

      <div className="mt-auto">
        <h4 className="font-serif text-lg text-[#1A1714]">{review?.customerName}</h4>
        <p className="text-sm text-[#B8935A] font-sans mt-0.5">{review?.salonName}</p>
      </div>
    </div>
  );
};


