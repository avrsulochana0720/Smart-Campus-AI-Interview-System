import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', zIndex: 9999 }}>
        {toasts.map((toast) => {
          let bgColor = '#334155';
          let borderColor = '#475569';
          let Icon = Info;
          let iconColor = '#E11D48';

          if (toast.type === 'success') {
            borderColor = 'rgba(34, 197, 94, 0.5)';
            Icon = CheckCircle;
            iconColor = '#22C55E';
          } else if (toast.type === 'warning') {
            borderColor = 'rgba(245, 158, 11, 0.5)';
            Icon = AlertTriangle;
            iconColor = '#F59E0B';
          } else if (toast.type === 'error') {
            borderColor = 'rgba(239, 68, 68, 0.5)';
            Icon = AlertCircle;
            iconColor = '#EF4444';
          }

          return (
            <div key={toast.id} style={{ 
              backgroundColor: bgColor, 
              border: `1px solid ${borderColor}`,
              borderRadius: '0.5rem',
              padding: '1rem',
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              minWidth: '250px',
              animation: 'slideIn 0.3s ease-out forwards'
            }}>
              <Icon size={20} color={iconColor} />
              <span style={{ fontSize: '0.85rem', flex: 1 }}>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
