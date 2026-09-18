import { useState } from "react";
import { X, Building2, MapPin, Phone, Image as ImageIcon, FileText, Loader2, Send } from "lucide-react";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";

export default function SalonApplicationModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/Upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLogoUrl(res.data.url);
    } catch (err) {
      console.error("Şəkil yüklənmədi:", err);
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/SalonApplication", {
        phoneNumber: `+994${phone.replace(/\s/g, "")}`,
        proposedSalonName: name,
        address,
        description,
        logoImageUrl: logoUrl || null,
      });
      showToast(t("salon_app_success"), "success");
      setPhone("");
      setName("");
      setAddress("");
      setDescription("");
      setLogoUrl("");
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || t("admin_generic_error"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-[#1A1714] px-6 py-5 flex items-center justify-between sticky top-0">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-[#C9A227]">
            Öz Salonunuzu SalonHub-a Qoşun
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <p className="text-sm text-gray-500 -mt-2">
            Salonunuzu platformamızda qeydiyyatdan keçirmək üçün aşağıdakı formanı doldurun.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1A1714] mb-2">Təklif olunan Salon Adı</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-11 block w-full border border-gray-200 rounded-xl py-3 text-[#1A1714] placeholder-gray-400 focus:ring-2 focus:ring-[#C9A227]/20 focus:border-[#C9A227] sm:text-sm transition-all outline-none bg-white"
                  placeholder="Məs: Elegance Beauty"
                />
              </div>
            </div>

                        <div>
              <label className="block text-sm font-medium text-[#1A1714] mb-2">Telefon Nömrəsi</label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3.5 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                <span className="absolute left-11 text-sm font-medium text-[#1A1714] pointer-events-none z-10">+994</span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                    let formatted = "";
                    if (digits.length > 0) formatted += "(" + digits.slice(0, 2);
                    if (digits.length >= 2) formatted += ") " + digits.slice(2, 5);
                    if (digits.length >= 5) formatted += "-" + digits.slice(5, 7);
                    if (digits.length >= 7) formatted += "-" + digits.slice(7, 9);
                    setPhone(formatted);
                  }}
                  maxLength={15}
                  className="pl-[84px] block w-full border border-gray-200 rounded-xl py-3 text-[#1A1714] placeholder-gray-400 focus:ring-2 focus:ring-[#C9A227]/20 focus:border-[#C9A227] sm:text-sm transition-all outline-none bg-white font-normal"
                  placeholder="(50) 348-45-89"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1714] mb-2">Ünvan</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-11 block w-full border border-gray-200 rounded-xl py-3 text-[#1A1714] placeholder-gray-400 focus:ring-2 focus:ring-[#C9A227]/20 focus:border-[#C9A227] sm:text-sm transition-all outline-none bg-white"
                  placeholder="Bakı ş., Nəsimi r-nu..."
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1A1714] mb-2">Qısa Təsvir / Bio</label>
              <div className="relative">
                <div className="absolute top-3.5 left-3.5 pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  rows="4"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="pl-11 block w-full border border-gray-200 rounded-xl py-3 text-[#1A1714] placeholder-gray-400 focus:ring-2 focus:ring-[#C9A227]/20 focus:border-[#C9A227] sm:text-sm transition-all outline-none bg-white resize-none"
                  placeholder="Salonunuzun fəaliyyət növləri və üstünlükləri barədə qısa məlumat..."
                ></textarea>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1A1714] mb-2">Loqo və ya Şəkil (Opsional)</label>
              <div className="mt-1 flex justify-center px-6 pt-6 pb-7 border border-gray-200 border-dashed rounded-xl bg-[#FAF6F0]/50 hover:bg-[#FAF6F0] transition-colors group">
                <div className="space-y-2 text-center">
                  {uploadingLogo ? (
                    <Loader2 className="mx-auto h-8 w-8 text-[#C9A227] animate-spin" />
                  ) : (
                    <ImageIcon className="mx-auto h-8 w-8 text-[#C9A227] opacity-70 group-hover:opacity-100 transition-opacity" />
                  )}
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label className="relative cursor-pointer rounded-md font-medium text-[#C9A227] hover:text-[#B8935A] focus-within:outline-none transition-colors">
                      <span>Şəkil seçin</span>
                      <input type="file" accept="image/*" onChange={handleLogoChange} className="sr-only" />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, JPEG (Max: 5MB)</p>
                  {logoUrl && (
                    <div className="pt-2">
                      <img src={logoUrl} alt="Loqo" className="mx-auto h-16 w-16 object-cover rounded-xl" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || uploadingLogo}
            className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-medium text-white bg-[#C9A227] hover:bg-[#B8935A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C9A227] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                Göndərilir...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" /> Müraciəti Göndər
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
