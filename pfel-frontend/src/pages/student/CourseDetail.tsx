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
  getCourseCompletions,
  toggleResourceCompletion,
} from '../../api/services';
import type { Cours, Ressource, Evaluation, Module } from '../../types';
import { useToast } from '../../context/ToastContext';
import { CrawlingPythonBg } from '../../components/ui/CrawlingPythonBg';
import { Skeleton } from '../../components/ui/Skeleton';
import { BackTrailGlyph, CompassRingGlyph } from '../../components/ui/CourseGlyphs';
import type { QuizQuestionItem } from '../components/QuizPlayerModal';
import ForumSection from '../../components/ForumSection';
import type { CourseSectionTab } from './course-detail/types';
import { resolveFileUrl, getSessionUser } from './course-detail/mediaUtils';
import { CourseHeroHeader } from './course-detail/CourseHeroHeader';
import { CourseSectionTabs } from './course-detail/CourseSectionTabs';
import { CourseChaptersSection } from './course-detail/CourseChaptersSection';
import { CourseEvaluationsSection } from './course-detail/CourseEvaluationsSection';
import { CourseCompanionRail } from './course-detail/CourseCompanionRail';
import { SubmissionModal } from './course-detail/SubmissionModal';
import { QuizModalWrapper } from './course-detail/QuizModalWrapper';

export interface StudentSubmissionInfo {
  id_soumission: number;
  id_evaluation: number;
  fichier_soumis: string;
  note?: number | null;
  commentaires?: string;
  date_soumission?: string;
}

export interface ChapterSection {
  key: string;
  orderLabel?: string;
  title: string;
  description?: string;
  isUnassigned?: boolean;
  items: Ressource[];
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessionUser = useMemo(() => getSessionUser(), []);
  const { success, warning, error: showError } = useToast();

  const [activeSection, setActiveSection] = useState<CourseSectionTab>('contenu');
  const [course, setCourse] = useState<Cours | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [resources, setResources] = useState<Ressource[]>([]);
  const [completedResourceIds, setCompletedResourceIds] = useState<number[]>([]);
  const [togglingResourceId, setTogglingResourceId] = useState<number | null>(null);
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
  const auraRef = useRef<HTMLDivElement | null>(null);
  const courseId = Number(id);

