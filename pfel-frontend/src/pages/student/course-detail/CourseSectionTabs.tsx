// File: src/pages/student/course-detail/CourseSectionTabs.tsx
import React from 'react';
import type { CourseSectionTab } from './types';
import {
  StackLayersGlyph,
  QuestCheckGlyph,
  LoungeBubbleGlyph,
} from '../../../components/ui/CourseGlyphs';

interface CourseSectionTabsProps {
  activeSection: CourseSectionTab;
  onSelectSection: (section: CourseSectionTab) => void;
  resourcesCount: number;
  completedLessonsCount: number;
  evaluationsCount: number;
  forumThreadsCount: number;
}

export const CourseSectionTabs: React.FC<CourseSectionTabsProps> = ({
  activeSection,
  onSelectSection,
  resourcesCount,
  completedLessonsCount,
  evaluationsCount,
  forumThreadsCount,
}) => {
  const tabs: Array<{
    id: CourseSectionTab;
    label: string;
    badge: string;
    glyph: React.ReactNode;
  }> = [
    {
      id: 'contenu',
      label: 'Chapitres & Butin',
      badge: `${completedLessonsCount}/${resourcesCount}`,
      glyph: <StackLayersGlyph className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'evaluations',
      label: 'Défis & Quiz',
      badge: `${evaluationsCount}`,
      glyph: <QuestCheckGlyph className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'forum',
      label: 'Le Salon',
      badge: `${forumThreadsCount}`,
      glyph: <LoungeBubbleGlyph className="w-4 h-4 shrink-0" />,
    },
  ];

  return (
    <nav
      aria-label="Sections du cours"
      className="gsap-cd-anim surface-card rounded-2xl p-1.5 grid grid-cols-1 sm:grid-cols-3 gap-1.5 border border-[var(--border-subtle)]"
    >
      {tabs.map((tab) => {
        const isActive = activeSection === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectSection(tab.id)}
            className={`flex items-center justify-between sm:justify-start gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              isActive
                ? 'btn-accent shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <span className="flex items-center gap-2">
              {tab.glyph}
              <span>{tab.label}</span>
            </span>
            <span
              className={`sm:ml-auto text-[11px] px-2 py-0.5 rounded-full tabular-nums ${
                isActive
                  ? 'bg-black/20 text-white'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
              }`}
            >
              {tab.badge}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
