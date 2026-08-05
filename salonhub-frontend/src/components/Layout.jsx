import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { LogOut, LayoutDashboard, Calendar, Gift, Sparkles, ShieldCheck, Bell, Check, CheckCheck, Building2, Users, Newspaper, Star, X, Mail, Phone, User, CreditCard } from "lucide-react";
import api from "../services/api";
import LanguageSwitcher from "./LanguageSwitcher";
import ChatBookingWidget from "./ChatBookingWidget";
import { useLanguage } from "../context/LanguageContext";

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

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Layout({ children }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const token = sessionStorage.getItem("token");
  const decoded = token ? decodeToken(token) : null;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [myProfileImageUrl, setMyProfileImageUrl] = useState(null);
  const [isLogoLightboxOpen, setIsLogoLightboxOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [myPhoneNumber, setMyPhoneNumber] = useState(null);
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [cardDraft, setCardDraft] = useState("");
  const notifRef = useRef(null);

  const formatCardNumberInput = (digitsOnly) => digitsOnly.match(/.{1,4}/g)?.join(" ") || "";

  const handleCardDraftChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 16);
    setCardDraft(formatCardNumberInput(digitsOnly));
  };

  const saveCardDraft = () => {
    const digitsOnly = cardDraft.replace(/\D/g, "");
    if (digitsOnly.length !== 16 || !myUserIdForCard) return;
    localStorage.setItem("salonhub_saved_card_number_" + myUserIdForCard, cardDraft);
    setIsEditingCard(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    api.get("/Notification/unread-count")
      .then((res) => setUnreadCount(res.data?.count || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const userRole = decoded?.role || decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "Customer";
    const userId = decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded?.sub;
    if (userRole !== "Employee" || !userId) return;
    api.get("/Employee")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.$values || []);
        const mine = list.find((e) => e.applicationUserId === userId);
        if (mine?.profileImageUrl) setMyProfileImageUrl(mine.profileImageUrl);
        if (mine?.phoneNumber) setMyPhoneNumber(mine.phoneNumber);
      })
      .catch(() => {});
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/Notification/mine");
      setNotifications(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const translateNotifText = (n) => {
    if (!n?.typeKey) return n?.message || "";
    let template = t(n.typeKey);
    try {
      const params = n.paramsJson ? JSON.parse(n.paramsJson) : {};
      Object.keys(params).forEach((key) => {
        template = template.replaceAll("{" + key + "}", params[key]);
      });
    } catch {}
    return template;
  };

  const toggleNotifications = () => {
    if (!isNotifOpen) {
      fetchNotifications();
    }
    setIsNotifOpen(!isNotifOpen);
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/Notification/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post("/Notification/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      markAsRead(n.id);
    }
  };


  const formatTime = (dateInput) => {
    if (!dateInput) return "";
    const utcInput = typeof dateInput === "string" && !dateInput.endsWith("Z") && !dateInput.includes("+") ? dateInput + "Z" : dateInput;
    const date = new Date(utcInput);
    if (isNaN(date.getTime())) return dateInput;
    const diffSec = Math.floor((new Date() - date) / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (language === "en") {
      if (diffMin < 1) return "just now";
      if (diffMin < 60) return `${diffMin} mins ago`;
      if (diffHour < 24) return `${diffHour} hours ago`;
      return `${diffDay} days ago`;
    } else if (language === "ru") {
      if (diffMin < 1) return "только что";
      if (diffMin < 60) return `${diffMin} мин. назад`;
      if (diffHour < 24) return `${diffHour} ч. назад`;
      return `${diffDay} дн. назад`;
    } else {
      if (diffMin < 1) return "indi";
      if (diffMin < 60) return `${diffMin} dəq əvvəl`;
      if (diffHour < 24) return `${diffHour} saat əvvəl`;
      return `${diffDay} gün əvvəl`;
    }
  };

  const fullName =
    decoded?.["FullName"] ||
    decoded?.name ||
    decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
    "İstifadəçi";

  const role =
    decoded?.role ||
    decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    "Customer";

  const myEmail =
    decoded?.email ||
    decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
    "";

  const myUserIdForCard = decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded?.sub;
  const savedCardNumber = myUserIdForCard ? (localStorage.getItem("salonhub_saved_card_number_" + myUserIdForCard) || "") : "";

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    navigate("/auth");
  };

  const navItems = [
    { label: t("nav_home"), icon: LayoutDashboard, path: "/dashboard" },
    { label: t("nav_loyalty"), icon: Gift, path: "/loyalty" },
    { label: t("home_our_salons"), icon: Building2, scrollId: "salons-section" },
    { label: t("home_our_masters"), icon: Users, scrollId: "masters-section" },
    { label: t("news_title"), icon: Newspaper, scrollId: "news-section" },
    { label: t("home_customer_reviews"), icon: Star, scrollId: "reviews-section" },
    ...(role === "SalonAdmin" || role === "SuperAdmin"
      ? [{ label: t("nav_admin"), icon: ShieldCheck, path: "/admin" }]
      : []),
    ...(role === "Employee"
      ? [{ label: t("nav_employee_cabinet"), icon: Calendar, path: "/employee-dashboard" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#FAF6F0] relative">
      <div
        className="fixed inset-0 pointer-events-none bg-cover bg-center opacity-60"
        style={{ backgroundImage: "url('/page-bg-tools.webp')" }}
      />
      <div className="relative z-10">
      <header className="bg-gradient-to-r from-[#1A1714] via-[#2B2118] to-[#1A1714] border-b border-[#B8935A]/20 shadow-lg">
        <div className="max-w-[1800px] mx-auto px-4 xl:px-8">
          <div className="flex items-center justify-between min-h-16 py-2 gap-4 flex-wrap xl:flex-nowrap">
            <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => navigate("/dashboard")}>
              <div
                onClick={(e) => { e.stopPropagation(); setIsLogoLightboxOpen(true); }}
                className="w-8 h-8 rounded-full border border-[#C9A227] overflow-hidden bg-gradient-to-br from-[#1A1714] to-[#2A2420] shrink-0 cursor-zoom-in hover:scale-105 transition-transform"
              >
                <img src="/logo-mark.png" alt="SalonHub" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-xl font-serif font-bold text-[#F4EDE0] tracking-wide whitespace-nowrap">SalonHub</h1>
            </div>

            <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 flex-wrap justify-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = !item.scrollId && location.pathname === item.path;
                const handleClick = () => {
                  if (item.disabled) return;
                  if (item.scrollId) {
                    if (location.pathname === "/dashboard") {
                      const el = document.getElementById(item.scrollId);
                      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 16, behavior: "smooth" });
                    } else {
                      navigate("/dashboard", { state: { scrollTo: item.scrollId } });
                    }
                  } else {
                    navigate(item.path, item.state ? { state: item.state } : undefined);
                  }
                };
                return (
                  <button
                    key={item.label}
                    disabled={item.disabled}
                    onClick={handleClick}
                    className={
                      "flex items-center gap-1.5 px-2.5 lg:px-3.5 py-2 rounded-lg text-[13px] lg:text-sm font-medium transition whitespace-nowrap " +
                      (active
                        ? "bg-[#C9A227]/15 text-[#F0D68A]"
                        : item.disabled
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-gray-300 hover:text-[#F0D68A] hover:bg-white/5")
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3 shrink-0">
              <LanguageSwitcher />
              <div className="relative" ref={notifRef}>
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 rounded-lg text-gray-300 hover:text-[#F0D68A] hover:bg-white/10 transition"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#C9A227] text-[#1A1714] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-[#FAF6F0]">
                      <h4 className="text-sm font-serif font-bold text-[#1A1714]">{t("nav_notifications")}</h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="flex items-center gap-1 text-[10px] font-semibold text-[#B8935A] hover:text-[#C9A227] transition"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> {t("nav_mark_all_read")}
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-xs text-gray-400">
                          {t("nav_no_notifications")}
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`px-4 py-3 border-b border-gray-50 flex items-start gap-2.5 transition cursor-pointer hover:bg-amber-100/40 ${
                              n.isRead ? "bg-white" : "bg-amber-50/50"
                            }`}
                          >
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] mt-1.5 flex-shrink-0" />
                            )}
                            <div className={`flex-1 min-w-0 ${n.isRead ? "pl-4" : ""}`}>
                              <p className="text-xs text-gray-700 leading-relaxed">{translateNotifText(n)}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] text-gray-400">{formatTime(n.createdAt)}</span>
                                {!n.isRead && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                    className="flex items-center gap-0.5 text-[10px] text-[#B8935A] hover:text-[#C9A227] font-medium transition"
                                  >
                                    <Check className="w-3 h-3" /> {t("nav_read")}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="hidden sm:flex items-center gap-2.5 rounded-lg px-1.5 py-1 hover:bg-white/10 transition"
              >
                {myProfileImageUrl ? (
                  <img
                    src={myProfileImageUrl}
                    alt={fullName}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-[#C9A227]/40"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F0D68A] to-[#B8935A] flex items-center justify-center text-[#1A1714] font-bold text-xs">
                    {getInitials(fullName)}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-[#F4EDE0] leading-tight">{fullName}</p>
                  <span className="text-[11px] text-[#C9A227] uppercase tracking-wide">{t("role_" + role.toLowerCase())}</span>
                </div>
              </button>
              <button
                onClick={handleLogout}
                title={t("nav_logout")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t("nav_logout")}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-4 xl:p-6">{children}</main>

      <footer className="bg-gradient-to-r from-[#1A1714] via-[#2B2118] to-[#1A1714] border-t border-[#B8935A]/20 mt-6">
        <div className="max-w-[1800px] mx-auto px-4 xl:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-[#C9A227]" />
                <h3 className="text-lg font-serif font-bold text-[#F4EDE0]">SalonHub</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{t("footer_tagline")}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#C9A227] uppercase tracking-wide mb-3">{t("footer_quick_links")}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {navItems.slice(0, 4).map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      disabled={item.disabled}
                      onClick={() => {
                        if (item.disabled) return;
                        if (item.scrollId) {
                          if (location.pathname === "/dashboard") {
                            const el = document.getElementById(item.scrollId);
                            if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 16, behavior: "smooth" });
                          } else {
                            navigate("/dashboard", { state: { scrollTo: item.scrollId } });
                          }
                        } else {
                          navigate(item.path, item.state ? { state: item.state } : undefined);
                        }
                      }}
                      className="hover:text-[#F0D68A] transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#C9A227] uppercase tracking-wide mb-3">{t("footer_account")}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button type="button" onClick={() => setIsProfileModalOpen(true)} className="hover:text-[#F0D68A] transition">
                    {t("profile_modal_title")}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={handleLogout} className="hover:text-[#F0D68A] transition">
                    {t("nav_logout")}
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#C9A227] uppercase tracking-wide mb-3">{t("footer_contact")}</h4>
              <p className="text-sm text-gray-400">info@salonhub.com</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-[#B8935A]/10 text-center text-xs text-gray-500">
            {t("footer_rights")}
          </div>
        </div>
      </footer>
      </div>

      {isLogoLightboxOpen && (
        <div
          onClick={() => setIsLogoLightboxOpen(false)}
          className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-6 cursor-zoom-out"
        >
          <img
            src="/logo-mark.png"
            alt="SalonHub"
            className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl object-contain border border-[#C9A227]/40"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setIsLogoLightboxOpen(false)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl"
          >
            ✕
          </button>
        </div>
      )}

      {isProfileModalOpen && (
        <div
          onClick={() => setIsProfileModalOpen(false)}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[radial-gradient(circle_at_center,_#FFFFFF_0%,_#FDFBF7_45%,_#F4E7CE_100%)] w-full max-w-sm rounded-3xl shadow-2xl border border-[#E5D2B1] overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-serif font-bold text-lg text-[#1A1714]">{t("profile_modal_title")}</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[#6B5D45]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center gap-2 pb-2">
                {myProfileImageUrl ? (
                  <img src={myProfileImageUrl} alt={fullName} className="w-16 h-16 rounded-full object-cover ring-2 ring-[#C9A227]/40" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F0D68A] to-[#B8935A] flex items-center justify-center text-[#1A1714] font-bold text-lg">
                    {getInitials(fullName)}
                  </div>
                )}
                <p className="font-serif font-bold text-[#1A1714]">{fullName}</p>
                <span className="text-[11px] text-[#C9A227] uppercase tracking-wide font-semibold">{t("role_" + role.toLowerCase())}</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF6F0] border border-gray-100">
                <User className="w-4 h-4 text-[#C9A227] shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">{t("profile_modal_name")}</p>
                  <p className="text-sm text-[#1A1714] font-medium">{fullName}</p>
                </div>
              </div>

              {myEmail && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF6F0] border border-gray-100">
                  <Mail className="w-4 h-4 text-[#C9A227] shrink-0" />
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide">{t("profile_modal_email")}</p>
                    <p className="text-sm text-[#1A1714] font-medium">{myEmail}</p>
                  </div>
                </div>
              )}

              {myPhoneNumber && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF6F0] border border-gray-100">
                  <Phone className="w-4 h-4 text-[#C9A227] shrink-0" />
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide">{t("profile_modal_phone")}</p>
                    <p className="text-sm text-[#1A1714] font-medium">{myPhoneNumber}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF6F0] border border-gray-100">
                <ShieldCheck className="w-4 h-4 text-[#C9A227] shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">{t("profile_modal_role")}</p>
                  <p className="text-sm text-[#1A1714] font-medium">{t("role_" + role.toLowerCase())}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF6F0] border border-gray-100">
                {isEditingCard ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-[#C9A227] shrink-0" />
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide">{t("profile_modal_card")}</p>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      value={cardDraft}
                      onChange={handleCardDraftChange}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setIsEditingCard(false); setCardDraft(""); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100"
                      >
                        {t("common_close")}
                      </button>
                      <button
                        type="button"
                        disabled={cardDraft.replace(/\D/g, "").length !== 16}
                        onClick={saveCardDraft}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#C9A227] text-[#1A1714] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {t("profile_modal_card_save")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-[#C9A227] shrink-0" />
                      <div>
                        <p className="text-[11px] text-gray-400 uppercase tracking-wide">{t("profile_modal_card")}</p>
                        <p className="text-sm text-[#1A1714] font-medium tracking-wider">
                          {savedCardNumber || t("profile_modal_card_none")}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setCardDraft(savedCardNumber || ""); setIsEditingCard(true); }}
                      className="text-xs font-semibold text-[#B8935A] hover:text-[#C9A227] transition shrink-0"
                    >
                      {savedCardNumber ? t("profile_modal_card_change") : t("profile_modal_card_add")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {role === "Customer" && <ChatBookingWidget />}
    </div>
  );
}