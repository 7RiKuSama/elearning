// File: src/pages/student/course-detail/CourseChaptersSection.tsx
import React from 'react';
import type { Ressource } from '../../../types';
import type { ChapterSection } from './types';
import { resolveFileUrl } from './mediaUtils';
import { ResourcePreviewPanel } from './ResourcePreviewPanel';
import {
  FolioBookGlyph,
  ChapterFolderGlyph,
  ReelPlayGlyph,
  FramePhotoGlyph,
  CodeScrollGlyph,
  DocSheetGlyph,
  ChevronFlipGlyph,
  CompletedBadgeGlyph,
  PendingRingGlyph,
} from '../../../components/ui/CourseGlyphs';

interface CourseChaptersSectionProps {
  chapterSections: ChapterSection[];
  collapsedChapters: Record<string, boolean>;
  onToggleChapterCollapse: (key: string) => void;
  onJumpToChapter: (key: string) => void;
  expandedResId: number | null;
  onToggleResource: (res: Ressource) => void;
  textContents: Record<number, string>;
  loadingTextId: number | null;
  completedResourceSet: Set<number>;
  togglingResourceId: number | null;
  onToggleResourceCompleted: (resourceId: number, resourceName?: string) => void;
}

const getResourceGlyph = (res: Ressource) => {
  if (
    res.type_fichier === 'video' ||
    /\.(mp4|webm|ogg)$/i.test(res.chemin_fichier) ||
    /(?:youtube\.com|youtu\.be|vimeo\.com)/i.test(res.chemin_fichier)
  ) {
    return <ReelPlayGlyph className="w-4 h-4 text-[var(--accent-text)]" />;
  }
  if (
    res.type_fichier === 'image' ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(res.chemin_fichier)
  ) {
    return <FramePhotoGlyph className="w-4 h-4 text-[var(--success-text)]" />;
  }
  if (res.type_fichier === 'text' || /\.(md|txt|markdown)$/i.test(res.chemin_fichier)) {
    return <CodeScrollGlyph className="w-4 h-4 text-[var(--warning-text)]" />;
  }
  return <DocSheetGlyph className="w-4 h-4 text-[var(--text-secondary)]" />;
};

