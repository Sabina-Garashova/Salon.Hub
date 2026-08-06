import { useState } from "react";
import { Shirt, Loader2, ShoppingBag } from "lucide-react";
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
  const [bookingService, setBookingService] = useState(null);

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
  };

  const bookService = (service) => {
    setBookingService(service);
    setShowBooking(true);
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
              <div className="border-l-2 border-[#C9A227] pl-4">
                <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t("outfit_match_hair")}</h4>
                <p className="text-[#F4EDE0] text-sm font-light leading-relaxed">{result.hairSuggestion}</p>
              </div>
              <div className="border-l-2 border-[#B8935A] pl-4">
                <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t("outfit_match_makeup")}</h4>
                <p className="text-[#F4EDE0] text-sm font-light leading-relaxed">{result.makeupSuggestion}</p>
              </div>
              <div className="border-l-2 border-[#C9A227] pl-4">
                <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t("outfit_match_manicure")}</h4>
                <p className="text-[#F4EDE0] text-sm font-light leading-relaxed">{result.manicureSuggestion}</p>
              </div>
            </div>

            {result.recommendedServices && result.recommendedServices.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xs text-[#F0D68A] uppercase tracking-wider mb-3">{t("outfit_match_bundle_label")}</h4>
                <div className="space-y-2">
                  {result.recommendedServices.map((sv) => (
                    <div
                      key={sv.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#1A1714]/60 border border-[#C9A227]/20"
                    >
                      <div>
                        <p className="text-[#F4EDE0] text-sm font-medium">{sv.name}</p>
                        <p className="text-gray-400 text-xs">{sv.categoryName} · {sv.price} AZN</p>
                      </div>
                      <button
                        onClick={() => bookService(sv)}
                        className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#C9A227] to-[#B8935A] text-[#1A1714] text-xs font-semibold flex items-center gap-1.5 hover:shadow-[0_4px_15px_rgba(201,162,39,0.4)] transition-shadow"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {t("outfit_match_book_btn")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={resetWidget}
                className="flex-1 py-3 px-4 rounded-xl border border-[#B8935A]/40 text-gray-300 text-sm hover:bg-[#B8935A]/10 hover:text-[#F4EDE0] transition-colors"
              >
                {t("style_try_again")}
              </button>
            </div>
          </div>
        )}
      </div>

      {showBooking && (
        <BookingModal
          isOpen={showBooking}
          onClose={() => { setShowBooking(false); setBookingService(null); }}
          salonId={salonId || 1}
          salonName=""
          initialServiceId={bookingService?.id}
          showAllSalons={true}
        />
      )}
    </div>
  );
}
