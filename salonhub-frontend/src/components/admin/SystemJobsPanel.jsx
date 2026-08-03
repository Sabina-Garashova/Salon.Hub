import React, { useState } from "react";
import { Bell, Gift, Trophy, MessageSquareText, Loader2 } from "lucide-react";
import api from "../../services/api";

const JOBS = [
  { id: "reminders", label: "Rezervasiya Xatirlatmalari", desc: "Yaxinlasan rezervasiyalar ucun xatirlatma gonderir (her 5 deqiqede avtomatik islek)", icon: Bell, endpoint: "/SystemJobs/trigger/reminders" },
  { id: "birthday-bonus", label: "Dogum Gunu Bonusu", desc: "Bu gun dogum gunu olan istifadecilere 100 bal hediyye edir (her gun 09:00-da avtomatik islek)", icon: Gift, endpoint: "/SystemJobs/trigger/birthday-bonus" },
  { id: "monthly-top-performer", label: "Aylig Top Performer", desc: "Ayin en yaxsi ustasini VE salonunu secir (her ayin 1-i saat 10:00-da avtomatik islek)", icon: Trophy, endpoint: "/SystemJobs/trigger/monthly-top-performer" },
  { id: "review-follow-up", label: "Rey Follow-up", desc: "Cavabsiz reylere xatirlatma gonderir (her gun 11:00-da avtomatik islek)", icon: MessageSquareText, endpoint: "/SystemJobs/trigger/review-follow-up" },
];

export default function SystemJobsPanel() {
  const [runningId, setRunningId] = useState(null);
  const [results, setResults] = useState({});

  const runJob = async (job) => {
    setRunningId(job.id);
    try {
      const res = await api.post(job.endpoint);
      setResults((prev) => ({ ...prev, [job.id]: { success: true, message: res.data.message } }));
    } catch (err) {
      setResults((prev) => ({ ...prev, [job.id]: { success: false, message: err.response?.data?.message || "Xeta bas verdi" } }));
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-serif text-lg font-bold text-[#1A1714]">Sistem Isleri</h3>
        <p className="text-xs text-gray-400 mt-1">Avtomatik isleri el ile derhal ise sala bilersiniz (test ve ya tecili ehtiyac ucun).</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {JOBS.map((job) => {
          const Icon = job.icon;
          const result = results[job.id];
          const isRunning = runningId === job.id;
          return (
            <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#FAF6F0] rounded-xl text-[#B8935A] border border-[#B8935A]/20">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-[#1A1714]">{job.label}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{job.desc}</p>
                </div>
              </div>
              <button
                onClick={() => runJob(job)}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1A1714] text-white rounded-xl text-sm font-semibold hover:bg-[#B8935A] transition disabled:opacity-50"
              >
                {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isRunning ? "Ise salinir..." : "Indi Ise Sal"}
              </button>
              {result && (
                <p className={"text-xs font-medium " + (result.success ? "text-emerald-600" : "text-red-600")}>
                  {result.message}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

