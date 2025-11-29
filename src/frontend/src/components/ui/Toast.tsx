/**
 * Toast - Toast notification component för systemmeddelanden
 */
import React, { useEffect } from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export type ToastSeverity = 'info' | 'success' | 'warning' | 'error';

interface ToastProps {
  id: string;
  message: string;
  severity?: ToastSeverity;
  duration?: number;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  message,
  severity = 'info',
  duration = 5000,
  onClose,
  action,
}) => {
  const { colors } = useTheme();

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const severityColors = {
    info: colors.info || colors.primary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  };

  const baseStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-md)',
    minWidth: '300px',
    maxWidth: '500px',
    backgroundColor: colors.surface,
    border: `1px solid ${severityColors[severity]}`,
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
    color: colors.text.primary,
    fontSize: 'var(--font-size-sm)',
    zIndex: 2000,
  };

  return (
    <div style={baseStyles} role="alert" aria-live="polite">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <div
          style={{
            width: '4px',
            height: '100%',
            backgroundColor: severityColors[severity],
            borderRadius: 'var(--radius-sm)',
            flexShrink: 0,
          }}
        />
        <span style={{ flex: 1 }}>{message}</span>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            backgroundColor: 'transparent',
            border: `1px solid ${severityColors[severity]}`,
            borderRadius: 'var(--radius-sm)',
            color: severityColors[severity],
            cursor: 'pointer',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
          }}
        >
          {action.label}
        </button>
      )}
      <button
        onClick={onClose}
        style={{
          padding: 'var(--spacing-xs)',
          backgroundColor: 'transparent',
          border: 'none',
          color: colors.text.secondary,
          cursor: 'pointer',
          fontSize: 'var(--font-size-lg)',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Stäng"
      >
        ×
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    severity?: ToastSeverity;
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>;
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'var(--spacing-lg)',
        right: 'var(--spacing-lg)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <Toast {...toast} onClose={() => onClose(toast.id)} />
        </div>
      ))}
    </div>
  );
};
