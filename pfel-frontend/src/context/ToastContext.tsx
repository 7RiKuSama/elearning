// File: src/context/ToastContext.tsx
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
  action?: ToastAction;
}

interface ToastContextValue {
  toast: (options: Omit<ToastItem, 'id'> | string, variant?: ToastVariant) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { container: string; icon: React.ComponentType<{ className?: string }> }
> = {
  success: {
    container:
      'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]',
    icon: CheckCircle2,
  },
  error: {
    container:
      'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)]',
    icon: AlertCircle,
  },
  warning: {
    container:
      'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]',
    icon: AlertTriangle,
  },
  info: {
    container:
      'bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--accent-border)]',
    icon: Info,
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    if (timersRef.current[id]) {
      window.clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    Object.values(timersRef.current).forEach((t) => window.clearTimeout(t));
    timersRef.current = {};
    setToasts([]);
  }, []);

  const toast = useCallback(
    (options: Omit<ToastItem, 'id'> | string, fallbackVariant: ToastVariant = 'info') => {
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const item: ToastItem =
        typeof options === 'string'
          ? { id, message: options, variant: fallbackVariant, duration: 4000 }
          : { id, duration: 4000, ...options };

      setToasts((prev) => [...prev.slice(-4), item]);

      if (item.duration && item.duration > 0) {
        timersRef.current[id] = window.setTimeout(() => {
          dismiss(id);
        }, item.duration);
      }

      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string, title?: string) => toast({ message, title, variant: 'success' }),
    [toast]
  );

  const error = useCallback(
    (message: string, title?: string) =>
      toast({ message, title, variant: 'error', duration: 5500 }),
    [toast]
  );

  const warning = useCallback(
    (message: string, title?: string) => toast({ message, title, variant: 'warning' }),
    [toast]
  );

  const info = useCallback(
    (message: string, title?: string) => toast({ message, title, variant: 'info' }),
    [toast]
  );

  return (
    <ToastContext.Provider
      value={{ toast, success, error, warning, info, dismiss, clearAll }}
    >
      {children}

      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full px-4 sm:px-0"
      >
        {toasts.map((item) => {
          const style = VARIANT_STYLES[item.variant];
          const Icon = style.icon;

          return (
            <div
              key={item.id}
              role="status"
              className="pointer-events-auto rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xl p-3.5 flex items-start gap-3 transition-all"
            >
              <div
                className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${style.container}`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                {item.title && (
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </p>
                )}
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed break-words">
                  {item.message}
                </p>

                {item.action && (
                  <button
                    type="button"
                    onClick={() => {
                      item.action?.onClick();
                      dismiss(item.id);
                    }}
                    className="mt-1.5 text-xs font-semibold text-[var(--accent-text)] hover:underline cursor-pointer"
                  >
                    {item.action.label}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Fermer la notification"
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition cursor-pointer shrink-0"
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

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
