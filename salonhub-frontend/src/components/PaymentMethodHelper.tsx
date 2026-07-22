import React from 'react';

export const PAYMENT_METHODS = [
  { id: 'Cash', label: 'Nağd', icon: '💵' },
  { id: 'Terminal', label: 'POS-Terminal', icon: '💳' },
  { id: 'Online', label: 'Onlayn', icon: '🌐' },
];

interface PaymentSelectorProps {
  value?: string;
  onChange: (method: string) => void;
}

export const PaymentMethodSelector: React.FC<PaymentSelectorProps> = ({ value = 'Cash', onChange }) => {
  return (
    <div className="flex flex-col gap-2 my-3">
      <label className="text-sm font-medium text-gray-700">Ödəniş Üsulu</label>
      <div className="grid grid-cols-3 gap-2">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = value === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onChange(method.id)}
              className={lex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all }
            >
              <span>{method.icon}</span>
              <span>{method.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const PaymentMethodBadge: React.FC<{ method?: string }> = ({ method }) => {
  switch (method) {
    case 'Cash':
    case 'Nağd':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">
          💵 Nağd
        </span>
      );
    case 'Terminal':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          💳 POS-Terminal
        </span>
      );
    case 'Online':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          🌐 Onlayn
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
          Göstərilməyib
        </span>
      );
  }
};
