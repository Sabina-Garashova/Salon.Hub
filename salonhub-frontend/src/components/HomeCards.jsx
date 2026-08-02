import React from 'react';
import { Star, MapPin, Phone, Calendar, Quote, ArrowRight } from 'lucide-react';

export const SalonCard = ({ salon, onClick, onBook }) => {
  return (
    <div
      onClick={onClick}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-[0_15px_35px_rgba(26,23,20,0.08)] transition-all duration-500 cursor-pointer h-full"
    >
      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-[#1A1714] to-[#2c2823]">
        {salon?.imageUrl ? (
          <img
            src={salon.imageUrl}
            alt={salon?.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F0]/20 to-transparent"></div>
        )}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
          <Star className="w-4 h-4 text-[#C9A227] fill-[#C9A227]" />
          <span className="text-sm font-medium text-[#1A1714]">{salon?.averageRating?.toFixed(1) || '0.0'}</span>
          <span className="text-xs text-gray-500">({salon?.reviewCount || 0})</span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="font-serif text-2xl text-[#1A1714] mb-4 group-hover:text-[#C9A227] transition-colors">{salon?.name}</h3>

        <div className="space-y-3 mb-8 flex-grow">
          <div className="flex items-start gap-3 text-gray-600">
            <MapPin className="w-4.5 h-4.5 text-[#B8935A] shrink-0 mt-0.5" />
            <span className="text-sm font-sans leading-relaxed">{salon?.address}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Phone className="w-4.5 h-4.5 text-[#B8935A] shrink-0" />
            <span className="text-sm font-sans">{salon?.phoneNumber}</span>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onBook?.(); }}
          className="w-full py-3.5 bg-[#FAF6F0] text-[#1A1714] font-medium rounded-xl group-hover:bg-[#1A1714] group-hover:text-white transition-colors duration-300 shadow-sm"
        >
          Rezervasiya
        </button>
      </div>
    </div>
  );
};

export const EmployeeCard = ({ employee }) => {
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="group bg-white rounded-2xl p-6 text-center border border-gray-100 hover:border-[#C9A227]/30 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
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

      <h4 className="font-serif text-lg text-[#1A1714] truncate">{employee?.fullName}</h4>
      <p className="text-sm text-gray-500 font-sans mt-1">Peşəkar Usta</p>
    </div>
  );
};

export const NewsCard = ({ news, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-500 cursor-pointer flex flex-col h-full"
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
    <div className="bg-white rounded-2xl p-8 relative border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#C9A227]/30 transition-all duration-500 h-full flex flex-col">
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

