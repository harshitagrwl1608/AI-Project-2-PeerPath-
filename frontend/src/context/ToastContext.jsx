import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
};

const ICONS = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-primary shrink-0" />,
};

const BG = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-tag-bg border-primary/20',
};

const TEXT = {
    success: 'text-emerald-800',
    error: 'text-red-800',
    info: 'text-primary',
};

let toastId = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 3500) => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast container — bottom-right on desktop, bottom-centre on mobile */}
            <div
                aria-live="polite"
                className="fixed bottom-5 right-5 left-5 sm:left-auto z-50 flex flex-col gap-3 sm:w-96"
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-lg
                            ${BG[toast.type]} animate-in slide-in-from-bottom-4 fade-in duration-300
                        `}
                        role="alert"
                    >
                        {ICONS[toast.type]}
                        <p className={`text-sm font-medium flex-1 leading-snug ${TEXT[toast.type]}`}>
                            {toast.message}
                        </p>
                        <button
                            onClick={() => dismiss(toast.id)}
                            className="text-gray-400 hover:text-gray-600 transition shrink-0 -mt-0.5"
                            aria-label="Dismiss notification"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
