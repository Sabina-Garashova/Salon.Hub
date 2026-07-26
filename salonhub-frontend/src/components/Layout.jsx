import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { LogOut, LayoutDashboard, Calendar, Gift, Sparkles, ShieldCheck, Bell, Check, CheckCheck } from "lucide-react";
import api from "../services/api";

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
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const decoded = token ? decodeToken(token) : null;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    api.get("/Notification/unread-count").then((res) => setUnreadCount(res.data.count)).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleNotifications = async () => {
    if (!isNotifOpen) {
      try {
        const res = await api.get("/Notification/mine");
        setNotifications(res.data);
      } catch {
        // sakit ucur
      }
    }
    setIsNotifOpen(!isNotifOpen);
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/Notification/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // sakit ucur
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post("/Notification/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // sakit ucur
    }
  };

  const formatTime = (dateStr) => {
    const utcStr = dateStr.endsWith("Z") ? dateStr : dateStr + "Z";
    const date = new Date(utcStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "indi";
    if (diffMin < 60) return `${diffMin} deq evvel`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} saat evvel`;
    return date.toLocaleDateString("az-AZ", { day: "numeric", month: "short" });
  };

  const fullName =
    decoded?.["FullName"] ||
    decoded?.name ||
    decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
    "Istifadeci";

  const role =
    decoded?.role ||
    decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    "Customer";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  const navItems = [
    { label: "Ana Sehife", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Loyalty", icon: Gift, path: "/loyalty" },
    ...(role === "SalonAdmin" || role === "SuperAdmin"
      ? [{ label: "Admin Panel", icon: ShieldCheck, path: "/admin" }]
      : []),
    ...(role === "SuperAdmin"
      ? [{ label: "Butun Rezervasiyalar", icon: Calendar, path: "/admin", state: { tab: "AllReservations" } }]
      : []),
    ...(role === "Employee"
      ? [{ label: "Usta Kabineti", icon: Calendar, path: "/employee-dashboard" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <header className="bg-gradient-to-r from-[#1A1714] via-[#2B2118] to-[#1A1714] border-b border-[#B8935A]/20 shadow-lg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C9A227]" />
              <h1 className="text-xl font-serif font-bold text-[#F4EDE0] tracking-wide">SalonHub</h1>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.label}
                    disabled={item.disabled}
                    onClick={() => !item.disabled && navigate(item.path, item.state ? { state: item.state } : undefined)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      active
                        ? "bg-[#C9A227]/15 text-[#F0D68A]"
                        : item.disabled
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-gray-300 hover:text-[#F0D68A] hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {item.disabled && (
                      <span className="text-[10px] text-gray-500 border border-gray-600 rounded px-1">tezlikle</span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
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
                      <h4 className="text-sm font-serif font-bold text-[#1A1714]">Bildirisler</h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="flex items-center gap-1 text-[10px] font-semibold text-[#B8935A] hover:text-[#C9A227] transition"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Hamisini oxu
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-xs text-gray-400">
                          Hec bir bildiris yoxdur.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-gray-50 flex items-start gap-2.5 transition ${
                              n.isRead ? "bg-white" : "bg-amber-50/50"
                            }`}
                          >
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] mt-1.5 flex-shrink-0" />
                            )}
                            <div className={`flex-1 min-w-0 ${n.isRead ? "pl-4" : ""}`}>
                              <p className="text-xs text-gray-700 leading-relaxed">{n.message}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] text-gray-400">{formatTime(n.createdAt)}</span>
                                {!n.isRead && (
                                  <button
                                    onClick={() => markAsRead(n.id)}
                                    className="flex items-center gap-0.5 text-[10px] text-[#B8935A] hover:text-[#C9A227] font-medium transition"
                                  >
                                    <Check className="w-3 h-3" /> Oxundu
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
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F0D68A] to-[#B8935A] flex items-center justify-center text-[#1A1714] font-bold text-xs">
                  {getInitials(fullName)}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-[#F4EDE0] leading-tight">{fullName}</p>
                  <span className="text-[11px] text-[#C9A227] uppercase tracking-wide">{role}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Cixis"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cixis</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}
















