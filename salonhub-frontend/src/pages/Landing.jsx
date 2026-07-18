import { useNavigate } from "react-router-dom";
import { Sparkles, LogIn, UserPlus } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1A1714] to-[#2B2118] relative overflow-hidden px-6">
      <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_50%_20%,#C9A227,transparent_60%)]" />

      <div className="relative z-10 text-center max-w-lg">
        <Sparkles className="w-10 h-10 text-[#C9A227] mx-auto mb-4" />
        <h1 className="text-6xl font-serif font-bold text-[#F4EDE0] tracking-wide">SalonHub</h1>
        <p className="mt-3 text-[#C9A227] tracking-widest text-sm uppercase font-medium">
          Your Beauty, Our Passion
        </p>
        <p className="mt-6 text-gray-400 text-sm leading-relaxed">
          Gozellik salonlarini kesf edin, ustalarla tanis olun, rezervasiya edin
          ve ya sebekemize qosulun.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/auth", { state: { tab: "login" } })}
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#1A1714] border border-[#C9A227]/40 text-[#F0D68A] font-semibold hover:bg-[#2A231C] transition"
          >
            <LogIn className="w-4 h-4" /> Giris Et
          </button>
          <button
            onClick={() => navigate("/auth", { state: { tab: "register" } })}
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#F0D68A] to-[#B8935A] text-[#1A1714] font-bold hover:opacity-95 transition"
          >
            <UserPlus className="w-4 h-4" /> Qeydiyyatdan Kec
          </button>
        </div>
      </div>
    </div>
  );
}
