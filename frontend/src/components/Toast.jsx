import React, { useState, createContext, useContext, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext({
  showToast: () => {},
  toast: {
    success: () => {},
    error: () => {},
    info: () => {},
    warning: () => {}
  }
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    if (!message) return;
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep up to 5 toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, dur) => showToast(msg, 'success', dur),
    error: (msg, dur) => showToast(msg, 'error', dur || 5000),
    info: (msg, dur) => showToast(msg, 'info', dur),
    warning: (msg, dur) => showToast(msg, 'warning', dur || 4500)
  };

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-[calc(100%-2rem)] pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          const icon = isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : isError ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : isWarning ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          );

          const borderBg = isSuccess
            ? 'bg-white border-emerald-300 text-emerald-950 shadow-emerald-950/10'
            : isError
            ? 'bg-white border-rose-300 text-rose-950 shadow-rose-950/10'
            : isWarning
            ? 'bg-white border-amber-300 text-amber-950 shadow-amber-950/10'
            : 'bg-white border-indigo-200 text-indigo-950 shadow-indigo-950/10';

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto rounded-2xl p-4 border shadow-xl flex items-start gap-3 backdrop-blur-md animate-fade-up transition-all ${borderBg}`}
            >
              {icon}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold leading-snug break-words">
                  {t.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded-lg transition-colors shrink-0 -mr-1 -mt-1"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
