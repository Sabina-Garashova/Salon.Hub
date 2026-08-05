import React, { useState } from "react";
import { Bell, Gift, Trophy, MessageSquareText, Loader2 } from "lucide-react";
import api from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";

const JOB_DEFS = [
  { id: "reminders", labelKey: "sysjobs_reminders_label", descKey: "sysjobs_reminders_desc", icon: Bell, endpoint: "/SystemJobs/trigger/reminders" },
  { id: "birthday-bonus", labelKey: "sysjobs_birthday_label", descKey: "sysjobs_birthday_desc", icon: Gift, endpoint: "/SystemJobs/trigger/birthday-bonus" },
  { id: "monthly-top-performer", labelKey: "sysjobs_topperformer_label", descKey: "sysjobs_topperformer_desc", icon: Trophy, endpoint: "/SystemJobs/trigger/monthly-top-performer" },
  { id: "review-follow-up", labelKey: "sysjobs_reviewfollowup_label", descKey: "sysjobs_reviewfollowup_desc", icon: MessageSquareText, endpoint: "/SystemJobs/trigger/review-follow-up" },
];

export default function SystemJobsPanel() {
  const { t } = useLanguage();
  const [runningId, setRunningId] = useState(null);
  const [results, setResults] = useState({});

  const runJob = async (job) => {
    setRunningId(job.id);
    try {
      const res = await api.post(job.endpoint);
      setResults((prev) => ({ ...prev, [job.id]: { success: true, message: res.data.message } }));
    } catch (err) {
      setResults((prev) => ({ ...prev, [job.id]: { success: false, message: err.response?.data?.message || t("sysjobs_generic_error") } }));
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">{t("sysjobs_hint")}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {JOB_DEFS.map((job) => {
          const Icon = job.icon;
          const result = results[job.id];
          const isRunning = runningId === job.id;
          return (
            <div key={job.id} className="bg-gradient-to-br from-[#F6EAD3] via-[#F1E2C5] to-[#E9D5A8] rounded-2xl border border-[#E5D2B1] p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#FAF6F0] rounded-xl text-[#B8935A] border border-[#B8935A]/20">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-[#1A1714]">{t(job.labelKey)}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{t(job.descKey)}</p>
                </div>
              </div>
              <button
                onClick={() => runJob(job)}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1A1714] text-white rounded-xl text-sm font-semibold hover:bg-[#B8935A] transition disabled:opacity-50"
              >
                {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isRunning ? t("sysjobs_running") : t("sysjobs_run_now")}
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

