import React, { useState, useEffect } from 'react';
import { CreditCard, Banknote, Gift, Check, Info } from 'lucide-react';

const SAVED_CARD_KEY_PREFIX = 'salonhub_saved_card_number_';

function decodeToken(t) {
  try {
    const base64 = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getCurrentUserId() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) return null;
  const decoded = decodeToken(token);
  return (
    decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
    decoded?.sub ||
    null
  );
}

function formatCardNumber(digitsOnly) {
  return digitsOnly.match(/.{1,4}/g)?.join(' ') || '';
}

export default function PaymentMethodSelector({
  paymentMethod,
  setPaymentMethod,
  loyaltyBalance,
  selectedService,
  remainderMethod,
  setRemainderMethod,
}) {
  const discount = loyaltyBalance?.equivalentDiscount || 0;
  const price = selectedService?.price || 0;
  const remainingAmount = Math.max(0, price - discount);
  const isLoyaltyDisabled = !loyaltyBalance || loyaltyBalance.points === 0 || discount === 0;

  const [cardNumber, setCardNumber] = useState('');

  useEffect(() => {
    // Köhnə paylaşılan (bütün istifadəçilər üçün ortaq) açarı təmizlə
    localStorage.removeItem('salonhub_saved_card_number');
    const userId = getCurrentUserId();
    if (!userId) return;
    const saved = localStorage.getItem(SAVED_CARD_KEY_PREFIX + userId);
    if (saved) setCardNumber(saved);
  }, []);

  const handleCardNumberChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = formatCardNumber(digitsOnly);
    setCardNumber(formatted);
    if (digitsOnly.length === 16) {
      const userId = getCurrentUserId();
      if (userId) localStorage.setItem(SAVED_CARD_KEY_PREFIX + userId, formatted);
    }
  };

  const options = [
    {
      id: 'Card',
      title: 'Kartla',
      subtitle: 'Derhal odenis',
      icon: CreditCard,
      disabled: false,
    },
    {
      id: 'Cash',
      title: 'Naqd',
      subtitle: 'Tamamlananda',
      icon: Banknote,
      disabled: false,
    },
    {
      id: 'LoyaltyPoints',
      title: 'Bal ile',
      subtitle: isLoyaltyDisabled
        ? 'Baliniz yoxdur'
        : discount.toFixed(2) + ' AZN movcuddur',
      icon: Gift,
      disabled: isLoyaltyDisabled,
    },
  ];

  return (
    <div className="w-full space-y-3 font-sans">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-[#1A1714]">
          Odenis Usulu
        </label>
        <p className="text-xs text-stone-500">
          Odenisi heyata kecirmek istediyiniz rahat usulu secin
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = paymentMethod === option.id;

          return (
            <button
              key={option.id}
              type="button"
              disabled={option.disabled}
              onClick={() => !option.disabled && setPaymentMethod(option.id)}
              className={
                "relative flex flex-col items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 outline-none text-center select-none " +
                (option.disabled
                  ? 'opacity-40 cursor-not-allowed bg-stone-100/60 border-stone-200'
                  : 'cursor-pointer') + " " +
                (isSelected && !option.disabled
                  ? 'border-[#C9A227] bg-[#FAF6F0] shadow-sm'
                  : !option.disabled
                  ? 'border-stone-200 bg-white hover:border-[#B8935A]/50 hover:bg-[#FAF6F0]/40'
                  : '')
              }
            >
              {isSelected && !option.disabled && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#C9A227] text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              <div
                className={
                  "p-3 rounded-full mb-2.5 transition-colors duration-200 " +
                  (isSelected && !option.disabled
                    ? 'bg-[#C9A227]/15 text-[#C9A227]'
                    : 'bg-stone-100 text-stone-600')
                }
              >
                <Icon className="w-6 h-6" />
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <span
                  className={
                    "font-semibold text-sm " +
                    (isSelected ? 'text-[#1A1714]' : 'text-stone-700')
                  }
                >
                  {option.title}
                </span>
                <span className="text-xs text-stone-500 font-normal">
                  {option.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {paymentMethod === 'Card' && (
        <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-[#FAF6F0] border border-[#C9A227]/40">
          <label className="text-xs font-semibold text-[#1A1714] flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-[#C9A227]" />
            Kart Nömrəsi
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={cardNumber}
            onChange={handleCardNumberChange}
            placeholder="0000 0000 0000 0000"
            maxLength={19}
            className="w-full px-3 py-2.5 rounded-lg border border-stone-200 bg-white text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-[#C9A227] font-mono"
          />
          <p className="text-[11px] text-stone-500">
            Kart məlumatınız növbəti dəfə üçün yadda saxlanılacaq.
          </p>
        </div>
      )}

      {paymentMethod === 'LoyaltyPoints' &&
        !isLoyaltyDisabled &&
        discount < price && (
          <>
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FAF6F0] border border-[#C9A227]/40 text-[#1A1714] text-xs leading-relaxed">
            <Info className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#1A1714]">Hibrid odenis: </span>
              Baliniz <span className="font-bold text-[#1A1714]">{discount.toFixed(2)} AZN</span>-i qarsilayir. Qalan{' '}
              <span className="font-bold text-[#C9A227]">{remainingAmount.toFixed(2)} AZN</span> salon yerinde kartla/naqdla odenilecek.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => setRemainderMethod("Card")}
              className={"p-2.5 rounded-lg border text-xs font-semibold transition " + (remainderMethod === "Card" ? "border-[#C9A227] bg-[#FAF6F0] text-[#1A1714]" : "border-gray-200 text-gray-500 bg-white")}
            >
              Qalani Kartla ode
            </button>
            <button
              type="button"
              onClick={() => setRemainderMethod("Cash")}
              className={"p-2.5 rounded-lg border text-xs font-semibold transition " + (remainderMethod === "Cash" ? "border-[#C9A227] bg-[#FAF6F0] text-[#1A1714]" : "border-gray-200 text-gray-500 bg-white")}
            >
              Qalani Naqd ode
            </button>
          </div>
          </>
        )}
    </div>
  );
}


