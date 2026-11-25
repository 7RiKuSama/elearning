// File: src/pages/components/QuizBuilderModal.tsx
import React, { useState } from 'react';
import type { Evaluation } from '../../types';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

export interface DraftQuizQuestion {
  id?: number;
  question_type: 'mcq' | 'true_false';
  prompt: string;
  options: string[];
  correct_index: number;
  points: number;
  explanation: string;
}

interface QuizBuilderModalProps {
  evaluation: Evaluation;
  initialQuestions?: DraftQuizQuestion[];
  onClose: () => void;
  onSave: (questions: DraftQuizQuestion[]) => Promise<void>;
}

const makeTrueFalse = (): DraftQuizQuestion => ({
  question_type: 'true_false',
  prompt: '',
  options: ['Vrai', 'Faux'],
  correct_index: 0,
  points: 2,
  explanation: '',
});

const makeMcq = (): DraftQuizQuestion => ({
  question_type: 'mcq',
  prompt: '',
  options: ['', '', '', ''],
  correct_index: 0,
  points: 2,
  explanation: '',
});

export default function QuizBuilderModal({
  evaluation,
  initialQuestions,
  onClose,
  onSave,
}: QuizBuilderModalProps) {
  const [questions, setQuestions] = useState<DraftQuizQuestion[]>(
    initialQuestions && initialQuestions.length > 0 ? initialQuestions : [makeMcq()]
  );
  const [saving, setSaving] = useState(false);

  const updateQuestion = (idx: number, patch: Partial<DraftQuizQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        const next = { ...q, ...patch };
        if (patch.question_type === 'true_false') {
          next.options = ['Vrai', 'Faux'];
          next.correct_index = 0;
        } else if (patch.question_type === 'mcq' && q.question_type === 'true_false') {
          next.options = ['', '', '', ''];
          next.correct_index = 0;
        }
        return next;
      })
    );
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const nextOpts = [...q.options];
        nextOpts[optIdx] = value;
        return { ...q, options: nextOpts };
      })
    );
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, ''] } : q))
    );
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasEmptyPrompt = questions.some((q) => !q.prompt.trim());
    const hasEmptyOption = questions.some((q) => q.options.some((o) => !o.trim()));
    if (hasEmptyPrompt || hasEmptyOption) {
      alert('Veuillez renseigner chaque question et chaque option de réponse.');
      return;
    }

    setSaving(true);
    try {
      await onSave(questions);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement du quiz.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div
        className="surface-card rounded-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Éditeur de quiz — {evaluation.titre}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              QCM et Vrai / Faux avec correction automatique et explications
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {questions.map((q, qIdx) => (
            <div
              key={qIdx}
              className="surface-subtle rounded-xl p-4 space-y-3.5 border border-[var(--border-subtle)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--accent-text)]">
                  Question {qIdx + 1}
                </span>

                <div className="flex items-center gap-2">
                  <select
                    value={q.question_type}
                    onChange={(e) =>
                      updateQuestion(qIdx, {
                        question_type: e.target.value as 'mcq' | 'true_false',
                      })
                    }
                    className="px-2.5 py-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-primary)]"
                  >
                    <option value="mcq">Choix multiple (QCM)</option>
                    <option value="true_false">Vrai / Faux</option>
                  </select>

                  <label className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                    <span>Pts :</span>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={q.points}
                      onChange={(e) => updateQuestion(qIdx, { points: Number(e.target.value) })}
                      className="w-16 px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-primary)]"
                    />
                  </label>

                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="p-1.5 rounded-lg bg-[var(--danger-bg)] text-[var(--danger-text)] border border-[var(--danger-border)]"
                      title="Supprimer la question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <input
                type="text"
                value={q.prompt}
                onChange={(e) => updateQuestion(qIdx, { prompt: e.target.value })}
                placeholder="Énoncé de la question..."
                required
                className="w-full px-3.5 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)]"
              />

              <div className="space-y-2">
                <span className="block text-[11px] font-medium text-[var(--text-muted)]">
                  Sélectionnez la bonne réponse :
                </span>
                {q.options.map((opt, optIdx) => {
                  const isCorrect = q.correct_index === optIdx;
                  return (
                    <div key={optIdx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuestion(qIdx, { correct_index: optIdx })}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 shrink-0 ${
                          isCorrect
                            ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isCorrect ? 'Correcte' : 'Option'}</span>
                      </button>

                      <input
                        type="text"
                        value={opt}
                        disabled={q.question_type === 'true_false'}
                        onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                        placeholder={`Choix ${optIdx + 1}`}
                        required
                        className="flex-1 px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-primary)] disabled:opacity-75"
                      />
                    </div>
                  );
                })}

                {q.question_type === 'mcq' && q.options.length < 6 && (
                  <button
                    type="button"
                    onClick={() => addOption(qIdx)}
                    className="text-xs font-medium text-[var(--accent-text)] hover:underline pt-1"
                  >
                    + Ajouter une option
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  Explication (affichée après soumission)
                </label>
                <input
                  type="text"
                  value={q.explanation}
                  onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                  placeholder="Pourquoi cette réponse est correcte..."
                  className="w-full px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-primary)]"
                />
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => setQuestions((prev) => [...prev, makeMcq()])}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un QCM</span>
            </button>
            <button
              type="button"
              onClick={() => setQuestions((prev) => [...prev, makeTrueFalse()])}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter Vrai / Faux</span>
            </button>
          </div>

          <div className="flex space-x-3 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] py-2.5 rounded-xl text-xs font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-accent disabled:opacity-50 py-2.5 rounded-xl text-xs font-medium"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer le quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
