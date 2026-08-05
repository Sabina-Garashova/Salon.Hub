import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Star, Sparkles, Loader2, Check, CalendarPlus } from "lucide-react";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function downloadIcs(slot) {
  const [h, m] = slot.startTime.split(":").map(Number);
  const start = new Date(slot.date);
  start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + 45 * 60000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${slot.serviceName} - ${slot.salonName}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `DESCRIPTION:Usta: ${slot.employeeName}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rezervasiya.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ChatBookingWidget() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: "welcome", role: "assistant", text: t("chatbot_welcome") },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingSlot, setPendingSlot] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [successSlot, setSuccessSlot] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, pendingSlot, sending, successSlot]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const history = messages
      .filter((m) => m.role === "user" || (m.role === "assistant" && m.text))
      .slice(-8)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, { id: Date.now() + "-u", role: "user", text: trimmed }]);
    setInputValue("");
    setSending(true);

    try {
      const res = await api.post("/ChatBooking/message", {
        message: trimmed,
        conversationHistory: history,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + "-a",
          role: "assistant",
          text: res.data.replyText,
          slots: res.data.suggestedSlots || [],
          quickReplies: res.data.quickReplies || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + "-err", role: "assistant", text: t("chatbot_error") },
      ]);
    } finally {
      setSending(false);
    }
  };

  const confirmReservation = async () => {
    if (!pendingSlot) return;
    setConfirming(true);
    try {
      await api.post("/Reservation", {
        serviceId: pendingSlot.serviceId,
        employeeId: pendingSlot.employeeId,
        branchId: pendingSlot.branchId,
        reservationDate: pendingSlot.date,
        startTime: pendingSlot.startTime + ":00",
        paymentMethod: "Cash",
      });
      setSuccessSlot(pendingSlot);
      setPendingSlot(null);
    } catch (err) {
      showToast(err.response?.data?.message || t("chatbot_booking_error"), "error");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#C9A227] to-[#B8935A] text-[#1A1714] shadow-[0_8px_24px_rgba(201,162,39,0.45)] flex items-center justify-center hover:scale-105 transition-transform"
        title={t("chatbot_button_title")}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:right-5 sm:bottom-24 z-40 w-full sm:w-[380px] h-[80vh] sm:h-[560px] max-h-[85vh] bg-[#1A1714] sm:rounded-3xl rounded-t-3xl shadow-2xl border border-[#B8935A]/20 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-[#1A1714] via-[#2B2118] to-[#1A1714] border-b border-[#B8935A]/20 shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F0D68A] to-[#B8935A] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#1A1714]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-serif font-bold text-[#F4EDE0] leading-tight">{t("chatbot_title")}</p>
              <p className="text-[10px] text-[#C9A227]">{t("chatbot_subtitle")}</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full text-gray-400 hover:bg-white/10 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed " +
                    (m.role === "user"
                      ? "bg-[#2B2118] text-[#F4EDE0] rounded-br-sm"
                      : "bg-[#B8935A]/15 border border-[#B8935A]/25 text-[#F4EDE0] rounded-bl-sm")
                  }
                >
                  {m.text}

                  {m.slots && m.slots.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {m.slots.map((slot, idx) => (
                        <div key={idx} className="rounded-xl bg-[#1A1714] border border-[#C9A227]/30 p-2.5 flex items-center gap-2.5">
                          {slot.employeeImageUrl ? (
                            <img src={slot.employeeImageUrl} alt={slot.employeeName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F0D68A] to-[#B8935A] flex items-center justify-center text-[#1A1714] font-bold text-[10px] shrink-0">
                              {getInitials(slot.employeeName)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#F4EDE0] truncate">{slot.employeeName}</p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                              {slot.employeeRating > 0 && (
                                <span className="flex items-center gap-0.5 text-[#C9A227]">
                                  <Star className="w-2.5 h-2.5 fill-[#C9A227]" /> {slot.employeeRating}
                                </span>
                              )}
                              <span>{slot.salonName}</span>
                            </div>
                            <p className="text-[10px] text-gray-400">
                              {new Date(slot.date).toLocaleDateString()} • {slot.startTime} • {slot.price} AZN
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPendingSlot(slot)}
                            className="shrink-0 px-3 py-1.5 rounded-lg bg-[#1A1714] border border-[#C9A227] text-[#C9A227] text-[11px] font-bold hover:bg-[#C9A227] hover:text-[#1A1714] transition"
                          >
                            {t("chatbot_select")}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {m.quickReplies && m.quickReplies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {m.quickReplies.map((qr, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => sendMessage(qr)}
                          className="px-2.5 py-1 rounded-full bg-[#1A1714] border border-[#B8935A]/40 text-[#F0D68A] text-[11px] hover:border-[#C9A227] transition"
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-[#B8935A]/15 border border-[#B8935A]/25 rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <Loader2 className="w-4 h-4 text-[#C9A227] animate-spin" />
                </div>
              </div>
            )}

            {pendingSlot && (
              <div className="rounded-2xl bg-gradient-to-br from-[#2B2118] to-[#1A1714] border border-[#C9A227]/40 p-4 space-y-2">
                <p className="text-xs text-[#C9A227] uppercase tracking-wide font-semibold mb-1">{t("chatbot_summary_title")}</p>
                <div className="text-sm text-[#F4EDE0] space-y-1">
                  <p>{t("chatbot_summary_service")}: <span className="font-semibold">{pendingSlot.serviceName}</span></p>
                  <p>{t("chatbot_summary_master")}: <span className="font-semibold">{pendingSlot.employeeName}</span></p>
                  <p>{t("chatbot_summary_date")}: <span className="font-semibold">{new Date(pendingSlot.date).toLocaleDateString()}, {pendingSlot.startTime}</span></p>
                  <p>{t("chatbot_summary_price")}: <span className="font-semibold">{pendingSlot.price} AZN</span></p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPendingSlot(null)}
                    disabled={confirming}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:bg-white/5"
                  >
                    {t("common_close")}
                  </button>
                  <button
                    type="button"
                    onClick={confirmReservation}
                    disabled={confirming}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#B8935A] text-[#1A1714] font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {t("chatbot_confirm_cta")}
                  </button>
                </div>
              </div>
            )}

            {successSlot && (
              <div className="rounded-2xl bg-gradient-to-br from-[#2B2118] to-[#1A1714] border border-[#C9A227]/50 p-5 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#F0D68A] to-[#C9A227] flex items-center justify-center shadow-[0_0_30px_rgba(201,162,39,0.5)] animate-pulse">
                  <Check className="w-7 h-7 text-[#1A1714]" />
                </div>
                <p className="text-sm font-semibold text-[#F0D68A]">{t("chatbot_success_title")}</p>
                <button
                  type="button"
                  onClick={() => downloadIcs(successSlot)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#B8935A]/40 text-[#F4EDE0] text-xs hover:bg-white/5"
                >
                  <CalendarPlus className="w-3.5 h-3.5" /> {t("chatbot_add_to_calendar")}
                </button>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue); }}
            className="flex items-center gap-2 px-3 py-3 border-t border-[#B8935A]/20 bg-[#1A1714] shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t("chatbot_input_placeholder")}
              disabled={sending}
              className="flex-1 bg-[#2B2118] text-[#F4EDE0] placeholder-gray-500 text-sm rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/50"
            />
            <button
              type="submit"
              disabled={sending || !inputValue.trim()}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A227] to-[#B8935A] text-[#1A1714] flex items-center justify-center disabled:opacity-40 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
