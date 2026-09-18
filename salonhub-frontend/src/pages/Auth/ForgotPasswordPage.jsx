import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import api from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      const msg = err.response?.data?.message || t("auth_login_error");
      showToast(msg, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6F0] p-6">
      <div
        className="fixed inset-0 pointer-events-none bg-cover bg-center opacity-60"
        style={{ backgroundImage: "url('/page-bg-tools.webp')" }}
      />
      <div className="relative z-10 w-full max-w-md bg-gradient-to-br from-[#F6EAD3] via-[#F1E2C5] to-[#E9D5A8] border border-[#E5D2B1] rounded-2xl shadow-xl p-8">
        <Link to="/auth" className="flex items-center gap-1.5 text-sm text-[#B8935A] hover:text-[#C9A227] font-medium mb-6">
          <ArrowLeft className="w-4 h-4" />
          {t("auth_login")}
        </Link>

        {sent ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-[#C9A227]/15 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-[#C9A227]" />
            </div>
            <h2 className="text-xl font-serif text-[#1A1714] mb-2">{t("auth_forgot_password_sent_title")}</h2>
            <p className="text-sm text-[#1A1714]/70 leading-relaxed">
              {t("auth_forgot_password_sent_desc")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-serif text-[#1A1714] mb-1">{t("auth_forgot_password")}</h2>
            <p className="text-sm text-[#1A1714]/60 mb-4">{t("auth_forgot_password_desc")}</p>

            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-xl bg-[#1A1714] text-white font-medium hover:bg-[#2A231C] transition disabled:opacity-60"
            >
              {sending ? t("sp_sending") : t("auth_forgot_password_submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