  const fetchCourseData = async () => {
    try {
      const catalog = await getCatalog();
      const currentCourse = (catalog || []).find((c: Cours) => Number(c.id_cours) === courseId);
      setCourse(currentCourse || null);
    } catch (err) {
      console.error(err);
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
      const completedIds = await getCourseCompletions(courseId);
      setCompletedResourceIds(Array.isArray(completedIds) ? completedIds.map(Number) : []);
    } catch {
      setCompletedResourceIds([]);
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
        y: 18,
        opacity: 0,
        duration: 0.6,
        stagger: 0.065,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      if (auraRef.current) {
        gsap.to(auraRef.current, {
          scale: 1.12,
          opacity: 0.7,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    }, pageRef);
    return () => ctx.revert();
  }, [loading, activeSection]);

  const completedResourceSet = useMemo(
    () => new Set(completedResourceIds),
    [completedResourceIds]
  );

  const handleToggleResourceCompleted = async (resourceId: number, resourceName?: string) => {
    if (togglingResourceId === resourceId) return;

    const previousIds = completedResourceIds;
    const wasCompleted = previousIds.includes(resourceId);
    const nextTermine = !wasCompleted;
    const optimisticIds = wasCompleted
      ? previousIds.filter((itemId) => itemId !== resourceId)
      : [...previousIds, resourceId];

    setCompletedResourceIds(optimisticIds);
    setTogglingResourceId(resourceId);

    try {
      const updated = await toggleResourceCompletion(resourceId, nextTermine);
      if (Array.isArray(updated?.completed_resource_ids)) {
        setCompletedResourceIds(updated.completed_resource_ids.map(Number));
      }
      if (nextTermine) {
        success(
          resourceName ? `« ${resourceName} » marqué comme terminé.` : 'Support marqué comme terminé.',
          'Progression enregistrée'
        );
      }
    } catch (err) {
      console.error(err);
      setCompletedResourceIds(previousIds);
      showError("Impossible d'enregistrer la progression du support.");
    } finally {
      setTogglingResourceId(null);
    }
  };

  const completedLessonsCount = useMemo(
    () => resources.filter((res) => completedResourceSet.has(res.id_ressource)).length,
    [resources, completedResourceSet]
  );

  const lessonCompletionPercentage = useMemo(() => {
    if (resources.length === 0) return 0;
    return Math.round((completedLessonsCount / resources.length) * 100);
  }, [completedLessonsCount, resources.length]);

  const handleOpenEvaluationAction = async (ev: Evaluation) => {
    if ((ev as { type_evaluation?: string }).type_evaluation === 'quiz') {
      setLoadingQuiz(true);
      try {
        const qs = await getEvaluationQuiz(ev.id_evaluation);
        if (!qs || qs.length === 0) {
          warning("Ce quiz n'a pas encore de questions disponibles.");
          return;
        }
        setActiveQuizQuestions(qs);
        setActiveQuizEval(ev);
      } catch (err) {
        console.error(err);
        showError('Impossible de charger ce quiz pour le moment.');
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
        title: sortedModules.length > 0 ? 'Supports complémentaires' : 'Supports du cours',
        description:
          sortedModules.length > 0 ? 'Ressources non rattachées à un chapitre' : undefined,
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
        if (!response.ok) throw new Error('Unable to load text file');
        const text = await response.text();
        setTextContents((prev) => ({ ...prev, [res.id_ressource]: text }));
      } catch (err) {
        console.error(err);
        setTextContents((prev) => ({
          ...prev,
          [res.id_ressource]: "*Aperçu indisponible en direct — utilise le bouton Télécharger.*",
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

      success('Travail bien reçu.', 'Évaluation soumise');
      setSelectedEval(null);
      setSubmissionFile(null);
      fetchCourseData();
    } catch (err) {
      console.error(err);
      showError("L'envoi du rendu a échoué. Réessaie dans un instant.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-44 w-full rounded-3xl" />
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
        <div className="surface-card rounded-3xl p-8 space-y-4 border border-[var(--border-subtle)]">
          <p className="text-[var(--danger-text)] font-semibold text-base">
            Ce cours est introuvable ou indisponible.
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 btn-accent text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
          >
            <BackTrailGlyph className="w-4 h-4" />
            <span>Revenir en arrière</span>
          </button>
        </div>
      </div>
    );
  }

  const displayTitle = course?.titre || `Cours #${courseId}`;
  const displayDescription =
    course?.description ||
    'Explore les chapitres, consulte les supports, passe les quiz et échange avec la promotion.';
  const displayCategoryId = course?.id_categorie ?? '—';

  return (
    <div
      ref={pageRef}
      className="relative z-10 space-y-6 max-w-6xl mx-auto pb-16 px-4 sm:px-6 pt-6"
    >
      <CrawlingPythonBg />

      <div
        ref={auraRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-[780px] h-[280px] rounded-full bg-[var(--accent)]/15 blur-3xl -z-10"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-[var(--bg-subtle)]/80 hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-xs sm:text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
        >
          <BackTrailGlyph className="w-4 h-4 text-[var(--accent-text)]" />
          <span>Retour</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
          <CompassRingGlyph className="w-3.5 h-3.5 text-[var(--accent-text)]" />
          <span>Section active :</span>
          <strong className="text-[var(--text-primary)]">
            {activeSection === 'contenu'
              ? 'Chapitres & Butin'
              : activeSection === 'evaluations'
                ? 'Défis & Quiz'
                : 'Le Salon'}
          </strong>
        </div>
      </div>

      <CourseHeroHeader
        title={displayTitle}
        description={displayDescription}
        categoryId={displayCategoryId}
        modulesCount={modules.length}
        resourcesCount={resources.length}
        evaluationsCount={evaluations.length}
        completedLessonsCount={completedLessonsCount}
        lessonCompletionPercentage={lessonCompletionPercentage}
        completedEvaluationsCount={completedEvaluationsCount}
        courseProgressPercentage={courseProgressPercentage}
      />

      <CourseSectionTabs
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        resourcesCount={resources.length}
        completedLessonsCount={completedLessonsCount}
        evaluationsCount={evaluations.length}
        forumThreadsCount={forumThreadsCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div className="lg:col-span-8 min-w-0 space-y-6">
          {activeSection === 'contenu' && (
            <CourseChaptersSection
              chapterSections={chapterSections}
              collapsedChapters={collapsedChapters}
              onToggleChapterCollapse={toggleChapterCollapse}
              onJumpToChapter={jumpToChapter}
              expandedResId={expandedResId}
              onToggleResource={handleToggleResource}
              textContents={textContents}
              loadingTextId={loadingTextId}
              completedResourceSet={completedResourceSet}
              togglingResourceId={togglingResourceId}
              onToggleResourceCompleted={handleToggleResourceCompleted}
            />
          )}

          {activeSection === 'evaluations' && (
            <CourseEvaluationsSection
              evaluations={evaluations}
              mySubmissions={mySubmissions}
              loadingQuiz={loadingQuiz}
              onOpenEvaluationAction={handleOpenEvaluationAction}
            />
          )}

          {activeSection === 'forum' && (
            <section className="gsap-cd-anim surface-card rounded-3xl p-6 sm:p-7 border border-[var(--border-subtle)]">
              <ForumSection
                courseId={courseId}
                currentUserId={sessionUser.id_user}
                currentUserRole={sessionUser.role}
              />
            </section>
          )}
        </div>

        <CourseCompanionRail
          chapterSections={chapterSections}
          completedResourceSet={completedResourceSet}
          completedLessonsCount={completedLessonsCount}
          resourcesCount={resources.length}
          lessonCompletionPercentage={lessonCompletionPercentage}
          forumThreadsCount={forumThreadsCount}
          onJumpToChapter={jumpToChapter}
          onSelectSection={setActiveSection}
        />
      </div>

      <SubmissionModal
        evaluation={selectedEval}
        submissionFile={submissionFile}
        uploading={uploading}
        onFileChange={setSubmissionFile}
        onClose={() => {
          setSelectedEval(null);
          setSubmissionFile(null);
        }}
        onSubmit={handleSubmitWork}
      />

      <QuizModalWrapper
        activeQuizEval={activeQuizEval}
        questions={activeQuizQuestions}
        onClose={() => setActiveQuizEval(null)}
        onCompleted={fetchCourseData}
      />
    </div>
  );
}