export const CourseChaptersSection: React.FC<CourseChaptersSectionProps> = ({
  chapterSections,
  collapsedChapters,
  onToggleChapterCollapse,
  onJumpToChapter,
  expandedResId,
  onToggleResource,
  textContents,
  loadingTextId,
  completedResourceSet,
  togglingResourceId,
  onToggleResourceCompleted,
}) => {
  return (
    <section className="gsap-cd-anim surface-card rounded-3xl p-6 sm:p-7 space-y-6 border border-[var(--border-subtle)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-text)]">
            <FolioBookGlyph className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Chapitres &amp; supports à explorer
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Ouvre un support pour l&apos;aperçu direct et valide ta progression
            </p>
          </div>
        </div>

        {chapterSections.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {chapterSections.map((sec) => (
              <button
                key={sec.key}
                type="button"
                onClick={() => onJumpToChapter(sec.key)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition cursor-pointer"
              >
                {sec.orderLabel || sec.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {chapterSections.length === 0 ? (
        <div className="text-center py-12 surface-subtle rounded-2xl border border-dashed border-[var(--border-subtle)] space-y-2">
          <DocSheetGlyph className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Pas encore de chapitres par ici
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Les prochains supports arrivent bientôt dans ce cours.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {chapterSections.map((section) => {
            const isCollapsed = Boolean(collapsedChapters[section.key]);
            const chapDone = section.items.filter((r) =>
              completedResourceSet.has(r.id_ressource)
            ).length;
            const chapTotal = section.items.length;

            return (
              <div
                id={`chapter-${section.key}`}
                key={section.key}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/35 overflow-hidden scroll-mt-20 transition hover:border-[var(--border-strong)]"
              >
                <button
                  type="button"
                  onClick={() => onToggleChapterCollapse(section.key)}
                  className="w-full px-4 py-3.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]/70 transition flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-[var(--accent-soft)]/60 border border-[var(--accent-border)]/50 text-[var(--accent-text)] shrink-0 mt-0.5">
                      <ChapterFolderGlyph className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {section.orderLabel && (
                          <span className="text-[11px] font-semibold bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)] px-2 py-0.5 rounded-md">
                            {section.orderLabel}
                          </span>
                        )}
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {section.title}
                        </h3>
                      </div>
                      {section.description && (
                        <p className="text-xs text-[var(--text-secondary)]">
                          {section.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {chapTotal > 0 && (
                      <span className="text-xs font-semibold text-[var(--success-text)] bg-[var(--success-bg)] border border-[var(--success-border)] px-2.5 py-0.5 rounded-full tabular-nums">
                        {chapDone}/{chapTotal} fait{chapDone > 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2.5 py-0.5 rounded-full tabular-nums">
                      {chapTotal} support{chapTotal > 1 ? 's' : ''}
                    </span>
                    <ChevronFlipGlyph
                      expanded={!isCollapsed}
                      className="w-4 h-4 text-[var(--text-muted)]"
                    />
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="p-3.5 border-t border-[var(--border-subtle)] space-y-2.5">
                    {section.items.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] italic py-3 text-center">
                        Aucun support déposé dans ce chapitre pour le moment.
                      </p>
                    ) : (
                      section.items.map((res) => {
                        const isExpanded = expandedResId === res.id_ressource;
                        const fileUrl = resolveFileUrl(res.chemin_fichier);
                        const isDone = completedResourceSet.has(res.id_ressource);
                        const isToggling = togglingResourceId === res.id_ressource;

                        return (
                          <div
                            key={res.id_ressource}
                            className={`rounded-xl border p-3.5 transition ${
                              isDone
                                ? 'bg-[var(--bg-surface)]/90 border-[var(--success-border)]/70'
                                : 'bg-[var(--bg-surface)]/75 border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => onToggleResource(res)}
                                className="flex items-center gap-2.5 text-left min-w-0 flex-1 cursor-pointer group"
                              >
                                <span className="p-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shrink-0">
                                  {getResourceGlyph(res)}
                                </span>
                                <span className="min-w-0">
                                  <span
                                    className={`block text-sm font-medium truncate group-hover:text-[var(--accent-text)] transition ${
                                      isDone
                                        ? 'text-[var(--text-primary)]'
                                        : 'text-[var(--text-primary)]'
                                    }`}
                                  >
                                    {res.nom_fichier}
                                  </span>
                                  <span className="block text-[11px] text-[var(--text-muted)]">
                                    {res.type_fichier || 'document'}
                                  </span>
                                </span>
                              </button>

                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  disabled={isToggling}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleResourceCompleted(res.id_ressource, res.nom_fichier);
                                  }}
                                  aria-pressed={isDone}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer disabled:opacity-60 ${
                                    isDone
                                      ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]'
                                      : 'bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]'
                                  }`}
                                >
                                  {isDone ? (
                                    <CompletedBadgeGlyph className="w-3.5 h-3.5" />
                                  ) : (
                                    <PendingRingGlyph className="w-3.5 h-3.5" />
                                  )}
                                  <span>{isDone ? 'Terminé' : 'Marquer fini'}</span>
                                </button>

                                {fileUrl && (
                                  <a
                                    href={fileUrl}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition"
                                  >
                                    <span>Télécharger</span>
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => onToggleResource(res)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)] hover:opacity-90 transition cursor-pointer"
                                >
                                  <span>{isExpanded ? 'Fermer' : 'Aperçu'}</span>
                                  <ChevronFlipGlyph
                                    expanded={isExpanded}
                                    className="w-3.5 h-3.5"
                                  />
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <ResourcePreviewPanel
                                resource={res}
                                textContent={textContents[res.id_ressource]}
                                isLoadingText={loadingTextId === res.id_ressource}
                              />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
