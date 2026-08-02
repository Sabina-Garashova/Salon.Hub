import React, { useRef, useState } from 'react';
import { Sparkles, ScanFace, Upload } from 'lucide-react';

export default function AIStyleRecommendationIdle({
  title = "AI ilə Sizə Uyğun Görünüşü Tapın",
  subtitle = "Süni intellekt üz formanızı analiz edib, sizə ən yaraşan saç düzümü və makyaj tövsiyə edir!",
  uploadHint = "Selfinizi yükləyin",
  uploadButtonText = "Şəklinizi Yükləyin",
  onImageUpload
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  };

  return (
    <div className="w-full mb-10 flex flex-col md:flex-row rounded-[2.5rem] overflow-hidden shadow-[0_15px_50px_rgba(201,162,39,0.08)] bg-gradient-to-r from-[#F0E6D6] to-[#E3D3B8] border border-[#D9C6A3]">

      <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-[#C9A227]/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C9A227]/10 border border-[#C9A227]/20 mb-6">
            <Sparkles className="w-4 h-4 text-[#C9A227]" />
            <span className="text-xs font-semibold text-[#B8935A] tracking-wider uppercase">SalonHub AI</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-serif font-medium text-[#1A1714] leading-tight mb-4">
            {title}
          </h2>

          <p className="text-[#1A1714]/70 text-sm md:text-base leading-relaxed mb-8">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="w-full md:w-1/2 p-8 md:p-12 bg-white/30 backdrop-blur-md flex items-center justify-center border-t md:border-t-0 md:border-l border-[#D9C6A3]/60 relative">
        <div
          className={`relative w-full aspect-square max-w-[320px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all duration-400 ease-out cursor-pointer group ${
            isDragging
              ? "border-[#C9A227] bg-[#FDFBF7] shadow-[0_0_30px_rgba(201,162,39,0.15)] scale-[1.02]"
              : "border-[#E8DCC3] hover:border-[#C9A227] hover:bg-white hover:shadow-[0_10px_30px_rgba(201,162,39,0.08)]"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="absolute inset-x-8 top-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#C9A227]/40 to-transparent -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:animate-[scan_2s_ease-in-out_infinite]" />

          <div className="relative w-20 h-20 mb-5 rounded-2xl bg-gradient-to-br from-[#FDFBF7] to-[#F5EEDC] flex items-center justify-center shadow-sm border border-[#E8DCC3]/50 group-hover:scale-105 transition-transform duration-500">
            <ScanFace className="w-10 h-10 text-[#C9A227]" strokeWidth={1.2} />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
              <Upload className="w-4 h-4 text-[#B8935A]" strokeWidth={2} />
            </div>
          </div>

          <p className="text-[#1A1714] font-medium mb-2 text-center">
            {uploadHint}
          </p>
          <p className="text-[#1A1714]/50 text-xs mb-8 text-center">
            və ya şəkli bura sürükləyin
          </p>

          <button
            className="w-full relative overflow-hidden py-3.5 rounded-xl bg-[#1A1714] text-[#FDFBF7] text-sm font-medium tracking-wide shadow-lg hover:shadow-xl hover:bg-[#2A2622] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <span>{uploadButtonText}</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_2s_infinite]" />
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(-40px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(40px); opacity: 0; }
        }
      `}} />
    </div>
  );
}

