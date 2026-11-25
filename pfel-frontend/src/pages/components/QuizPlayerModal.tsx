// File: src/pages/components/QuizPlayerModal.tsx
import React, { useEffect, useState } from 'react';
import type { Evaluation } from '../../types';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Trophy,
  X,
  HelpCircle,
} from 'lucide-react';

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

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function getScoreHeadline(score: number, maxScore: number): string {
  if (maxScore <= 0) return 'Mission bouclée !';
  const ratio = score / maxScore;
  if (ratio >= 0.9) return 'Boom ! Mode génie activé !';
  if (ratio >= 0.7) return 'Bien joué ! Le boomslang approuve.';
  if (ratio >= 0.5) return 'Pas mal du tout, ça prend forme !';
  return 'Bien tenté — chaque essai fait monter le niveau !';
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submitting, onClose]);

  const answeredCount = questions.filter((q) => selected[q.id_question] !== undefined).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const progressPct =
    questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) {
      alert('Il reste encore quelques cases vides — réponds à tout avant de valider !');
      return;
    }
    setSubmitting(true);
    try {
      const res = await onSubmitAnswers(selected);
      setResult(res);
    } catch (err) {
      console.error(err);
      alert('Oups, la correction automatique a glissé — réessaie dans un instant !');
    } finally {
      setSubmitting(false);
    }
  };

  const resultMap = new Map<number, QuizResultItem>();
  result?.results.forEach((r) => resultMap.set(r.id_question, r));

  const scorePct =
    result && result.max_score > 0
      ? Math.round((result.score / result.max_score) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="surface-card rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto border border-[var(--border-subtle)]"
        style={{ boxShadow: 'var(--shadow-modal)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)]">
              <Sparkles className="w-3 h-3" />
              <span>Défi Quiz</span>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] leading-snug">
              {evaluation.titre}
            </h3>
            <p className="text-xs text-[var(--text-muted)] tabular-nums">
              {questions.length} question{questions.length > 1 ? 's' : ''} · Barème :{' '}
              <span className="font-medium text-[var(--text-secondary)]">
                {evaluation.bareme} pts
              </span>
            </p>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            aria-label="Fermer le quiz"
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar (before submission) */}
        {!result && questions.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)] font-medium">
                Progression du défi
              </span>
              <span className="text-[var(--text-muted)] tabular-nums">
                {answeredCount}/{questions.length} répondues ({progressPct}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--bg-subtle)] overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Score Banner (after submission) */}
        {result && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--success-bg)] border border-[var(--success-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)]/80 border border-[var(--success-border)] text-[var(--success-text)] flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[var(--success-text)] block">
                  {getScoreHeadline(result.score, result.max_score)}
                </span>
                <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                  Score : {result.score} / {result.max_score}
                </span>
              </div>
            </div>

            <span className="self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold bg-[var(--bg-surface)]/80 text-[var(--success-text)] border border-[var(--success-border)] tabular-nums">
              {scorePct}%
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {questions.map((q, idx) => {
            const qRes = resultMap.get(q.id_question);
            const chosen = selected[q.id_question];

            return (
              <div
                key={q.id_question}
                className="surface-subtle rounded-2xl p-4 sm:p-5 space-y-3.5 border border-[var(--border-subtle)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-text)] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
                      {q.prompt}
                    </p>
                  </div>

                  <span className="text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-surface)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] shrink-0 tabular-nums">
                    {qRes ? `${qRes.points_earned}/${q.points} pts` : `${q.points} pts`}
                  </span>
                </div>

                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isChosen = chosen === optIdx;
                    const isRightAnswer = Boolean(qRes && qRes.correct_index === optIdx);
                    const isWrongChoice = Boolean(qRes && isChosen && !qRes.is_correct);
                    const letter = OPTION_LETTERS[optIdx] ?? String(optIdx + 1);

                    let rowStyle =
                      'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]/60';
                    let badgeStyle =
                      'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]';

                    if (isRightAnswer) {
                      rowStyle =
                        'bg-[var(--success-bg)] border-[var(--success-border)] text-[var(--success-text)]';
                      badgeStyle =
                        'bg-[var(--bg-surface)]/80 text-[var(--success-text)] border-[var(--success-border)]';
                    } else if (isWrongChoice) {
                      rowStyle =
                        'bg-[var(--danger-bg)] border-[var(--danger-border)] text-[var(--danger-text)]';
                      badgeStyle =
                        'bg-[var(--bg-surface)]/80 text-[var(--danger-text)] border-[var(--danger-border)]';
                    } else if (isChosen) {
                      rowStyle =
                        'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-text)]';
                      badgeStyle =
                        'bg-[var(--accent)] text-[var(--text-inverse)] border-[var(--accent)]';
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={Boolean(result)}
                        onClick={() =>
                          setSelected((prev) => ({ ...prev, [q.id_question]: optIdx }))
                        }
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition flex items-center justify-between gap-3 ${
                          result ? 'cursor-default' : 'cursor-pointer'
                        } ${rowStyle}`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg border text-[11px] font-bold flex items-center justify-center shrink-0 transition ${badgeStyle}`}
                          >
                            {letter}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </span>

                        {isRightAnswer && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                        {isWrongChoice && <XCircle className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {qRes && qRes.explanation && (
                  <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-1">
                    <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                      <span>Le mot du coach :</span>
                    </span>
                    <p className="leading-relaxed">{qRes.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 border-t border-[var(--border-subtle)]">
            {result ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full btn-accent py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Trop bien, fermer
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onClose}
                  className="flex-1 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] py-2.5 rounded-xl text-xs font-medium border border-[var(--border-subtle)] transition cursor-pointer disabled:opacity-50"
                >
                  Plus tard
                </button>
                <button
                  type="submit"
                  disabled={submitting || !allAnswered}
                  className="flex-1 btn-accent disabled:opacity-50 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  {submitting ? 'Correction éclair...' : 'Envoyer mes réponses'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
