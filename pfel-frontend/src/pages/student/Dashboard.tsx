// File: src/pages/student/Dashboard.tsx
import { useEffect, useRef, useState, useMemo } from 'react';
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
  getCourseModules,
} from '../../api/services';
import type { Inscription, Cours, Categorie, Utilisateur } from '../../types';
import { useToast } from '../../context/ToastContext';
import { CrawlingPythonBg } from '../../components/ui/CrawlingPythonBg';
import { CardSkeleton, Skeleton } from '../../components/ui/Skeleton';
import SlangLogo from '../../components/SlangLogo';
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
  Sparkles,
  Flame,
  Layers,
  PlayCircle,
  Trophy,
} from 'lucide-react';

interface CourseMeta {
  progress: number;
  evalCount: number;
  completedEvals: number;
  resourceCount: number;
  moduleCount: number;
  enrolledDate?: string;
}

interface GradeEntry {
  id_soumission?: number;
  id_evaluation: number;
  titre_evaluation?: string;
  note: number | null;
  bareme: number;
  date_soumission?: string;
}

const BANNER_GRADIENTS = [
  'from-[var(--accent)]/25 via-[var(--accent-soft)] to-[var(--bg-subtle)]',
  'from-emerald-500/20 via-[var(--accent-soft)] to-[var(--bg-subtle)]',
  'from-amber-500/20 via-[var(--accent-soft)] to-[var(--bg-subtle)]',
  'from-sky-500/20 via-[var(--accent-soft)] to-[var(--bg-subtle)]',
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [user, setUser] = useState<Utilisateur | null>(null);
  const [enrollments, setEnrollments] = useState<Inscription[]>([]);
  const [catalog, setCatalog] = useState<Cours[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [courseMeta, setCourseMeta] = useState<Record<number, CourseMeta>>({});
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  const pageRef = useRef<HTMLDivElement | null>(null);
  const auraRef = useRef<HTMLDivElement | null>(null);

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
        const gradesList: GradeEntry[] = Array.isArray(gradesData) ? gradesData : [];

        setUser(profileData);
        setEnrollments(enrollList);
        setCatalog(courseList);
        setCategories(allCategories || []);
        setGrades(gradesList);

        const subMap: Record<number, { note: number | null; bareme: number }> = {};
        gradesList.forEach((g) => {
          subMap[g.id_evaluation] = { note: g.note, bareme: g.bareme };
        });

        const metaMap: Record<number, CourseMeta> = {};
        await Promise.all(
          enrollList.map(async (enr: Inscription) => {
            try {
              const [evals, resources, mods] = await Promise.all([
                getCourseEvaluations(enr.id_cours).catch(() => []),
                getCourseResources(enr.id_cours).catch(() => []),
                getCourseModules(enr.id_cours).catch(() => []),
              ]);

              const evalList = evals || [];
              const resList = resources || [];
              const modList = mods || [];

              if (evalList.length === 0) {
                metaMap[enr.id_cours] = {
                  progress: Math.round(enr.progression_pourcentage || 0),
                  evalCount: 0,
                  completedEvals: 0,
                  resourceCount: resList.length,
                  moduleCount: modList.length,
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
                moduleCount: modList.length,
                enrolledDate: enr.date_inscription,
              };
            } catch {
              metaMap[enr.id_cours] = {
                progress: Math.round(enr.progression_pourcentage || 0),
                evalCount: 0,
                completedEvals: 0,
                resourceCount: 0,
                moduleCount: 0,
                enrolledDate: enr.date_inscription,
              };
            }
          })
        );

        setCourseMeta(metaMap);
      } catch (err) {
        console.error('Erreur chargement dashboard étudiant:', err);
        showError("Impossible de charger ton QG d'explorateur pour l'instant !");
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
        y: 20,
        opacity: 0,
        duration: 0.65,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.gsap-std-card', {
        y: 18,
        opacity: 0,
        duration: 0.52,
        stagger: 0.06,
        delay: 0.14,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });

      if (auraRef.current) {
        gsap.to(auraRef.current, {
          scale: 1.12,
          opacity: 0.72,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
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

  const spotlightCourse = useMemo(() => {
    if (myCourses.length === 0) return null;
    const active = myCourses.find((c) => (courseMeta[c.id_cours]?.progress ?? 0) < 100);
    return active || myCourses[0];
  }, [myCourses, courseMeta]);

  const stats = useMemo(() => {
    const total = myCourses.length;
    if (total === 0) {
      return { total: 0, completed: 0, inProgress: 0, avgProgress: 0, totalResources: 0 };
    }

    let completed = 0;
    let sumProgress = 0;
    let totalResources = 0;

    myCourses.forEach((c) => {
      const m = courseMeta[c.id_cours];
      const p = m?.progress ?? 0;
      sumProgress += p;
      totalResources += m?.resourceCount ?? 0;
      if (p >= 100) completed += 1;
    });

    return {
      total,
      completed,
      inProgress: total - completed,
      avgProgress: Math.round(sumProgress / total),
      totalResources,
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
        <div className="surface-card rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row justify-between gap-6">
          <div className="space-y-3 max-w-xl w-full">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-3 pt-1">
              <Skeleton className="h-10 w-36 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full lg:w-80">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>
        <CardSkeleton count={3} />
      </div>
    );
  }

  return (
    <div ref={pageRef} className="relative z-10 max-w-6xl mx-auto space-y-8 pb-16 px-4 sm:px-6 pt-6">
      <CrawlingPythonBg />

      {/* Ambient glow */}
      <div
        ref={auraRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-[780px] h-[280px] rounded-full bg-[var(--accent)]/15 blur-3xl -z-10"
      />

      {/* Welcoming Slang Hero */}
      <section
        className="gsap-std-hero surface-card rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] relative overflow-hidden"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none -right-14 -top-14 w-64 h-64 rounded-full bg-[var(--accent)]/12 blur-2xl absolute"
        />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <SlangLogo width={96} label="Slang" />
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)]">
                <Sparkles className="w-3 h-3" />
                <span>QG Explorateur</span>
              </span>
            </div>

            <h1 className="font-editorial text-2xl sm:text-4xl text-[var(--text-primary)] tracking-tight leading-tight">
              Salut{user ? ` ${user.prenom}` : ''}, prêt à faire chauffer le compteur ?
            </h1>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Retrouve tes missions en cours, checke tes scores et repars direct dans tes
              chapitres sans perdre le fil.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/student/grades"
                className="inline-flex items-center gap-2 btn-accent text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition-transform hover:-translate-y-0.5 shadow-md shadow-[var(--accent)]/15"
              >
                <Trophy className="w-4 h-4" />
                <span>Mon tableau de scores</span>
              </Link>
              <Link
                to="/catalogue"
                className="inline-flex items-center gap-2 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition hover:-translate-y-0.5"
              >
                <Compass className="w-4 h-4 text-[var(--accent-text)]" />
                <span>Chasser d&apos;autres cours</span>
              </Link>
            </div>
          </div>

          {/* 3-Stat HUD */}
          <div className="grid grid-cols-3 gap-3 shrink-0 w-full lg:w-auto">
            <div className="surface-subtle rounded-2xl p-3.5 sm:p-4 text-center space-y-1 border border-[var(--border-subtle)]">
              <BookOpen className="w-4 h-4 text-[var(--accent-text)] mx-auto" />
              <span className="block text-xl sm:text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                {stats.total}
              </span>
              <span className="block text-[11px] text-[var(--text-muted)]">Cours actifs</span>
            </div>

            <div className="surface-subtle rounded-2xl p-3.5 sm:p-4 text-center space-y-1 border border-[var(--border-subtle)]">
              <CheckCircle2 className="w-4 h-4 text-[var(--success-text)] mx-auto" />
              <span className="block text-xl sm:text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                {stats.completed}
              </span>
              <span className="block text-[11px] text-[var(--text-muted)]">Bouclés</span>
            </div>

            <div className="surface-subtle rounded-2xl p-3.5 sm:p-4 text-center space-y-1 border border-[var(--border-subtle)]">
              <Flame className="w-4 h-4 text-[var(--accent-text)] mx-auto" />
              <span className="block text-xl sm:text-2xl font-bold text-[var(--accent-text)] tabular-nums">
                {stats.avgProgress}%
              </span>
              <span className="block text-[11px] text-[var(--text-muted)]">Niveau moyen</span>
            </div>
          </div>
        </div>
      </section>

      {/* Spotlight Jump-Back Banner + Quick Activity Strip */}
      {spotlightCourse && (
        <section className="gsap-std-hero grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          <div
            onClick={() => navigate(`/cours/${spotlightCourse.id_cours}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(`/cours/${spotlightCourse.id_cours}`);
              }
            }}
            className="lg:col-span-8 surface-card rounded-2xl p-4 sm:p-5 border border-[var(--accent-border)]/70 hover:border-[var(--accent)] transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
          >
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-text)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-text)]">
                  Reprise express
                </span>
                <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-text)] transition-colors">
                  {spotlightCourse.titre}
                </h2>
                <p className="text-xs text-[var(--text-muted)] tabular-nums">
                  Progression : {courseMeta[spotlightCourse.id_cours]?.progress ?? 0}% ·{' '}
                  {courseMeta[spotlightCourse.id_cours]?.resourceCount ?? 0} supports disponibles
                </p>
              </div>
            </div>

            <span className="inline-flex items-center justify-center gap-1.5 btn-accent px-4 py-2 rounded-xl text-xs font-semibold shrink-0 self-start sm:self-center">
              <span>Reprendre</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>

          <div className="lg:col-span-4 surface-card rounded-2xl p-4 sm:p-5 border border-[var(--border-subtle)] flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[var(--accent-text)]" />
                <span>Butin &amp; scores récents</span>
              </span>
              <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
                {stats.totalResources} supports
              </span>
            </div>

            {grades.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">
                Aucun score enregistré pour le moment — lance un quiz ou dépose un rendu !
              </p>
            ) : (
              <div className="space-y-1.5">
                {grades.slice(0, 2).map((g, idx) => (
                  <div
                    key={`${g.id_evaluation}-${idx}`}
                    className="flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)]"
                  >
                    <span className="text-[var(--text-secondary)] truncate">
                      {g.titre_evaluation || `Défi #${g.id_evaluation}`}
                    </span>
                    <span className="font-bold text-[var(--text-primary)] tabular-nums shrink-0">
                      {g.note !== null && g.note !== undefined ? `${g.note}/${g.bareme}` : 'En cours'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
            Tes terrains d&apos;entraînement
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Clique sur une carte pour plonger dans les chapitres, quiz et salon d&apos;entraide
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="inline-flex bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-subtle)] text-xs font-medium">
            {[
              { id: 'all', label: `Tous (${stats.total})` },
              { id: 'in_progress', label: `En route (${stats.inProgress})` },
              { id: 'completed', label: `Bouclés (${stats.completed})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as 'all' | 'in_progress' | 'completed')}
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
              placeholder="Filtrer tes cours..."
              className="pl-8 pr-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] w-full sm:w-48 transition"
            />
          </div>
        </div>
      </div>

      {/* Cards Grid with Cover Banners */}
      {myCourses.length === 0 ? (
        <div className="surface-card rounded-3xl p-10 text-center space-y-3.5 max-w-md mx-auto border border-[var(--border-subtle)]">
          <BookOpen className="w-9 h-9 text-[var(--accent-text)] mx-auto" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Ton sac à dos est encore vide !
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            File dans le catalogue pour embarquer dans ton premier cours et débloquer les chapitres.
          </p>
          <button
            type="button"
            onClick={() => navigate('/catalogue')}
            className="inline-flex items-center gap-2 btn-accent text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Explorer le catalogue</span>
          </button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="surface-card rounded-3xl p-10 text-center space-y-3 max-w-md mx-auto border border-[var(--border-subtle)]">
          <Search className="w-9 h-9 text-[var(--text-muted)] mx-auto opacity-75" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Rien sous ce radar
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Aucun de tes cours ne matche ce filtre — tente un autre mot-clé ou réinitialise.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="inline-flex items-center gap-1.5 btn-accent text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, idx) => {
            const meta = courseMeta[course.id_cours] || {
              progress: 0,
              evalCount: 0,
              completedEvals: 0,
              resourceCount: 0,
              moduleCount: 0,
            };
            const prog = meta.progress;
            const isCompleted = prog >= 100;
            const categoryName =
              categoryMap.get(course.id_categorie) || `Terrain #${course.id_categorie}`;
            const bannerGrad = BANNER_GRADIENTS[idx % BANNER_GRADIENTS.length];

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
                className="gsap-std-card group surface-card rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--accent-border)] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div>
                  {/* Course Banner */}
                  <div className="relative h-32 w-full bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] overflow-hidden">
                    {course.cover_url ? (
                      <img
                        src={course.cover_url}
                        alt={course.titre}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${bannerGrad} flex items-center justify-between px-5`}
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-text)] bg-[var(--bg-surface)]/80 px-2 py-0.5 rounded-md border border-[var(--border-subtle)]">
                            {categoryName}
                          </span>
                          <p className="text-xs font-medium text-[var(--text-secondary)] tabular-nums">
                            {meta.moduleCount} chapitre{meta.moduleCount > 1 ? 's' : ''}
                          </p>
                        </div>
                        <GraduationCap className="w-9 h-9 text-[var(--accent-text)]/75 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                    )}

                    {/* Status Pill */}
                    <span
                      className={`absolute top-2.5 right-2.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border backdrop-blur-xs flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]'
                          : prog > 0
                            ? 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]'
                            : 'bg-[var(--bg-surface)]/90 text-[var(--text-secondary)] border-[var(--border-subtle)]'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Bouclé</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>{prog > 0 ? 'En route' : 'Tout neuf'}</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                      <span className="font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] px-2.5 py-0.5 rounded-full truncate">
                        {categoryName}
                      </span>
                      {course.estimated_duration && (
                        <span className="tabular-nums shrink-0">{course.estimated_duration}</span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-text)] transition-colors leading-snug">
                      {course.titre}
                    </h3>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                      {course.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-lg">
                        <Layers className="w-3 h-3 text-[var(--accent-text)]" />
                        <span className="tabular-nums">
                          {meta.moduleCount} chap.
                        </span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-lg">
                        <FileText className="w-3 h-3 text-[var(--accent-text)]" />
                        <span className="tabular-nums">
                          {meta.resourceCount} support{meta.resourceCount > 1 ? 's' : ''}
                        </span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-lg">
                        <CheckSquare className="w-3 h-3 text-[var(--text-secondary)]" />
                        <span className="tabular-nums">
                          {meta.completedEvals}/{meta.evalCount} défi{meta.evalCount > 1 ? 's' : ''}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress & CTA Footer */}
                <div className="px-5 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Progression</span>
                      <span className="font-bold text-[var(--text-primary)] tabular-nums">
                        {prog}%
                      </span>
                    </div>
                    <div className="w-full bg-[var(--border-subtle)] rounded-full h-2 overflow-hidden">
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
                        ? `Rejoint le ${new Date(meta.enrolledDate).toLocaleDateString('fr-FR')}`
                        : 'Accès direct'}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-text)]">
                      <span>{prog > 0 ? 'Continuer' : 'Démarrer'}</span>
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
