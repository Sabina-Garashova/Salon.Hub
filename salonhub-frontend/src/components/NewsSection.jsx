import { useState, useEffect } from "react";
import { Calendar, Newspaper, X } from "lucide-react";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export default function NewsSection({ limit = 3, title, salonId }) {
  const { t } = useLanguage();
  const displayTitle = title || t("news_title");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    const params = { publicOnly: true };
    if (salonId) params.salonId = salonId;
    api.get("/News", { params })
      .then((res) => {
        const sorted = (res.data || []).sort(
          (a, b) => new Date(b.publishedDate) - new Date(a.publishedDate)
        );
        setNews(sorted.slice(0, limit));
      })
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, [limit, salonId]);

  if (loading || news.length === 0) return null;

  return (
    <section className="py-10">
      <div className="flex items-center gap-2 mb-6">
        <Newspaper size={22} className="text-[#C9A227]" />
        <h2 className="text-2xl font-serif font-bold text-[#1A1714]">{displayTitle}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedArticle(item)}
            className="bg-gradient-to-br from-[#F6EAD3] via-[#F1E2C5] to-[#E9D5A8] rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-amber-300/30 hover:-translate-y-1 cursor-pointer"
          >
            <div className="relative w-full h-[180px] overflow-hidden bg-[#1A1714]">
              <img
                src={item.imageUrl || "https://placehold.co/800x600/1A1714/FAF6F0?text=SalonHub"}
                alt={item.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-5">
              <div className="inline-flex items-center gap-1.5 bg-[#FAF6F0] text-[#C9A227] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-[#C9A227]/20 mb-3">
                <Calendar size={11} />
                {item.publishedDate
                  ? new Date(item.publishedDate).toLocaleDateString("az-AZ", { day: "numeric", month: "short", year: "numeric" })
                  : ""}
              </div>
              <h3 className="font-serif font-bold text-[#1A1714] text-lg mb-2 leading-snug line-clamp-2">
                {item.title}
              </h3>
              {item.authorEmployeeName && (
                <p className="text-xs font-semibold text-[#C9A227] mb-1">{item.authorEmployeeName}</p>
              )}
              <p className="text-sm text-[#1A1714]/70 line-clamp-2">{item.content}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 bg-[#1A1714]/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="bg-[radial-gradient(circle_at_center,_#FFFFFF_0%,_#FDFBF7_45%,_#F4E7CE_100%)] w-full max-w-2xl rounded-3xl shadow-2xl border border-[#E5D2B1] overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-[280px] bg-[#1A1714] flex-shrink-0">
              <img
                src={selectedArticle.imageUrl || "https://placehold.co/800x600/1A1714/FAF6F0?text=SalonHub"}
                alt={selectedArticle.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full text-[#1A1714] shadow-sm transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="inline-flex items-center gap-1.5 bg-[#FAF6F0] text-[#C9A227] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-[#C9A227]/20 mb-3">
                <Calendar size={11} />
                {selectedArticle.publishedDate
                  ? new Date(selectedArticle.publishedDate).toLocaleDateString("az-AZ", { day: "numeric", month: "short", year: "numeric" })
                  : ""}
              </div>
              <h2 className="font-serif font-bold text-[#1A1714] text-2xl mb-4 leading-snug">
                {selectedArticle.title}
              </h2>
              <p className="text-sm text-[#1A1714]/80 whitespace-pre-line leading-relaxed">
                {selectedArticle.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

