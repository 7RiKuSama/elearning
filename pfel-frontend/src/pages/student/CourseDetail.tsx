// File: src/pages/student/CourseDetail.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import {
  getCatalog,
  getCourseResources,
  getCourseModules,
  getCourseEvaluations,
  getForumThreads,
  submitEvaluation,
  uploadFileToServer,
  getStudentGrades,
  getEvaluationQuiz,
} from '../../api/services';
import type { Cours, Ressource, Evaluation, Module } from '../../types';
import { useToast } from '../../context/ToastContext';
import { CrawlingPythonBg } from '../../components/ui/CrawlingPythonBg';
import { Skeleton } from '../../components/ui/Skeleton';
import QuizPlayerModal, { type QuizQuestionItem } from '../components/QuizPlayerModal';
import ForumSection from '../../components/ForumSection';
import {
  FileText,
  CheckSquare,
  MessageSquare,
  ArrowLeft,
  Upload,
  Download,
  PlayCircle,
  Image as ImageIcon,
  FileCode,
  FolderOpen,
  Layers,
  Eye,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  Award,
  BookOpen,
  X,
} from 'lucide-react';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(
  /\/api\/?$/,
  ''
);

const resolveFileUrl = (path?: string | null): string => {
  if (!path) return '';
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('file://')) {
    const clean = trimmed.replace(/^file:\/\//i, '');
    const uploadsIdx = clean.indexOf('/uploads/');
    if (uploadsIdx !== -1) {
      return `${API_ORIGIN}${clean.slice(uploadsIdx)}`;
    }
    return '';
  }
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_ORIGIN}${normalized}`;
};

const getVideoEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return null;
};

const renderMarkdown = (md: string) => {
  if (!md) return '';
  let html = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  html = html.replace(
    /```([\s\S]*?)```/g,
    '<pre class="bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] p-3.5 rounded-xl overflow-x-auto text-xs my-3 font-mono"><code>$1</code></pre>'
  );
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-[var(--accent-soft)] text-[var(--accent-text)] px-1.5 py-0.5 rounded text-xs font-mono">$1</code>'
  );
  html = html.replace(
    /^### (.*$)/gim,
    '<h3 class="text-base font-semibold text-[var(--text-primary)] mt-4 mb-1">$1</h3>'
  );
  html = html.replace(
    /^## (.*$)/gim,
    '<h2 class="text-lg font-semibold text-[var(--text-primary)] mt-5 mb-2 border-b border-[var(--border-subtle)] pb-1">$1</h2>'
  );
  html = html.replace(
    /^# (.*$)/gim,
    '<h1 class="font-editorial text-xl text-[var(--text-primary)] mt-5 mb-3">$1</h1>'
  );
  html = html.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-semibold text-[var(--text-primary)]">$1</strong>'
  );
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  html = html.replace(
    /^&gt; (.*$)/gim,
    '<blockquote class="border-l-2 border-[var(--accent)] pl-3.5 italic text-[var(--text-secondary)] my-2">$1</blockquote>'
  );
  html = html.replace(/^\s*[-*] (.*$)/gim, '<li class="ml-5 list-disc my-0.5">$1</li>');
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer" class="text-[var(--accent-text)] underline hover:opacity-80">$1</a>'
  );
  html = html.replace(/\n/g, '<br />');

  return html;
};

const getSessionUser = (): { id_user?: string; role?: string } => {
  try {
    for (const key of ['user', 'pfel_user', 'currentUser', 'auth_user']) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const u = parsed?.user ?? parsed;
        if (u?.id_user || u?.role) {
          return { id_user: u.id_user || u.id, role: u.role };
        }
      }
    }
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token && token.split('.').length === 3) {
      const payload = JSON.parse(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      );
      return {
        id_user: payload.id_user || payload.user_id || payload.sub,
        role: payload.role || payload.user_role,
      };
    }
  } catch {
    // ignore storage/token parse issues
  }
  return {};
};

interface StudentSubmissionInfo {
  id_soumission: number;
  id_evaluation: number;
  fichier_soumis?: string;
  note: number | null;
  commentaires: string;
  date_soumission: string;
}

interface ChapterSection {
  key: string;
  orderLabel?: string;
  title: string;
  description?: string;
  isUnassigned?: boolean;
  items: Ressource[];
}

type CourseSectionTab = 'contenu' | 'evaluations' | 'forum';

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessionUser = useMemo(() => getSessionUser(), []);
  const { success, warning, error: showError } = useToast();

  const [activeSection, setActiveSection] = useState<CourseSectionTab>('contenu');
  const [course, setCourse] = useState<Cours | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [resources, setResources] = useState<Ressource[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Record<number, StudentSubmissionInfo>>({});
  const [forumThreadsCount, setForumThreadsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});
  const [expandedResId, setExpandedResId] = useState<number | null>(null);
  const [textContents, setTextContents] = useState<Record<number, string>>({});
  const [loadingTextId, setLoadingTextId] = useState<number | null>(null);

  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [activeQuizEval, setActiveQuizEval] = useState<Evaluation | null>(null);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestionItem[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  const pageRef = useRef<HTMLDivElement | null>(null);
  const courseId = Number(id);

  const fetchCourseData = async () => {
    try {
      const catalog = await getCatalog();
      const currentCourse = (catalog || []).find((c: Cours) => Number(c.id_cours) === courseId);
      setCourse(currentCourse || null);
    } catch (err) {
      console.error('Erreur lors de la récupération du cours:', err);
    }

    try {
      const modsData = await getCourseModules(courseId);
      setModules(Array.isArray(modsData) ? modsData : []);
    } catch {
      setModules([]);
    }

    try {
      const resData = await getCourseResources(courseId);
      setResources(Array.isArray(resData) ? resData : []);
    } catch {
      setResources([]);
    }

    try {
      const evalData = await getCourseEvaluations(courseId);
      setEvaluations(Array.isArray(evalData) ? evalData : []);
    } catch {
      setEvaluations([]);
    }

    try {
      const gradesData = await getStudentGrades();
      const subMap: Record<number, StudentSubmissionInfo> = {};
      (Array.isArray(gradesData) ? gradesData : []).forEach((item: StudentSubmissionInfo) => {
        subMap[item.id_evaluation] = item;
      });
      setMySubmissions(subMap);
    } catch {
      setMySubmissions({});
    }

    try {
      const forumData = await getForumThreads(courseId);
      setForumThreadsCount(Array.isArray(forumData) ? forumData.length : 0);
    } catch {
      setForumThreadsCount(0);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (courseId) {
      setLoading(true);
      fetchCourseData();
    }
  }, [courseId]);

  useEffect(() => {
    if (loading || !pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.gsap-cd-anim', {
        y: 16,
        opacity: 0,
        duration: 0.55,
        stagger: 0.06,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });
    }, pageRef);
    return () => ctx.revert();
  }, [loading, activeSection]);

  const handleOpenEvaluationAction = async (ev: Evaluation) => {
    if ((ev as any).type_evaluation === 'quiz') {
      setLoadingQuiz(true);
      try {
        const qs = await getEvaluationQuiz(ev.id_evaluation);
        if (!qs || qs.length === 0) {
          warning('Aucune question disponible pour ce quiz pour le moment.');
          return;
        }
        setActiveQuizQuestions(qs);
        setActiveQuizEval(ev);
      } catch (err) {
        console.error(err);
        showError('Impossible de charger le quiz.');
      } finally {
        setLoadingQuiz(false);
      }
      return;
    }

    setSelectedEval(ev);
  };

  const courseProgressPercentage = useMemo(() => {
    if (evaluations.length === 0) return 0;

    let totalScore = 0;
    evaluations.forEach((ev) => {
      const sub = mySubmissions[ev.id_evaluation];
      if (sub) {
        if (sub.note === null || sub.note === undefined) {
          totalScore += 0.5;
        } else {
          const ratio = ev.bareme > 0 ? Math.min(Math.max(sub.note / ev.bareme, 0), 1) : 1;
          totalScore += 0.5 + 0.5 * ratio;
        }
      }
    });

    return Math.round((totalScore / evaluations.length) * 100);
  }, [evaluations, mySubmissions]);

  const completedEvaluationsCount = useMemo(() => {
    return evaluations.filter((ev) => Boolean(mySubmissions[ev.id_evaluation])).length;
  }, [evaluations, mySubmissions]);

  const chapterSections = useMemo<ChapterSection[]>(() => {
    const sortedModules = [...modules].sort(
      (a, b) => (a.ordre_affichage ?? 0) - (b.ordre_affichage ?? 0) || a.id_module - b.id_module
    );

    const moduleIds = new Set(sortedModules.map((m) => m.id_module));
    const sections: ChapterSection[] = sortedModules.map((mod, idx) => ({
      key: `mod-${mod.id_module}`,
      orderLabel: `Chapitre ${idx + 1}`,
      title: mod.titre,
      description: mod.description,
      items: resources.filter((res) => res.id_module === mod.id_module),
    }));

    const unassigned = resources.filter(
      (res) => res.id_module === null || res.id_module === undefined || !moduleIds.has(res.id_module)
    );

    if (unassigned.length > 0) {
      sections.push({
        key: 'unassigned',
        title:
          sortedModules.length > 0 ? 'Autres supports & ressources générales' : 'Supports du cours',
        description:
          sortedModules.length > 0
            ? 'Documents complémentaires non rattachés à un chapitre spécifique'
            : undefined,
        isUnassigned: true,
        items: unassigned,
      });
    }

    return sections;
  }, [modules, resources]);

  const toggleChapterCollapse = (key: string) => {
    setCollapsedChapters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const jumpToChapter = (key: string) => {
    setActiveSection('contenu');
    setCollapsedChapters((prev) => ({ ...prev, [key]: false }));
    requestAnimationFrame(() => {
      const el = document.getElementById(`chapter-${key}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  const handleToggleResource = async (res: Ressource) => {
    if (expandedResId === res.id_ressource) {
      setExpandedResId(null);
      return;
    }

    setExpandedResId(res.id_ressource);

    const isText = res.type_fichier === 'text' || /\.(md|txt|markdown)$/i.test(res.chemin_fichier);
    if (isText && textContents[res.id_ressource] === undefined) {
      setLoadingTextId(res.id_ressource);
      try {
        const response = await fetch(resolveFileUrl(res.chemin_fichier));
        if (!response.ok) throw new Error('Impossible de charger le fichier texte');
        const text = await response.text();
        setTextContents((prev) => ({ ...prev, [res.id_ressource]: text }));
      } catch (err) {
        console.error(err);
        setTextContents((prev) => ({
          ...prev,
          [res.id_ressource]:
            "*Impossible d'afficher l'aperçu direct de ce fichier. Utilisez le bouton Télécharger.*",
        }));
      } finally {
        setLoadingTextId(null);
      }
    }
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEval || !submissionFile) return;
    setUploading(true);
    try {
      const uploaded = await uploadFileToServer(submissionFile);
      await submitEvaluation(selectedEval.id_evaluation, uploaded.chemin_fichier);

      setMySubmissions((prev) => ({
        ...prev,
        [selectedEval.id_evaluation]: {
          id_soumission: prev[selectedEval.id_evaluation]?.id_soumission || Date.now(),
          id_evaluation: selectedEval.id_evaluation,
          fichier_soumis: uploaded.chemin_fichier,
          note: prev[selectedEval.id_evaluation]?.note ?? null,
          commentaires: prev[selectedEval.id_evaluation]?.commentaires || '',
          date_soumission: new Date().toISOString(),
        },
      }));

      success('Votre travail a été enregistré avec succès !', 'Devoir soumis');
      setSelectedEval(null);
      setSubmissionFile(null);
      fetchCourseData();
    } catch (err) {
      console.error(err);
      showError('Erreur lors de la soumission du devoir.');
    } finally {
      setUploading(false);
    }
  };

  const getResourceIcon = (res: Ressource) => {
    if (
      res.type_fichier === 'video' ||
      /\.(mp4|webm|ogg)$/i.test(res.chemin_fichier) ||
      getVideoEmbedUrl(res.chemin_fichier) !== null
    ) {
      return <PlayCircle className="w-4 h-4 text-[var(--accent-text)]" />;
    }
    if (res.type_fichier === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(res.chemin_fichier)) {
      return <ImageIcon className="w-4 h-4 text-[var(--success-text)]" />;
    }
    if (res.type_fichier === 'text' || /\.(md|txt|markdown)$/i.test(res.chemin_fichier)) {
      return <FileCode className="w-4 h-4 text-[var(--warning-text)]" />;
    }
    return <FileText className="w-4 h-4 text-[var(--text-secondary)]" />;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const hasAnyCourseContent =
    Boolean(course) ||
    modules.length > 0 ||
    resources.length > 0 ||
    evaluations.length > 0 ||
    forumThreadsCount > 0;

  if (!hasAnyCourseContent) {
    return (
      <div className="max-w-3xl mx-auto mt-16 px-4 text-center space-y-4">
        <div className="surface-card rounded-2xl p-8 space-y-4">
          <p className="text-[var(--danger-text)] font-medium text-base">
            Cours introuvable ou non publié.
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 btn-accent text-xs font-medium px-4 py-2 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retourner en arrière</span>
          </button>
        </div>
      </div>
    );
  }

  const displayTitle = course?.titre || `Cours #${courseId}`;
  const displayDescription =
    course?.description ||
    'Consultez les chapitres, supports pédagogiques, quiz auto-notés et échanges du cours.';
  const displayCategoryId = course?.id_categorie ?? '—';

  return (
    <div ref={pageRef} className="relative z-10 space-y-6 max-w-6xl mx-auto pb-16 px-4 sm:px-6 pt-6">
      <CrawlingPythonBg />

      {/* Top Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux cours</span>
        </button>

        <span className="text-xs text-[var(--text-muted)]">
          Section active :{' '}
          <strong className="text-[var(--text-primary)]">
            {activeSection === 'contenu'
              ? 'Contenu & Chapitres'
              : activeSection === 'evaluations'
                ? 'Évaluations & Quiz'
                : 'Forum du cours'}
          </strong>
        </span>
      </div>

      {/* Course Hero Banner */}
      <header className="gsap-cd-anim surface-card rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)] font-medium">
              Catégorie #{displayCategoryId}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] tabular-nums">
              {modules.length} chapitre{modules.length > 1 ? 's' : ''}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] tabular-nums">
              {resources.length} support{resources.length > 1 ? 's' : ''}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] tabular-nums">
              {evaluations.length} évaluation{evaluations.length > 1 ? 's' : ''}
            </span>
          </div>

          <h1 className="font-editorial text-2xl sm:text-3xl text-[var(--text-primary)] leading-snug">
            {displayTitle}
          </h1>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {displayDescription}
          </p>
        </div>

        <div className="surface-subtle rounded-xl p-4 w-full lg:w-72 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)] flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-[var(--accent-text)]" />
              <span>Progression</span>
            </span>
            <span className="text-lg font-semibold text-[var(--text-primary)] tabular-nums">
              {courseProgressPercentage}%
            </span>
          </div>
          <div className="w-full bg-[var(--border-subtle)] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[var(--accent)] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(courseProgressPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] tabular-nums">
            <span>
              {completedEvaluationsCount}/{evaluations.length} complétée
              {completedEvaluationsCount > 1 ? 's' : ''}
            </span>
            <span>50% rendu · 50% note</span>
          </div>
        </div>
      </header>

      {/* Dedicated Section Navigation Pages */}
      <nav
        aria-label="Sections du cours"
        className="gsap-cd-anim surface-card rounded-2xl p-1.5 grid grid-cols-1 sm:grid-cols-3 gap-1.5"
      >
        <button
          type="button"
          onClick={() => setActiveSection('contenu')}
          className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer ${
            activeSection === 'contenu'
              ? 'btn-accent'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span>1. Contenu & Chapitres</span>
          <span
            className={`ml-auto text-[11px] px-2 py-0.5 rounded-full tabular-nums ${
              activeSection === 'contenu'
                ? 'bg-black/20 text-white'
                : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
            }`}
          >
            {resources.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('evaluations')}
          className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer ${
            activeSection === 'evaluations'
              ? 'btn-accent'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <CheckSquare className="w-4 h-4 shrink-0" />
          <span>2. Évaluations & Quiz</span>
          <span
            className={`ml-auto text-[11px] px-2 py-0.5 rounded-full tabular-nums ${
              activeSection === 'evaluations'
                ? 'bg-black/20 text-white'
                : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
            }`}
          >
            {evaluations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('forum')}
          className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer ${
            activeSection === 'forum'
              ? 'btn-accent'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span>3. Forum du cours</span>
          <span
            className={`ml-auto text-[11px] px-2 py-0.5 rounded-full tabular-nums ${
              activeSection === 'forum'
                ? 'bg-black/20 text-white'
                : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
            }`}
          >
            {forumThreadsCount}
          </span>
        </button>
      </nav>

      {/* Main Layout: Active Section Page + Right Companion Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION PAGE 1: CONTENU & CHAPITRES */}
          {activeSection === 'contenu' && (
            <section className="gsap-cd-anim surface-card rounded-2xl p-6 sm:p-7 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      Chapitres & supports pédagogiques
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Lisez vos cours, vidéos, PDF et notes Markdown directement dans la page
                    </p>
                  </div>
                </div>

                {chapterSections.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    {chapterSections.map((sec) => (
                      <button
                        key={sec.key}
                        type="button"
                        onClick={() => jumpToChapter(sec.key)}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition cursor-pointer"
                      >
                        {sec.orderLabel || sec.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {chapterSections.length === 0 ? (
                <div className="text-center py-12 surface-subtle rounded-xl border-dashed space-y-2">
                  <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    Aucun chapitre ni support publié dans ce cours pour le moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chapterSections.map((section) => {
                    const isCollapsed = Boolean(collapsedChapters[section.key]);

                    return (
                      <div
                        id={`chapter-${section.key}`}
                        key={section.key}
                        className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 overflow-hidden scroll-mt-6"
                      >
                        <button
                          type="button"
                          onClick={() => toggleChapterCollapse(section.key)}
                          className="w-full px-4 py-3.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]/60 transition flex items-center justify-between gap-4 text-left cursor-pointer"
                        >
                          <div className="flex items-start space-x-3 min-w-0">
                            <div className="p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] shrink-0 mt-0.5">
                              <FolderOpen className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                {section.orderLabel && (
                                  <span className="text-[11px] font-medium bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)] px-2 py-0.5 rounded-md">
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

                          <div className="flex items-center space-x-2.5 shrink-0">
                            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2.5 py-0.5 rounded-full tabular-nums">
                              {section.items.length} support{section.items.length > 1 ? 's' : ''}
                            </span>
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                            ) : (
                              <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                            )}
                          </div>
                        </button>

                        {!isCollapsed && (
                          <div className="p-3.5 border-t border-[var(--border-subtle)] space-y-2.5">
                            {section.items.length === 0 ? (
                              <p className="text-xs text-[var(--text-muted)] italic py-3 text-center">
                                Aucun support dans ce chapitre pour le moment.
                              </p>
                            ) : (
                              section.items.map((res) => {
                                const isExpanded = expandedResId === res.id_ressource;
                                const embedVideoUrl = getVideoEmbedUrl(res.chemin_fichier);
                                const isDirectVideo =
                                  !embedVideoUrl &&
                                  (res.type_fichier === 'video' ||
                                    /\.(mp4|webm|ogg)$/i.test(res.chemin_fichier));
                                const isVideo = Boolean(embedVideoUrl) || isDirectVideo;
                                const isImage =
                                  res.type_fichier === 'image' ||
                                  /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(res.chemin_fichier);
                                const isText =
                                  res.type_fichier === 'text' ||
                                  /\.(md|txt|markdown)$/i.test(res.chemin_fichier);
                                const isPdf =
                                  res.type_fichier === 'pdf' || /\.pdf$/i.test(res.chemin_fichier);
                                const resolvedUrl = resolveFileUrl(res.chemin_fichier);

                                return (
                                  <div
                                    key={res.id_ressource}
                                    className={`rounded-xl border transition overflow-hidden ${
                                      isExpanded
                                        ? 'bg-[var(--bg-surface)] border-[var(--accent-border)]'
                                        : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                                    }`}
                                  >
                                    <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div
                                        onClick={() => handleToggleResource(res)}
                                        className="flex items-start space-x-3 cursor-pointer flex-1 min-w-0"
                                      >
                                        <div className="p-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shrink-0 mt-0.5">
                                          {getResourceIcon(res)}
                                        </div>
                                        <div className="min-w-0 space-y-0.5">
                                          <h4 className="font-medium text-[var(--text-primary)] text-sm truncate">
                                            {res.nom_fichier}
                                          </h4>
                                          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                                            <span className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-[11px]">
                                              {res.type_fichier}
                                            </span>
                                            {isText && <span>Lecture Markdown</span>}
                                            {isVideo && <span>Vidéo</span>}
                                            {isPdf && <span>PDF</span>}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleResource(res)}
                                          className={`inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                                            isExpanded
                                              ? 'bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--accent-border)]'
                                              : 'bg-[var(--bg-subtle)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
                                          }`}
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>{isExpanded ? 'Masquer' : 'Ouvrir'}</span>
                                        </button>

                                        {resolvedUrl && (
                                          <a
                                            href={resolvedUrl}
                                            download={res.nom_fichier}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center space-x-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] px-2.5 py-1.5 rounded-lg transition"
                                            title="Télécharger le support"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                          </a>
                                        )}
                                      </div>
                                    </div>

                                    {isExpanded && (
                                      <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/30 space-y-3">
                                        {isText && (
                                          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 sm:p-5 text-sm text-[var(--text-secondary)] leading-relaxed">
                                            {loadingTextId === res.id_ressource ? (
                                              <p className="text-xs text-[var(--text-muted)]">
                                                Chargement de la note...
                                              </p>
                                            ) : (
                                              <div
                                                dangerouslySetInnerHTML={{
                                                  __html: renderMarkdown(
                                                    textContents[res.id_ressource] || ''
                                                  ),
                                                }}
                                              />
                                            )}
                                          </div>
                                        )}

                                        {embedVideoUrl && (
                                          <div className="aspect-video w-full rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-black">
                                            <iframe
                                              src={embedVideoUrl}
                                              title={res.nom_fichier}
                                              className="w-full h-full"
                                              allowFullScreen
                                            />
                                          </div>
                                        )}

                                        {isDirectVideo && resolvedUrl && (
                                          <video
                                            src={resolvedUrl}
                                            controls
                                            className="w-full max-h-[420px] rounded-xl border border-[var(--border-subtle)] bg-black"
                                          />
                                        )}

                                        {isImage && resolvedUrl && (
                                          <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 flex justify-center">
                                            <img
                                              src={resolvedUrl}
                                              alt={res.nom_fichier}
                                              className="max-h-[420px] w-auto object-contain rounded-lg"
                                            />
                                          </div>
                                        )}

                                        {isPdf && resolvedUrl && (
                                          <div className="space-y-2">
                                            <iframe
                                              src={resolvedUrl}
                                              title={res.nom_fichier}
                                              className="w-full h-[460px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                                            />
                                            <div className="flex justify-end">
                                              <a
                                                href={resolvedUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-text)] hover:underline"
                                              >
                                                <span>Ouvrir dans un nouvel onglet</span>
                                                <ExternalLink className="w-3.5 h-3.5" />
                                              </a>
                                            </div>
                                          </div>
                                        )}

                                        {!isText && !isVideo && !isImage && !isPdf && resolvedUrl && (
                                          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs">
                                            <span className="text-[var(--text-secondary)]">
                                              Aperçu intégré non disponible pour ce format.
                                            </span>
                                            <a
                                              href={resolvedUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-1 font-medium text-[var(--accent-text)] hover:underline"
                                            >
                                              <span>Ouvrir le fichier</span>
                                              <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                          </div>
                                        )}
                                      </div>
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
          )}

          {/* SECTION PAGE 2: ÉVALUATIONS & QUIZ */}
          {activeSection === 'evaluations' && (
            <section className="gsap-cd-anim surface-card rounded-2xl p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      Évaluations, devoirs & quiz
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Soumettez vos fichiers ou passez vos quiz auto-notés et consultez vos notes
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)] tabular-nums">
                  {completedEvaluationsCount}/{evaluations.length} rendue(s)
                </span>
              </div>

              {evaluations.length === 0 ? (
                <div className="text-center py-12 surface-subtle rounded-xl border-dashed space-y-2">
                  <CheckSquare className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                  <p className="text-sm text-[var(--text-secondary)]">
                    Aucune évaluation publiée pour ce cours pour le moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {evaluations.map((ev) => {
                    const isQuiz = (ev as any).type_evaluation === 'quiz';
                    const sub = mySubmissions[ev.id_evaluation];
                    const hasNote = sub && sub.note !== null && sub.note !== undefined;

                    return (
                      <div
                        key={ev.id_evaluation}
                        className="p-4 rounded-xl bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                                isQuiz
                                  ? 'bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--accent-border)]'
                                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                              }`}
                            >
                              {isQuiz ? 'Quiz auto-noté' : 'Devoir à rendre'}
                            </span>
                            <span className="text-xs text-[var(--text-muted)] tabular-nums">
                              Barème : {ev.bareme} pts
                            </span>
                            {sub && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)]">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>
                                  {hasNote
                                    ? `Note : ${sub.note}/${ev.bareme}`
                                    : 'Soumis · En attente de note'}
                                </span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
                            {ev.titre}
                          </h3>
                          {ev.description && (
                            <p className="text-xs text-[var(--text-secondary)]">{ev.description}</p>
                          )}
                          {sub?.commentaires && (
                            <p className="text-xs text-[var(--accent-text)] pt-0.5">
                              Remarque enseignant : {sub.commentaires}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={loadingQuiz}
                            onClick={() => handleOpenEvaluationAction(ev)}
                            className="inline-flex items-center gap-1.5 btn-accent px-4 py-2 rounded-xl text-xs font-medium cursor-pointer disabled:opacity-50"
                          >
                            {isQuiz ? (
                              <>
                                <PlayCircle className="w-3.5 h-3.5" />
                                <span>{sub ? 'Refaire le quiz' : 'Passer le quiz'}</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                <span>{sub ? 'Mettre à jour le rendu' : 'Soumettre un devoir'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* SECTION PAGE 3: FORUM DU COURS */}
          {activeSection === 'forum' && (
            <section className="gsap-cd-anim surface-card rounded-2xl p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      Discussions & entraide
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      Posez vos questions aux enseignants et partagez des ressources
                    </p>
                  </div>
                </div>
              </div>

              <ForumSection
                courseId={courseId}
                currentUserId={sessionUser.id_user}
                currentUserRole={sessionUser.role}
              />
            </section>
          )}
        </div>

        {/* Right Companion Rail */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="gsap-cd-anim surface-card rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3">
              Plan du cours
            </h2>

            {chapterSections.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">Aucun chapitre disponible.</p>
            ) : (
              <div className="space-y-1.5">
                {chapterSections.map((sec) => (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => jumpToChapter(sec.key)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-subtle)]/50 hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-left transition cursor-pointer"
                  >
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {sec.orderLabel ? `${sec.orderLabel} · ${sec.title}` : sec.title}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] shrink-0 tabular-nums">
                      {sec.items.length}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="gsap-cd-anim surface-card rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Raccourcis rapides</h2>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveSection('evaluations')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-between transition cursor-pointer"
              >
                <span>Voir mes évaluations ({evaluations.length})</span>
                <CheckSquare className="w-3.5 h-3.5 text-[var(--accent-text)]" />
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('forum')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-between transition cursor-pointer"
              >
                <span>Ouvrir le forum ({forumThreadsCount})</span>
                <MessageSquare className="w-3.5 h-3.5 text-[var(--accent-text)]" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* File Submission Modal */}
      {selectedEval && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => !uploading && setSelectedEval(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-medium text-[var(--accent-text)]">
                  Soumission de devoir
                </span>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  {selectedEval.titre}
                </h3>
              </div>
              <button
                type="button"
                disabled={uploading}
                onClick={() => setSelectedEval(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Fichier à envoyer
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[var(--text-secondary)] file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border file:border-[var(--border-subtle)] file:text-xs file:font-medium file:bg-[var(--bg-subtle)] file:text-[var(--text-primary)] hover:file:bg-[var(--bg-hover)] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setSelectedEval(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading || !submissionFile}
                  className="btn-accent px-4 py-2 rounded-xl text-xs font-medium disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? 'Envoi en cours...' : 'Envoyer le devoir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Player Modal */}
      {activeQuizEval && (
        <QuizPlayerModal
          evaluation={activeQuizEval}
          questions={activeQuizQuestions}
          onClose={() => {
            setActiveQuizEval(null);
            setActiveQuizQuestions([]);
          }}
          onCompleted={() => {
            setActiveQuizEval(null);
            setActiveQuizQuestions([]);
            success('Quiz soumis avec succès !');
            fetchCourseData();
          }}
        />
      )}
    </div>
  );
}
