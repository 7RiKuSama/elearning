// File: src/pages/student/course-detail/SubmissionModal.tsx
import React from 'react';
import type { Evaluation } from '../../../types';
import { CloseCrossGlyph, DropTrayGlyph } from '../../../components/ui/CourseGlyphs';

interface SubmissionModalProps {
  evaluation: Evaluation | null;
  submissionFile: File | null;
  uploading: boolean;
  onFileChange: (file: File | null) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  evaluation,
  submissionFile,
  uploading,
  onFileChange,
  onClose,
  onSubmit,
}) => {
  if (!evaluation) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submission-modal-title"
    >
      <div
        className="surface-card w-full max-w-lg rounded-3xl p-6 sm:p-7 border border-[var(--border-subtle)] space-y-5 relative"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-text)]">
              Rendu d&apos;évaluation
            </span>
            <h2
              id="submission-modal-title"
              className="text-lg font-semibold text-[var(--text-primary)]"
            >
              {evaluation.titre}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre de rendu"
            className="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition cursor-pointer"
          >
            <CloseCrossGlyph className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <label className="block rounded-2xl border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--accent)] bg-[var(--bg-subtle)]/40 p-6 text-center transition cursor-pointer">
            <DropTrayGlyph className="w-7 h-7 text-[var(--accent-text)] mx-auto mb-2.5" />
            <span className="block text-sm font-semibold text-[var(--text-primary)]">
              {submissionFile
                ? submissionFile.name
                : 'Sélectionne ou glisse ton fichier de rendu'}
            </span>
            <span className="block text-xs text-[var(--text-muted)] mt-1">
              {submissionFile
                ? `${Math.max(1, Math.round(submissionFile.size / 1024))} Ko`
                : 'PDF, archive, code source ou document'}
            </span>
            <input
              type="file"
              className="sr-only"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />
          </label>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition cursor-pointer disabled:opacity-60"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!submissionFile || uploading}
              className="btn-accent px-5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {uploading ? 'Envoi en cours...' : 'Envoyer mon rendu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
