import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import api from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const invalidLink = !email || !token;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast(t("auth_password_mismatch"), "error");
      return;
    }
    setSending(true);
    try {
      await api.post("/auth/reset-password", { email, token, newPassword });
      setDone(true);
      setTimeout(() => navigate("/auth"), 2500);
    } catch (err) {
      const msg = err.response?.data?.message || t("auth_reset_password_error");
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

        {invalidLink ? (
          <div className="text-center py-6">
            <h2 className="text-xl font-serif text-[#1A1714] mb-2">{t("auth_reset_password_invalid_title")}</h2>
            <p className="text-sm text-[#1A1714]/70 leading-relaxed">
              {t("auth_reset_password_invalid_desc")}
            </p>
          </div>
        ) : done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-[#C9A227]/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-[#C9A227]" />
            </div>
            <h2 className="text-xl font-serif text-[#1A1714] mb-2">{t("auth_reset_password_success_title")}</h2>
            <p className="text-sm text-[#1A1714]/70 leading-relaxed">
              {t("auth_reset_password_success_desc")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-serif text-[#1A1714] mb-1">{t("auth_reset_password_title")}</h2>
            <p className="text-sm text-[#1A1714]/60 mb-4">{email}</p>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type={showPass ? "text" : "password"}
                placeholder={t("auth_password")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-gray-400">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type={showPass ? "text" : "password"}
                placeholder={t("auth_confirm_password")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-xl bg-[#1A1714] text-white font-medium hover:bg-[#2A231C] transition disabled:opacity-60"
            >
              {sending ? t("sp_sending") : t("auth_reset_password_submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
