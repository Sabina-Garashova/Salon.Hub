import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, LogIn, UserPlus, MapPin, Phone, Star, Users, Building2, Crown, Quote, X, Send, CalendarPlus } from "lucide-react";
import BookingModal from "../components/BookingModal";
import SalonApplicationModal from "../components/SalonApplicationModal";
import { HomeStatsSection, HomeCTASection } from "../components/HomeSections";
import { SalonCard, EmployeeCard, NewsCard, ReviewCard } from "../components/HomeCards";
import CraftsmanApplicationModal from "../components/CraftsmanApplicationModal";
import api from "../services/api";
import NewsSection from "../components/NewsSection";
import StyleRecommendationWidget from "../components/StyleRecommendationWidget";
import { useLanguage } from "../context/LanguageContext";

export default function Home() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [salons, setSalons] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [galleryBySalon, setGalleryBySalon] = useState({});
  const [reviews, setReviews] = useState([]);
  const [reviewModalSalon, setReviewModalSalon] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [bookingSalon, setBookingSalon] = useState(null);
  const [showSalonApplicationModal, setShowSalonApplicationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uniqueCustomersCount, setUniqueCustomersCount] = useState(0);
  const [allReviewsForRating, setAllReviewsForRating] = useState([]);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/salon"), api.get("/Employee"), api.get("/GalleryImage"), api.get("/Review"), api.get("/Reservation/customer-count").catch(() => ({ data: { count: 0 } }))])
      .then(([salonRes, empRes, galleryRes, reviewRes, custCountRes]) => {
        const allReviews = Array.isArray(reviewRes.data) ? reviewRes.data : [reviewRes.data];
        setAllReviewsForRating(allReviews);
        const withComments = allReviews.filter((r) => r?.comment);
        setReviews([...withComments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10));
        setUniqueCustomersCount(custCountRes.data?.count || 0);
        setSalons(salonRes.data);
        setEmployees(empRes.data);

        const map = {};
        (Array.isArray(galleryRes.data) ? galleryRes.data : [galleryRes.data]).forEach((img) => {
          if (img?.salonId && !map[img.salonId]) map[img.salonId] = img.imageUrl;
        });
        setGalleryBySalon(map);
      })
      .catch((err) => console.error("Məlumat yüklənmədi", err))
      .finally(() => setLoading(false));
  }, []);

  const requireLogin = () => {
    if (!localStorage.getItem("token")) {
      navigate("/auth", { state: { tab: "login" } });
      return false;
    }
    return true;
  };

  const openSalonApplicationModal = () => {
    if (!requireLogin()) return;
    setShowSalonApplicationModal(true);
  };

  const openBookingModal = (e, salon) => {
    e.stopPropagation();
    if (!requireLogin()) return;
    setBookingSalon(salon);
  };

  const openReviewModal = (salon) => {
    if (!requireLogin()) return;
    setReviewModalSalon(salon);
    setReviewRating(5);
    setReviewComment("");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.post("/Review", {
        salonId: reviewModalSalon.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      alert(t("home_review_thanks"));
      setReviewModalSalon(null);
      const reviewRes = await api.get("/Review");
      const withComments = (Array.isArray(reviewRes.data) ? reviewRes.data : [reviewRes.data]).filter((r) => r?.comment);
      setReviews([...withComments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10));
    } catch (err) {
      alert(err.response?.data?.message || t("home_review_error"));
    } finally {
      setSubmittingReview(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <header className="bg-gradient-to-r from-[#1A1714] via-[#2B2118] to-[#1A1714] border-b border-[#B8935A]/20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C9A227]" />
            <h1 className="text-xl font-serif font-bold text-[#F4EDE0] tracking-wide">SalonHub</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/auth", { state: { tab: "login" } })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-[#F0D68A] hover:bg-white/5 transition"
            >
              <LogIn className="w-4 h-4" /> {t("home_login")}
            </button>
            <button
              onClick={() => navigate("/auth", { state: { tab: "register" } })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-[#F0D68A] to-[#B8935A] text-[#1A1714] hover:opacity-95 transition"
            >
              <UserPlus className="w-4 h-4" /> {t("home_register")}
            </button>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-[#1A1714] to-[#2B2118] py-16 px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#F4EDE0] max-w-2xl mx-auto leading-tight">
          {t("home_hero_title")}
        </h2>
        <p className="mt-4 text-gray-400 max-w-lg mx-auto text-sm">
          Şəbəkəmizdəki ən yaxşı salonları və ustaları kəşf edin, rezervasiya edin
          və ya öz karyeranızı bizimlə qurun.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 mt-10">
        <HomeStatsSection stats={{ salonCount: salons.length, employeeCount: employees.length, avgRating: allReviewsForRating.length > 0 ? (allReviewsForRating.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviewsForRating.length).toFixed(1) : "0.0", customerCount: uniqueCustomersCount }} />
      </section>

      <HomeCTASection onApplySpecialist={() => { if (requireLogin()) setShowApplicationModal(true); }} onApplySalon={openSalonApplicationModal} />

      <div className="max-w-6xl mx-auto px-6 mt-10 relative z-10">
        {localStorage.getItem("token") ? (
          <StyleRecommendationWidget />
        ) : (
          <div className="bg-gradient-to-br from-[#1A1714] to-[#2B2118] rounded-2xl p-6 mb-10 flex items-center justify-between gap-4 border border-[#B8935A]/20">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-[#C9A227]" />
              <div>
                <p className="text-sm font-bold text-[#F4EDE0]">{t("style_title")}</p>
                <p className="text-xs text-gray-400">{t("style_subtitle")}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/auth", { state: { tab: "login" } })}
              className="px-4 py-2 bg-gradient-to-r from-[#F0D68A] to-[#B8935A] text-[#1A1714] font-bold text-xs rounded-xl whitespace-nowrap hover:opacity-95 transition"
            >
              {t("style_login_cta")}
            </button>
          </div>
        )}


        <h3 className="text-2xl font-serif font-bold text-[#1A1714] mb-4">{t("home_our_salons")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {loading ? (
            <p className="text-sm text-gray-400 col-span-full">Yüklənir...</p>
          ) : salons.length === 0 ? (
            <p className="text-sm text-gray-400 col-span-full">{t("home_no_salons")}</p>
          ) : (
            salons.map((salon) => (
              <SalonCard
                key={salon.id}
                salon={{ ...salon, imageUrl: galleryBySalon[salon.id] }}
                onClick={() => navigate(`/salon/${salon.id}`)}
                onBook={() => { if (!requireLogin()) return; setBookingSalon(salon); }}
              />
            ))
          )}
        </div>

        <h3 className="text-2xl font-serif font-bold text-[#1A1714] mb-4">{t("home_our_masters")}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-16">
          {loading ? (
            <p className="text-sm text-gray-400 col-span-full">Yüklənir...</p>
          ) : employees.length === 0 ? (
            <p className="text-sm text-gray-400 col-span-full">{t("home_no_masters")}</p>
          ) : (
            employees.map((emp) => (
              <EmployeeCard key={emp.id} employee={emp} />
            ))
          )}
        </div>

        <NewsSection limit={3} />
        {reviews.length > 0 && (
          <>
            <h3 className="text-2xl font-serif font-bold text-[#1A1714] mb-4">{t("home_customer_reviews")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
                {reviews.map((rev) => (
                  <ReviewCard
                    key={rev.id}
                    review={{ comment: rev.comment, customerName: rev.customerFullName, salonName: salons.find((s) => s.id === rev.salonId)?.name, rating: rev.rating }}
                  />
                ))}
            </div>
          </>
        )}
      </div>

      {reviewModalSalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-serif font-bold text-lg text-[#1A1714]">{reviewModalSalon.name} - Rəy yaz</h3>
              <button onClick={() => setReviewModalSalon(null)} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider block mb-2">{t("home_rating")}</label>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReviewRating(i + 1)}
                      className="p-1"
                    >
                      <Star className={`w-7 h-7 ${i < reviewRating ? "text-[#C9A227] fill-[#C9A227]" : "text-gray-200 fill-gray-200"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider block mb-2">{t("home_your_review")}</label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={t("home_review_placeholder")}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReviewModalSalon(null)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-600">
                  Imtina
                </button>
                <button type="submit" disabled={submittingReview} className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#B8935A] to-[#C9A227] text-white rounded-xl text-sm font-bold disabled:opacity-50">
                  <Send className="w-3.5 h-3.5" /> {submittingReview ? t("home_sending") : t("home_submit_review")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SalonApplicationModal isOpen={showSalonApplicationModal} onClose={() => setShowSalonApplicationModal(false)} />
      <CraftsmanApplicationModal isOpen={showApplicationModal} onClose={() => setShowApplicationModal(false)} />

      {bookingSalon && (
        <BookingModal
          isOpen={!!bookingSalon}
          onClose={() => setBookingSalon(null)}
          salonId={bookingSalon.id}
          salonName={bookingSalon.name}
        />
      )}
    </div>
  );
}






















