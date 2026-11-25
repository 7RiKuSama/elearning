// File: src/pages/student/course-detail/CourseEvaluationsSection.tsx
import React from 'react';
import type { Evaluation } from '../../../types';
import type { StudentSubmissionInfo } from './types';
import {
  QuestCheckGlyph,
  CompletedBadgeGlyph,
  PendingRingGlyph,
  TrophyCrestGlyph,
} from '../../../components/ui/CourseGlyphs';

interface CourseEvaluationsSectionProps {
  evaluations: Evaluation[];
  mySubmissions: Record<number, StudentSubmissionInfo>;
  loadingQuiz: boolean;
  onOpenEvaluationAction: (ev: Evaluation) => void;
}

export const CourseEvaluationsSection: React.FC<CourseEvaluationsSectionProps> = ({
  evaluations,
  mySubmissions,
  loadingQuiz,
  onOpenEvaluationAction,
}) => {
  return (
    <section className="gsap-cd-anim surface-card rounded-3xl p-6 sm:p-7 space-y-6 border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-text)]">
            <QuestCheckGlyph className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Défis &amp; quiz du cours
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Valide tes acquis par un rendu de travail ou un quiz interactif
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] tabular-nums">
          {evaluations.length} défi{evaluations.length > 1 ? 's' : ''}
        </span>
      </div>

      {evaluations.length === 0 ? (
        <div className="text-center py-12 surface-subtle rounded-2xl border border-dashed border-[var(--border-subtle)] space-y-2">
          <TrophyCrestGlyph className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Aucun défi publié pour le moment
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Reviens bientôt pour tester tes compétences sur ce module.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {evaluations.map((ev) => {
            const sub = mySubmissions[ev.id_evaluation];
            const isQuiz = (ev as { type_evaluation?: string }).type_evaluation === 'quiz';
            const isGraded = sub && sub.note !== null && sub.note !== undefined;

            return (
              <div
                key={ev.id_evaluation}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 p-5 space-y-3.5 transition hover:border-[var(--border-strong)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)]">
                        {isQuiz ? 'Quiz interactif' : 'Rendu de travail'}
                      </span>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] tabular-nums">
                        Barème : {ev.bareme} pts
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {ev.titre}
                    </h3>
                  </div>

                  {sub ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)] tabular-nums">
                      <CompletedBadgeGlyph className="w-3.5 h-3.5" />
                      <span>
                        {isGraded ? `Noté ${sub.note}/${ev.bareme}` : 'Rendu envoyé'}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                      <PendingRingGlyph className="w-3.5 h-3.5" />
                      <span>À faire</span>
                    </span>
                  )}
                </div>

                {ev.instructions && (
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                    {ev.instructions}
                  </p>
                )}

                {sub?.commentaires && (
                  <div className="rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] p-3 text-xs text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)]">
                      Retour enseignant :{' '}
                    </span>
                    {sub.commentaires}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                  <span>
                    Clôture :{' '}
                    {ev.date_cloture
                      ? new Date(ev.date_cloture).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Libre'}
                  </span>

                  <button
                    type="button"
                    disabled={loadingQuiz}
                    onClick={() => onOpenEvaluationAction(ev)}
                    className="btn-accent px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-60"
                  >
                    {isQuiz
                      ? sub
                        ? 'Refaire le quiz'
                        : 'Lancer le quiz'
                      : sub
                        ? 'Mettre à jour mon rendu'
                        : 'Déposer mon travail'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
