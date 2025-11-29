/**
 * useToast - Hook för att hantera toast-notifieringar
 */
import { useState, useCallback } from 'react';
import { ToastSeverity } from '../components/ui/Toast';

interface ToastMessage {
  id: string;
  message: string;
  severity?: ToastSeverity;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prevToasts) => [...prevToasts, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  // Convenience methods
  const showToast = useCallback(
    (message: string, severity: ToastSeverity = 'info', duration?: number) => {
      addToast({ message, severity, duration });
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    showToast,
  };
};
