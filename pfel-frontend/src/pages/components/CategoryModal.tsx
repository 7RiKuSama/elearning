// File: src/components/ui/ConfirmModal.tsx
import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'default';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  confirmLabel = 'On y va',
  cancelLabel = 'Finalement non',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const badgeClass =
    variant === 'danger'
      ? 'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)]'
      : variant === 'warning'
      ? 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]'
      : 'bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--accent-border)]';

  const confirmBtnClass =
    variant === 'danger'
      ? 'bg-[var(--danger-bg)] hover:brightness-110 text-[var(--danger-text)] border border-[var(--danger-border)]'
      : variant === 'warning'
      ? 'bg-[var(--warning-bg)] hover:brightness-110 text-[var(--warning-text)] border border-[var(--warning-border)]'
      : 'btn-accent';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${badgeClass}`}
            >
              {variant === 'danger' ? (
                <Trash2 className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
            <div className="space-y-1">
              <h3
                id="confirm-modal-title"
                className="text-base font-semibold text-[var(--text-primary)]"
              >
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            aria-label="Fermer cette fenêtre"
            title="Fermer"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer disabled:opacity-50 ${confirmBtnClass}`}
          >
            {loading ? 'Patiente une seconde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
