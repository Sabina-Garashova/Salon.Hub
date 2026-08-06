import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Building2,
  Loader2,
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
import OutfitMatchWidget from "../../components/OutfitMatchWidget";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";

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
  const { showToast } = useToast();
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
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showSalonApplicationModal, setShowSalonApplicationModal] = useState(false);
  const [salons, setSalons] = useState([]);
  const [salonsLoading, setSalonsLoading] = useState(true);
  const [galleryBySalon, setGalleryBySalon] = useState({});
  const [galleryByEmployee, setGalleryByEmployee] = useState({});
  const [workPhotos, setWorkPhotos] = useState([]);
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
  const [showAllReservationsModal, setShowAllReservationsModal] = useState(false);
  const [postCareAppt, setPostCareAppt] = useState(null);
  const [postCareResult, setPostCareResult] = useState(null);
  const [postCareStatus, setPostCareStatus] = useState("idle");
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
      showToast(err.response?.data?.message || t("admin_generic_error"), "error");
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
      showToast(t("home_review_thanks"), "success");
      setReviewModalSalon(null);
      setReviewComment("");
      setReviewEmployeeId("");
      const reviewRes = await api.get("/Review");
      const allRevs = Array.isArray(reviewRes.data) ? reviewRes.data : [reviewRes.data];
      setAllReviewsForRating(allRevs);
      const withComments = allRevs.filter((r) => r?.comment);
      setReviews([...withComments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10));
    } catch (err) {
      showToast(err.response?.data?.message || t("admin_generic_error"), "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const token = sessionStorage.getItem("token");
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
    Promise.all([
      api.get("/salon"),
      api.get("/GalleryImage"),
      api.get("/Employee"),
      api.get("/Review"),
      api.get("/Service").catch(() => ({ data: [] })),
    ])
      .then(([salonRes, galleryRes, empRes, reviewRes, serviceRes]) => {
        setSalons(salonRes.data);

        const serviceById = {};
        (Array.isArray(serviceRes.data) ? serviceRes.data : []).forEach((s) => { serviceById[s.id] = s.name; });
        const employeesWithSpecialty = empRes.data.map((emp) => ({
          ...emp,
          specialty: emp.serviceIds && emp.serviceIds.length > 0 ? serviceById[emp.serviceIds[0]] : null,
          averageRating: emp.averageRating || 0,
        }));
        setEmployees(employeesWithSpecialty);

        const map = {};
        const empMap = {};
        const portfolioImages = [];
        (Array.isArray(galleryRes.data) ? galleryRes.data : [galleryRes.data]).forEach((img) => {
          if (img?.salonId && !map[img.salonId]) map[img.salonId] = img.imageUrl;
          if (img?.employeeId) {
            if (!empMap[img.employeeId]) empMap[img.employeeId] = [];
            empMap[img.employeeId].push(img.imageUrl);
          }
          if (img?.type === "Portfolio") portfolioImages.push(img);
        });
        setGalleryBySalon(map);
        setGalleryByEmployee(empMap);
        setWorkPhotos(portfolioImages.slice(0, 12));

        const allRevs = Array.isArray(reviewRes.data) ? reviewRes.data : [reviewRes.data];
        setAllReviewsForRating(allRevs);
        const withComments = allRevs.filter((r) => r?.comment);
        setReviews([...withComments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10));
      })
      .catch((err) => console.error("Məlumat yüklənmədi", err))
      .finally(() => setSalonsLoading(false));
  }, []);

  useEffect(() => {
    const targetId = location.state?.scrollTo;
    if (!targetId || salonsLoading) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 16, behavior: "smooth" });
      navigate(location.pathname, { replace: true, state: {} });
    }, 150);
    return () => clearTimeout(timer);
  }, [location.state, salonsLoading]);

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
    s === "Confirmed" ? t("status_confirmed") : s === "Completed" ? t("status_completed") : s === "Cancelled" ? t("status_cancelled") : t("status_pending");

  const openPostCareGuide = async (appt) => {
    setPostCareAppt(appt);
    setPostCareStatus("loading");
    setPostCareResult(null);
    try {
      const res = await api.post("/PostCare/generate", { reservationId: appt.id });
      setPostCareResult(res.data);
      setPostCareStatus("result");
    } catch (err) {
      setPostCareStatus("error");
    }
  };

  const topEmployeeRanks = {};
  [...employees]
    .filter((e) => e.averageRating > 0)
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 3)
    .forEach((e, idx) => { topEmployeeRanks[e.id] = idx + 1; });

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
      .slice(0, 5);
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
              <p className="text-[#7A6A50] text-xs mt-0.5 font-medium">{t("dash_panel_sub")}</p>
            </div>

            <div className="bg-gradient-to-br from-[#F6EAD3] via-[#F1E2C5] to-[#E9D5A8] backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-md border border-amber-300/30 text-sm text-gray-700 font-semibold flex items-center gap-3 self-start sm:self-center transition-all hover:shadow-md">
              <div className="p-2 bg-[#C9A227]/10 text-[#C9A227] rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-[#7A6A50] font-bold uppercase tracking-wider">{t("dash_current_date")}</div>
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
          {role === "Employee" && (
            <HomeCTASection
              onApplySalon={() => setShowSalonApplicationModal(true)}
              onlySalon
            />
          )}
          {/* 4. AI Stil Tövsiyəsi Vidceti */}
          <StyleRecommendationWidget />

          {/* 4b. AI Geyimə Uyğun Stil Vidceti */}
          {role === "Customer" && <OutfitMatchWidget />}

          {/* 5. Salonlarımız Bölməsi */}
          <div id="salons-section" className="bg-gradient-to-br from-[#E3CC9E]/90 to-[#C9AD70]/85 backdrop-blur-lg p-5 rounded-2xl border border-[#B8935A]/40 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1A1714] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#C9A227]" />
                  {t("dash_our_salons")}
                </h3>
                <p className="text-xs text-[#7A6A50] font-medium">{t("dash_our_salons_sub")}</p>
              </div>
              <div className="text-[#B8A578]">
                <Scissors className="w-5 h-5 opacity-40 rotate-90" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salonsLoading ? (
                <p className="text-sm text-[#7A6A50] col-span-full">{t("dash_loading")}</p>
              ) : salons.length === 0 ? (
                <p className="text-sm text-[#7A6A50] col-span-full">{t("dash_no_salons_yet")}</p>
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
          <div id="masters-section" className="bg-gradient-to-br from-[#E3CC9E]/90 to-[#C9AD70]/85 backdrop-blur-lg p-5 rounded-2xl border border-[#B8935A]/40 shadow-sm space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1714] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#C9A227]" />
              {t("dash_our_masters")}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {employees.map((emp) => (
                <EmployeeCard key={emp.id} employee={emp} workPhotos={galleryByEmployee[emp.id] || []} topRank={topEmployeeRanks[emp.id] || null} />
              ))}
            </div>
          </div>

          {/* İşlərimiz Bölməsi */}
          {workPhotos.length > 0 && (
            <div id="works-section" className="bg-gradient-to-br from-[#E3CC9E]/90 to-[#C9AD70]/85 backdrop-blur-lg p-5 rounded-2xl border border-[#B8935A]/40 shadow-sm space-y-4">
              <h3 className="text-xl font-serif font-bold text-[#1A1714] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C9A227]" />
                {t("sp_our_works")}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {workPhotos.map((photo) => (
                  <div key={photo.id} className="aspect-square rounded-xl overflow-hidden border border-amber-300/30 shadow-sm">
                    <img src={photo.imageUrl} alt={photo.description || t("sp_our_works")} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Xəbərlər */}
          <div id="news-section"><NewsSection limit={3} /></div>

          {/* Rəylər */}
          {reviews.length > 0 && (
            <div id="reviews-section" className="bg-gradient-to-br from-[#E3CC9E]/90 to-[#C9AD70]/85 backdrop-blur-lg p-5 rounded-2xl border border-[#B8935A]/40 shadow-sm space-y-4">
              <h3 className="text-xl font-serif font-bold text-[#1A1714] flex items-center gap-2">
                <Quote className="w-5 h-5 text-[#C9A227]" />
                {t("dash_customer_reviews")}
              </h3>
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
                        {s && <span className="text-xs text-[#7A6A50] truncate max-w-[50%]">{s.name}</span>}
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
                  rawPrice: appt.price,
                  price: appt.price + " AZN",
                  rawStatus: appt.status,
                  status: statusLabel(appt.status),
                }))}
                onShowQr={(appt) => setQrModalAppt(appt)}
                onPostCare={role === "Customer" ? openPostCareGuide : undefined}
                role={role}
                onShowAll={
                  role === "SuperAdmin" || role === "SalonAdmin"
                    ? () => navigate("/admin", { state: { tab: "AllReservations" } })
                    : () => setShowAllReservationsModal(true)
                }
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
                <h3 className="text-lg font-serif font-bold text-[#1A1714]">{t("qr_checkin_title")}</h3>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR" className="mx-auto rounded-xl border border-gray-100" />
                ) : (
                  <p className="text-sm text-[#7A6A50] py-10">{t("qr_loading")}</p>
                )}
                <button
                  onClick={() => setQrModalAppt(null)}
                  className="w-full py-2.5 rounded-xl bg-[#1A1714] text-white font-medium text-sm hover:bg-[#2B2118]"
                >
                  {t("common_close")}
                </button>
              </div>
            </div>
          )}

          {showAllReservationsModal && (
            <div
              onClick={() => setShowAllReservationsModal(false)}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[radial-gradient(circle_at_center,_#FFFFFF_0%,_#FDFBF7_45%,_#F4E7CE_100%)] w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl border border-[#E5D2B1] p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-serif font-bold text-[#1A1714]">{t("all_reservations_title")}</h3>
                  <button
                    onClick={() => setShowAllReservationsModal(false)}
                    className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <TodayAppointmentsTable
                  appointments={[...allReservations]
                    .filter((r) => r.reservationDate?.split("T")[0] >= todayStr)
                    .sort((a, b) => new Date(a.reservationDate) - new Date(b.reservationDate) || (a.startTime || "").localeCompare(b.startTime || ""))
                    .map((appt) => ({
                      ...appt,
                      time: appt.startTime?.slice(0, 5),
                      rawPrice: appt.price,
                      price: appt.price + " AZN",
                      rawStatus: appt.status,
                      status: statusLabel(appt.status),
                    }))}
                  onShowQr={(appt) => { setShowAllReservationsModal(false); setQrModalAppt(appt); }}
                  onPostCare={role === "Customer" ? (appt) => { setShowAllReservationsModal(false); openPostCareGuide(appt); } : undefined}
                  role={role}
                />
              </div>
            </div>
          )}

          {postCareAppt && (
            <div
              onClick={() => setPostCareAppt(null)}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[radial-gradient(circle_at_center,_#FFFFFF_0%,_#FDFBF7_45%,_#F4E7CE_100%)] w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl border border-[#E5D2B1] p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-serif font-bold text-[#1A1714] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#C9A227]" />
                    {t("postcare_modal_title")}
                  </h3>
                  <button
                    onClick={() => setPostCareAppt(null)}
                    className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {postCareStatus === "loading" && (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <Loader2 className="w-8 h-8 text-[#C9A227] animate-spin mb-4" />
                    <p className="text-[#7A6A50] text-sm">{t("postcare_loading")}</p>
                  </div>
                )}

                {postCareStatus === "error" && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-red-500 text-sm mb-4">{t("postcare_error")}</p>
                    <button
                      onClick={() => openPostCareGuide(postCareAppt)}
                      className="px-5 py-2 rounded-full border border-[#B8935A]/40 text-[#6B5D45] text-sm hover:bg-[#B8935A]/10"
                    >
                      {t("style_try_again")}
                    </button>
                  </div>
                )}

                {postCareStatus === "result" && postCareResult && (
                  <div className="space-y-5">
                    <p className="text-sm text-[#6B5D45] italic">{postCareResult.introMessage}</p>

                    {postCareResult.dailyPlan && postCareResult.dailyPlan.length > 0 && (
                      <div className="space-y-2">
                        {postCareResult.dailyPlan.map((day) => (
                          <div key={day.day} className="flex gap-3 bg-white rounded-xl border border-gray-100 p-3">
                            <div className="shrink-0 w-8 h-8 rounded-full bg-[#C9A227]/15 text-[#B8935A] font-bold text-xs flex items-center justify-center">
                              {day.day}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#1A1714]">{day.title}</p>
                              <p className="text-xs text-[#7A6A50] mt-0.5">{day.advice}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {postCareResult.productRecommendations && postCareResult.productRecommendations.length > 0 && (
                      <div>
                        <h4 className="text-xs text-[#B8935A] uppercase tracking-wider mb-2">{t("postcare_products_label")}</h4>
                        <div className="flex flex-wrap gap-2">
                          {postCareResult.productRecommendations.map((p, idx) => (
                            <span key={idx} className="px-3 py-1.5 rounded-full bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#6B5D45] text-xs font-medium">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {postCareResult.thingsToAvoid && postCareResult.thingsToAvoid.length > 0 && (
                      <div>
                        <h4 className="text-xs text-red-400 uppercase tracking-wider mb-2">{t("postcare_avoid_label")}</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {postCareResult.thingsToAvoid.map((a, idx) => (
                            <li key={idx} className="text-xs text-[#6B5D45]">{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <CraftsmanApplicationModal isOpen={showApplicationModal} onClose={() => setShowApplicationModal(false)} />
      <SalonApplicationModal isOpen={showSalonApplicationModal} onClose={() => setShowSalonApplicationModal(false)} />

      {reviewModalSalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[radial-gradient(circle_at_center,_#FFFFFF_0%,_#FDFBF7_45%,_#F4E7CE_100%)] w-full max-w-md rounded-3xl shadow-2xl border border-[#E5D2B1] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-serif font-bold text-lg text-[#1A1714]">{reviewModalSalon.name} - {t("review_modal_write_review")}</h3>
              <button onClick={() => setReviewModalSalon(null)} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[#6B5D45]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider block mb-2">{t("review_modal_which_employee")}</label>
                <select
                  value={reviewEmployeeId}
                  onChange={(e) => setReviewEmployeeId(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                >
                  <option value="">{t("review_modal_salon_only")}</option>
                  {employees.filter((e) => e.salonId === reviewModalSalon?.id).map((e) => (
                    <option key={e.id} value={e.id}>{e.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider block mb-2">{t("review_modal_rating")}</label>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button key={i} type="button" onClick={() => setReviewRating(i + 1)} className="p-1">
                      <Star className={"w-7 h-7 " + (i < reviewRating ? "text-[#C9A227] fill-[#C9A227]" : "text-gray-200 fill-gray-200")} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider block mb-2">{t("review_modal_your_review")}</label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={t("review_modal_placeholder")}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3 bg-gradient-to-r from-[#C9A227] to-[#B8935A] text-[#1A1714] font-bold rounded-xl shadow-md hover:opacity-95 transition"
              >
                {submittingReview ? t("review_modal_sending") : t("review_modal_send")}
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



















