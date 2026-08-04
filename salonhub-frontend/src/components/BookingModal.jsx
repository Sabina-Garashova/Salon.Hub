import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect } from "react";
import { Check, Calendar, Clock, User, Scissors, ChevronRight, ChevronLeft, Star, Loader2, X, Sparkles, CreditCard, Banknote, Gift, Camera, Wand2, ArrowRight, Trash2, ImagePlus } from "lucide-react";
import api from "../services/api";
import PaymentMethodSelector from "./PaymentMethodSelector";

export default function BookingModal({ isOpen, onClose, salonId, salonName, initialReferenceImage, showAllSalons = false }) {
  const getMatchingServiceIds = (svcName) => services.filter((s) => s.name === svcName).map((s) => s.id);
  const getActualServiceId = () => {
    if (!selectedEmployee || !selectedService) return selectedService?.id;
    const matchingIds = getMatchingServiceIds(selectedService.name);
    const employeeMatch = selectedEmployee.serviceIds?.find((id) => {
      if (!matchingIds.includes(id)) return false;
      const matchedService = services.find((s) => s.id === id);
      return matchedService && matchedService.salonId === selectedService.salonId;
    });
    return employeeMatch || selectedService.id;
  };
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [loyaltyBalance, setLoyaltyBalance] = useState({ points: 0, equivalentDiscount: 0 });
  const [remainderMethod, setRemainderMethod] = useState("Card");
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null);
  const [desiredPhotoUrl, setDesiredPhotoUrl] = useState(initialReferenceImage || null);
  const [uploadingCurrent, setUploadingCurrent] = useState(false);
  const [uploadingDesired, setUploadingDesired] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState("");

  useEffect(() => {
    if (!isOpen || !salonId) return;
    setStep(1);
    setSelectedService(null);
    setSelectedEmployee(null);
    setSelectedDate("");
    setSelectedTime(null);
    setAvailableSlots([]);
    setLoadingOptions(true);
    setCurrentPhotoUrl(null);
    setDesiredPhotoUrl(initialReferenceImage || null);
    setPhotoUploadError("");

    Promise.all([api.get("/Service"), api.get("/Employee"), api.get(`/Loyalty/balance/${salonId}`).catch(() => ({ data: { points: 0, equivalentDiscount: 0 } }))])
      .then(([servRes, empRes, balRes]) => {
        setServices(servRes.data.filter((s) => showAllSalons || s.salonId === salonId));
        setEmployees(empRes.data.filter((e) => e.branchId && (showAllSalons || e.salonId === salonId)));
        setLoyaltyBalance(balRes.data);
      })
      .catch((err) => console.error("Məlumat yüklənmədi", err))
      .finally(() => setLoadingOptions(false));
  }, [isOpen, salonId]);

  // Sorgunu tam nezaretde saxlayan useEffect
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedDate || !selectedEmployee || !selectedService) {
        setAvailableSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      setSlotsError("");
      

      try {
        const res = await api.get("/Reservation/available-slots", {
          params: { 
            employeeId: selectedEmployee.id, 
            serviceId: getActualServiceId(), 
            date: selectedDate,
            _t: Date.now() 
          },
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
        setAvailableSlots(res.data);
      } catch (err) {
        setSlotsError(err.response?.data?.message || "Boş saatları yükləmək olmadı");
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedDate, selectedEmployee, selectedService]);

  if (!isOpen) return null;

  const handleDateChange = (e) => {
    setSelectedTime(null);
    setSelectedDate(e.target.value);
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handlePhotoSelect = async (kind, file) => {
    if (!file) return;
    setPhotoUploadError("");
    const setUploading = kind === "current" ? setUploadingCurrent : setUploadingDesired;
    const setUrl = kind === "current" ? setCurrentPhotoUrl : setDesiredPhotoUrl;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/Upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUrl(res.data.url);
    } catch (err) {
      setPhotoUploadError(err.response?.data?.message || "Şəkil yüklənmədi.");
    } finally {
      setUploading(false);
    }
  };

  const handleFinalConfirm = async () => {
    setSubmitting(true);
    try {
      const startTime = selectedTime.length === 5 ? `${selectedTime}:00` : selectedTime;
      const res = await api.post("/Reservation", {
        serviceId: getActualServiceId(),
        employeeId: selectedEmployee.id,
        branchId: selectedEmployee.branchId,
        reservationDate: selectedDate,
        startTime,
        referenceImageUrl: desiredPhotoUrl || null,
        currentPhotoUrl: currentPhotoUrl || null,
        paymentMethod: paymentMethod === "LoyaltyPoints" ? remainderMethod : paymentMethod,
      });

      if (paymentMethod === "LoyaltyPoints" && loyaltyBalance.points > 0) {
        const discountAmount = Math.min(selectedService.price, loyaltyBalance.equivalentDiscount);
        try {
          await api.post("/Loyalty/redeem", {
            salonId,
            discountAmount,
            reservationId: res.data.id,
          });
        } catch (redeemErr) {
          console.error("Bal istifadə edilərkən xəta", redeemErr);
        }
      }
      alert("Rezervasiya uğurla tamamlandı!");
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Xəta baş verdi");
    } finally {
      setSubmitting(false);
    }
  };

  const isNextDisabled = () => {
    if (step === 1 && !selectedService) return true;
    if (step === 2 && !selectedEmployee) return true;
    if (step === 3 && (!selectedDate || !selectedTime)) return true;
    return false;
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const StepIndicator = () => {
    const stepsArr = [
      { id: 1, label: "Xidmət" },
      { id: 2, label: "Usta" },
      { id: 3, label: "Tarix & Saat" },
      { id: 4, label: "Görünüş" },
      { id: 5, label: "Təsdiq" },
    ];
    return (
      <div className="flex items-center justify-between w-full mb-8 relative px-4">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -translate-y-1/2 z-0 mx-8"></div>
        {stepsArr.map((s) => {
          const isCompleted = step > s.id;
          const isActive = step === s.id;
          return (
            <div key={s.id} className="flex flex-col items-center z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? "bg-emerald-600 text-white"
                    : isActive
                    ? "bg-[#C9A227] text-white ring-4 ring-[#F0D68A]"
                    : "bg-white text-[#1A1714] border-2 border-gray-300"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className={`text-xs mt-2 font-sans hidden sm:block ${isActive ? "text-[#C9A227] font-bold" : "text-gray-500"}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#1A1714]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[radial-gradient(circle_at_center,_#FFFFFF_0%,_#FDFBF7_45%,_#F4E7CE_100%)] w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-[#E5D2B1]">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-[#1A1714] text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C9A227]" />
            <div>
              <h2 className="text-xl font-serif text-[#F0D68A]">SalonHub</h2>
              <p className="text-xs text-gray-400 font-sans tracking-wider">{salonName || "ONLAYN REZERVASİYA"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition">
            <X className="w-6 h-6 text-gray-400 hover:text-white" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <StepIndicator />

          {loadingOptions ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-[#C9A227] animate-spin" />
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-serif text-[#1A1714] mb-2">Xidmət seçin</h3>
                  {services.length === 0 ? (
                    <p className="text-sm text-gray-400">Bu salonda hələ xidmət əlavə edilməyib.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from(new Map(services.map((s) => [s.name, s])).values()).map((service) => (
                        <div
                          key={service.id}
                          onClick={() => setSelectedService(service)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedService?.id === service.id ? "border-[#C9A227] bg-[#B8935A]/10" : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#FAF6F0] rounded-lg text-[#C9A227]">
                                <Scissors className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-sans font-semibold text-[#1A1714]">{service.name}</h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{service.durationMinutes} {t("bm_minutes")}</span>
                                </div>
                              </div>
                            </div>
                            <span className="font-serif font-bold text-[#C9A227] text-lg">{service.price} AZN</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-serif text-[#1A1714] mb-2">Usta seçin</h3>
                  {employees.filter((e) => e.serviceIds?.some((id) => getMatchingServiceIds(selectedService?.name).includes(id))).length === 0 ? (
                    <p className="text-sm text-gray-400">Bu salonda hələ usta əlavə edilməyib.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {employees.filter((e) => e.serviceIds?.some((id) => getMatchingServiceIds(selectedService?.name).includes(id))).map((employee) => (
                        <div
                          key={employee.id}
                          onClick={() => setSelectedEmployee(employee)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 ${
                            selectedEmployee?.id === employee.id ? "border-[#C9A227] bg-[#B8935A]/10" : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          {employee.profileImageUrl ? (
                            <img src={employee.profileImageUrl} alt={employee.fullName} className="w-12 h-12 rounded-full object-cover ring-2 ring-[#B8935A]" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-[#1A1714] text-[#F0D68A] flex items-center justify-center font-bold text-lg font-serif">
                              {getInitials(employee.fullName)}
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-sans font-semibold text-[#1A1714]">{employee.fullName}</h4>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(employee.averageRating) ? "text-[#C9A227] fill-[#C9A227]" : "text-gray-300"}`} />
                              ))}
                              <span className="text-xs text-gray-500 ml-1">({employee.averageRating.toFixed(1)})</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-serif text-[#1A1714] mb-3">Tarix seçin</h3>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={handleDateChange}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#C9A227] text-[#1A1714] font-sans shadow-sm"
                    />
                  </div>

                  {selectedDate && (
                    <div>
                      <h3 className="text-xl font-serif text-[#1A1714] mb-3">Mövcud saatlar</h3>
                      {isLoadingSlots ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 text-[#C9A227] animate-spin" />
                        </div>
                      ) : slotsError ? (
                        <p className="text-sm text-red-500">{slotsError}</p>
                      ) : availableSlots.length === 0 ? (
                        <p className="text-sm text-gray-400">Bu tarixdə boş saat yoxdur.</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots.map((slot, index) => {
                            const isSelected = selectedTime === slot;
                            return (
                              <button
                                key={index}
                                onClick={() => setSelectedTime(slot)}
                                className={`p-2.5 rounded-lg text-sm font-semibold transition-all font-sans ${
                                  isSelected ? "bg-[#C9A227] text-white shadow-md" : "bg-white text-[#C9A227] border border-[#B8935A]/40 hover:bg-[#B8935A]/10"
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-serif text-[#1A1714] mb-1 flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-[#C9A227]" />
                      Görünüş Transformasiyası
                    </h3>
                    <p className="text-sm text-gray-500">
                      Ustanıza hazırkı halınızı və arzuladığınız nəticəni göstərin ki, tam istədiyiniz kimi işləsin. Bu addım istəyə bağlıdır.
                    </p>
                  </div>

                  {photoUploadError && <p className="text-sm text-red-500">{photoUploadError}</p>}

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-center">
                    <PhotoUploadSlot
                      label="İndiki Halınız"
                      hint="Hazırkı saç/görünüşünüzün şəkli"
                      icon={<Camera className="w-6 h-6" />}
                      imageUrl={currentPhotoUrl}
                      uploading={uploadingCurrent}
                      onFile={(file) => handlePhotoSelect("current", file)}
                      onRemove={() => setCurrentPhotoUrl(null)}
                      inputId="booking-current-photo"
                    />

                    <div className="flex sm:flex-col items-center justify-center gap-1 text-[#C9A227] py-1">
                      <ArrowRight className="w-6 h-6 rotate-90 sm:rotate-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">Transformasiya</span>
                    </div>

                    <PhotoUploadSlot
                      label="Arzuladığınız Nəticə"
                      hint="Bəyəndiyiniz model/ilham şəkli"
                      icon={<Sparkles className="w-6 h-6" />}
                      imageUrl={desiredPhotoUrl}
                      uploading={uploadingDesired}
                      onFile={(file) => handlePhotoSelect("desired", file)}
                      onRemove={() => setDesiredPhotoUrl(null)}
                      inputId="booking-desired-photo"
                      accent
                    />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-serif text-[#1A1714] mb-2">Rezervasiya Xülasəsi</h3>
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-[#FAF6F0] rounded-xl text-[#C9A227]">
                          <Scissors className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block font-sans">XİDMƏT</span>
                          <h4 className="text-lg font-sans font-bold text-[#1A1714]">{selectedService?.name}</h4>
                          <p className="text-xs text-gray-500">{selectedService?.durationMinutes} {t("bm_minutes")}</p>
                        </div>
                      </div>
                      <div className="border-t border-dashed border-gray-200 my-2"></div>
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-[#FAF6F0] rounded-xl text-[#C9A227]">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block font-sans">USTA</span>
                          <h4 className="text-lg font-sans font-bold text-[#1A1714]">{selectedEmployee?.fullName}</h4>
                        </div>
                      </div>
                      <div className="border-t border-dashed border-gray-200 my-2"></div>
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-[#FAF6F0] rounded-xl text-[#C9A227]">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block font-sans">TARİX VƏ SAAT</span>
                          <h4 className="text-lg font-sans font-bold text-[#1A1714]">
                            {selectedDate} <span className="text-[#C9A227] ml-2">| {selectedTime}</span>
                          </h4>
                        </div>
                      </div>
                      {(currentPhotoUrl || desiredPhotoUrl) && (
                        <>
                          <div className="border-t border-dashed border-gray-200 my-2"></div>
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#FAF6F0] rounded-xl text-[#C9A227]">
                              <Wand2 className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <span className="text-xs text-gray-400 block font-sans mb-2">GÖRÜNÜŞ ŞƏKİLLƏRİ</span>
                              <div className="flex gap-3">
                                {currentPhotoUrl && (
                                  <div className="relative">
                                    <img src={currentPhotoUrl} alt="İndiki hal" className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200" />
                                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#1A1714] text-white text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap">İndiki</span>
                                  </div>
                                )}
                                {currentPhotoUrl && desiredPhotoUrl && <ArrowRight className="w-4 h-4 text-[#C9A227] self-center shrink-0" />}
                                {desiredPhotoUrl && (
                                  <div className="relative">
                                    <img src={desiredPhotoUrl} alt="Arzu olunan" className="w-16 h-16 rounded-lg object-cover border-2 border-[#C9A227]/50" />
                                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#C9A227] text-white text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap">Arzu</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      <div className="border-t border-dashed border-gray-200 my-2"></div>
                      <PaymentMethodSelector
                        paymentMethod={paymentMethod}
                        setPaymentMethod={setPaymentMethod}
                        loyaltyBalance={loyaltyBalance}
                        selectedService={selectedService}
                        remainderMethod={remainderMethod}
                        setRemainderMethod={setRemainderMethod}
                      />
                    </div>
                    <div className="bg-[#1A1714] p-5 flex justify-between items-center">
                      <span className="text-sm font-sans tracking-wide text-gray-300">YEKUN ÖDƏNİŞ</span>
                      <span className="text-2xl font-serif font-bold text-[#F0D68A]">{selectedService?.price} AZN</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center">
          {step > 1 ? (
            <button onClick={handleBack} className="px-5 py-2.5 rounded-xl border border-gray-300 font-sans font-medium text-gray-600 hover:bg-gray-50 transition flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Geri
            </button>
          ) : (
            <div></div>
          )}

          {step < 5 ? (
            <button
              disabled={isNextDisabled()}
              onClick={handleNext}
              className={`px-6 py-2.5 rounded-xl font-sans font-semibold text-white flex items-center gap-1 transition shadow-md ${
                isNextDisabled() ? "bg-gray-300 cursor-not-allowed shadow-none" : "bg-[#C9A227] hover:bg-[#B8935A]"
              }`}
            >
              Növbəti <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinalConfirm}
              disabled={submitting}
              className="px-6 py-3 rounded-xl font-sans font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="w-5 h-5" /> {submitting ? "Göndərilir..." : "Rezervasiyanı Təsdiqlə"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PhotoUploadSlot({ label, hint, icon, imageUrl, uploading, onFile, onRemove, inputId, accent = false }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <label
        htmlFor={inputId}
        className={`relative w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center p-3 cursor-pointer transition-all duration-300 overflow-hidden group ${
          imageUrl
            ? accent
              ? "border-solid border-[#C9A227]"
              : "border-solid border-[#1A1714]/30"
            : accent
            ? "border-[#C9A227]/40 bg-[#C9A227]/5 hover:bg-[#C9A227]/10 hover:border-[#C9A227]"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
        }`}
      >
        {uploading ? (
          <Loader2 className="w-7 h-7 text-[#C9A227] animate-spin" />
        ) : imageUrl ? (
          <>
            <img src={imageUrl} alt={label} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-sans font-semibold transition-opacity duration-300 flex items-center gap-1">
                <ImagePlus className="w-3.5 h-3.5" /> Dəyiş
              </span>
            </div>
          </>
        ) : (
          <>
            <div className={`mb-1.5 ${accent ? "text-[#C9A227]" : "text-gray-400"}`}>{icon}</div>
            <span className={`text-xs font-sans font-semibold ${accent ? "text-[#B8935A]" : "text-gray-500"}`}>{label}</span>
            <span className="text-[10px] text-gray-400 mt-0.5 font-sans leading-tight">{hint}</span>
          </>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-sans font-semibold ${accent ? "text-[#B8935A]" : "text-gray-600"}`}>{label}</span>
        {imageUrl && !uploading && (
          <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-colors" title="Sil">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}







