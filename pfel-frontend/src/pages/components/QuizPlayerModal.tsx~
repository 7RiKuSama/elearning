// File: src/pages/components/QuizPlayerModal.tsx
import React, { useState } from 'react';
import type { Evaluation } from '../../types';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export interface QuizQuestionItem {
  id_question: number;
  question_type: 'mcq' | 'true_false';
  prompt: string;
  options: string[];
  points: number;
  correct_index?: number;
  explanation?: string;
}

export interface QuizResultItem {
  id_question: number;
  is_correct: boolean;
  selected_index: number;
  correct_index: number;
  points_earned: number;
  explanation: string;
}

export interface QuizSubmissionResult {
  score: number;
  max_score: number;
  results: QuizResultItem[];
}

interface QuizPlayerModalProps {
  evaluation: Evaluation;
  questions: QuizQuestionItem[];
  onSubmitAnswers: (answers: Record<number, number>) => Promise<QuizSubmissionResult>;
  onClose: () => void;
}

export default function QuizPlayerModal({
  evaluation,
  questions,
  onSubmitAnswers,
  onClose,
}: QuizPlayerModalProps) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);

  const allAnswered = questions.every((q) => selected[q.id_question] !== undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) {
      alert('Veuillez répondre à toutes les questions avant de valider.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await onSubmitAnswers(selected);
      setResult(res);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la correction automatique du quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const resultMap = new Map<number, QuizResultItem>();
  result?.results.forEach((r) => resultMap.set(r.id_question, r));

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div
        className="surface-card rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              {evaluation.titre}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {questions.length} question{questions.length > 1 ? 's' : ''} · Barème :{' '}
              {evaluation.bareme} pts
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

        {result && (
          <div className="p-4 rounded-xl bg-[var(--success-bg)] border border-[var(--success-border)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[var(--success-text)]" />
              <div>
                <span className="text-xs font-medium text-[var(--success-text)] block">
                  Correction automatique terminée
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Score : {result.score} / {result.max_score}
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {questions.map((q, idx) => {
            const qRes = resultMap.get(q.id_question);
            const chosen = selected[q.id_question];

            return (
              <div
                key={q.id_question}
                className="surface-subtle rounded-xl p-4 space-y-3 border border-[var(--border-subtle)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {idx + 1}. {q.prompt}
                  </p>
                  <span className="text-xs text-[var(--text-muted)] shrink-0">{q.points} pts</span>
                </div>

                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isChosen = chosen === optIdx;
                    const isRightAnswer = qRes && qRes.correct_index === optIdx;
                    const isWrongChoice = qRes && isChosen && !qRes.is_correct;

                    let rowStyle =
                      'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--border-strong)]';
                    if (isRightAnswer) {
                      rowStyle =
                        'bg-[var(--success-bg)] border-[var(--success-border)] text-[var(--success-text)]';
                    } else if (isWrongChoice) {
                      rowStyle =
                        'bg-[var(--danger-bg)] border-[var(--danger-border)] text-[var(--danger-text)]';
                    } else if (isChosen) {
                      rowStyle =
                        'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-text)]';
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={Boolean(result)}
                        onClick={() => setSelected((prev) => ({ ...prev, [q.id_question]: optIdx }))}
                        className={`w-full text-left px-3.5 py-2 rounded-xl border text-xs font-medium transition flex items-center justify-between ${rowStyle}`}
                      >
                        <span>{opt}</span>
                        {qRes && isRightAnswer && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                        {qRes && isWrongChoice && <XCircle className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {qRes && qRes.explanation && (
                  <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)] block mb-0.5">
                      Explication :
                    </span>
                    <p>{qRes.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex space-x-3 pt-2 border-t border-[var(--border-subtle)]">
            {result ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full btn-accent py-2.5 rounded-xl text-xs font-medium"
              >
                Fermer
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] py-2.5 rounded-xl text-xs font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !allAnswered}
                  className="flex-1 btn-accent disabled:opacity-50 py-2.5 rounded-xl text-xs font-medium"
                >
                  {submitting ? 'Correction...' : 'Valider mes réponses'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
