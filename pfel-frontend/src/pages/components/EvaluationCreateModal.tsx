// File: src/pages/components/EvaluationCreateModal.tsx
import React, { useState } from 'react';
import { createEvaluation, uploadFileToServer } from '../../api/services';
import type { Cours, Evaluation } from '../../types';

interface EvaluationCreateModalProps {
  course: Cours;
  onClose: () => void;
  onCreated: (created?: any, evalType?: 'file' | 'quiz', courseId?: number) => void;
}

function extractEvaluationId(raw: any): number | null {
  const candidate =
    raw?.id_evaluation ??
    raw?.id ??
    raw?.data?.id_evaluation ??
    raw?.data?.id ??
    raw?.evaluation?.id_evaluation ??
    raw?.evaluation?.id;
  const num = Number(candidate);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export default function EvaluationCreateModal({
  course,
  onClose,
  onCreated,
}: EvaluationCreateModalProps) {
  const [evalType, setEvalType] = useState<'file' | 'quiz'>('file');
  const [evalTitle, setEvalTitle] = useState('');
  const [evalInstructions, setEvalInstructions] = useState('');
  const [evalBareme, setEvalBareme] = useState(20);
  const [evalOpen, setEvalOpen] = useState('');
  const [evalClose, setEvalClose] = useState('');
  const [evalNomFichier, setEvalNomFichier] = useState('');
  const [evalFile, setEvalFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let nomFichier = '';
      let cheminFichier = '';

      if (evalType === 'file' && evalFile) {
        const uploaded = await uploadFileToServer(evalFile);
        nomFichier = evalNomFichier.trim() || uploaded.nom_fichier;
        cheminFichier = uploaded.chemin_fichier;
      }

      const rawCreated = await createEvaluation(course.id_cours, {
        titre: evalTitle,
        instructions: evalInstructions,
        bareme: Number(evalBareme),
        type_evaluation: evalType,
        date_ouverture: evalOpen ? new Date(evalOpen).toISOString() : new Date().toISOString(),
        date_cloture: evalClose ? new Date(evalClose).toISOString() : new Date().toISOString(),
        nom_fichier: evalType === 'file' ? nomFichier : '',
        chemin_fichier: evalType === 'file' ? cheminFichier : '',
      });

      const resolvedId = extractEvaluationId(rawCreated);
      const normalizedEval: Evaluation = {
        ...(typeof rawCreated === 'object' && rawCreated !== null ? rawCreated : {}),
        id_evaluation: resolvedId ?? 0,
        id_cours: course.id_cours,
        titre: evalTitle,
        instructions: evalInstructions,
        bareme: Number(evalBareme),
        type_evaluation: evalType,
      } as any;

      alert(
        evalType === 'quiz'
          ? 'Quiz prêt à chauffer les neurones ! Ajoute tes questions dès maintenant.'
          : 'Nouveau défi lâché pour la troupe !'
      );
      onCreated(
        resolvedId
          ? normalizedEval
          : {
              ...(typeof rawCreated === 'object' && rawCreated !== null ? rawCreated : {}),
              id_cours: course.id_cours,
              titre: evalTitle,
              bareme: Number(evalBareme),
              type_evaluation: evalType,
            },
        evalType,
        course.id_cours
      );
      onClose();
    } catch (err) {
      console.error(err);
      alert("Oups, le défi n'a pas pu être lancé — réessaie dans un instant !");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div
        className="surface-card rounded-2xl max-w-lg w-full p-6 space-y-5"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3.5">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Balance un nouveau défi
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Format du défi
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setEvalType('file')}
                className={`py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  evalType === 'file'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                TP à rendre (fichier)
              </button>
              <button
                type="button"
                onClick={() => setEvalType('quiz')}
                className={`py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  evalType === 'quiz'
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Quiz express (auto-corrigé)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Titre du défi
            </label>
            <input
              type="text"
              value={evalTitle}
              onChange={(e) => setEvalTitle(e.target.value)}
              placeholder={
                evalType === 'quiz'
                  ? 'ex: Quiz éclair — Réflexes sur les tensors'
                  : 'ex: Mission finale — Une API qui tient la route'
              }
              required
              className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Règles du jeu & consignes
            </label>
            <textarea
              value={evalInstructions}
              onChange={(e) => setEvalInstructions(e.target.value)}
              placeholder="Explique ce qu'il faut construire, tester ou rendre..."
              required
              rows={3}
              className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Score max / Barème (ex: 20)
            </label>
            <input
              type="number"
              value={evalBareme}
              onChange={(e) => setEvalBareme(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Coup d&apos;envoi
              </label>
              <input
                type="date"
                value={evalOpen}
                onChange={(e) => setEvalOpen(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Clap de fin
              </label>
              <input
                type="date"
                value={evalClose}
                onChange={(e) => setEvalClose(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>

          {evalType === 'file' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Petit nom pour le fichier joint (optionnel)
                </label>
                <input
                  type="text"
                  value={evalNomFichier}
                  onChange={(e) => setEvalNomFichier(e.target.value)}
                  placeholder="ex: Sujet_Mission_1.pdf"
                  className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Fichier de départ / sujet (optionnel)
                </label>
                <input
                  type="file"
                  onChange={(e) => setEvalFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:font-medium file:bg-[var(--accent-soft)] file:text-[var(--accent-text)]"
                />
              </div>
            </>
          )}

          <div className="flex space-x-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] py-2.5 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 btn-accent disabled:opacity-50 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
            >
              {uploading
                ? 'Mise en place...'
                : evalType === 'quiz'
                  ? 'Créer & préparer les questions'
                  : 'Lancer le défi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
