import { useState, useEffect } from "react";
import Layout from "./Layout";
import jsQR from "jsqr";
import ReviewsManagement from "./admin/ReviewsManagement";
import NewsManagement from "./admin/NewsManagement";
import api from "../services/api";
import { Calendar, MessageSquare, Wrench, AlertCircle, Scissors, Newspaper } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("reservations");
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
  const [assignedEquipment, setAssignedEquipment] = useState(null);
  const [news, setNews] = useState([]);
  const [salons, setSalons] = useState([]);

  const handleRespondReview = async (id, response) => {
    await api.post(`/Review/${id}/respond`, { response });
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, response } : r)));
  };
  const handleCreateNews = async (payload) => {
    await api.post("/News", { ...payload, authorEmployeeId: myEmployeeId });
    const res = await api.get("/News");
    setNews(res.data);
  };
  const handleEditNews = async (id, payload) => {
    await api.put(`/News/${id}`, payload);
    const res = await api.get("/News");
    setNews(res.data);
  };
  const handleDeleteNews = async (id) => {
    await api.delete(`/News/${id}`);
    setNews((prev) => prev.filter((n) => n.id !== id));
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

      if (meFull?.assignedEquipmentId) {
        try {
          const eqRes = await api.get(`/Equipment/${meFull.assignedEquipmentId}`);
          setAssignedEquipment(eqRes.data);
        } catch {
          setAssignedEquipment(null);
        }
      } else {
        setAssignedEquipment(null);
      }

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
        throw new Error(`Server xetasi: ${response.status}`);
      }

      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Dashboard Error:", err);
      setError(err.message || "Rezervasiyalari yuklemek mumkun olmadi.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusAction = async (id, action) => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem("token");
      let url = `https://localhost:7289/api/Reservation/${id}/${action}`;
      let options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        }
      };

      if (action === "cancel") {
        options.body = JSON.stringify("Usta terefinden legv edildi");
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

      const statusMap = {
        confirm: "Confirmed",
        complete: "Completed",
        cancel: "Cancelled"
      };

      setAppointments(prev =>
        prev.map(app => app.id === id ? { ...app, status: statusMap[action] } : app)
      );

    } catch (err) {
      alert("Status yenilenerken xeta oldu: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchEmployeeAppointments();
  }, []);

  useEffect(() => {
    api.get("/News").then((res) => setNews(res.data)).catch(() => {});
    api.get("/salon").then((res) => setSalons(res.data)).catch(() => {});
  }, []);

  const totalRevenue = appointments
    .filter(app => app?.status === "Completed" || app?.status === "Confirmed")
    .reduce((sum, app) => sum + (Number(app?.price) || 0), 0);

  const activeBookings = appointments.filter(app => app?.status === "Pending" || app?.status === "Confirmed").length;

  const completedApps = appointments.filter((app) => app?.status === "Completed");
  const cardRevenue = completedApps.filter((app) => app?.paymentMethod !== "LoyaltyPoints").reduce((sum, app) => sum + (Number(app?.price) || 0), 0);
  const loyaltyRevenue = completedApps.filter((app) => app?.paymentMethod === "LoyaltyPoints").reduce((sum, app) => sum + (Number(app?.price) || 0), 0);

  const getEquipmentStatusBadge = (status) => {
    switch (status) {
      case "Active": return "bg-emerald-100 text-emerald-800";
      case "Busy": return "bg-blue-100 text-blue-800";
      case "InRepair": return "bg-amber-100 text-amber-800 border border-amber-200";
      case "Faulty": return "bg-red-100 text-red-800 border border-red-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  const getEquipmentStatusLabel = (status) => {
    switch (status) {
      case "Active": return "Islek";
      case "Busy": return "Mesgul";
      case "InRepair": return "Temirde";
      case "Faulty": return "Xarab";
      default: return status;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#FAF6F0] text-[#1A1714] p-4 md:p-8 font-sans -m-6">

        <div className="max-w-5xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A1714] mb-1">Usta Kabineti</h1>
            <p className="text-sm text-gray-500">Gundelik is qrafiki ve aktiv rezervasiyalariniz</p>
          </div>
          <button
            onClick={fetchEmployeeAppointments}
            className="flex items-center gap-2 bg-[#1A1714] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#B8935A] transition shadow-md"
          >
            Yenile
          </button>
        </div>

        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">

          <div className="flex border-b border-gray-200 bg-gray-50/50 overflow-x-auto">
            <button
              onClick={() => setActiveTab("reservations")}
              className={"flex items-center px-6 py-4 font-medium transition-colors whitespace-nowrap " + (activeTab === "reservations" ? "text-[#C9A227] border-b-2 border-[#C9A227] bg-white" : "text-gray-500 hover:text-[#1A1714] hover:bg-white")}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Rezervasiyalar
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={"flex items-center px-6 py-4 font-medium transition-colors whitespace-nowrap " + (activeTab === "reviews" ? "text-[#C9A227] border-b-2 border-[#C9A227] bg-white" : "text-gray-500 hover:text-[#1A1714] hover:bg-white")}
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Reyler
            </button>
            <button
              onClick={() => setActiveTab("equipment")}
              className={"flex items-center px-6 py-4 font-medium transition-colors whitespace-nowrap " + (activeTab === "equipment" ? "text-[#C9A227] border-b-2 border-[#C9A227] bg-white" : "text-gray-500 hover:text-[#1A1714] hover:bg-white")}
            >
              <Wrench className="w-5 h-5 mr-2" />
              Avadanligim
            </button>
            <button
              onClick={() => setActiveTab("news")}
              className={"flex items-center px-6 py-4 font-medium transition-colors whitespace-nowrap " + (activeTab === "news" ? "text-[#C9A227] border-b-2 border-[#C9A227] bg-white" : "text-gray-500 hover:text-[#1A1714] hover:bg-white")}
            >
              <Newspaper className="w-5 h-5 mr-2" />
              Xeberler
            </button>
          </div>

          <div className="p-6">

            {activeTab === "reservations" && (
              <div className="space-y-8">
                <div className="bg-[#FAF6F0] p-5 rounded-2xl border border-[#F0D68A]">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">QR Check-in</h3>
                  <form onSubmit={handleScanSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      required
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value)}
                      placeholder="Musterinin QR kodunu daxil edin ve ya yapisdirin"
                      className="flex-1 p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                    />
                    <button
                      type="submit"
                      disabled={scanning}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#B8935A] to-[#C9A227] text-white rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      {scanning ? "Yoxlanilir..." : "Check-in Et"}
                    </button>
                    <label className="inline-flex px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-600 cursor-pointer items-center gap-1.5 justify-center">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl text-xl">Cal</div>
                    <div>
                      <span className="text-xs text-gray-400 block font-semibold tracking-wider">AKTIV REZERVASIYA</span>
                      <span className="text-2xl font-serif font-bold text-[#1A1714]">{activeBookings} seans</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl">$</div>
                      <div>
                        <span className="text-xs text-gray-400 block font-semibold tracking-wider">UMUMI GELIR</span>
                        <span className="text-2xl font-serif font-bold text-emerald-600">{totalRevenue} AZN</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[10px]">
                      <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Kartla: {cardRevenue} AZN</span>
                      <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Bal ile: {loyaltyRevenue} AZN</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-gray-50 text-gray-600 rounded-xl text-xl">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block font-semibold tracking-wider">UMUMI SIFARIS</span>
                      <span className="text-2xl font-serif font-bold text-[#1A1714]">{appointments.length} seans</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-serif font-semibold mb-4 text-[#1A1714]">Rezervasiya Cedveli</h3>
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-8 h-8 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-500 font-medium">Siyahi yuklenir...</p>
                    </div>
                  ) : error ? (
                    <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl">
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <p className="text-base font-semibold text-[#1A1714]/70">Hele ki hec bir rezervasiyaniz yoxdur.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointments.map((app) => (
                        <div
                          key={app?.id}
                          className={"p-5 rounded-xl border transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:shadow-md " + (app?.status === "Cancelled" ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-gray-200 hover:border-[#B8935A]/50")}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                            <div className="p-3 bg-[#FAF6F0] text-xl rounded-xl flex-shrink-0">U</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-sans font-bold text-base text-[#1A1714]">
                                  {app?.customerFullName || app?.customerName || app?.customer?.fullName || "Musteri"}
                                </h4>
                                <span className="text-gray-400 hidden sm:inline">-</span>
                                <span className="text-sm font-medium text-gray-600">
                                  {app?.serviceName || "Xidmet"}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1.5 font-medium">
                                <span className="bg-gray-100 px-2 py-0.5 rounded">
                                  {app?.reservationDate ? app.reservationDate.split("T")[0] : "Tarix yoxdur"}
                                </span>
                                <span className="bg-gray-100 px-2 py-0.5 rounded">
                                  {app?.startTime ? app.startTime.slice(0, 5) : "00:00"}
                                </span>
                                <span className="text-gray-400">({app?.durationMinutes || 0} deq)</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
                            <div className="text-left lg:text-right min-w-[100px]">
                              <span className="text-xs text-gray-400 block font-semibold tracking-wider">XIDMET HAQQI</span>
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
                                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600">Legv edilib</span>
                                  )}
                                  {app?.status === "Confirmed" && (
                                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700">Tesdiqlenib</span>
                                  )}
                                  {app?.status === "Completed" && (
                                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">Tamamlanib</span>
                                  )}
                                  {(app?.status === "Pending" || app?.status === "Gozlemede") && (
                                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700">Gozlemede</span>
                                  )}

                                  {app?.status !== "Cancelled" && app?.status !== "Completed" && (
                                    <div className="flex items-center gap-1 ml-2 border-l pl-2 border-gray-200">
                                      {app?.status !== "Confirmed" && (
                                        <button
                                          onClick={() => handleStatusAction(app.id, "confirm")}
                                          className="p-1 px-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition"
                                        >
                                          Tesdiqle
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleStatusAction(app.id, "complete")}
                                        className="p-1 px-2 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium transition"
                                      >
                                        Tamamla
                                      </button>
                                      <button
                                        onClick={() => handleStatusAction(app.id, "cancel")}
                                        className="p-1 px-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium transition"
                                      >
                                        Legv et
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
            )}

            {activeTab === "reviews" && (
              <ReviewsManagement reviews={reviews} onRespond={handleRespondReview} />
            )}

            {activeTab === "equipment" && (
              <div>
                <h3 className="text-xl font-serif font-semibold mb-6 text-[#1A1714]">Tehkim Olunmus Avadanliq</h3>

                {assignedEquipment ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#FAF6F0] flex items-center justify-center text-[#B8935A]">
                          <Scissors className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-[#1A1714]">{assignedEquipment.name}</h4>
                          <span className="text-sm text-gray-500">{assignedEquipment.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Cari Status:</span>
                      <span className={"px-3 py-1 rounded-full text-xs font-semibold " + getEquipmentStatusBadge(assignedEquipment.status)}>
                        {getEquipmentStatusLabel(assignedEquipment.status)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-[#1A1714] mb-2">Avadanliq Yoxdur</h4>
                    <p className="text-gray-500 max-w-sm">
                      Sizə hele hec bir avadanliq tehkim edilmeyib. Eger bir sehv oldugunu dusunursunuzse, adminle elaqe saxlayin.
                    </p>
                  </div>
                )}
              </div>
            )}
            {activeTab === "news" && (
              <NewsManagement
                news={news}
                salons={salons}
                onCreate={handleCreateNews}
                onEdit={handleEditNews}
                onDelete={handleDeleteNews}
              />
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}






