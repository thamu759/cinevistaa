import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map(t => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          return (
            <div 
              key={t.id} 
              className={`toast toast--${t.type}`}
              role="status"
            >
              <div className="toast-icon-wrap">
                {isSuccess && <CheckCircle2 size={16} className="toast-icon toast-icon--success" />}
                {isError && <AlertCircle size={16} className="toast-icon toast-icon--error" />}
                {!isSuccess && !isError && <Info size={16} className="toast-icon toast-icon--info" />}
              </div>
              <span className="toast-text">{t.message}</span>
              <button 
                type="button" 
                className="toast-close-btn" 
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss message"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
