import { useState, useEffect } from "react";
import { Check, Calendar, Clock, User, Scissors, ChevronRight, ChevronLeft, Star, Loader2, X, Sparkles } from "lucide-react";
import api from "../services/api";

export default function BookingModal({ isOpen, onClose, salonId, salonName }) {
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

  useEffect(() => {
    if (!isOpen || !salonId) return;
    setStep(1);
    setSelectedService(null);
    setSelectedEmployee(null);
    setSelectedDate("");
    setSelectedTime(null);
    setAvailableSlots([]);
    setLoadingOptions(true);

    Promise.all([api.get("/Service"), api.get("/Employee")])
      .then(([servRes, empRes]) => {
        setServices(servRes.data.filter((s) => s.salonId === salonId));
        setEmployees(empRes.data.filter((e) => e.salonId === salonId && e.branchId));
      })
      .catch((err) => console.error("Melumat yuklenmedi", err))
      .finally(() => setLoadingOptions(false));
  }, [isOpen, salonId]);

  // Sorgunu tam n?zar?td? saxlayan useEffect
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedDate || !selectedEmployee || !selectedService) {
        setAvailableSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      setSlotsError("");
      
      // F12-SIZ YOXLAMAQ ÜÇÜN BILDIRIS EKRANI
      alert(`Backend-e geden tarix: ${selectedDate}\nUsta ID: ${selectedEmployee.id}`);

      try {
        const res = await api.get("/Reservation/available-slots", {
          params: { 
            employeeId: selectedEmployee.id, 
            serviceId: selectedService.id, 
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
        setSlotsError(err.response?.data?.message || "Bos saatlari yuklemek olmadi");
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
    if (step < 4) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinalConfirm = async () => {
    setSubmitting(true);
    try {
      const startTime = selectedTime.length === 5 ? `${selectedTime}:00` : selectedTime;
      await api.post("/Reservation", {
        serviceId: selectedService.id,
        employeeId: selectedEmployee.id,
        branchId: selectedEmployee.branchId,
        reservationDate: selectedDate,
        startTime,
      });
      alert("Rezervasiya ugurla tamamlandi!");
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Xeta bas verdi");
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
      { id: 1, label: "Xidmet" },
      { id: 2, label: "Usta" },
      { id: 3, label: "Tarix & Saat" },
      { id: 4, label: "Tesdiq" },
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
      <div className="bg-[#FAF6F0] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-[#B8935A]/20">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-[#1A1714] text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C9A227]" />
            <div>
              <h2 className="text-xl font-serif text-[#F0D68A]">SalonHub</h2>
              <p className="text-xs text-gray-400 font-sans tracking-wider">{salonName || "ONLAYN REZERVASIYA"}</p>
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
                  <h3 className="text-xl font-serif text-[#1A1714] mb-2">Xidmet secin</h3>
                  {services.length === 0 ? (
                    <p className="text-sm text-gray-400">Bu salonda hele xidmet elave edilmeyib.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {services.map((service) => (
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
                                  <span>{service.durationMinutes} deqiqe</span>
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
                  <h3 className="text-xl font-serif text-[#1A1714] mb-2">Usta secin</h3>
                  {employees.length === 0 ? (
                    <p className="text-sm text-gray-400">Bu salonda hele usta elave edilmeyib.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {employees.map((employee) => (
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
                    <h3 className="text-xl font-serif text-[#1A1714] mb-3">Tarix secin</h3>
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
                      <h3 className="text-xl font-serif text-[#1A1714] mb-3">Movcud saatlar</h3>
                      {isLoadingSlots ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 text-[#C9A227] animate-spin" />
                        </div>
                      ) : slotsError ? (
                        <p className="text-sm text-red-500">{slotsError}</p>
                      ) : availableSlots.length === 0 ? (
                        <p className="text-sm text-gray-400">Bu tarixde bos saat yoxdur.</p>
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
                <div className="space-y-4">
                  <h3 className="text-xl font-serif text-[#1A1714] mb-2">Rezervasiya Xulasesi</h3>
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-[#FAF6F0] rounded-xl text-[#C9A227]">
                          <Scissors className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block font-sans">XIDMET</span>
                          <h4 className="text-lg font-sans font-bold text-[#1A1714]">{selectedService?.name}</h4>
                          <p className="text-xs text-gray-500">{selectedService?.durationMinutes} deqiqe</p>
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
                          <span className="text-xs text-gray-400 block font-sans">TARIX VE SAAT</span>
                          <h4 className="text-lg font-sans font-bold text-[#1A1714]">
                            {selectedDate} <span className="text-[#C9A227] ml-2">| {selectedTime}</span>
                          </h4>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#1A1714] p-5 flex justify-between items-center">
                      <span className="text-sm font-sans tracking-wide text-gray-300">YEKUN ODENIS</span>
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

          {step < 4 ? (
            <button
              disabled={isNextDisabled()}
              onClick={handleNext}
              className={`px-6 py-2.5 rounded-xl font-sans font-semibold text-white flex items-center gap-1 transition shadow-md ${
                isNextDisabled() ? "bg-gray-300 cursor-not-allowed shadow-none" : "bg-[#C9A227] hover:bg-[#B8935A]"
              }`}
            >
              Novbeti <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinalConfirm}
              disabled={submitting}
              className="px-6 py-3 rounded-xl font-sans font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="w-5 h-5" /> {submitting ? "Gonderilir..." : "Rezervasiyani Tesdiqle"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
