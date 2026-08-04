import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { LogOut, LayoutDashboard, Calendar, Gift, Sparkles, ShieldCheck, Bell, Check, CheckCheck, Building2, Users, Newspaper, Star } from "lucide-react";
import api from "../services/api";
import LanguageSwitcher from "./LanguageSwitcher";
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
  const token = localStorage.getItem("token");
  const decoded = token ? decodeToken(token) : null;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [myProfileImageUrl, setMyProfileImageUrl] = useState(null);
  const notifRef = useRef(null);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
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
        style={{ backgroundImage: "url('/page-bg-tools.png')" }}
      />
      <div className="relative z-10">
      <header className="bg-gradient-to-r from-[#1A1714] via-[#2B2118] to-[#1A1714] border-b border-[#B8935A]/20 shadow-lg">
        <div className="max-w-[1800px] mx-auto px-4 xl:px-8">
          <div className="flex items-center justify-between min-h-16 py-2 gap-4 flex-wrap xl:flex-nowrap">
            <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => navigate("/dashboard")}>
              <Sparkles className="w-5 h-5 text-[#C9A227]" />
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

              <div className="hidden sm:flex items-center gap-2.5">
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
              </div>
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
      </div>
    </div>
  );
}