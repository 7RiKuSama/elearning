// File: src/pages/teacher/CoursesTab.tsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Cours } from '../../types';
import type { TeacherCourseStats } from './teacherDashboard.types';
import { resolveSafeUrl } from '../../utils/url';
import {
  BookOpen,
  PlusCircle,
  Edit,
  Upload,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  FolderPlus,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';

interface CoursesTabProps {
  courses: Cours[];
  categoryMap: Map<number, string>;
  courseStats: Record<number, TeacherCourseStats>;
  globalStats: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
  };
  onOpenCreateCourse: () => void;
  onEditCourse: (course: Cours) => void;
  onOpenModules: (course: Cours) => void;
  onOpenResourceUpload: (course: Cours) => void;
  onOpenEvaluationCreate: (course: Cours) => void;
  onOpenQuizForCourse: (course: Cours) => void;
}

export default function CoursesTab({
  courses,
  categoryMap,
  courseStats,
  globalStats,
  onOpenCreateCourse,
  onEditCourse,
  onOpenModules,
  onOpenResourceUpload,
  onOpenEvaluationCreate,
  onOpenQuizForCourse,
}: CoursesTabProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [pubFilter, setPubFilter] = useState<'all' | 'published' | 'draft'>('all');

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (pubFilter === 'published') return c.est_publie;
      if (pubFilter === 'draft') return !c.est_publie;
      return true;
    });
  }, [courses, searchQuery, pubFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
        <div className="inline-flex bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-subtle)] text-xs font-medium">
          <button
            type="button"
            onClick={() => setPubFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              pubFilter === 'all'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Tous ({globalStats.totalCourses})
          </button>
          <button
            type="button"
            onClick={() => setPubFilter('published')}
            className={`px-3 py-1.5 rounded-lg transition ${
              pubFilter === 'published'
                ? 'bg-[var(--bg-surface)] text-[var(--success-text)] border border-[var(--border-subtle)]'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Publiés ({globalStats.publishedCourses})
          </button>
          <button
            type="button"
            onClick={() => setPubFilter('draft')}
            className={`px-3 py-1.5 rounded-lg transition ${
              pubFilter === 'draft'
                ? 'bg-[var(--bg-surface)] text-[var(--warning-text)] border border-[var(--border-subtle)]'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Brouillons ({globalStats.draftCourses})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un cours..."
            className="pl-8 pr-3.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] w-full sm:w-52"
          />
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="surface-card rounded-2xl p-10 text-center space-y-3 max-w-md mx-auto">
          <BookOpen className="w-8 h-8 text-[var(--accent-text)] mx-auto" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Aucun cours créé pour le moment
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Créez votre premier cours pour ajouter des chapitres, supports et évaluations.
          </p>
          <button
            onClick={onOpenCreateCourse}
            className="inline-flex items-center space-x-2 btn-accent text-xs font-medium px-4 py-2 rounded-xl"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Créer un cours</span>
          </button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="surface-card rounded-2xl p-8 text-center text-sm text-[var(--text-muted)]">
          Aucun cours ne correspond à votre recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const categoryName =
              categoryMap.get(course.id_categorie) || `Catégorie #${course.id_categorie}`;
            const st = courseStats[course.id_cours] || {
              resourceCount: 0,
              evalCount: 0,
              studentCount: 0,
              avgProgress: 0,
            };
            const coverSrc = resolveSafeUrl(course.cover_url);

            return (
              <div
                key={course.id_cours}
                onClick={() => navigate(`/cours/${course.id_cours}`)}
                className="group surface-card rounded-2xl hover:border-[var(--border-strong)] transition flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <div className="relative h-32 w-full bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] overflow-hidden">
                    {coverSrc ? (
                      <img
                        src={coverSrc}
                        alt={course.titre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                        <BookOpen className="w-7 h-7 opacity-60" />
                      </div>
                    )}

                    <span className="absolute top-2.5 left-2.5 text-[11px] font-medium bg-[var(--bg-surface)]/95 text-[var(--text-primary)] border border-[var(--border-subtle)] px-2.5 py-0.5 rounded-full truncate max-w-[170px]">
                      {categoryName}
                    </span>

                    <span
                      className={`absolute top-2.5 right-2.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${
                        course.est_publie
                          ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]'
                          : 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]'
                      }`}
                    >
                      {course.est_publie ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Publié</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Brouillon</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="p-5 space-y-3.5">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] leading-snug">
                      {course.titre}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center space-x-1 font-medium bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)] px-2 py-0.5 rounded-md">
                        <GraduationCap className="w-3 h-3" />
                        <span>{course.difficulty_level || 'Beginner'}</span>
                      </span>
                      {course.estimated_duration && (
                        <span className="inline-flex items-center space-x-1 text-[var(--text-secondary)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3" />
                          <span>{course.estimated_duration}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                      {course.description}
                    </p>

                    {course.prerequisites && (
                      <p className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-subtle)] px-3 py-2 rounded-lg border border-[var(--border-subtle)] line-clamp-1">
                        <strong className="text-[var(--text-primary)]">Prérequis :</strong>{' '}
                        {course.prerequisites}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="surface-subtle rounded-lg p-2 text-center">
                        <span className="block text-sm font-semibold text-[var(--text-primary)]">
                          {st.studentCount}
                        </span>
                        <span className="block text-[10px] text-[var(--text-muted)]">Inscrits</span>
                      </div>
                      <div className="surface-subtle rounded-lg p-2 text-center">
                        <span className="block text-sm font-semibold text-[var(--accent-text)]">
                          {st.resourceCount}
                        </span>
                        <span className="block text-[10px] text-[var(--text-muted)]">Supports</span>
                      </div>
                      <div className="surface-subtle rounded-lg p-2 text-center">
                        <span className="block text-sm font-semibold text-[var(--text-primary)]">
                          {st.evalCount}
                        </span>
                        <span className="block text-[10px] text-[var(--text-muted)]">Évals</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-muted)]">Progression moyenne</span>
                        <span className="font-semibold text-[var(--text-primary)]">
                          {st.avgProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-[var(--border-subtle)] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(st.avgProgress, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="px-5 pb-5 pt-3 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 space-y-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onOpenModules(course)}
                    className="w-full bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-medium py-2 px-3 rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                    <span>Chapitres & organisation</span>
                  </button>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => onOpenResourceUpload(course)}
                      className="btn-accent font-medium py-2 px-2 rounded-xl text-xs flex items-center justify-center space-x-1"
                    >
                      <Upload className="w-3.5 h-3.5 shrink-0" />
                      <span>+ Support</span>
                    </button>

                    <button
                      onClick={() => onOpenEvaluationCreate(course)}
                      className="bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-medium py-2 px-2 rounded-xl text-xs transition flex items-center justify-center space-x-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
                      <span>+ Éval</span>
                    </button>

                    <button
                      onClick={() => onOpenQuizForCourse(course)}
                      className="bg-[var(--accent-soft)] hover:opacity-90 text-[var(--accent-text)] border border-[var(--accent-border)] font-medium py-2 px-2 rounded-xl text-xs transition flex items-center justify-center space-x-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>+ Quiz</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditCourse(course)}
                      className="flex-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] font-medium py-1.5 rounded-xl text-xs transition flex items-center justify-center space-x-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </button>

                    <button
                      onClick={() => navigate(`/cours/${course.id_cours}`)}
                      className="flex-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--accent-text)] border border-[var(--border-subtle)] font-medium py-1.5 rounded-xl text-xs transition flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Aperçu</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
