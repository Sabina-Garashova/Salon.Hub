import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolver.current = resolve;
      setDialog({ message, options });
    });
  }, []);

  const handleClose = (result) => {
    setDialog(null);
    if (resolver.current) {
      resolver.current(result);
      resolver.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <div
          onClick={() => handleClose(false)}
          className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[radial-gradient(circle_at_center,_#FFFFFF_0%,_#FDFBF7_45%,_#F4E7CE_100%)] w-full max-w-sm rounded-3xl shadow-2xl border border-[#E5D2B1] overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <p className="text-sm text-[#1A1714] text-center leading-relaxed font-medium">
                {dialog.message}
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                >
                  {dialog.options.cancelLabel || "Ləğv et"}
                </button>
                <button
                  type="button"
                  onClick={() => handleClose(true)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-[#1A1714] hover:bg-[#2A231C] transition"
                >
                  {dialog.options.confirmLabel || "Bəli, Sil"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx.confirm;
}
