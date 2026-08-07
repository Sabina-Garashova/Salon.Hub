import { useState } from "react";
import { Shirt, Loader2, ZoomIn } from "lucide-react";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import BookingModal from "./BookingModal";
import AIStyleRecommendationIdle from "./AIStyleRecommendationIdle";

export default function OutfitMatchWidget({ salonId }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState("idle");
  const [selectedImage, setSelectedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [selectedInspirations, setSelectedInspirations] = useState([]);

  const toggleInspirationImage = (url) => {
    if (!url) return;
    setSelectedInspirations((prev) => {
      if (prev.includes(url)) return prev.filter((item) => item !== url);
      if (prev.length >= 2) return [prev[1], url];
      return [...prev, url];
    });
  };

  const processFile = (file) => {
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setStatus("loading");

    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result.split(",")[1];
      try {
        const res = await api.post("/OutfitMatch/analyze", {
          imageBase64: base64String,
          salonId: salonId || 1,
        });
        setResult(res.data);
        setStatus("result");
      } catch (err) {
        setStatus("error");
      }
    };
    reader.readAsDataURL(file);
  };

  const resetWidget = () => {
    setStatus("idle");
    setSelectedImage(null);
    setResult(null);
    setSelectedInspirations([]);
  };

  const getFinalInspirationImages = () => {
    if (selectedInspirations.length > 0) {
      return selectedInspirations;
    }
    const firstImg =
      result?.recommendedImages?.[0]?.imageUrl ||
      result?.recommendedImages?.[0]?.url ||
      (typeof result?.recommendedImages?.[0] === "string" ? result?.recommendedImages?.[0] : null);
    return firstImg ? [firstImg] : [];
  };

  if (status === "idle") {
    return (
      <AIStyleRecommendationIdle
        title={t("outfit_match_title")}
        subtitle={t("outfit_match_subtitle")}
        uploadHint={t("outfit_match_upload_hint")}
        uploadButtonText={t("outfit_match_upload_btn")}
        onImageUpload={processFile}
      />
    );
  }

  return (
    <div className="w-full mx-auto rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-gradient-to-br from-[#1A1714] to-[#2B2118] border border-[#B8935A]/20 font-sans mb-10">
      <div className="pt-8 px-6 pb-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1A1714] via-[#C9A227] to-[#1A1714] opacity-70"></div>
        <h2 className="text-2xl font-light text-[#F4EDE0] mb-2 flex items-center justify-center gap-2">
          <Shirt className="w-5 h-5 text-[#C9A227]" />
          {t("outfit_match_title")}
        </h2>
        <p className="text-sm text-gray-400 font-light">{t("outfit_match_subtitle")}</p>
      </div>

      <div className="px-6 pb-8">
        {status === "loading" && (
          <div className="mt-4 flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-10 h-10 text-[#C9A227] animate-spin mb-6" />
            <h3 className="text-[#F0D68A] text-lg font-light mb-2">{t("outfit_match_analyzing")}</h3>
            <p className="text-gray-400 text-sm">{t("outfit_match_analyzing_hint")}</p>
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 flex flex-col items-center justify-center py-10 text-center">
            <p className="text-red-300 text-sm mb-4">{t("outfit_match_error")}</p>
            <button onClick={resetWidget} className="px-5 py-2 rounded-full border border-[#B8935A]/40 text-gray-300 text-sm hover:bg-[#B8935A]/10">
              {t("style_try_again")}
            </button>
          </div>
        )}

        {status === "result" && result && (
          <div className="mt-2">
            <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-[#1A1714] border border-[#C9A227]/20 shadow-inner">
              <img src={selectedImage} alt="Uploaded outfit" className="w-16 h-16 rounded-xl object-cover shadow-md border border-[#B8935A]/30" />
              <div>
                <p className="text-xs text-[#C9A227] uppercase tracking-wider mb-1">{t("outfit_match_summary_label")}</p>
                <p className="text-[#F4EDE0] text-sm">{result.styleSummary}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {result.hairSuggestion && (
                <div className="border-l-2 border-[#C9A227] pl-4">
                  <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t("outfit_match_hair")}</h4>
                  <p className="text-[#F4EDE0] text-sm font-light leading-relaxed">{result.hairSuggestion}</p>
                </div>
              )}
              {result.makeupSuggestion && (
                <div className="border-l-2 border-[#B8935A] pl-4">
                  <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t("outfit_match_makeup")}</h4>
                  <p className="text-[#F4EDE0] text-sm font-light leading-relaxed">{result.makeupSuggestion}</p>
                </div>
              )}
              {result.manicureSuggestion && (
                <div className="border-l-2 border-[#C9A227] pl-4">
                  <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t("outfit_match_manicure")}</h4>
                  <p className="text-[#F4EDE0] text-sm font-light leading-relaxed">{result.manicureSuggestion}</p>
                </div>
              )}
            </div>

            {/* İLHAM ALIN QALEREYASI */}
            {result.recommendedImages && result.recommendedImages.length > 0 && (
              <div className="mb-8 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm text-[#C9A227] tracking-wider uppercase font-semibold">İLHAM ALIN</h4>
                  <span className="text-xs text-gray-400">{selectedInspirations.length}/2 seçildi</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pb-2">
                  {result.recommendedImages.map((img, idx) => {
                    const imgUrl = typeof img === "string" ? img : img.imageUrl || img.url;
                    if (!imgUrl) return null;
                    const isSelected = selectedInspirations.includes(imgUrl);

                    return (
                      <div
                        key={img.id || idx}
                        onClick={() => toggleInspirationImage(imgUrl)}
                        className={`relative group rounded-xl overflow-hidden cursor-pointer transition-all aspect-[3/4] ${
                          isSelected ? "ring-2 ring-[#C9A227]" : "border border-transparent hover:border-[#B8935A]/60"
                        }`}
                      >
                        <img 
                          src={imgUrl} 
                          alt={img.description || ""} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1714]/90 via-transparent to-transparent opacity-80"></div>
                        
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setLightboxImage(imgUrl); }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                          title="Böyüt"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>

                        {isSelected && (
                          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#C9A227] text-[#1A1714] flex items-center justify-center text-xs font-bold shadow-md">
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <p className="text-xs text-gray-400 mt-4 font-light">
                  Rezervasiyaya əlavə etmək üçün 1 və ya 2 şəkil seçin (seçməsəniz ilk şəkil istifadə olunacaq).
                </p>
              </div>
            )}

            {/* DÜYMƏLƏR */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={resetWidget}
                className="flex-1 py-4 px-4 rounded-xl border border-gray-600 text-gray-300 text-base font-medium hover:bg-white/5 transition-colors"
              >
                Yenidən Sına
              </button>
              
              <button
                onClick={() => setShowBooking(true)}
                className="flex-[2] py-4 px-4 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#B8935A] text-[#1A1714] text-base font-bold hover:shadow-[0_4px_20px_rgba(201,162,39,0.5)] transition-all"
              >
                Bu Stili Rezerv Et
              </button>
            </div>
          </div>
        )}
      </div>

      {showBooking && (
        <BookingModal
          isOpen={showBooking}
          onClose={() => setShowBooking(false)}
          salonId={salonId || 1}
          salonName=""
          showAllSalons={true}
          initialCurrentImage={selectedImage}
          initialDesiredImages={getFinalInspirationImages()}
        />
      )}

      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-2xl max-h-[90vh]">
            <img src={lightboxImage} alt="Enlarged" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
            <button className="absolute -top-10 right-0 text-white text-lg font-bold">✕ Bağla</button>
          </div>
        </div>
      )}
    </div>
  );
}
