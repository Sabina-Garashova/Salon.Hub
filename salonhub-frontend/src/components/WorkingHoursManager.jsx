import { useState, useEffect } from "react";
import { Clock, Save, CheckCircle, AlertCircle, RefreshCw, Sun, Moon } from "lucide-react";
import api from "../services/api";

const DAYS = [
  { id: 1, nameAz: "Bazar ertəsi", shortAz: "B.E." },
  { id: 2, nameAz: "Çərşənbə axşamı", shortAz: "Ç.A." },
  { id: 3, nameAz: "Çərşənbə", shortAz: "Çərş." },
  { id: 4, nameAz: "Cümə axşamı", shortAz: "C.A." },
  { id: 5, nameAz: "Cümə", shortAz: "Cümə" },
  { id: 6, nameAz: "Şənbə", shortAz: "Şənbə" },
  { id: 0, nameAz: "Bazar", shortAz: "Bazar" },
];

const toArray = (val) => {
  if (Array.isArray(val)) return val;
  if (val && Array.isArray(val.$values)) return val.$values;
  return [];
};

export default function WorkingHoursManager({ employeeId: propEmpId }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeEmpId, setActiveEmpId] = useState(propEmpId || null);

  const fetchWorkingHours = async () => {
    try {
      setLoading(true);
      let empId = propEmpId || activeEmpId;

      if (!empId) {
        try {
          const userStr = localStorage.getItem("user");
          const storedUser = userStr ? JSON.parse(userStr) : null;
          const empRes = await api.get("/Employee");
          const empList = toArray(empRes.data);
          const matched = empList.find(
            (e) => e && storedUser && (e.applicationUserId === storedUser.id || e.email === storedUser.email)
          );
          empId = matched ? matched.id : empList[0]?.id;
          setActiveEmpId(empId);
        } catch (e) {
          console.warn("İşçi məlumatı yüklənərkən xəbərdarlıq:", e);
        }
      }

      const res = await api.get("/WorkingHour");
      const rawHours = toArray(res.data);
      const myHours = empId ? rawHours.filter((h) => h && String(h.employeeId) === String(empId)) : rawHours;

      const fullSchedule = DAYS.map((d) => {
        const existing = myHours.find((h) => h && Number(h.dayOfWeek) === d.id);
        let start = "09:00";
        let end = "18:00";
        if (existing?.startTime) start = existing.startTime.toString().substring(0, 5);
        if (existing?.endTime) end = existing.endTime.toString().substring(0, 5);
        return {
          id: existing ? existing.id : null,
          dayOfWeek: d.id,
          startTime: start,
          endTime: end,
          isDayOff: existing ? Boolean(existing.isDayOff) : d.id === 0,
        };
      });

      setSchedule(fullSchedule);
    } catch (err) {
      console.error("İş saatları yüklənərkən xəta:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkingHours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propEmpId]);

  const handleChange = (dayId, field, value) => {
    setSchedule((prev) => prev.map((item) => (item.dayOfWeek === dayId ? { ...item, [field]: value } : item)));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const targetEmpId = activeEmpId || propEmpId;

      for (const item of schedule) {
        if (item.id) {
          const updateDto = {
            startTime: (item.startTime || "09:00") + ":00",
            endTime: (item.endTime || "18:00") + ":00",
            isDayOff: Boolean(item.isDayOff),
          };
          await api.put(`/WorkingHour/${item.id}`, updateDto);
        } else {
          const createDto = {
            dayOfWeek: Number(item.dayOfWeek),
            startTime: (item.startTime || "09:00") + ":00",
            endTime: (item.endTime || "18:00") + ":00",
            isDayOff: Boolean(item.isDayOff),
            employeeId: targetEmpId ? Number(targetEmpId) : null,
            branchId: null,
          };
          await api.post("/WorkingHour", createDto);
        }
      }

      setMessage({ type: "success", text: "İş saatları uğurla saxlanıldı!" });
      await fetchWorkingHours();
    } catch (err) {
      console.error("Yadda saxlayarkən xəta:", err.response || err);
      const details = err.response?.data?.title || err.response?.data || err.message;
      setMessage({ type: "error", text: `Xəta: ${typeof details === "object" ? JSON.stringify(details) : details}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center text-gray-500">
        <RefreshCw className="w-6 h-6 animate-spin text-[#C9A227] mr-3" />
        <span className="font-medium">İş qrafiki yüklənir...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-serif text-[#1A1714] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#C9A227]" />
            İş Saatları və Qrafik
          </h2>
          <p className="text-sm text-gray-500 mt-1">Həftəlik iş vaxtlarınızı təyin edin və istirahət günlərinizi seçin.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#C9A227] to-[#B8935A] hover:shadow-lg active:scale-95 text-[#1A1714] px-5 py-2.5 rounded-xl font-semibold transition shadow-sm disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Yadda Saxla
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {DAYS.map((day) => {
          const item = schedule.find((s) => s.dayOfWeek === day.id) || { startTime: "09:00", endTime: "18:00", isDayOff: false };
          const isOff = Boolean(item.isDayOff);
          return (
            <div
              key={day.id}
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                isOff ? "bg-gray-50/70 border-gray-200/80" : "bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-[#C9A227]/40"
              } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
            >
              <div className="flex items-center gap-3 min-w-[200px]">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                    isOff ? "bg-gray-200 text-gray-500" : "bg-[#C9A227]/10 text-[#B8935A]"
                  }`}
                >
                  {day.shortAz}
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1714]">{day.nameAz}</h3>
                  <span
                    className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium mt-1 ${
                      isOff ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {isOff ? "İstirahət Günü" : "İş Günü"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                <button
                  type="button"
                  onClick={() => handleChange(day.id, "isDayOff", !isOff)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    isOff ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-[#C9A227]/10 text-[#8a6d1f] border-[#C9A227]/30 hover:bg-[#C9A227]/20"
                  }`}
                >
                  {isOff ? "İş Günü Et" : "İstirahət Qoy"}
                </button>

                {!isOff ? (
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200/80">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-[#C9A227]" />
                      <input
                        type="time"
                        value={item.startTime || "09:00"}
                        onChange={(e) => handleChange(day.id, "startTime", e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C9A227] shadow-sm cursor-pointer"
                      />
                    </div>
                    <span className="text-gray-400 font-bold px-1">-</span>
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-[#B8935A]" />
                      <input
                        type="time"
                        value={item.endTime || "18:00"}
                        onChange={(e) => handleChange(day.id, "endTime", e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C9A227] shadow-sm cursor-pointer"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-medium text-gray-400 bg-gray-100 px-4 py-2 rounded-xl border border-gray-200/50">
                    Bu gün iş saatı təyin olunmayıb
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
