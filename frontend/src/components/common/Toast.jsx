import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4500) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newToast = { id, message, type, timestamp: new Date().toLocaleTimeString() };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const warning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const typeConfig = {
            success: {
              border: 'border-emerald-500/30',
              bg: 'bg-slate-900/95',
              iconColor: 'text-emerald-400',
              badge: 'bg-emerald-500/10 text-emerald-300',
              icon: CheckCircle2,
            },
            error: {
              border: 'border-rose-500/30',
              bg: 'bg-slate-900/95',
              iconColor: 'text-rose-400',
              badge: 'bg-rose-500/10 text-rose-300',
              icon: AlertCircle,
            },
            warning: {
              border: 'border-amber-500/30',
              bg: 'bg-slate-900/95',
              iconColor: 'text-amber-400',
              badge: 'bg-amber-500/10 text-amber-300',
              icon: AlertTriangle,
            },
            info: {
              border: 'border-indigo-500/30',
              bg: 'bg-slate-900/95',
              iconColor: 'text-indigo-400',
              badge: 'bg-indigo-500/10 text-indigo-300',
              icon: Info,
            },
          };

          const config = typeConfig[toast.type] || typeConfig.info;
          const Icon = config.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border ${config.border} ${config.bg} shadow-2xl backdrop-blur-md transition-all duration-200 transform translate-y-0`}
              role="alert"
            >
              <div className="shrink-0 mt-0.5">
                <Icon className={`w-4 h-4 ${config.iconColor}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`text-[10px] font-mono uppercase font-semibold px-1.5 py-0.2 rounded ${config.badge}`}
                  >
                    {toast.type}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {toast.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-snug font-sans">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-1"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback dummy if rendered outside ToastProvider
    return {
      addToast: () => {},
      removeToast: () => {},
      success: (msg) => console.log('Toast [success]:', msg),
      error: (msg) => console.error('Toast [error]:', msg),
      warning: (msg) => console.warn('Toast [warning]:', msg),
      info: (msg) => console.info('Toast [info]:', msg),
    };
  }
  return context;
};

export default ToastProvider;

