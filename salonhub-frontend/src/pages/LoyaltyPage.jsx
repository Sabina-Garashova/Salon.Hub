import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import LoyaltyProgram from "../components/LoyaltyProgram";
import api from "../services/api";
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

export default function LoyaltyPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [balances, setBalances] = useState([]);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSalonId, setExpandedSalonId] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setLoading(true);
    api
      .get("/salon")
      .then(async (salonRes) => {
        const salonList = salonRes.data;
        const balancePromises = salonList.map((s) =>
          api.get(`/Loyalty/balance/${s.id}`).catch(() => ({ data: { salonId: s.id, salonName: s.name, points: 0, equivalentDiscount: 0 } }))
        );
        const results = await Promise.all(balancePromises);
        setBalances(results.map((r) => r.data));

        try {
          const refRes = await api.get("/Auth/my-referral-code");
          setReferralCode(refRes.data.referralCode);
        } catch {}

        const token = localStorage.getItem("token");
        const decoded = token ? decodeToken(token) : null;
        const myUserId = decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded?.sub;
        const resvRes = await api.get("/Reservation");
        setReservations(resvRes.data.filter((r) => r.customerId === myUserId));
      })
      .catch((err) => console.error("Loyalty məlumatı yüklənmədi", err))
      .finally(() => setLoading(false));
  }, []);

  const handleViewHistory = async (salonId) => {
    if (expandedSalonId === salonId) {
      setExpandedSalonId(null);
      return;
    }
    setExpandedSalonId(salonId);
    try {
      const res = await api.get(`/Loyalty/history/${salonId}`);
      setHistory(res.data);
    } catch {
      setHistory([]);
    }
  };

  const handleRedeem = async (salonId, discountAmount, reservationId) => {
    try {
      const res = await api.post("/Loyalty/redeem", {
        salonId,
        discountAmount,
        reservationId: reservationId ? Number(reservationId) : null,
      });
      alert(`${t("loy_redeem_success")} ${res.data.remainingPoints}`);
      setBalances((prev) =>
        prev.map((b) => (b.salonId === salonId ? { ...b, points: res.data.remainingPoints } : b))
      );
    } catch (err) {
      alert(err.response?.data?.message || t("home_review_error"));
    }
  };

  return (
    <Layout>
      <div className="-m-6">
        <LoyaltyProgram
          balances={balances}
          history={history}
          expandedSalonId={expandedSalonId}
          onViewHistory={handleViewHistory}
          onRedeem={handleRedeem}
          isLoading={loading}
          onBookNow={() => navigate("/dashboard")}
          reservations={reservations}
        />

        {referralCode && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
            <div className="bg-gradient-to-r from-[#1A1714] to-[#2D2622] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#B8935A]/20">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#B8935A] font-semibold mb-1">{t("loy_referral_title")}</p>
                <p className="text-2xl font-serif font-bold text-[#F0D68A] tracking-wider">{referralCode}</p>
                <p className="text-xs text-gray-400 mt-1">{t("loy_referral_desc")}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-5 py-2.5 bg-[#C9A227] text-[#1A1714] rounded-xl text-sm font-bold hover:bg-[#F0D68A] transition whitespace-nowrap"
              >
                {copied ? t("loy_copied") : t("loy_copy")}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
