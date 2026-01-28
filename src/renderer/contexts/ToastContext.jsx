import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ message, type = 'info', duration = 3000 }) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const error = (message, duration = 5000) => addToast({ message, type: 'error', duration });
    const success = (message, duration = 3000) => addToast({ message, type: 'success', duration });
    const info = (message, duration = 3000) => addToast({ message, type: 'info', duration });

    return (
        <ToastContext.Provider value={{ addToast, removeToast, error, success, info }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ toast, onClose }) => {
    const colors = {
        error: 'bg-red-500/90 border-red-400',
        success: 'bg-green-500/90 border-green-400',
        info: 'bg-blue-500/90 border-blue-400',
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`pointer-events-auto min-w-[300px] max-w-sm rounded-lg shadow-lg border backdrop-blur-md p-4 flex items-start gap-3 text-white ${colors[toast.type]}`}
        >
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </motion.div>
    );
};
