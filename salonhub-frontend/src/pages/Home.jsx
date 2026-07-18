import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, LogIn, UserPlus, MapPin, Phone, Star, Users, Building2, Crown, Quote, X, Send, CalendarPlus } from "lucide-react";
import BookingModal from "../components/BookingModal";
import api from "../services/api";

export default function Home() {
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/salon"), api.get("/Employee"), api.get("/GalleryImage"), api.get("/Review")])
      .then(([salonRes, empRes, galleryRes, reviewRes]) => {
        const withComments = (Array.isArray(reviewRes.data) ? reviewRes.data : [reviewRes.data]).filter((r) => r?.comment);
        setReviews(withComments.slice(0, 6));
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
      alert("Reyiniz ucun tesekkur edirik!");
      setReviewModalSalon(null);
      const reviewRes = await api.get("/Review");
      const withComments = (Array.isArray(reviewRes.data) ? reviewRes.data : [reviewRes.data]).filter((r) => r?.comment);
      setReviews(withComments.slice(0, 6));
    } catch (err) {
      alert(err.response?.data?.message || "Xeta bas verdi");
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
              <LogIn className="w-4 h-4" /> Giriş
            </button>
            <button
              onClick={() => navigate("/auth", { state: { tab: "register" } })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-[#F0D68A] to-[#B8935A] text-[#1A1714] hover:opacity-95 transition"
            >
              <UserPlus className="w-4 h-4" /> Qeydiyyat
            </button>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-[#1A1714] to-[#2B2118] py-16 px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#F4EDE0] max-w-2xl mx-auto leading-tight">
          Gözəlliyinizi kəşf edin,<br />bizimlə bir addım öndə olun
        </h2>
        <p className="mt-4 text-gray-400 max-w-lg mx-auto text-sm">
          Şəbəkəmizdəki ən yaxşı salonları və ustaları kəşf edin, rezervasiya edin
          və ya öz karyeranızı bizimlə qurun.
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
            <Building2 className="w-6 h-6 text-[#C9A227] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#1A1714]">{salons.length}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Salon</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
            <Users className="w-6 h-6 text-[#C9A227] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#1A1714]">{employees.length}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Usta</p>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
            <Star className="w-6 h-6 text-[#C9A227] mx-auto mb-2 fill-[#C9A227]" />
            <p className="text-2xl font-bold text-[#1A1714]">
              {salons.length > 0
                ? (salons.reduce((sum, s) => sum + s.averageRating, 0) / salons.length).toFixed(1)
                : "0.0"}
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Orta Reytinq</p>
          </div>
        </div>

        <h3 className="text-2xl font-serif font-bold text-[#1A1714] mb-4">Salonlarımız</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {loading ? (
            <p className="text-sm text-gray-400 col-span-full">Yüklənir...</p>
          ) : salons.length === 0 ? (
            <p className="text-sm text-gray-400 col-span-full">Hələ salon əlavə edilməyib.</p>
          ) : (
            salons.map((salon) => (
              <div
                key={salon.id}
                onClick={() => openReviewModal(salon)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition relative cursor-pointer"
              >
                <div className="h-40 bg-gradient-to-br from-[#1A1714] to-[#3A2E22] relative overflow-hidden">
                  <img
                    src={galleryBySalon[salon.id] || "/craftsman-modal-bg.png"}
                    alt={salon.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = "/craftsman-modal-bg.png"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {salon.isMonthlyTopSalon && (
                    <div className="absolute top-3 right-3 text-[#C9A227] bg-white/90 rounded-full p-1.5" title="Ayın ən yaxşı salonu">
                      <Crown className="w-4 h-4 fill-[#C9A227]" />
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  <h4 className="font-serif font-bold text-base text-[#1A1714]">{salon.name}</h4>
                  {salon.description && <p className="text-xs text-gray-500 line-clamp-2">{salon.description}</p>}
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C9A227]" />
                      {salon.address}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#C9A227]" />
                      {salon.phoneNumber}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
                    <Star className="w-3.5 h-3.5 text-[#C9A227] fill-[#C9A227]" />
                    <span className="text-sm font-semibold text-[#1A1714]">{salon.averageRating.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({salon.reviewCount} rəy)</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <h3 className="text-2xl font-serif font-bold text-[#1A1714] mb-4">Ustalarımız</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-16">
          {loading ? (
            <p className="text-sm text-gray-400 col-span-full">Yüklənir...</p>
          ) : employees.length === 0 ? (
            <p className="text-sm text-gray-400 col-span-full">Hələ usta əlavə edilməyib.</p>
          ) : (
            employees.map((emp) => (
              <div key={emp.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition">
                {emp.profileImageUrl ? (
                  <img
                    src={emp.profileImageUrl}
                    alt={emp.fullName}
                    className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-2 border-[#C9A227]/30"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F0D68A] to-[#B8935A] flex items-center justify-center mx-auto mb-3 text-[#1A1714] font-bold text-xl">
                    {getInitials(emp.fullName)}
                  </div>
                )}
                <h5 className="font-serif font-bold text-sm text-[#1A1714] truncate">{emp.fullName}</h5>
                <div className="flex items-center justify-center gap-1 mt-1 text-xs text-[#C9A227]">
                  <Star className="w-3 h-3 fill-[#C9A227]" />
                  <span>{emp.averageRating.toFixed(1)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {reviews.length > 0 && (
          <>
            <h3 className="text-2xl font-serif font-bold text-[#1A1714] mb-4">Musteri Reyleri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
              {reviews.map((rev) => {
                const salonName = salons.find((s) => s.id === rev.salonId)?.name;
                return (
                  <div key={rev.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                    <Quote className="w-6 h-6 text-[#C9A227]/30" />
                    <p className="text-sm text-gray-600 italic leading-relaxed line-clamp-4">"{rev.comment}"</p>
                    <p className="text-xs font-semibold text-[#1A1714]">{rev.customerFullName}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < rev.rating ? "text-[#C9A227] fill-[#C9A227]" : "text-gray-200 fill-gray-200"}`}
                          />
                        ))}
                      </div>
                      {salonName && <span className="text-xs text-gray-400 font-medium truncate max-w-[50%]">{salonName}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {reviewModalSalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-serif font-bold text-lg text-[#1A1714]">{reviewModalSalon.name} - Rey yaz</h3>
              <button onClick={() => setReviewModalSalon(null)} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider block mb-2">Reytinq</label>
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
                <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider block mb-2">Reyiniz</label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tecrubenizi bizimle paylasin..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReviewModalSalon(null)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-600">
                  Imtina
                </button>
                <button type="submit" disabled={submittingReview} className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#B8935A] to-[#C9A227] text-white rounded-xl text-sm font-bold disabled:opacity-50">
                  <Send className="w-3.5 h-3.5" /> {submittingReview ? "Gonderilir..." : "Gonder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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









