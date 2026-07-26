import { useState, useEffect } from "react";
import {
  X,
  Briefcase,
  Building2,
  Store,
  DollarSign,
  User,
  ImagePlus,
  Send,
  Award,
  ChevronDown,
  Loader2,
  Phone,
  Sparkles,
} from "lucide-react";
import api from "../services/api";

export default function CraftsmanApplicationModal({ isOpen, onClose }) {
  const [salons, setSalons] = useState([]);
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [salon, setSalon] = useState("");
  const [branch, setBranch] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [experience, setExperience] = useState(0);
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [bio, setBio] = useState("");

  const [portfolioUrls, setPortfolioUrls] = useState([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [uploadingProfile, setUploadingProfile] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingOptions(true);
    Promise.all([api.get("/salon"), api.get("/branch"), api.get("/Service")])
      .then(([salonRes, branchRes, serviceRes]) => {
        setSalons(salonRes.data);
        setBranches(branchRes.data);
        setServices(serviceRes.data);
      })
      .catch((err) => console.error("Salon/filial siyahısı yüklənmədi", err))
      .finally(() => setLoadingOptions(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredBranches = branches.filter(
    (b) => !salon || String(b.salonId) === String(salon)
  );

  const handleProfileFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProfile(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/Upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfileImageUrl(res.data.url);
    } catch (err) {
      alert(err.response?.data?.message || "Sekil yuklenmedi.");
    } finally {
      setUploadingProfile(false);
      e.target.value = "";
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingCount((c) => c + files.length);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await api.post("/Upload/image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setPortfolioUrls((prev) => [...prev, res.data.url]);
      } catch (err) {
        alert(err.response?.data?.message || "Sekil yuklenmedi.");
      } finally {
        setUploadingCount((c) => c - 1);
      }
    }

    e.target.value = "";
  };

  const handleRemoveUrl = (indexToRemove) => {
    setPortfolioUrls(portfolioUrls.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      phoneNumber: `+994${phoneNumber.replace(/\s/g, "")}`,
      specialty,
      profileImageUrl: profileImageUrl || null,
      salonId: Number(salon),
      branchId: branch ? Number(branch) : null,
      yearsOfExperience: Number(experience),
      expectedSalaryMin: Number(minSalary),
      expectedSalaryMax: Number(maxSalary),
      bio,
      portfolioImageUrls: portfolioUrls,
    };

    try {
      await api.post("/SpecialistApplication", payload);
      alert("Müraciətiniz uğurla göndərildi!");
      setSalon("");
      setBranch("");
      setPhoneNumber("");
      setSpecialty("");
      setProfileImageUrl("");
      setExperience(0);
      setMinSalary("");
      setMaxSalary("");
      setBio("");
      setPortfolioUrls([]);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Xəta baş verdi. Məlumatları yenidən yoxlayın.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="flex w-full max-w-5xl h-[90vh] max-h-[750px] bg-white rounded-[32px] overflow-hidden shadow-2xl border border-white/20">
        <div className="hidden md:flex flex-col justify-between w-[35%] bg-gradient-to-b from-[#1A1714] to-[#261F1A] p-8 text-white relative border-r border-[#B8935A]/20">
          <div className="text-center space-y-1">
            <div className="flex justify-center mb-1">
              <div className="w-12 h-12 rounded-full border border-[#C9A227] flex items-center justify-center p-1 bg-[#1A1714]">
                <span className="text-[#C9A227] font-serif text-2xl font-bold">S</span>
              </div>
            </div>
            <h2 className="text-xl font-serif font-bold tracking-wider text-[#FAF6F0]">SALONHUB</h2>
            <p className="text-[9px] text-[#C9A227] tracking-widest font-semibold uppercase">Gözəllik Salonları Sistemi</p>
          </div>

          <div className="space-y-4 my-auto">
            <div className="text-center">
              <h3 className="text-2xl font-serif font-bold text-[#F4EDE0]">Usta olmaq istəyirəm</h3>
              <div className="w-16 h-[1px] bg-[#C9A227] mx-auto mt-2" />
              <p className="text-xs text-gray-400 mt-3 font-light px-2">Peşənizi bizimlə paylaşın, birlikdə böyüyək.</p>
            </div>
            <div className="w-2/3 mx-auto aspect-square rounded-t-full border border-[#B8935A]/30 overflow-hidden bg-[#1D1916] p-2 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1714] to-transparent z-10" />
              <img src="/craftsman-modal-bg.png" alt="Workspace" className="w-full h-full object-cover opacity-70" />
            </div>
          </div>

          <div className="bg-[#151210] p-3 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="p-2 bg-[#C9A227]/10 text-[#C9A227] rounded-lg"><Award className="w-4 h-4" /></div>
            <p className="text-[10px] text-gray-400 font-light">Bacarıqlarınızı göstərin, peşəkar karyeranıza bizimlə başlayın.</p>
          </div>
        </div>

        <div className="flex-1 bg-[#FAF6F0]/60 flex flex-col justify-between p-6 md:p-8 relative overflow-hidden">
          <div className="flex items-start justify-between border-b border-gray-200/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100/50 text-[#B8935A] rounded-xl border border-amber-200/40"><Briefcase className="w-5 h-5" /></div>
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1A1714]">Usta olmaq istəyirəm</h3>
                <p className="text-xs text-gray-400 font-medium">SalonHub üzərindən seçdiyiniz salona iş müraciəti göndərin.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full bg-gray-200/50 text-gray-500 hover:bg-gray-200 transition"><X className="w-4 h-4" /></button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto my-4 pr-2 space-y-4 text-sm text-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider">Salon seçimi *</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <select
                    value={salon}
                    onChange={(e) => { setSalon(e.target.value); setBranch(""); }}
                    required
                    disabled={loadingOptions}
                    className="w-full pl-10 pr-10 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227] transition appearance-none cursor-pointer"
                  >
                    <option value="">{loadingOptions ? "Yüklənir..." : "Salon seçin"}</option>
                    {salons.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-4 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider">Filial seçimi (opsional)</label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    disabled={!salon || filteredBranches.length === 0}
                    className="w-full pl-10 pr-10 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227] transition appearance-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">
                      {!salon
                        ? "Əvvəlcə salon seçin"
                        : filteredBranches.length === 0
                        ? "Bu salonda filial yoxdur"
                        : "Filial seçin"}
                    </option>
                    {filteredBranches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-4 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider">Telefon nömrəsi *</label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 z-10" />
                  <span className="absolute left-10 top-3.5 text-xs text-gray-500 font-medium select-none pointer-events-none">+994</span>
                  <input
                    type="tel"
                    placeholder="XX XXX XX XX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9 ]/g, ""))}
                    maxLength={12}
                    required
                    className="w-full pl-[4.7rem] pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227] transition text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider">Xidmet *</label>
                <div className="relative">
                  <Sparkles className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    required
                    disabled={!salon}
                    className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227] transition text-xs appearance-none disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="" disabled>{salon ? "Ixtisas secin..." : "Evvelce salon secin"}</option>
                    {services.filter((s) => s.salonId === Number(salon)).map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider block">Ozunuzun sekli</label>
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-dashed border-gray-200 hover:border-[#C9A227] transition flex items-center justify-center flex-shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  {uploadingProfile ? (
                    <Loader2 className="w-5 h-5 text-[#C9A227] animate-spin" />
                  ) : profileImageUrl ? (
                    <img src={profileImageUrl} alt="Profil" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                <p className="text-[10px] text-gray-400 flex-1">
                  Sekli secmek ucun klikleyin. Bu, tesdiqlendikde profil sekliniz olacaq.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider">Təcrübə ili *</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <input type="number" min="0" value={experience} onChange={(e) => setExperience(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227] transition" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider">Gözlənilən aylıq maaş aralığı *</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-semibold">₼</span>
                    <input type="number" placeholder="Min" value={minSalary} onChange={(e) => setMinSalary(e.target.value)} required className="w-full pl-8 pr-3 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227] text-xs transition" />
                  </div>
                  <span className="text-gray-400">—</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-semibold">₼</span>
                    <input type="number" placeholder="Max" value={maxSalary} onChange={(e) => setMaxSalary(e.target.value)} required className="w-full pl-8 pr-3 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227] text-xs transition" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider">Özünüz haqqında qısa məlumat (Bio) *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <textarea maxLength={500} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} required placeholder="Özünüz haqqında qısa məlumat yazın..." className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C9A227] transition resize-none text-xs" />
                <div className="absolute bottom-2 right-3 text-[10px] font-mono text-gray-400">{bio.length} / 500</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1A1714] uppercase tracking-wider block">Portfolio şəkilləri</label>

              <div className="relative border-2 border-dashed border-gray-200 hover:border-[#C9A227] rounded-xl p-4 transition bg-white text-center cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  {uploadingCount > 0 ? (
                    <Loader2 className="w-7 h-7 text-[#C9A227] animate-spin" />
                  ) : (
                    <ImagePlus className="w-7 h-7 text-gray-400 group-hover:text-[#C9A227] transition" />
                  )}
                  <p className="text-xs text-gray-600 font-medium">
                    {uploadingCount > 0 ? `Yuklenir (${uploadingCount})...` : "Sekilleri secmek ucun klikleyin"}
                  </p>
                  <p className="text-[10px] text-gray-400">Yalniz sekil fayllari (Maks. 5MB)</p>
                </div>
              </div>

              {portfolioUrls.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3 max-h-[140px] overflow-y-auto p-1 bg-white/40 rounded-xl border border-gray-100">
                  {portfolioUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm group">
                      <img src={url} alt="portfolio" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveUrl(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition z-30"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200/60 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-3 bg-white text-gray-600 font-semibold text-xs rounded-xl border border-gray-200 hover:bg-gray-50 transition">✕ İmtina et</button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting || uploadingCount > 0}
              className="px-6 py-3 bg-gradient-to-r from-[#B8935A] to-[#C9A227] text-white font-bold text-xs rounded-xl hover:opacity-95 shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> {submitting ? "Göndərilir..." : "Müraciət et"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



















