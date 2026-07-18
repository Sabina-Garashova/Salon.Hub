import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, Calendar, Gift } from "lucide-react";
import api from "../../services/api";

function SalonIllustration() {
  return (
    <img
      src="/salon-illustration.png"
      alt="SalonHub illustration"
      className="w-full h-full object-contain"
    />
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 120 100" className="w-24 h-20" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#C9A227" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 30 80 Q 25 60 30 45 Q 25 30 35 20 Q 45 10 55 18" />
        <path d="M 55 18 Q 70 22 68 40 Q 75 55 65 70 Q 60 78 50 80" />
        <path d="M 35 20 Q 20 25 22 40 Q 15 50 25 60" />
        <path d="M 45 14 L 48 8 L 52 12 L 56 6 L 60 12 L 63 8 L 66 15" />
        <circle cx="90" cy="30" r="2" fill="#C9A227" />
        <circle cx="98" cy="45" r="1.5" fill="#C9A227" />
        <circle cx="88" cy="55" r="1" fill="#C9A227" />
      </g>
    </svg>
  );
}

export default function AuthPage() {
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab === "register" ? "register" : "login");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loginData, setLoginData] = useState({ emailOrPhone: "", password: "" });
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    referredByCode: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        email: loginData.emailOrPhone,
        password: loginData.password,
      };
      const res = await api.post("/auth/login", payload);
      localStorage.setItem("token", res.data.token);
      window.location.href = "/dashboard";
    } catch (err) {
      const msg = err.response?.data?.message || "Giris ugursuz oldu";
      alert(msg);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      alert("Sifreler uygun gelmir");
      return;
    }
    try {
      const payload = {
        fullName: registerData.fullName,
        email: registerData.email,
        password: registerData.password,
        dateOfBirth: registerData.dateOfBirth,
        referredByCode: registerData.referredByCode || null,
      };
      await api.post("/auth/register", payload);
      setTab("login");
      alert("Qeydiyyat ugurludur, indi daxil olun");
    } catch (err) {
      const msg = err.response?.data?.message || "Qeydiyyat ugursuz oldu";
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FAF6F0]">
      {/* Sol brend/illustrasiya paneli */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gradient-to-b from-[#1A1714] to-[#2B2118] relative overflow-hidden px-10 py-10">
        <LogoMark />
        <h1 className="text-5xl font-serif text-[#F4EDE0] tracking-wide -mt-2">SalonHub</h1>
        <p className="mt-2 mb-8 text-[#C9A227] tracking-widest text-xs uppercase">
          Your Beauty, Our Passion
        </p>
        <div className="relative w-full max-w-3xl h-[560px]">
          <SalonIllustration />
        </div>
      </div>

      {/* Sag auth paneli */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="relative flex bg-[#F4EDE0] rounded-full p-1 mb-8">
            <div
              className={`absolute top-1 bottom-1 w-1/2 rounded-full bg-[#1A1714] transition-transform duration-300 ${
                tab === "register" ? "translate-x-full" : "translate-x-0"
              }`}
            />
            <button
              onClick={() => setTab("login")}
              className={`relative z-10 flex-1 py-2 font-medium transition-colors ${
                tab === "login" ? "text-white" : "text-[#1A1714]"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setTab("register")}
              className={`relative z-10 flex-1 py-2 font-medium transition-colors ${
                tab === "register" ? "text-white" : "text-[#1A1714]"
              }`}
            >
              Register
            </button>
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-2xl font-serif text-[#1A1714] mb-2">Xos gelmisiniz</h2>

              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Email or Phone"
                  value={loginData.emailOrPhone}
                  onChange={(e) => setLoginData({ ...loginData, emailOrPhone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                  maxLength={40}
                  pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                  title="Zehmet olmasa etibarli bir email adresi daxil edin"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 text-gray-600">
                  <input type="checkbox" className="accent-[#C9A227]" />
                  Remember me
                </label>
                <a href="#" className="text-[#C9A227] font-medium">Forgot password?</a>
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-[#1A1714] text-white font-medium hover:bg-[#2A231C] transition">
                Log In
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-2xl font-serif text-[#1A1714] mb-2">Hesab yaradin</h2>

              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={registerData.fullName}
                  onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                  maxLength={40}
                  pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                  title="Zehmet olmasa etibarli bir email adresi daxil edin"
                  required
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  placeholder="Date of Birth"
                  value={registerData.dateOfBirth}
                  onChange={(e) => setRegisterData({ ...registerData, dateOfBirth: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227] text-gray-600"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
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
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-3.5 text-gray-400">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Gift className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Devet kodu (istege gore)"
                  value={registerData.referredByCode}
                  onChange={(e) => setRegisterData({ ...registerData, referredByCode: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                />
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-[#C9A227] text-white font-medium hover:bg-[#B8935A] transition">
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}














