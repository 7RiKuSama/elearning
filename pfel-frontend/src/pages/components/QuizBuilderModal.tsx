// File: src/pages/components/QuizBuilderModal.tsx
import React, { useEffect, useState } from 'react';
import type { Evaluation } from '../../types';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  X,
  ListChecks,
} from 'lucide-react';

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

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saving, onClose]);

  const totalPoints = questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);

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
      prev.map((q, i) =>
        i === qIdx && q.options.length < 6 ? { ...q, options: [...q.options, ''] } : q
      )
    );
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx || q.options.length <= 2) return q;
        const nextOpts = q.options.filter((_, idx) => idx !== optIdx);
        let nextCorrect = q.correct_index;
        if (optIdx === q.correct_index) {
          nextCorrect = 0;
        } else if (optIdx < q.correct_index) {
          nextCorrect = Math.max(0, q.correct_index - 1);
        }
        return { ...q, options: nextOpts, correct_index: nextCorrect };
      })
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
      alert('Il manque un bout : remplis chaque question et chaque choix de réponse !');
      return;
    }

    setSaving(true);
    try {
      await onSave(questions);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Oups, le quiz n'a pas pu être sauvegardé — réessaie dans un instant !");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="surface-card rounded-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto border border-[var(--border-subtle)]"
        style={{ boxShadow: 'var(--shadow-modal)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)]">
              <Sparkles className="w-3 h-3" />
              <span>Atelier Quiz Express</span>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] leading-snug">
              {evaluation.titre}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Balance des QCM piquants ou des Vrai/Faux — correction auto et petites astuces incluses.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] tabular-nums">
              <ListChecks className="w-3.5 h-3.5 text-[var(--accent-text)]" />
              <span>{questions.length}</span>
              <span className="text-[var(--text-muted)]">•</span>
              <span className="text-[var(--text-primary)] font-semibold">{totalPoints} pts</span>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              aria-label="Fermer l'éditeur de quiz"
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {questions.map((q, qIdx) => (
            <div
              key={qIdx}
              className="surface-subtle rounded-2xl p-4 sm:p-5 space-y-4 border border-[var(--border-subtle)] transition hover:border-[var(--border-strong)]"
            >
              {/* Question Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-text)] text-xs font-bold flex items-center justify-center tabular-nums">
                    {qIdx + 1}
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    Question #{qIdx + 1}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                    {q.question_type === 'true_false' ? 'Vrai / Faux' : 'QCM'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-xl bg-[var(--bg-surface)] p-0.5 border border-[var(--border-subtle)]">
                    <button
                      type="button"
                      onClick={() => updateQuestion(qIdx, { question_type: 'mcq' })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                        q.question_type === 'mcq'
                          ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      QCM
                    </button>
                    <button
                      type="button"
                      onClick={() => updateQuestion(qIdx, { question_type: 'true_false' })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                        q.question_type === 'true_false'
                          ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Vrai / Faux
                    </button>
                  </div>

                  <label className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 bg-[var(--bg-surface)] px-2.5 py-1 rounded-xl border border-[var(--border-subtle)]">
                    <span className="text-[11px] text-[var(--text-muted)]">Pts</span>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={q.points}
                      onChange={(e) => updateQuestion(qIdx, { points: Number(e.target.value) })}
                      className="w-12 bg-transparent text-xs font-semibold text-[var(--text-primary)] tabular-nums focus:outline-none text-right"
                    />
                  </label>

                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="p-1.5 rounded-xl bg-[var(--danger-bg)] text-[var(--danger-text)] border border-[var(--danger-border)] hover:brightness-110 transition cursor-pointer"
                      title="Retirer cette question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Prompt Input */}
              <div>
                <input
                  type="text"
                  value={q.prompt}
                  onChange={(e) => updateQuestion(qIdx, { prompt: e.target.value })}
                  placeholder="Balance ta question ici... (ex: Qu'est-ce qui rend un boomslang redoutable ?)"
                  required
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[var(--text-muted)]">
                    Clique sur un badge pour marquer la bonne réponse :
                  </span>
                  {q.question_type === 'mcq' && (
                    <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
                      {q.options.length}/6 choix
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = q.correct_index === optIdx;
                    const letter = OPTION_LETTERS[optIdx] ?? String(optIdx + 1);

                    return (
                      <div key={optIdx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuestion(qIdx, { correct_index: optIdx })}
                          title={
                            isCorrect
                              ? 'Bonne réponse sélectionnée'
                              : 'Marquer comme bonne réponse'
                          }
                          className={`px-2.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
                            isCorrect
                              ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)] shadow-2xs'
                              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {isCorrect ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <span className="w-4 text-center font-bold">{letter}</span>
                          )}
                          <span className="hidden sm:inline">
                            {isCorrect ? 'Bonne réponse' : `Choix ${letter}`}
                          </span>
                        </button>

                        <input
                          type="text"
                          value={opt}
                          disabled={q.question_type === 'true_false'}
                          onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                          placeholder={`Option ${letter}...`}
                          required
                          className={`flex-1 px-3 py-2 rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border transition focus:outline-none disabled:opacity-80 ${
                            isCorrect
                              ? 'bg-[var(--bg-surface)] border-[var(--success-border)]'
                              : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] focus:border-[var(--accent)]'
                          }`}
                        />

                        {q.question_type === 'mcq' && q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qIdx, optIdx)}
                            aria-label={`Supprimer l'option ${letter}`}
                            title="Supprimer cette option"
                            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--danger-text)] hover:bg-[var(--danger-bg)] transition cursor-pointer shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.question_type === 'mcq' && q.options.length < 6 && (
                  <button
                    type="button"
                    onClick={() => addOption(qIdx)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-text)] hover:underline pt-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un choix</span>
                  </button>
                )}
              </div>

              {/* Explanation */}
              <div className="pt-1">
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)] mb-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                  <span>Le pourquoi du comment (affiché après soumission)</span>
                </label>
                <input
                  type="text"
                  value={q.explanation}
                  onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                  placeholder="Explique brièvement l'astuce ou le piège à éviter..."
                  className="w-full px-3.5 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition"
                />
              </div>
            </div>
          ))}

          {/* Add Question Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setQuestions((prev) => [...prev, makeMcq()])}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-medium transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                <span>Nouveau QCM</span>
              </button>
              <button
                type="button"
                onClick={() => setQuestions((prev) => [...prev, makeTrueFalse()])}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-medium transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                <span>Nouveau Vrai / Faux</span>
              </button>
            </div>

            <span className="text-xs text-[var(--text-muted)] tabular-nums sm:hidden">
              {questions.length} question{questions.length > 1 ? 's' : ''} • {totalPoints} pts
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="flex-1 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] py-2.5 rounded-xl text-xs font-medium border border-[var(--border-subtle)] transition cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-accent disabled:opacity-50 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              {saving ? 'Sauvegarde en cours...' : 'Valider le quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
