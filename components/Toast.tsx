import React, { useEffect } from 'https://esm.sh/react@19.0.0';
import { AppNotification } from '../types.ts';

interface ToastProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ notifications, onDismiss }) => {
  const activeToasts = notifications.filter(n => !n.read).slice(-3); // Only show last 3 unread as toasts

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {activeToasts.map((n) => (
        <ToastItem key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ notification: AppNotification; onDismiss: (id: string) => void }> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const styles = {
    success: 'bg-emerald-600 border-emerald-500',
    info: 'bg-[#f26722] border-orange-400',
    warning: 'bg-amber-600 border-amber-500',
    error: 'bg-red-600 border-red-500',
  };

  return (
    <div className={`pointer-events-auto flex items-center justify-between min-w-[300px] max-w-md p-4 rounded-2xl shadow-2xl border text-white animate-slideInRight ${styles[notification.type]}`}>
      <div className="flex items-center gap-3">
        <span className="text-xl">
          {notification.type === 'success' && '✅'}
          {notification.type === 'info' && '🔔'}
          {notification.type === 'warning' && '⚠️'}
          {notification.type === 'error' && '🚫'}
        </span>
        <p className="text-sm font-bold leading-tight">{notification.message}</p>
      </div>
      <button 
        onClick={() => onDismiss(notification.id)}
        className="ml-4 text-white/60 hover:text-white transition-colors text-lg"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;