import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import LoyaltyProgram from "../components/LoyaltyProgram";
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

export default function LoyaltyPage() {
  const navigate = useNavigate();
  const [balances, setBalances] = useState([]);
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

        const token = localStorage.getItem("token");
        const decoded = token ? decodeToken(token) : null;
        const myUserId = decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded?.sub;
        const resvRes = await api.get("/Reservation");
        setReservations(resvRes.data.filter((r) => r.customerId === myUserId));
      })
      .catch((err) => console.error("Loyalty melumati yuklenmedi", err))
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
      alert(`Ugurla istifade edildi! Qalan bal: ${res.data.remainingPoints}`);
      setBalances((prev) =>
        prev.map((b) => (b.salonId === salonId ? { ...b, points: res.data.remainingPoints } : b))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Xeta bas verdi");
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
      </div>
    </Layout>
  );
}
