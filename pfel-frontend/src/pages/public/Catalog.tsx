// File: src/pages/public/Catalog.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { getCatalog, getCategories, getMyEnrollments, enrollCourse } from '../../api/services';
import type { Cours, Categorie, Inscription } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CrawlingPythonBg } from '../../components/ui/CrawlingPythonBg';
import { CardSkeleton, Skeleton } from '../../components/ui/Skeleton';
import {
  BookOpen,
  PlusCircle,
  CheckCircle,
  LogIn,
  UserPlus,
  ChevronDown,
  Folder,
  Search,
  Clock,
  GraduationCap,
  ListChecks,
  Sparkles,
  Layers,
  Award,
  RotateCcw,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]',
  Intermediate: 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]',
  Advanced: 'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)]',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  Beginner: 'Débutant (cool)',
  Intermediate: 'Intermédiaire (ça chauffe)',
  Advanced: 'Avancé (mode turbo)',
};

export default function Catalog() {
  const [courses, setCourses] = useState<Cours[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);
  const { token, role } = useAuth();
  const { success, error: showError } = useToast();

  const [openCategories, setOpenCategories] = useState<Record<number, boolean>>({});

  const pageRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async () => {
    try {
      const [courseData, catData] = await Promise.all([getCatalog(), getCategories()]);
      const cats = catData || [];
      setCategories(cats);
      setCourses(courseData || []);

      const initialOpen: Record<number, boolean> = {};
      cats.forEach((c) => {
        initialOpen[c.id_categorie] = true;
      });
      setOpenCategories(initialOpen);

      if (token && role === 'ETUDIANT') {
        const enrollments = await getMyEnrollments();
        const ids = new Set((enrollments || []).map((e: Inscription) => e.id_cours));
        setEnrolledIds(ids);
      }
    } catch (err) {
      console.error(err);
      showError("Oups, le catalogue n'a pas voulu s'ouvrir — réessaie dans un instant !");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, role]);

  const toggleCategory = (id: number) => {
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEnroll = async (id: number) => {
    setEnrollingId(id);
    try {
      await enrollCourse(id);
      setEnrolledIds((prev) => new Set(prev).add(id));
      success('Te voilà dans la boucle ! Bon apprentissage.', 'C’est validé');
    } catch {
      showError("L'inscription a glissé en route — réessaie !");
    } finally {
      setEnrollingId(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDifficultyFilter('ALL');
    setSelectedCategoryId('ALL');
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        course.titre.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        (course.prerequisites || '').toLowerCase().includes(q);

      const level = course.difficulty_level || 'Beginner';
      const matchesDifficulty = difficultyFilter === 'ALL' || level === difficultyFilter;
      const matchesCategory =
        selectedCategoryId === 'ALL' || course.id_categorie === selectedCategoryId;

      return matchesQuery && matchesDifficulty && matchesCategory;
    });
  }, [courses, searchQuery, difficultyFilter, selectedCategoryId]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) || difficultyFilter !== 'ALL' || selectedCategoryId !== 'ALL';

  useEffect(() => {
    if (loading || !pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('.gsap-hero-item', {
        y: 22,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.gsap-stat-card', {
        y: 18,
        opacity: 0,
        duration: 0.6,
        stagger: 0.09,
        delay: 0.2,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.gsap-course-card', {
        y: 24,
        opacity: 0,
        scale: 0.98,
        duration: 0.55,
        stagger: { amount: 0.35, from: 'start' },
        delay: 0.25,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });

      if (glowRef.current) {
        gsap.to(glowRef.current, {
          scale: 1.12,
          opacity: 0.65,
          duration: 3.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    }, pageRef);

    return () => ctx.revert();
  }, [loading, selectedCategoryId, difficultyFilter, searchQuery]);

  useEffect(() => {
    if (loading || !heroRef.current || !glowRef.current) return;

    const heroEl = heroRef.current;
    const xTo = gsap.quickTo(glowRef.current, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(glowRef.current, 'y', { duration: 0.6, ease: 'power3.out' });

    const onMove = (e: MouseEvent) => {
      const rect = heroEl.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      xTo(relX * 0.28);
      yTo(relY * 0.22);
    };

    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    heroEl.addEventListener('mousemove', onMove);
    heroEl.addEventListener('mouseleave', onLeave);
    return () => {
      heroEl.removeEventListener('mousemove', onMove);
      heroEl.removeEventListener('mouseleave', onLeave);
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="max-w-2xl mx-auto space-y-4 text-center">
          <Skeleton className="h-6 w-44 rounded-full mx-auto" />
          <Skeleton className="h-11 w-4/5 mx-auto" />
          <Skeleton className="h-5 w-2/3 mx-auto" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
        <CardSkeleton count={3} />
      </div>
    );
  }

  return (
    <div ref={pageRef} className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      <CrawlingPythonBg />

      {/* Interactive ambient aura */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-[740px] h-[300px] rounded-full bg-[var(--accent)]/15 blur-3xl -z-10"
      />

      {/* Hero & Search Composer */}
      <section ref={heroRef} className="max-w-3xl mx-auto text-center space-y-5 pt-1">
        <div className="gsap-hero-item inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-text)] text-xs font-medium shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Terrain de jeu Slang</span>
        </div>

        <h1 className="gsap-hero-item font-editorial text-3xl sm:text-5xl text-[var(--text-primary)] tracking-tight leading-[1.12]">
          On fait péter quel sujet aujourd&apos;hui ?
        </h1>

        <p className="gsap-hero-item text-[var(--text-secondary)] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Teste, bricole, débloque des chapitres à ton rythme et fais grimper ton niveau sans prise
          de tête.
        </p>

        {/* Search & Filter Composer */}
        <div className="gsap-hero-item surface-card rounded-2xl p-2.5 text-left transition-all duration-200 focus-within:border-[var(--accent)] focus-within:shadow-xl focus-within:shadow-[var(--accent)]/10">
          <div className="flex items-center px-3 py-1.5 gap-2.5">
            <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cherche un cours, une idée folle ou un prérequis..."
              className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 rounded-lg hover:bg-[var(--bg-subtle)] transition cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Tout remettre à zéro</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-2.5 pb-1 border-t border-[var(--border-subtle)] mt-1.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { value: 'ALL', label: 'Tous les niveaux' },
                { value: 'Beginner', label: 'Débutant' },
                { value: 'Intermediate', label: 'Intermédiaire' },
                { value: 'Advanced', label: 'Avancé' },
              ].map((opt) => {
                const active = difficultyFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDifficultyFilter(opt.value)}
                    className={`px-3 py-1 rounded-full font-medium transition-all duration-150 cursor-pointer ${
                      active
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)] shadow-2xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] border border-transparent'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-[var(--text-muted)] tabular-nums">
              {filteredCourses.length} cours prêt{filteredCourses.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Category Quick Pills */}
        {categories.length > 0 && (
          <div className="gsap-hero-item flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryId('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                selectedCategoryId === 'ALL'
                  ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)] border-[var(--border-strong)]'
                  : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)]/60'
              }`}
            >
              Tous les terrains ({courses.length})
            </button>
            {categories.map((cat) => {
              const active = selectedCategoryId === cat.id_categorie;
              const count = courses.filter((c) => c.id_categorie === cat.id_categorie).length;
              return (
                <button
                  key={cat.id_categorie}
                  type="button"
                  onClick={() => setSelectedCategoryId(active ? 'ALL' : cat.id_categorie)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    active
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--accent-border)]'
                      : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]/60'
                  }`}
                >
                  {cat.nom} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Guest Auth Actions */}
        {!token && (
          <div className="gsap-hero-item flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 btn-accent px-4 py-2.5 rounded-xl text-sm font-medium transition-transform hover:-translate-y-0.5"
            >
              <LogIn className="w-4 h-4" />
              <span>Se connecter</span>
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 surface-card hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Rejoindre la troupe</span>
            </Link>
          </div>
        )}
      </section>

      {/* Compact Platform Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="gsap-stat-card surface-card rounded-2xl px-4 py-3.5 flex items-center gap-3.5 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--text-primary)] tabular-nums leading-tight">
              {courses.length}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Cours en piste</p>
          </div>
        </div>

        <div className="gsap-stat-card surface-card rounded-2xl px-4 py-3.5 flex items-center gap-3.5 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--text-primary)] tabular-nums leading-tight">
              {categories.length}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Terrains thématiques</p>
          </div>
        </div>

        <div className="gsap-stat-card surface-card rounded-2xl px-4 py-3.5 flex items-center gap-3.5 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--success-bg)] border border-[var(--success-border)] text-[var(--success-text)] flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--text-primary)] tabular-nums leading-tight">
              {token && role === 'ETUDIANT' ? enrolledIds.size : '100%'}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {token && role === 'ETUDIANT'
                ? 'Tes missions en cours'
                : 'Pratique & fun'}
            </p>
          </div>
        </div>
      </section>

      {/* Categories & Course Cards */}
      {categories.length === 0 ? (
        <div className="surface-card p-10 rounded-2xl text-center max-w-md mx-auto space-y-2.5">
          <BookOpen className="w-10 h-10 text-[var(--accent-text)] mx-auto" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Le terrain est encore tout neuf
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Passe côté coach pour créer des terrains et lâcher les premiers cours.
          </p>
        </div>
      ) : filteredCourses.length === 0 && hasActiveFilters ? (
        <div className="surface-card p-10 rounded-2xl text-center max-w-md mx-auto space-y-3">
          <Search className="w-9 h-9 text-[var(--text-muted)] mx-auto opacity-75" />
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Rien sous ce radar !
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Essaie un autre mot-clé ou réinitialise les filtres pour élargir ta chasse.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 btn-accent px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser les filtres</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {categories
            .filter((cat) => selectedCategoryId === 'ALL' || cat.id_categorie === selectedCategoryId)
            .map((cat) => {
              const catCourses = filteredCourses.filter(
                (c) => c.id_categorie === cat.id_categorie
              );
              const isOpen = openCategories[cat.id_categorie] ?? true;

              if (hasActiveFilters && catCourses.length === 0) {
                return null;
              }

              return (
                <div
                  key={cat.id_categorie}
                  className="surface-card rounded-2xl overflow-hidden transition-shadow duration-200 hover:shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id_categorie)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-[var(--bg-subtle)]/60 hover:bg-[var(--bg-subtle)] transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-text)]">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-[var(--text-primary)]">
                          {cat.nom}
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {cat.description || 'Prêt à faire chauffer les neurones'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] px-2.5 py-0.5 rounded-full tabular-nums">
                        {catCourses.length} cours
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-6 border-t border-[var(--border-subtle)]">
                      {catCourses.length === 0 ? (
                        <p className="text-sm text-[var(--text-muted)] italic">
                          Pas encore de cours ici — le boomslang garde ce coin au frais.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {catCourses.map((course) => {
                            const isEnrolled = enrolledIds.has(course.id_cours);
                            const level = course.difficulty_level || 'Beginner';
                            const badgeClass =
                              DIFFICULTY_STYLES[level] ||
                              'bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--accent-border)]';
                            const levelLabel = DIFFICULTY_LABELS[level] || level;

                            return (
                              <article
                                key={course.id_cours}
                                className="gsap-course-card group rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-border)] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 transition-all duration-200 flex flex-col justify-between overflow-hidden"
                              >
                                <div>
                                  <div className="relative h-40 w-full bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] overflow-hidden">
                                    {course.cover_url ? (
                                      <img
                                        src={course.cover_url}
                                        alt={course.titre}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent-soft)]/50 via-[var(--bg-subtle)] to-[var(--bg-surface)] text-[var(--accent-text)]">
                                        <BookOpen className="w-9 h-9 opacity-80 transition-transform duration-300 group-hover:scale-110" />
                                      </div>
                                    )}

                                    <span
                                      className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border backdrop-blur-xs ${badgeClass}`}
                                    >
                                      <GraduationCap className="w-3 h-3" />
                                      <span>{levelLabel}</span>
                                    </span>

                                    {isEnrolled && (
                                      <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-[11px] font-medium bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)] px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                                        <CheckCircle className="w-3 h-3" />
                                        <span>Dans ta team</span>
                                      </span>
                                    )}
                                  </div>

                                  <div className="p-4 space-y-2.5">
                                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                                      <span className="tabular-nums">Cours #{course.id_cours}</span>
                                      {course.estimated_duration && (
                                        <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]">
                                          <Clock className="w-3 h-3 text-[var(--accent-text)]" />
                                          <span>{course.estimated_duration}</span>
                                        </span>
                                      )}
                                    </div>

                                    <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-text)] transition-colors flex items-start justify-between gap-2">
                                      <span>{course.titre}</span>
                                      <ArrowUpRight className="w-4 h-4 shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--accent-text)] mt-0.5" />
                                    </h3>

                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                                      {course.description}
                                    </p>

                                    {course.prerequisites && (
                                      <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)]/80 border border-[var(--border-subtle)] text-xs space-y-1">
                                        <span className="font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                                          <ListChecks className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
                                          <span>Bagage conseillé</span>
                                        </span>
                                        <p className="text-[var(--text-secondary)] leading-snug">
                                          {course.prerequisites}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {token && role === 'ETUDIANT' && (
                                  <div className="px-4 pb-4 pt-1">
                                    {isEnrolled ? (
                                      <Link
                                        to={`/cours/${course.id_cours}`}
                                        className="w-full flex items-center justify-center gap-1.5 bg-[var(--success-bg)] hover:brightness-105 text-[var(--success-text)] border border-[var(--success-border)] py-2 rounded-lg text-xs font-medium transition"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        <span>Continuer l&apos;aventure</span>
                                      </Link>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={enrollingId === course.id_cours}
                                        onClick={() => handleEnroll(course.id_cours)}
                                        className="w-full flex items-center justify-center gap-1.5 btn-accent py-2 rounded-lg text-xs font-medium disabled:opacity-50 cursor-pointer transition-transform active:scale-[0.99]"
                                      >
                                        <PlusCircle className="w-3.5 h-3.5" />
                                        <span>
                                          {enrollingId === course.id_cours
                                            ? 'Préparation...'
                                            : 'Embarquer dans le cours'}
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
