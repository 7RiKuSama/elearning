// File: src/pages/student/course-detail/CourseHeroHeader.tsx
import React from 'react';
import {
  PrismSparkGlyph,
  EmberFlameGlyph,
  TrophyCrestGlyph,
  CompletedBadgeGlyph,
} from '../../../components/ui/CourseGlyphs';

interface CourseHeroHeaderProps {
  title: string;
  description: string;
  categoryId: string | number;
  modulesCount: number;
  resourcesCount: number;
  evaluationsCount: number;
  completedLessonsCount: number;
  lessonCompletionPercentage: number;
  completedEvaluationsCount: number;
  courseProgressPercentage: number;
}

export const CourseHeroHeader: React.FC<CourseHeroHeaderProps> = ({
  title,
  description,
  categoryId,
  modulesCount,
  resourcesCount,
  evaluationsCount,
  completedLessonsCount,
  lessonCompletionPercentage,
  completedEvaluationsCount,
  courseProgressPercentage,
}) => {
  return (
    <header
      className="gsap-cd-anim surface-card rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] relative overflow-hidden"
      style={{ boxShadow: 'var(--shadow-modal)' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none -right-20 -top-20 w-72 h-72 rounded-full bg-[var(--accent)]/12 blur-3xl absolute"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none -left-24 -bottom-24 w-64 h-64 rounded-full bg-[var(--accent)]/8 blur-3xl absolute"
      />

      <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)]">
              <PrismSparkGlyph className="w-3.5 h-3.5" />
              <span>Terrain #{categoryId}</span>
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] tabular-nums">
              {modulesCount} chapitre{modulesCount > 1 ? 's' : ''}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] tabular-nums">
              {resourcesCount} support{resourcesCount > 1 ? 's' : ''}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] tabular-nums">
              {evaluationsCount} défi{evaluationsCount > 1 ? 's' : ''}
            </span>
          </div>

          <h1 className="font-editorial text-2xl sm:text-4xl text-[var(--text-primary)] leading-[1.15] tracking-tight">
            {title}
          </h1>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {description}
          </p>
        </div>

        <div className="surface-subtle rounded-2xl p-4 sm:p-5 w-full lg:w-84 shrink-0 space-y-4 border border-[var(--border-subtle)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <EmberFlameGlyph className="w-4 h-4 text-[var(--accent-text)]" />
                <span>Ta jauge de niveau</span>
              </span>
              <span className="text-xl font-bold text-[var(--accent-text)] tabular-nums">
                {courseProgressPercentage}%
              </span>
            </div>

            <div className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[var(--accent)] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(courseProgressPercentage, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] tabular-nums">
              <span className="inline-flex items-center gap-1">
                <TrophyCrestGlyph className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                <span>
                  {completedEvaluationsCount}/{evaluationsCount} défi
                  {completedEvaluationsCount > 1 ? 's' : ''} bouclé
                  {completedEvaluationsCount > 1 ? 's' : ''}
                </span>
              </span>
              <span>50% rendu · 50% score</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--text-secondary)]">
                <CompletedBadgeGlyph className="w-3.5 h-3.5 text-[var(--success-text)]" />
                <span>Supports terminés</span>
              </span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                {completedLessonsCount}/{resourcesCount} ({lessonCompletionPercentage}%)
              </span>
            </div>

            <div className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[var(--success-text)] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(lessonCompletionPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
