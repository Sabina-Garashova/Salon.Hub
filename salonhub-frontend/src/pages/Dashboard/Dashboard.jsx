import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  Calendar,
  Users,
  Star,
  Scissors,
  Sparkles,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  ArrowUpRight,
  Crown,
  X,
  Send,
} from "lucide-react";
import { ImageOff, Quote, CalendarPlus } from "lucide-react";
import Layout from "../../components/Layout";
import CraftsmanApplicationModal from "../../components/CraftsmanApplicationModal";
import SalonApplicationModal from "../../components/SalonApplicationModal";
import { TodayAppointmentsTable, TopServicesChart } from "../../components/DashboardCards";
import DashboardStatsSection from "../../components/DashboardStatsSection";
import { EmployeeCard, SalonCard } from "../../components/HomeCards";
import { HomeCTASection } from "../../components/HomeSections";
import BookingModal from "../../components/BookingModal";
import api from "../../services/api";
import jsQR from "jsqr";
import QRCode from "qrcode";
import NewsSection from "../../components/NewsSection";
import StyleRecommendationWidget from "../../components/StyleRecommendationWidget";
import { useLanguage } from "../../context/LanguageContext";

function decodeToken(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getFirstName(fullName) {
  if (!fullName) return "";
  return fullName.trim().split(" ")[0];
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const dateNow = new Date();
  const weekdaysByLang = {
    az: ["Bazar", "Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə", "Cümə axşamı", "Cümə", "Şənbə"],
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    ru: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
  };
  const monthsByLang = {
    az: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  };
  const weekdayArr = weekdaysByLang[language] || weekdaysByLang.az;
  const monthArr = monthsByLang[language] || monthsByLang.az;
  const dateStr = weekdayArr[dateNow.getDay()] + ", " + dateNow.getDate() + " " + monthArr[dateNow.getMonth()] + " " + dateNow.getFullYear();

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showSalonApplicationModal, setShowSalonApplicationModal] = useState(false);
  const [salons, setSalons] = useState([]);
  const [salonsLoading, setSalonsLoading] = useState(true);
  const [galleryBySalon, setGalleryBySalon] = useState({});
  const [employees, setEmployees] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [allReviewsForRating, setAllReviewsForRating] = useState([]);
  const [reviewModalSalon, setReviewModalSalon] = useState(null);
  const [reviewEmployeeId, setReviewEmployeeId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [bookingSalon, setBookingSalon] = useState(null);
  const [qrModalAppt, setQrModalAppt] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [checkInResult, setCheckInResult] = useState(null);

  useEffect(() => {
    if (qrModalAppt?.checkInCode) {
      const qrPayload = JSON.stringify({
        code: qrModalAppt.checkInCode,
        customer: qrModalAppt.customerFullName || "",
        service: qrModalAppt.serviceName || "",
        employee: qrModalAppt.employeeName || "",
        time: qrModalAppt.startTime || "",
      });
      QRCode.toDataURL(qrPayload, { width: 260, margin: 2 })
        .then(setQrDataUrl)
        .catch((err) => {
          console.error("QR generasiya xetasi:", err);
          setQrDataUrl("");
        });
    } else {
      setQrDataUrl("");
    }
  }, [qrModalAppt]);

  const performCheckIn = async (code) => {
    const userId = decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded?.sub;
    const myEmployee = employees.find((emp) => emp.applicationUserId === userId);
    if (!myEmployee?.salonId) return;
    setScanning(true);
    setCheckInResult(null);
    try {
      const resp = await api.post("/CheckIn/scan", { checkInCode: code, salonId: myEmployee.salonId });
      setCheckInResult(resp.data.reservation || null);
      setQrCode("");
    } catch (err) {
      alert(err.response?.data?.message || "Xəta baş verdi");
    } finally {
      setScanning(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.post("/Review", {
        salonId: reviewModalSalon.id,
        employeeId: reviewEmployeeId || null,
        rating: reviewRating,
        comment: reviewComment,
      });
      alert("Rəyiniz üçün təşəkkür edirik!");
      setReviewModalSalon(null);
      setReviewComment("");
      setReviewEmployeeId("");
    } catch (err) {
      alert(err.response?.data?.message || "Xəta baş verdi");
    } finally {
      setSubmittingReview(false);
    }
  };

  const token = localStorage.getItem("token");
  const decoded = token ? decodeToken(token) : null;
  const fullName =
    decoded?.["FullName"] ||
    decoded?.name ||
    decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
    "";
  const firstName = getFirstName(fullName);

  const role =
    decoded?.role ||
    decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    "Customer";
  const canSeeRevenue = role === "SalonAdmin" || role === "SuperAdmin";

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 6 ? t("dash_good_night") : hour < 12 ? t("dash_good_morning") : hour < 18 ? t("dash_good_day") : t("dash_good_evening");

  useEffect(() => {
    Promise.all([api.get("/salon"), api.get("/GalleryImage"), api.get("/Employee"), api.get("/Review")])
      .then(([salonRes, galleryRes, empRes, reviewRes]) => {
        setSalons(salonRes.data);
        setEmployees(empRes.data);

        const map = {};
        (Array.isArray(galleryRes.data) ? galleryRes.data : [galleryRes.data]).forEach((img) => {
          if (img?.salonId && !map[img.salonId]) map[img.salonId] = img.imageUrl;
        });
        setGalleryBySalon(map);

        const allRevs = Array.isArray(reviewRes.data) ? reviewRes.data : [reviewRes.data];
        setAllReviewsForRating(allRevs);
        const withComments = allRevs.filter((r) => r?.comment);
      })
      .catch((err) => console.error("Məlumat yüklənmədi", err))
      .finally(() => setSalonsLoading(false));
  }, []);

  const [allReservations, setAllReservations] = useState([]);
  const [globalReservations, setGlobalReservations] = useState([]);
  const [customerCountFromApi, setCustomerCountFromApi] = useState(0);
  const activeSessionsCount = globalReservations.filter((r) => r.status === "Pending" || r.status === "Confirmed").length;
  const uniqueCustomersCount = customerCountFromApi;
  const avgSalonRating = allReviewsForRating.length > 0 ? (allReviewsForRating.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviewsForRating.length).toFixed(1) : "0.0";
  const myUserIdForRevenue = decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded?.sub;
  const myOwnSalonIdsForRevenue = salons.filter((s) => s.ownerId === myUserIdForRevenue).map((s) => s.id);
  const totalRevenue = globalReservations
    .filter((r) => r.status === "Completed" && (role !== "SalonAdmin" || myOwnSalonIdsForRevenue.includes(r.salonId)))
    .reduce((sum, r) => sum + (r.price || 0), 0);

  const allStats = [
    { id: 1, name: t("dash_total_earnings"), value: totalRevenue.toFixed(2) + " AZN", change: t("dash_completed"), icon: DollarSign, color: "#C9A227", adminOnly: true },
    { id: 2, name: t("dash_active_sessions"), value: activeSessionsCount + " " + t("emp_sessions"), change: t("dash_current_status"), icon: Calendar, color: "#B8935A" },
    { id: 3, name: t("dash_customers"), value: uniqueCustomersCount + " " + t("dash_people"), change: t("dash_total"), icon: Users, color: "#1A1714" },
    { id: 4, name: t("dash_salon_rating"), value: avgSalonRating + " / 5.0", change: allReviewsForRating.length + " " + t("dash_reviews_count"), icon: Star, color: "#C9A227" },
    { id: 5, name: t("dash_masters"), value: employees.length + " " + t("dash_people"), change: t("dash_total"), icon: Scissors, color: "#B8935A" },
  ];
  const stats = allStats.filter((s) => !s.adminOnly || canSeeRevenue);

  useEffect(() => {
    const userId = decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded?.sub;
    api
      .get("/Reservation")
      .then((res) => {
        let list = res.data;
        if (role === "Customer") {
          list = list.filter((r) => r.customerId === userId);
        } else if (role === "Employee") {
          list = list.filter((r) => r.employeeId && employees.some((e) => e.id === r.employeeId && e.applicationUserId === userId));
        } else if (role === "SalonAdmin") {
          const mySalonIds = salons.filter((s) => s.ownerId === userId).map((s) => s.id);
          list = list.filter((r) => mySalonIds.includes(r.salonId));
        }
        setAllReservations(list);
        setGlobalReservations(res.data);
        api.get("/Reservation/customer-count").then((cc) => setCustomerCountFromApi(cc.data?.count || 0)).catch(() => {});
      })
      .catch((err) => console.error("Rezervasiyalar yüklənmədi", err));
  }, [role, employees, salons]);

  const nowForToday = new Date();
  const todayStr = nowForToday.getFullYear() + "-" + String(nowForToday.getMonth() + 1).padStart(2, "0") + "-" + String(nowForToday.getDate()).padStart(2, "0");
  const todaysAppointments = allReservations.filter((r) => r.reservationDate?.split("T")[0] === todayStr);

  const statusLabel = (s) =>
    s === "Confirmed" ? "Təsdiqlənib" : s === "Completed" ? "Tamamlanıb" : s === "Cancelled" ? "Ləğv edilib" : "Gözlənilir";

  const serviceStats = (() => {
    const completed = globalReservations.filter((r) => r.status === "Completed");
    const counts = {};
    completed.forEach((r) => {
      counts[r.serviceName] = (counts[r.serviceName] || 0) + 1;
    });
    const total = completed.length || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({ name, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  })();

  return (
    <Layout>
      <div className="relative min-h-screen w-full overflow-hidden -m-6 p-4 md:p-6 font-sans">
        <style>{`
          @keyframes floatOrb1 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            50% { transform: translate(40px, -60px) scale(1.2); }
          }
          @keyframes floatOrb2 {
            0%, 100% { transform: translate(0px, 0px) scale(1.1); }
            50% { transform: translate(-50px, 30px) scale(0.9); }
          }
          @keyframes floatOrb3 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            50% { transform: translate(30px, 40px) scale(1.15); }
          }
          .animate-orb-1 { animation: floatOrb1 18s infinite ease-in-out; }
          .animate-orb-2 { animation: floatOrb2 22s infinite ease-in-out; }
          .animate-orb-3 { animation: floatOrb3 15s infinite ease-in-out; }
        `}</style>

        <div className="absolute top-[10%] left-[5%] w-[350px] h-[350px] bg-[#C9A227]/8 blur-[100px] rounded-full animate-orb-1 pointer-events-none z-0" />
        <div className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] bg-[#B8935A]/6 blur-[120px] rounded-full animate-orb-2 pointer-events-none z-0" />
        <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-[#F0D68A]/10 blur-[90px] rounded-full animate-orb-3 pointer-events-none z-0" />

        <div className="relative z-10 space-y-6 max-w-[1900px] mx-auto">
          {/* 1. Salamlama və Cari Tarix Bloku */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#B8935A] uppercase tracking-widest block mb-1">
                {greeting}{firstName ? `, ${firstName}` : ""}
              </span>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1714] tracking-tight">{t("dash_panel_title")}</h1>
              <p className="text-gray-400 text-xs mt-0.5 font-medium">{t("dash_panel_sub")}</p>
            </div>

            <div className="bg-white/70 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-sm border border-white/60 text-sm text-gray-700 font-semibold flex items-center gap-3 self-start sm:self-center transition-all hover:shadow-md">
              <div className="p-2 bg-[#C9A227]/10 text-[#C9A227] rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{t("dash_current_date")}</div>
                <div className="font-mono text-[#1A1714] capitalize">{dateStr}</div>
              </div>
            </div>
          </div>

          {/* 2. Statistika Kartları */}
          <DashboardStatsSection stats={stats} />

          {/* 3. Karyera Imkani (Usta + Salon CTA) */}
          {role === "Customer" && (
            <HomeCTASection
              onApplySpecialist={() => setShowApplicationModal(true)}
              onApplySalon={() => setShowSalonApplicationModal(true)}
            />

          )}
          {/* 4. AI Stil Tövsiyəsi Vidceti */}
          {role === "Customer" && <StyleRecommendationWidget />}

          {/* 5. Salonlarımız Bölməsi */}
          <div className="bg-white/60 backdrop-blur-lg p-5 rounded-2xl border border-white/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1A1714]">{t("dash_our_salons")}</h3>
                <p className="text-xs text-gray-400 font-medium">{t("dash_our_salons_sub")}</p>
              </div>
              <div className="text-gray-300">
                <Scissors className="w-5 h-5 opacity-40 rotate-90" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salonsLoading ? (
                <p className="text-sm text-gray-400 col-span-full">Yüklənir...</p>
              ) : salons.length === 0 ? (
                <p className="text-sm text-gray-400 col-span-full">Hələ salon əlavə edilməyib.</p>
              ) : (
                salons.map((salon) => (
                  <SalonCard
                    key={salon.id}
                    salon={{ ...salon, imageUrl: galleryBySalon[salon.id] }}
                    onClick={() => navigate(`/salon/${salon.id}`)}
                    onBook={() => setBookingSalon(salon)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Ustalarımız Bölməsi */}
          <div className="bg-white/60 backdrop-blur-lg p-5 rounded-2xl border border-white/80 shadow-sm space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1714]">{t("dash_our_masters")}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {employees.map((emp) => (
                <EmployeeCard key={emp.id} employee={emp} />
              ))}
            </div>
          </div>

          {/* Xəbərlər */}
          <NewsSection limit={3} />

          {/* Rəylər */}
          {reviews.length > 0 && (
            <div className="bg-white/60 backdrop-blur-lg p-5 rounded-2xl border border-white/80 shadow-sm space-y-4">
              <h3 className="text-xl font-serif font-bold text-[#1A1714]">{t("dash_customer_reviews")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviews.map((rev) => {
                  const s = salons.find((sal) => sal.id === rev.salonId);
                  return (
                    <div key={rev.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2">
                      <p className="text-sm text-gray-600 italic line-clamp-3">"{rev.comment}"</p>
                      <p className="text-xs font-semibold text-[#1A1714]">{rev.customerFullName}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={"w-3 h-3 " + (i < rev.rating ? "text-[#C9A227] fill-[#C9A227]" : "text-gray-200 fill-gray-200")} />
                          ))}
                        </div>
                        {s && <span className="text-xs text-gray-400 truncate max-w-[50%]">{s.name}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TodayAppointmentsTable
                appointments={todaysAppointments.map((appt) => ({
                  ...appt,
                  time: appt.startTime?.slice(0, 5),
                  price: appt.price + " AZN",
                  status: statusLabel(appt.status),
                }))}
                onShowQr={(appt) => setQrModalAppt(appt)}
                role={role}
              />
            </div>

            <TopServicesChart services={serviceStats} />
          </div>

          {qrModalAppt && (
            <div
              onClick={() => setQrModalAppt(null)}
              className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-6"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-3 max-h-[90vh] overflow-y-auto"
              >
                <h3 className="text-lg font-serif font-bold text-[#1A1714]">Check-in QR Kodu</h3>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR" className="mx-auto rounded-xl border border-gray-100" />
                ) : (
                  <p className="text-sm text-gray-400 py-10">QR kodu yuklenir...</p>
                )}
                <button
                  onClick={() => setQrModalAppt(null)}
                  className="w-full py-2.5 rounded-xl bg-[#1A1714] text-white font-medium text-sm hover:bg-[#2B2118]"
                >
                  Bagla
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CraftsmanApplicationModal isOpen={showApplicationModal} onClose={() => setShowApplicationModal(false)} />
      <SalonApplicationModal isOpen={showSalonApplicationModal} onClose={() => setShowSalonApplicationModal(false)} />

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
                <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider block mb-2">Hansı usta ilə işlədin? (Könüllü)</label>
                <select
                  value={reviewEmployeeId}
                  onChange={(e) => setReviewEmployeeId(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                >
                  <option value="">Sadece salona rəy ver</option>
                  {employees.filter((e) => e.salonId === reviewModalSalon?.id).map((e) => (
                    <option key={e.id} value={e.id}>{e.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider block mb-2">Reytinq</label>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button key={i} type="button" onClick={() => setReviewRating(i + 1)} className="p-1">
                      <Star className={"w-7 h-7 " + (i < reviewRating ? "text-[#C9A227] fill-[#C9A227]" : "text-gray-200 fill-gray-200")} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider block mb-2">Rəyiniz</label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Fikirlərinizi bölüşün..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3 bg-gradient-to-r from-[#C9A227] to-[#B8935A] text-[#1A1714] font-bold rounded-xl shadow-md hover:opacity-95 transition"
              >
                {submittingReview ? "Göndərilir..." : "Rəyi Göndər"}
              </button>
            </form>
          </div>
        </div>
      )}

      {bookingSalon && (
        <BookingModal
          isOpen={!!bookingSalon}
          salonId={bookingSalon.id}
          salonName={bookingSalon.name}
          onClose={() => setBookingSalon(null)}
        />
      )}
    </Layout>
  );
}



















