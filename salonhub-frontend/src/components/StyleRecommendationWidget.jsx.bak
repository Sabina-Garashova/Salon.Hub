import { useState, useEffect } from "react";
import { Sparkles, Upload, Loader2, RefreshCw, Wand2, ZoomIn } from "lucide-react";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import BookingModal from "./BookingModal";
import AIStyleRecommendationIdle from "./AIStyleRecommendationIdle";

// Virtual Try-On, Gemini-nin öz billing/kredit balansını tələb edir. Kredit yüklənənə qədər
// bu funksiya deaktivdir (gizlədilib) — kredit alınandan sonra bunu true edin, kifayətdir.
const TRY_ON_ENABLED = false;

function BeforeAfterSlider({ beforeSrc, afterSrc, t }) {
  const [percent, setPercent] = useState(50);
  return (
    <div className="relative w-full aspect-square rounded-2xl overflow-hidden select-none border border-[#B8935A]/30 bg-black/20">
      <img src={afterSrc} alt="after" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <img
        src={beforeSrc}
        alt="before"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
      />
      <div className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-[0_0_6px_rgba(0,0,0,0.5)] pointer-events-none" style={{ left: `${percent}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-[#1A1714]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l-4 5 4 5m8-10l4 5-4 5" /></svg>
        </div>
      </div>
      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold uppercase tracking-wide pointer-events-none">{t("style_before")}</span>
      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#C9A227] text-[#1A1714] text-[10px] font-bold uppercase tracking-wide pointer-events-none">{t("style_after")}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={percent}
        onChange={(e) => setPercent(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
      />
    </div>
  );
}

export default function StyleRecommendationWidget({ salonId }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState("idle");
  const [selectedImage, setSelectedImage] = useState(null);
  const [originalBase64, setOriginalBase64] = useState(null);
  const [result, setResult] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [selectedInspirationIds, setSelectedInspirationIds] = useState([]);
  const [tryOnMap, setTryOnMap] = useState({});
  const [activeTryOnKeyword, setActiveTryOnKeyword] = useState(null);

  const toggleInspirationImage = (img) => {
    setSelectedInspirationIds((prev) => {
      if (prev.includes(img.id)) return prev.filter((id) => id !== img.id);
      if (prev.length >= 2) return [prev[1], img.id];
      return [...prev, img.id];
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file) => {
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setStatus("loading");

    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result.split(",")[1];
      setOriginalBase64(base64String);
      try {
        const res = await api.post("/StyleRecommendation/analyze", {
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
    setOriginalBase64(null);
    setResult(null);
    setSelectedInspirationIds([]);
    setTryOnMap({});
    setActiveTryOnKeyword(null);
  };

  const generateTryOn = async (keyword) => {
    if (!originalBase64) return;
    setTryOnMap((prev) => ({ ...prev, [keyword]: { status: "loading" } }));
    setActiveTryOnKeyword(keyword);
    try {
      const res = await api.post("/StyleRecommendation/try-on", {
        imageBase64: originalBase64,
        styleDescription: keyword,
      });
      const dataUrl = `data:${res.data.mimeType || "image/png"};base64,${res.data.generatedImageBase64}`;
      setTryOnMap((prev) => ({ ...prev, [keyword]: { status: "done", imageDataUrl: dataUrl } }));
    } catch (err) {
      const message = err.response?.data?.message || err.message || "";
      console.error("Virtual try-on xetasi:", message);
      setTryOnMap((prev) => ({ ...prev, [keyword]: { status: "error", errorMessage: message } }));
    }
  };

  const getChosenReferenceImage = () => {
    if (!result?.recommendedImages?.length) return null;
    if (selectedInspirationIds.length > 0) {
      const chosen = result.recommendedImages.find((img) => img.id === selectedInspirationIds[0]);
      if (chosen) return chosen.imageUrl;
    }
    return result.recommendedImages[0].imageUrl;
  };

  const getChosenReferenceImage2 = () => {
    if (!result?.recommendedImages?.length) return null;
    if (selectedInspirationIds.length > 1) {
      const chosen = result.recommendedImages.find((img) => img.id === selectedInspirationIds[1]);
      if (chosen) return chosen.imageUrl;
    }
    return null;
  };

  const [bookingFromTryOn, setBookingFromTryOn] = useState(null);
  const [uploadingTryOn, setUploadingTryOn] = useState(false);

  const bookThisTryOn = async (keyword) => {
    const entry = tryOnMap[keyword];
    if (!entry?.imageDataUrl) return;
    setUploadingTryOn(true);
    try {
      const blob = await (await fetch(entry.imageDataUrl)).blob();
      const formData = new FormData();
      formData.append("file", blob, "virtual-tryon.png");
      const uploadRes = await api.post("/Upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setBookingFromTryOn(uploadRes.data.url);
      setShowBooking(true);
    } catch (err) {
      setBookingFromTryOn(entry.imageDataUrl);
      setShowBooking(true);
    } finally {
      setUploadingTryOn(false);
    }
  };

  const tryOnLoadingMessages = [t("style_tryon_step1"), t("style_tryon_step2"), t("style_tryon_step3")];
  const [tryOnMessageIndex, setTryOnMessageIndex] = useState(0);
  const isAnyTryOnLoading = Object.values(tryOnMap).some((e) => e?.status === "loading");

  useEffect(() => {
    if (!isAnyTryOnLoading) {
      setTryOnMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setTryOnMessageIndex((i) => (i + 1) % tryOnLoadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isAnyTryOnLoading]);

  if (status === "idle") return <AIStyleRecommendationIdle onImageUpload={processFile} />;

  return (
    <div className="w-full mx-auto rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-gradient-to-br from-[#1A1714] to-[#2B2118] border border-[#B8935A]/20 font-sans mb-10">

      <div className="pt-8 px-6 pb-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1A1714] via-[#C9A227] to-[#1A1714] opacity-70"></div>
        <h2 className="text-2xl font-light text-[#F4EDE0] mb-2 flex items-center justify-center gap-2">
          <svg className="w-5 h-5 text-[#C9A227]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          {t("style_title")}
        </h2>
        <p className="text-sm text-gray-400 font-light">{t("style_subtitle")}</p>
      </div>

      <div className="px-6 pb-8">


        {status === "loading" && (
          <div className="mt-4 flex flex-col items-center justify-center py-16 text-center">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 bg-[#C9A227] rounded-full blur-xl opacity-20 animate-pulse"></div>
              <svg className="animate-spin w-full h-full text-[#C9A227]/20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-[#F0D68A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
              </div>
            </div>
            <h3 className="text-[#F0D68A] text-lg font-light mb-2">{t("style_analyzing")}</h3>
            <p className="text-gray-400 text-sm">{t("style_analyzing_hint")}</p>
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 flex flex-col items-center justify-center py-10 text-center">
            <p className="text-red-300 text-sm mb-4">{t("style_error")}</p>
            <button onClick={resetWidget} className="px-5 py-2 rounded-full border border-[#B8935A]/40 text-gray-300 text-sm hover:bg-[#B8935A]/10">
              {t("style_try_again")}
            </button>
          </div>
        )}

        {status === "result" && result && (
          <div className="mt-2">
            <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-[#1A1714] border border-[#C9A227]/20 shadow-inner">
              <div className="relative">
                <img src={selectedImage} alt="Uploaded" className="w-16 h-16 rounded-xl object-cover shadow-md border border-[#B8935A]/30" />
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#C9A227] to-[#B8935A] w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#1A1714]">
                  <svg className="w-3 h-3 text-[#1A1714]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#C9A227] uppercase tracking-wider mb-1">{t("style_analysis_complete")}</p>
                <p className="text-[#F4EDE0] text-sm">
                  {t("style_face_shape")}: <span className="font-medium text-[#F0D68A]">{result.faceShapeAnalysis}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="border-l-2 border-[#C9A227] pl-4">
                <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t("style_hair_rec")}</h4>
                <p className="text-[#F4EDE0] text-sm font-light leading-relaxed">{result.hairRecommendation}</p>
              </div>

              <div className="border-l-2 border-[#B8935A] pl-4">
                <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t("style_makeup_rec")}</h4>
                <p className="text-[#F4EDE0] text-sm font-light leading-relaxed">{result.makeupRecommendation}</p>
              </div>
            </div>

            {result.fullExplanation && (
              <p className="text-xs text-gray-400/80 leading-relaxed mb-6 italic">"{result.fullExplanation}"</p>
            )}

            {result.recommendedImages && result.recommendedImages.length > 0 ? (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs text-[#F0D68A] uppercase tracking-wider">{t("style_inspiration")}</h4>
                  <span className="text-[10px] text-gray-400">{selectedInspirationIds.length}/2 {t("style_selected")}</span>
                </div>
                <div className="flex overflow-x-auto gap-3 pb-2">
                  {result.recommendedImages.filter((img) => img.imageUrl).map((img) => {
                    const isSelected = selectedInspirationIds.includes(img.id);
                    return (
                      <div
                        key={img.id}
                        onClick={() => toggleInspirationImage(img)}
                        className={`shrink-0 relative group rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          isSelected ? "border-[#C9A227] ring-2 ring-[#C9A227]/50" : "border-[#2B2118] hover:border-[#B8935A]/60"
                        }`}
                      >
                        <img src={img.imageUrl} alt={img.description || ""} className="w-24 h-32 object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1714] via-transparent to-transparent opacity-80"></div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setLightboxImage(img.imageUrl); }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center"
                          title={t("style_zoom")}
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        {isSelected && (
                          <div className="absolute bottom-1.5 left-1.5 w-5 h-5 rounded-full bg-[#C9A227] text-[#1A1714] flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedInspirationIds.length === 0 && (
                  <p className="text-[10px] text-gray-500 mt-2">{t("style_select_hint_0")}</p>
                )}
                {selectedInspirationIds.length === 2 && (
                  <p className="text-[10px] text-gray-500 mt-2">{t("style_select_hint_2")}</p>
                )}
              </div>
            ) : result.styleKeywords && result.styleKeywords.length > 0 ? (
              <div className="mb-8">
                <h4 className="text-xs text-[#F0D68A] uppercase tracking-wider mb-3">{t("style_keywords_label")}</h4>
                <div className="flex flex-wrap gap-2">
                  {result.styleKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#C9A227]/15 to-[#B8935A]/15 border border-[#C9A227]/30 text-[#F0D68A] text-xs font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {TRY_ON_ENABLED && result.styleKeywords && result.styleKeywords.length > 0 && (
              <div className="mb-8 rounded-2xl bg-[#1A1714]/60 border border-[#C9A227]/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wand2 className="w-4 h-4 text-[#C9A227]" />
                  <h4 className="text-xs text-[#F0D68A] uppercase tracking-wider">{t("style_tryon_title")}</h4>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {result.styleKeywords.slice(0, 3).map((kw) => {
                    const entry = tryOnMap[kw];
                    const isActive = activeTryOnKeyword === kw;
                    return (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => (entry?.status === "done" ? setActiveTryOnKeyword(kw) : generateTryOn(kw))}
                        disabled={entry?.status === "loading"}
                        className={
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1.5 " +
                          (isActive
                            ? "bg-[#C9A227] text-[#1A1714] border-[#C9A227]"
                            : "bg-transparent text-[#F0D68A] border-[#C9A227]/40 hover:border-[#C9A227]")
                        }
                      >
                        {entry?.status === "loading" && <Loader2 className="w-3 h-3 animate-spin" />}
                        {kw}
                        {entry?.status === "done" && !isActive && <span className="text-[#C9A227]">✓</span>}
                      </button>
                    );
                  })}
                </div>

                {activeTryOnKeyword && tryOnMap[activeTryOnKeyword]?.status === "loading" && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Loader2 className="w-8 h-8 text-[#C9A227] animate-spin mb-4" />
                    <p className="text-[#F0D68A] text-sm">{tryOnLoadingMessages[tryOnMessageIndex]}</p>
                  </div>
                )}

                {activeTryOnKeyword && tryOnMap[activeTryOnKeyword]?.status === "error" && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-red-300 text-xs mb-1">{t("style_tryon_error")}</p>
                    {tryOnMap[activeTryOnKeyword]?.errorMessage && (
                      <p className="text-red-400/70 text-[10px] mb-3 max-w-xs break-words">
                        {tryOnMap[activeTryOnKeyword].errorMessage}
                      </p>
                    )}
                    <button
                      onClick={() => generateTryOn(activeTryOnKeyword)}
                      className="px-4 py-1.5 rounded-full border border-[#B8935A]/40 text-gray-300 text-xs hover:bg-[#B8935A]/10"
                    >
                      {t("style_try_again")}
                    </button>
                  </div>
                )}

                {activeTryOnKeyword && tryOnMap[activeTryOnKeyword]?.status === "done" && (
                  <div>
                    <BeforeAfterSlider beforeSrc={selectedImage} afterSrc={tryOnMap[activeTryOnKeyword].imageDataUrl} t={t} />
                    <button
                      onClick={() => bookThisTryOn(activeTryOnKeyword)}
                      disabled={uploadingTryOn}
                      className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#B8935A] text-[#1A1714] font-semibold text-sm shadow-[0_4px_15px_rgba(201,162,39,0.3)] hover:shadow-[0_4px_20px_rgba(201,162,39,0.5)] transition-shadow disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {uploadingTryOn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {t("style_tryon_book_cta")}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={resetWidget}
                className="flex-1 py-3 px-4 rounded-xl border border-[#B8935A]/40 text-gray-300 text-sm hover:bg-[#B8935A]/10 hover:text-[#F4EDE0] transition-colors"
              >
                {t("style_try_again")}
              </button>
              <button
                onClick={() => setShowBooking(true)}
                className="flex-[2] py-3 px-4 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#B8935A] text-[#1A1714] font-medium text-sm shadow-[0_4px_15px_rgba(201,162,39,0.3)] hover:shadow-[0_4px_20px_rgba(201,162,39,0.5)] transition-shadow"
              >
                {t("style_book_this")}
              </button>
            </div>
          </div>
        )}
      </div>

      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-6 cursor-zoom-out"
        >
          <img
            src={lightboxImage}
            alt={t("style_zoomed_alt")}
            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl"
          >
            ✕
          </button>
        </div>
      )}
      {showBooking && (
        <BookingModal
          isOpen={showBooking}
          onClose={() => { setShowBooking(false); setBookingFromTryOn(null); }}
          salonId={salonId || 1}
          salonName=""
          initialReferenceImage={bookingFromTryOn || getChosenReferenceImage()}
          initialReferenceImage2={bookingFromTryOn ? null : getChosenReferenceImage2()}
          showAllSalons={true}
        />
      )}
    </div>
  );
}

