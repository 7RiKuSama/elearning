// File: src/pages/student/course-detail/CourseCompanionRail.tsx
import React from 'react';
import type { Ressource } from '../../../types';
import type { CourseSectionTab } from './types';

export interface ChapterSection {
  key: string;
  orderLabel?: string;
  title: string;
  description?: string;
  isUnassigned?: boolean;
  items: Ressource[];
}

interface CourseCompanionRailProps {
  chapterSections: ChapterSection[];
  completedResourceSet: Set<number>;
  completedLessonsCount: number;
  resourcesCount: number;
  lessonCompletionPercentage: number;
  forumThreadsCount: number;
  onJumpToChapter: (key: string) => void;
  onSelectSection: (tab: CourseSectionTab) => void;
}

export const CourseCompanionRail: React.FC<CourseCompanionRailProps> = ({
  chapterSections,
  completedResourceSet,
  completedLessonsCount,
  resourcesCount,
  lessonCompletionPercentage,
  forumThreadsCount,
  onJumpToChapter,
  onSelectSection,
}) => {
  const safeTotal = Math.max(0, resourcesCount);
  const safeCompleted = Math.min(Math.max(0, completedLessonsCount), safeTotal);
  const clampedPercent = Math.min(Math.max(0, lessonCompletionPercentage), 100);

  return (
    <aside className="lg:col-span-4 space-y-5 min-w-0">
      <div className="gsap-cd-anim surface-card rounded-3xl p-5 sm:p-6 space-y-5 border border-[var(--border-subtle)]">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-text)]">
            Progression étudiant
          </p>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Suivi du parcours
          </h2>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-[var(--text-secondary)]">Supports complétés</span>
            <span className="font-semibold text-[var(--text-primary)] tabular-nums whitespace-nowrap">
              {safeCompleted}/{safeTotal} ({clampedPercent}%)
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[var(--bg-subtle)] overflow-hidden border border-[var(--border-subtle)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
              style={{
                width: `${clampedPercent}%`,
                minWidth: clampedPercent > 0 ? '8px' : '0px',
              }}
            />
          </div>
        </div>

        {chapterSections.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-[var(--border-subtle)]">
            <p className="text-xs font-semibold text-[var(--text-secondary)]">
              Chapitres
            </p>
            <div className="space-y-1.5">
              {chapterSections.map((sec) => {
                const secTotal = sec.items.length;
                const secDone = sec.items.filter((item: Ressource) =>
                  completedResourceSet.has(item.id_ressource)
                ).length;

                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => onJumpToChapter(sec.key)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs bg-[var(--bg-subtle)]/60 hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
                  >
                    <span className="truncate font-medium text-[var(--text-primary)]">
                      {sec.orderLabel ? `${sec.orderLabel} · ` : ''}
                      {sec.title}
                    </span>
                    <span className="shrink-0 font-semibold text-[var(--text-secondary)] tabular-nums">
                      {secDone}/{secTotal}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => onSelectSection('evaluations')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition cursor-pointer"
          >
            Voir les défis &amp; quiz
          </button>
          <button
            type="button"
            onClick={() => onSelectSection('forum')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition cursor-pointer"
          >
            Ouvrir le salon ({forumThreadsCount})
          </button>
        </div>
      </div>
    </aside>
  );
};

export default CourseCompanionRail;
