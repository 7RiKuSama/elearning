// File: src/pages/student/Dashboard.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import {
  getMyEnrollments,
  getCatalog,
  getCategories,
  getProfile,
  getStudentGrades,
  getCourseEvaluations,
  getCourseResources,
} from '../../api/services';
import type { Inscription, Cours, Categorie, Utilisateur } from '../../types';
import { useToast } from '../../context/ToastContext';
import { CrawlingPythonBg } from '../../components/ui/CrawlingPythonBg';
import { CardSkeleton, Skeleton } from '../../components/ui/Skeleton';
import {
  BookOpen,
  Award,
  CheckCircle2,
  ArrowRight,
  FileText,
  CheckSquare,
  Search,
  Clock,
  Compass,
  GraduationCap,
  RotateCcw,
} from 'lucide-react';

interface CourseMeta {
  progress: number;
  evalCount: number;
  completedEvals: number;
  resourceCount: number;
  enrolledDate?: string;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [user, setUser] = useState<Utilisateur | null>(null);
  const [enrollments, setEnrollments] = useState<Inscription[]>([]);
  const [catalog, setCatalog] = useState<Cours[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [courseMeta, setCourseMeta] = useState<Record<number, CourseMeta>>({});
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  const pageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [profileData, userEnrollments, allCourses, allCategories, gradesData] =
          await Promise.all([
            getProfile().catch(() => null),
            getMyEnrollments().catch(() => []),
            getCatalog().catch(() => []),
            getCategories().catch(() => []),
            getStudentGrades().catch(() => []),
          ]);

        const enrollList = userEnrollments || [];
        const courseList = allCourses || [];
        const gradesList = gradesData || [];

        setUser(profileData);
        setEnrollments(enrollList);
        setCatalog(courseList);
        setCategories(allCategories || []);

        const subMap: Record<number, { note: number | null; bareme: number }> = {};
        gradesList.forEach((g: any) => {
          subMap[g.id_evaluation] = { note: g.note, bareme: g.bareme };
        });

        const metaMap: Record<number, CourseMeta> = {};
        await Promise.all(
          enrollList.map(async (enr: Inscription) => {
            try {
              const [evals, resources] = await Promise.all([
                getCourseEvaluations(enr.id_cours).catch(() => []),
                getCourseResources(enr.id_cours).catch(() => []),
              ]);

              const evalList = evals || [];
              const resList = resources || [];

              if (evalList.length === 0) {
                metaMap[enr.id_cours] = {
                  progress: Math.round(enr.progression_pourcentage || 0),
                  evalCount: 0,
                  completedEvals: 0,
                  resourceCount: resList.length,
                  enrolledDate: enr.date_inscription,
                };
                return;
              }

              let totalScore = 0;
              let doneCount = 0;
              evalList.forEach((ev) => {
                const sub = subMap[ev.id_evaluation];
                if (sub) {
                  doneCount += 1;
                  if (sub.note === null || sub.note === undefined) {
                    totalScore += 0.5;
                  } else {
                    const ratio =
                      ev.bareme > 0 ? Math.min(Math.max(sub.note / ev.bareme, 0), 1) : 1;
                    totalScore += 0.5 + 0.5 * ratio;
                  }
                }
              });

              const calculated = Math.round((totalScore / evalList.length) * 100);
              metaMap[enr.id_cours] = {
                progress: Math.max(calculated, Math.round(enr.progression_pourcentage || 0)),
                evalCount: evalList.length,
                completedEvals: doneCount,
                resourceCount: resList.length,
                enrolledDate: enr.date_inscription,
              };
            } catch {
              metaMap[enr.id_cours] = {
                progress: Math.round(enr.progression_pourcentage || 0),
                evalCount: 0,
                completedEvals: 0,
                resourceCount: 0,
                enrolledDate: enr.date_inscription,
              };
            }
          })
        );

        setCourseMeta(metaMap);
      } catch (err) {
        console.error('Erreur chargement dashboard étudiant:', err);
        showError('Impossible de charger votre espace apprenant.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [showError]);

  useEffect(() => {
    if (loading || !pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('.gsap-std-hero', {
        y: 18,
        opacity: 0,
        duration: 0.65,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.gsap-std-card', {
        y: 18,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        delay: 0.14,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });
    }, pageRef);

    return () => ctx.revert();
  }, [loading, statusFilter, searchQuery]);

  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((cat) => map.set(cat.id_categorie, cat.nom));
    return map;
  }, [categories]);

  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.map((e) => e.id_cours)),
    [enrollments]
  );
  const myCourses = useMemo(
    () => catalog.filter((c) => enrolledCourseIds.has(c.id_cours)),
    [catalog, enrolledCourseIds]
  );

  const stats = useMemo(() => {
    const total = myCourses.length;
    if (total === 0) return { total: 0, completed: 0, inProgress: 0, avgProgress: 0 };

    let completed = 0;
    let sumProgress = 0;

    myCourses.forEach((c) => {
      const p = courseMeta[c.id_cours]?.progress ?? 0;
      sumProgress += p;
      if (p >= 100) completed += 1;
    });

    return {
      total,
      completed,
      inProgress: total - completed,
      avgProgress: Math.round(sumProgress / total),
    };
  }, [myCourses, courseMeta]);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return myCourses.filter((course) => {
      const prog = courseMeta[course.id_cours]?.progress ?? 0;
      const matchesSearch =
        !q ||
        course.titre.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter === 'completed') return prog >= 100;
      if (statusFilter === 'in_progress') return prog < 100;
      return true;
    });
  }, [myCourses, courseMeta, searchQuery, statusFilter]);

  const hasFilters = Boolean(searchQuery.trim()) || statusFilter !== 'all';

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="surface-card rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row justify-between gap-6">
          <div className="space-y-3 max-w-xl w-full">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-3 pt-1">
              <Skeleton className="h-9 w-32 rounded-xl" />
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full lg:w-72">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
        <CardSkeleton count={3} />
      </div>
    );
  }

  return (
    <div ref={pageRef} className="relative z-10 max-w-6xl mx-auto space-y-9 pb-16 px-4 sm:px-6 pt-6">
      <CrawlingPythonBg />

      {/* Welcoming Header */}
      <section className="gsap-std-hero surface-card rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)]">
            Espace apprenant
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl text-[var(--text-primary)]">
            Welcome back{user ? `, ${user.prenom}` : ''}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Retrouvez vos cours inscrits, suivez l'avancement de vos évaluations et reprenez vos lectures.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              to="/student/grades"
              className="inline-flex items-center space-x-2 btn-accent text-xs sm:text-sm font-medium px-4 py-2 rounded-xl transition-transform hover:-translate-y-0.5"
            >
              <Award className="w-4 h-4" />
              <span>Relevé de notes</span>
            </Link>
            <Link
              to="/catalogue"
              className="inline-flex items-center space-x-2 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs sm:text-sm font-medium px-4 py-2 rounded-xl transition"
            >
              <Compass className="w-4 h-4" />
              <span>Catalogue</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="surface-subtle rounded-xl p-3.5 text-center space-y-1">
            <BookOpen className="w-4 h-4 text-[var(--accent-text)] mx-auto" />
            <span className="block text-xl font-semibold text-[var(--text-primary)] tabular-nums">
              {stats.total}
            </span>
            <span className="block text-[11px] text-[var(--text-muted)]">Cours</span>
          </div>

          <div className="surface-subtle rounded-xl p-3.5 text-center space-y-1">
            <CheckCircle2 className="w-4 h-4 text-[var(--success-text)] mx-auto" />
            <span className="block text-xl font-semibold text-[var(--text-primary)] tabular-nums">
              {stats.completed}
            </span>
            <span className="block text-[11px] text-[var(--text-muted)]">Validés</span>
          </div>

          <div className="surface-subtle rounded-xl p-3.5 text-center space-y-1">
            <GraduationCap className="w-4 h-4 text-[var(--text-secondary)] mx-auto" />
            <span className="block text-xl font-semibold text-[var(--text-primary)] tabular-nums">
              {stats.avgProgress}%
            </span>
            <span className="block text-[11px] text-[var(--text-muted)]">Moyenne</span>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Mes cours inscrits</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Cliquez sur un cours pour accéder aux chapitres, supports et devoirs
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="inline-flex bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-subtle)] text-xs font-medium">
            {[
              { id: 'all', label: `Tous (${stats.total})` },
              { id: 'in_progress', label: `En cours (${stats.inProgress})` },
              { id: 'completed', label: `Terminés (${stats.completed})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-2xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="pl-8 pr-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] w-full sm:w-48 transition"
            />
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {myCourses.length === 0 ? (
        <div className="surface-card rounded-2xl p-10 text-center space-y-3 max-w-md mx-auto">
          <BookOpen className="w-8 h-8 text-[var(--accent-text)] mx-auto" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Aucun cours inscrit pour le moment
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Explorez le catalogue pour vous inscrire à un cours.
          </p>
          <button
            type="button"
            onClick={() => navigate('/catalogue')}
            className="inline-flex items-center space-x-2 btn-accent text-xs font-medium px-4 py-2 rounded-xl cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Découvrir le catalogue</span>
          </button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="surface-card rounded-2xl p-10 text-center space-y-3 max-w-md mx-auto">
          <Search className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-75" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Aucun cours correspondant
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Aucun cours inscrit ne correspond à votre recherche ou au filtre sélectionné.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="inline-flex items-center gap-1.5 btn-accent text-xs font-medium px-4 py-2 rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const meta = courseMeta[course.id_cours] || {
              progress: 0,
              evalCount: 0,
              completedEvals: 0,
              resourceCount: 0,
            };
            const prog = meta.progress;
            const isCompleted = prog >= 100;
            const categoryName =
              categoryMap.get(course.id_categorie) || `Catégorie #${course.id_categorie}`;

            return (
              <div
                key={course.id_cours}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/cours/${course.id_cours}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/cours/${course.id_cours}`);
                  }
                }}
                className="gsap-std-card group surface-card rounded-2xl hover:border-[var(--accent-border)] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/15 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="p-5 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] px-2.5 py-0.5 rounded-full truncate">
                      {categoryName}
                    </span>

                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border flex items-center space-x-1 shrink-0 ${
                        isCompleted
                          ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]'
                          : prog > 0
                            ? 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]'
                            : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Terminé</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>{prog > 0 ? 'En cours' : 'Nouveau'}</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-text)] transition-colors leading-snug">
                    {course.titre}
                  </h3>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center space-x-1 text-xs text-[var(--text-secondary)] bg-[var(--bg-subtle)] px-2.5 py-1 rounded-lg">
                      <FileText className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                      <span className="tabular-nums">
                        {meta.resourceCount} support{meta.resourceCount > 1 ? 's' : ''}
                      </span>
                    </span>

                    <span className="inline-flex items-center space-x-1 text-xs text-[var(--text-secondary)] bg-[var(--bg-subtle)] px-2.5 py-1 rounded-lg">
                      <CheckSquare className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                      <span className="tabular-nums">
                        {meta.completedEvals}/{meta.evalCount} éval{meta.evalCount > 1 ? 's' : ''}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Progression</span>
                      <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                        {prog}%
                      </span>
                    </div>
                    <div className="w-full bg-[var(--border-subtle)] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(prog, 100)}%`,
                          backgroundColor: isCompleted ? 'var(--success-text)' : 'var(--accent)',
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {meta.enrolledDate
                        ? `Inscrit le ${new Date(meta.enrolledDate).toLocaleDateString('fr-FR')}`
                        : 'Accès immédiat'}
                    </span>

                    <span className="inline-flex items-center space-x-1 text-xs font-medium text-[var(--accent-text)]">
                      <span>{prog > 0 ? 'Continuer' : 'Commencer'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
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
