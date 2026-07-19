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
import BookingModal from "../../components/BookingModal";
import api from "../../services/api";

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [salons, setSalons] = useState([]);
  const [salonsLoading, setSalonsLoading] = useState(true);
  const [galleryBySalon, setGalleryBySalon] = useState({});
  const [employees, setEmployees] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewModalSalon, setReviewModalSalon] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [bookingSalon, setBookingSalon] = useState(null);

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
    } catch (err) {
      alert(err.response?.data?.message || "Xeta bas verdi");
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
    hour < 6 ? "Yaxsi geceler" : hour < 12 ? "Sabahiniz xeyir" : hour < 18 ? "Gununuz xeyir" : "Axsaminiz xeyir";
  const dateStr = now.toLocaleDateString("az-AZ", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

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

        const withComments = (Array.isArray(reviewRes.data) ? reviewRes.data : [reviewRes.data]).filter((r) => r?.comment);
        setReviews(withComments.slice(0, 6));
      })
      .catch((err) => console.error("Melumat yuklenmedi", err))
      .finally(() => setSalonsLoading(false));
  }, []);



  const allStats = [
    { id: 1, name: "UMUMI QAZANC", value: "1,450.00 AZN", change: "+12.5%", icon: DollarSign, color: "#C9A227", adminOnly: true },
    { id: 2, name: "AKTIV GORUSLER", value: "24 Seans", change: "+4.3%", icon: Calendar, color: "#B8935A" },
    { id: 3, name: "MUSTERILER", value: "182 Nefer", change: "+18.2%", icon: Users, color: "#1A1714" },
    { id: 4, name: "SALON REYTINQI", value: "4.9 / 5.0", change: "Mukemmel", icon: Star, color: "#C9A227" },
  ];
  const stats = allStats.filter((s) => !s.adminOnly || canSeeRevenue);

  const [allReservations, setAllReservations] = useState([]);

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
        }
        setAllReservations(list);
      })
      .catch((err) => console.error("Rezervasiyalar yuklenmedi", err));
  }, [role, employees]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todaysAppointments = allReservations.filter((r) => r.reservationDate?.split("T")[0] === todayStr);

  const statusLabel = (s) =>
    s === "Confirmed" ? "Tesdiqlenib" : s === "Completed" ? "Tamamlanib" : s === "Cancelled" ? "Legv edilib" : "Gozlenilir";

  const serviceStats = (() => {
    const completed = allReservations.filter((r) => r.status === "Completed");
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

        <div className="relative z-10 space-y-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#B8935A] uppercase tracking-widest block mb-1">
                {greeting}{firstName ? `, ${firstName}` : ""} ?
              </span>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1714] tracking-tight">Idareetme Paneli</h1>
              <p className="text-gray-400 text-xs mt-0.5 font-medium">Salonunuzun gunluk fealiyyeti ve analitikasi.</p>
            </div>

            <div className="bg-white/70 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-sm border border-white/60 text-sm text-gray-700 font-semibold flex items-center gap-3 self-start sm:self-center transition-all hover:shadow-md">
              <div className="p-2 bg-[#C9A227]/10 text-[#C9A227] rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Cari Tarix</div>
                <div className="font-mono text-[#1A1714] capitalize">{dateStr}</div>
              </div>
            </div>
          </div>

          {role === "Customer" && (
          <div className="relative overflow-hidden rounded-2xl bg-[#1A1714] text-white p-6 md:p-8 border border-[#B8935A]/20 shadow-xl transition-all duration-300 hover:shadow-[#1A1714]/10 hover:shadow-2xl group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#C9A227]/20 to-transparent blur-[60px] pointer-events-none rounded-full transition-transform duration-500 group-hover:scale-110" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#F0D68A] text-[10px] font-bold uppercase tracking-widest">
                  <Sparkles className="w-3 h-3 text-[#C9A227]" />
                  Karyera Imkani
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#FAF6F0] leading-tight">
                  Usta olmaq isteyirsiniz?
                </h2>
                <p className="text-gray-400 text-xs md:text-sm leading-relaxed font-light">
                  SalonHub sebekesinde oz ferdi profilinizi yaradin, musterilerinizi qeydiyyata alin, cedvelinizi rahatliqla idare ederek gelirlerinizi qat-qat artirin!
                </p>
              </div>

              <button
                onClick={() => setShowApplicationModal(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#F0D68A] to-[#B8935A] text-[#1A1714] font-bold text-sm rounded-xl hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-[#B8935A]/10 whitespace-nowrap group/btn"
              >
                Muraciet Et
                <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </button>
            </div>
          </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={stat.id}
                  className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-white/60 flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#C9A227]/30 group"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{stat.name}</span>
                    <h3 className="text-2xl font-bold text-[#1A1714] tracking-tight">{stat.value}</h3>
                    <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md inline-block">
                      {stat.change}
                    </span>
                  </div>
                  <div
                    className="p-3.5 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${stat.color}10`, color: stat.color }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white/60 backdrop-blur-lg p-5 rounded-2xl border border-white/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1A1714]">Salonlar</h3>
                <p className="text-xs text-gray-400 font-medium">Sebekemizdeki gozellik salonlari.</p>
              </div>
              <div className="text-gray-300">
                <Scissors className="w-5 h-5 opacity-40 rotate-90" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salonsLoading ? (
                <p className="text-sm text-gray-400 col-span-full">Yuklenir...</p>
              ) : salons.length === 0 ? (
                <p className="text-sm text-gray-400 col-span-full">Hele salon elave edilmeyib.</p>
              ) : (
                salons.map((salon) => (
                  <div
                    key={salon.id}
                    onClick={() => navigate(`/salon/${salon.id}`)}
                    className="bg-white rounded-xl border border-gray-100/70 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-[#C9A227]/20 relative group cursor-pointer"
                  >
                    <div className="h-32 bg-gradient-to-br from-[#1A1714] to-[#3A2E22] relative overflow-hidden">
                      <img
                        src={galleryBySalon[salon.id] || "/craftsman-modal-bg.png"}
                        alt={salon.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = "/craftsman-modal-bg.png"; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {salon.isMonthlyTopSalon && (
                        <div className="absolute top-3 right-3 text-[#C9A227] bg-white/90 rounded-full p-1.5" title="Ayin en yaxsi salonu">
                          <Crown className="w-4 h-4 fill-[#C9A227]" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 space-y-3">
                      <h4 className="font-serif font-bold text-base text-[#1A1714] group-hover:text-[#C9A227] transition-colors">
                        {salon.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        <span>{salon.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <Phone className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        <span className="font-mono">{salon.phoneNumber}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-[#C9A227] font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{salon.averageRating.toFixed(1)}</span>
                          <span className="text-gray-400 font-normal">({salon.reviewCount} rey)</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setBookingSalon(salon); }}
                          className="flex items-center gap-1 text-[10px] font-bold text-white bg-[#C9A227] hover:bg-[#B8935A] px-2.5 py-1 rounded-lg transition"
                        >
                          <CalendarPlus className="w-3 h-3" /> Rezervasiya
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>


          <div className="bg-white/60 backdrop-blur-lg p-5 rounded-2xl border border-white/80 shadow-sm space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1714]">Ustalarimiz</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {employees.map((emp) => (
                <div key={emp.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition">
                  {emp.profileImageUrl ? (
                    <img
                      src={emp.profileImageUrl}
                      alt={emp.fullName}
                      className="w-28 h-28 rounded-full object-cover mx-auto mb-2 border-2 border-[#C9A227]/30"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#F0D68A] to-[#B8935A] flex items-center justify-center mx-auto mb-2 text-[#1A1714] font-bold text-xl">
                      {emp.fullName?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <h5 className="font-serif font-bold text-sm text-[#1A1714] truncate">{emp.fullName}</h5>
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs text-[#C9A227]">
                    <Star className="w-3 h-3 fill-[#C9A227]" />
                    <span>{emp.averageRating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {reviews.length > 0 && (
          <div className="bg-white/60 backdrop-blur-lg p-5 rounded-2xl border border-white/80 shadow-sm space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1A1714]">Musteri Reyleri</h3>
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
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-white/60 lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#1A1714]">Bugunki Gorusler</h3>
                  <p className="text-xs text-gray-400">Son qeydiyyatdan kecen musterilerin siyahisi.</p>
                </div>
                <button className="text-xs font-semibold text-[#C9A227] hover:text-[#B8935A] inline-flex items-center gap-0.5 transition">
                  Hamisina bax <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-50">
                      <th className="py-3 font-medium">Musteri</th>
                      <th className="py-3 font-medium">Xidmet</th>
                      <th className="py-3 font-medium">Saat</th>
                      <th className="py-3 font-medium">Qiymet</th>
                      <th className="py-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-[#1A1714]">
                    {todaysAppointments.length === 0 ? (
                      <tr><td colSpan="5" className="py-8 text-center text-gray-400 text-sm">Bu gun ucun rezervasiya yoxdur.</td></tr>
                    ) : (
                    todaysAppointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 font-medium">{appt.customerFullName}</td>
                        <td className="py-3.5 text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Scissors className="w-3.5 h-3.5 text-gray-400" />
                            {appt.serviceName}
                          </span>
                        </td>
                        <td className="py-3.5 font-mono text-gray-600">{appt.startTime?.slice(0, 5)}</td>
                        <td className="py-3.5 font-semibold text-[#1A1714]">{appt.price} AZN</td>
                        <td className="py-3.5 text-right">
                          <span className={"inline-block px-2.5 py-1 rounded-full text-xs font-medium " + (
                            appt.status === "Confirmed"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : appt.status === "Completed"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : appt.status === "Cancelled"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          )}>
                            {statusLabel(appt.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-white/60 space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-lg font-serif font-bold text-[#1A1714]">En Cox Satilanlar</h3>
                <p className="text-xs text-gray-400">Bu ay en cox teleb olunan xidmetler.</p>
              </div>

              <div className="space-y-4 pt-1">
                {serviceStats.length === 0 ? (
                  <p className="text-xs text-gray-400">Hele tamamlanmis xidmet yoxdur.</p>
                ) : (
                  serviceStats.map((stat, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[#1A1714]">{stat.name}</span>
                        <span className="text-gray-500">{stat.percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#F0D68A] to-[#C9A227] rounded-full" style={{ width: stat.percentage + "%" }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <CraftsmanApplicationModal isOpen={showApplicationModal} onClose={() => setShowApplicationModal(false)} />

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
                    <button key={i} type="button" onClick={() => setReviewRating(i + 1)} className="p-1">
                      <Star className={"w-7 h-7 " + (i < reviewRating ? "text-[#C9A227] fill-[#C9A227]" : "text-gray-200 fill-gray-200")} />
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
    </Layout>
  );
}



























