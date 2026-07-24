import { useState, useEffect } from "react";
import Layout from "./Layout";
import jsQR from "jsqr";
import ReviewsManagement from "./admin/ReviewsManagement";
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

export default function EmployeeDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [myEmployeeId, setMyEmployeeId] = useState(null);

  const [mySalonId, setMySalonId] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [checkInResult, setCheckInResult] = useState(null);
  const [reviews, setReviews] = useState([]);

  const handleRespondReview = async (id, response) => {
    await api.post(`/Review/${id}/respond`, { response });
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, response } : r)));
  };

  const performCheckIn = async (code) => {
    if (!mySalonId) return;
    setScanning(true);
    setCheckInResult(null);
    try {
      const token3 = localStorage.getItem("token");
      const res = await fetch("https://localhost:7289/api/CheckIn/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token3 ? `Bearer ${token3}` : "",
        },
        body: JSON.stringify({ checkInCode: code, salonId: mySalonId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.title || "Xeta kodu: " + res.status);
      setCheckInResult(data.reservation || null);
      setQrCode("");
      fetchEmployeeAppointments();
    } catch (err) {
      alert(err.message || "Xeta bas verdi");
    } finally {
      setScanning(false);
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    await performCheckIn(qrCode);
  };

  const handleQrImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height);
        if (result?.data) {
          performCheckIn(result.data);
        } else {
          alert("QR kod tapilmadi, sekli aydin cekib yenidan yukleyin.");
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const resolveMyEmployeeId = async () => {
    const token = localStorage.getItem("token");
    const decoded = token ? decodeToken(token) : null;
    const userId = decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded?.sub;

    const res = await fetch("https://localhost:7289/api/Employee", {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });
    const employees = await res.json();
    const me = employees.find((e) => e.applicationUserId === userId);
    return me?.id || null;
  };

  const fetchEmployeeAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const employeeId = myEmployeeId || (await resolveMyEmployeeId());
      if (!employeeId) {
        setError("Bu hesaba bagli isci qeydi tapilmadi.");
        setAppointments([]);
        return;
      }
      setMyEmployeeId(employeeId);

      const token2 = localStorage.getItem("token");
      const empRes2 = await fetch("https://localhost:7289/api/Employee", {
        headers: { Authorization: token2 ? `Bearer ${token2}` : "" },
      });
      const allEmps = await empRes2.json();
      const meFull = allEmps.find((e) => e.id === employeeId);
      if (meFull?.salonId) setMySalonId(meFull.salonId);

      try {
        const revRes = await api.get("/Review");
        setReviews(revRes.data.filter((r) => r.employeeId === employeeId));
      } catch {}

      const token = localStorage.getItem("token");
      const response = await fetch(`https://localhost:7289/api/Reservation/employee?employeeId=${employeeId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });

      if (!response.ok) {
        throw new Error(`Server xətası: ${response.status}`);
      }

      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Dashboard Error:", err);
      setError(err.message || "Rezervasiyaları yükləmək mümkün olmadı.");
    } finally {
      setLoading(false);
    }
  };

  // --- REAL BACKEND STATUS DƏYİŞMƏ FUNKSİYASI ---
  const handleStatusAction = async (id, action) => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem("token");
      
      // Backend POST metodu və /{id}/confirm, /{id}/cancel, /{id}/complete gözləyir
      let url = `https://localhost:7289/api/Reservation/${id}/${action}`;
      let options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        }
      };

      // Əgər ləğv ediriksə, backend [FromBody] string reason gözləyir
      if (action === "cancel") {
        options.body = JSON.stringify("Usta tərəfindən ləğv edildi");
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        let serverMessage = `Xeta kodu: ${response.status}`;
        try {
          const errData = await response.json();
          serverMessage = errData.message || errData.title || serverMessage;
        } catch {}
        throw new Error(serverMessage);
      }

      // Ekranda statusu anlıq dəyişmək üçün state-i yeniləyirik
      const statusMap = {
        confirm: "Confirmed",
        complete: "Completed",
        cancel: "Cancelled"
      };

      setAppointments(prev => 
        prev.map(app => app.id === id ? { ...app, status: statusMap[action] } : app)
      );

    } catch (err) {
      alert("Status yenilənərkən xəta oldu: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchEmployeeAppointments();
  }, []);

  const totalRevenue = appointments
    .filter(app => app?.status === "Completed" || app?.status === "Confirmed")
    .reduce((sum, app) => sum + (Number(app?.price) || 0), 0);

  const activeBookings = appointments.filter(app => app?.status === "Pending" || app?.status === "Confirmed").length;

  const completedApps = appointments.filter((app) => app?.status === "Completed");
  const cardRevenue = completedApps.filter((app) => app?.paymentMethod !== "LoyaltyPoints").reduce((sum, app) => sum + (Number(app?.price) || 0), 0);
  const loyaltyRevenue = completedApps.filter((app) => app?.paymentMethod === "LoyaltyPoints").reduce((sum, app) => sum + (Number(app?.price) || 0), 0);

  return (
    <Layout>
    <div className="min-h-screen bg-[#FAF6F0] p-4 md:p-8 text-[#1A1714] font-sans -m-6">
      <div className="max-w-5xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1A1714]">Usta Kabineti</h1>
          <p className="text-sm text-gray-500 mt-1">Gündəlik iş qrafiki və aktiv rezervasiyalarınız</p>
        </div>
        <button 
          onClick={fetchEmployeeAppointments}
          className="flex items-center gap-2 bg-[#1A1714] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#B8935A] transition shadow-md"
        >
          🔄 Yenilə
        </button>
      </div>

      <div className="max-w-5xl mx-auto mb-8 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">QR Check-in</h3>
        <form onSubmit={handleScanSubmit} className="flex gap-3">
          <input
            type="text"
            required
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            placeholder="Musterinin QR kodunu daxil edin ve ya yapisdirin"
            className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
          />
          <button
            type="submit"
            disabled={scanning}
            className="px-5 py-2.5 bg-gradient-to-r from-[#B8935A] to-[#C9A227] text-white rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {scanning ? "Yoxlanilir..." : "Check-in Et"}
          </button>
        <label className="mt-3 inline-flex px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-600 cursor-pointer items-center gap-1.5">
          Sekil Yukle
          <input type="file" accept="image/*" capture="environment" onChange={handleQrImageUpload} className="hidden" />
        </label>
        </form>
        {checkInResult && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Check-in ugurlu</p>
            <p className="text-sm font-semibold text-[#1A1714]">{checkInResult.customerFullName || "Musteri"}</p>
            <p className="text-xs text-gray-600 mt-0.5">{checkInResult.serviceName} - {checkInResult.reservationDate?.split("T")[0]} {checkInResult.startTime?.slice(0,5)}</p>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto mb-8">
        <ReviewsManagement reviews={reviews} onRespond={handleRespondReview} />
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl text-xl">📅</div>
          <div>
            <span className="text-xs text-gray-400 block font-semibold tracking-wider">AKTİV REZERVASİYA</span>
            <span className="text-2xl font-serif font-bold text-[#1A1714]">{activeBookings} seans</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl">💰</div>
          <div>
            <span className="text-xs text-gray-400 block font-semibold tracking-wider">ÜMUMİ GƏLİR</span>
            <span className="text-2xl font-serif font-bold text-emerald-600">{totalRevenue} AZN</span>
          </div>
            <div className="flex items-center gap-2 mt-1.5 text-[10px]">
              <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Kartla: {cardRevenue} AZN</span>
              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Bal ile: {loyaltyRevenue} AZN</span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-gray-50 text-gray-600 rounded-xl text-xl">✂️</div>
          <div>
            <span className="text-xs text-gray-400 block font-semibold tracking-wider">ÜMUMİ SİFARİŞ</span>
            <span className="text-2xl font-serif font-bold text-[#1A1714]">{appointments.length} seans</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-[#1A1714] text-white">
          <h3 className="font-serif font-bold text-lg text-[#F0D68A]">Rezervasiya Cədvəli</h3>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500 font-medium">Siyahı yüklənir...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl">
              <span>⚠️</span>
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-base font-semibold text-[#1A1714]/70">Hələ ki heç bir rezervasiyanız yoxdur.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((app) => (
                <div 
                  key={app?.id} 
                  className={`p-5 rounded-xl border transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:shadow-md ${
                    app?.status === "Cancelled" ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-gray-200 hover:border-[#B8935A]/50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                    <div className="p-3 bg-[#FAF6F0] text-xl rounded-xl flex-shrink-0">👤</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-sans font-bold text-base text-[#1A1714]">
                          {app?.customerFullName || app?.customerName || app?.customer?.fullName || "Müştəri"}
                        </h4>
                        <span className="text-gray-400 hidden sm:inline">▶</span>
                        <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                          ✂️ {app?.serviceName || "Xidmət"}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1.5 font-medium">
                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                          📅 {app?.reservationDate ? app.reservationDate.split("T")[0] : "Tarix yoxdur"}
                        </span>
                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                          🕒 {app?.startTime ? app.startTime.slice(0, 5) : "00:00"}
                        </span>
                        <span className="text-gray-400">({app?.durationMinutes || 0} dəq)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
                    <div className="text-left lg:text-right min-w-[100px]">
                      <span className="text-xs text-gray-400 block font-semibold tracking-wider">XİDMƏT HAQQI</span>
                      <span className="text-lg font-serif font-bold text-[#C9A227]">{app?.price || 0} AZN</span>
                      <span className={"mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full " + (app?.paymentMethod === "LoyaltyPoints" ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-gray-600")}>
                        {app?.paymentMethod === "LoyaltyPoints" ? "Bal ile" : app?.paymentMethod === "Cash" ? "Naqd" : "Kartla"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {actionLoading === app.id ? (
                        <div className="w-5 h-5 border-2 border-[#1A1714] border-t-transparent rounded-full animate-spin mx-4"></div>
                      ) : (
                        <>
                          {app?.status === "Cancelled" && (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600">Ləğv edilib</span>
                          )}
                          {app?.status === "Confirmed" && (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700">Təsdiqlənib</span>
                          )}
                          {app?.status === "Completed" && (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">Tamamlanıb ✅</span>
                          )}
                          {(app?.status === "Pending" || app?.status === "Gözləmədə") && (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700">Gözləmədə</span>
                          )}

                          {app?.status !== "Cancelled" && app?.status !== "Completed" && (
                            <div className="flex items-center gap-1 ml-2 border-l pl-2 border-gray-200">
                              {app?.status !== "Confirmed" && (
                                <button 
                                  onClick={() => handleStatusAction(app.id, "confirm")}
                                  className="p-1 px-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition animate-pulse"
                                >
                                  ✔ Təsdiqlə
                                </button>
                              )}
                              <button 
                                onClick={() => handleStatusAction(app.id, "complete")}
                                className="p-1 px-2 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium transition"
                              >
                                🏁 Tamamla
                              </button>
                              <button 
                                onClick={() => handleStatusAction(app.id, "cancel")}
                                className="p-1 px-2 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 font-medium transition"
                              >
                                ❌
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </Layout>
  );
}






