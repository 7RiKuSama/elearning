// File: src/pages/teacher/Dashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  getCatalog,
  getCategories,
  getCourseResources,
  getCourseEvaluations,
  getCourseStudents,
  getProfile,
  getEvaluationQuiz,
  saveEvaluationQuiz,
} from '../../api/services';
import type { Categorie, Cours, Evaluation, Utilisateur } from '../../types';
import type { TeacherCourseStats } from './teacherDashboard.types';
import { useToast } from '../../context/ToastContext';
import { CrawlingPythonBg } from '../../components/ui/CrawlingPythonBg';
import { Skeleton } from '../../components/ui/Skeleton';
import CoursesTab from './CoursesTab';
import EvaluationsTab from './EvaluationsTab';
import ClassTrackingTab from './ClassTrackingTab';
import CourseFormModal from '../components/CourseFormModal';
import CategoryModal from '../components/CategoryModal';
import ModuleManagerModal from '../components/ModuleManagerModal';
import ResourceUploadModal from '../components/ResourceUploadModal';
import EvaluationCreateModal from '../components/EvaluationCreateModal';
import QuizBuilderModal, { type DraftQuizQuestion } from '../components/QuizBuilderModal';
import {
  BookOpen,
  PlusCircle,
  CheckSquare,
  Users,
  Layers,
  FileText,
} from 'lucide-react';

function resolveEvalId(raw: any): number | null {
  const val =
    raw?.id_evaluation ??
    raw?.id ??
    raw?.data?.id_evaluation ??
    raw?.data?.id ??
    raw?.evaluation?.id_evaluation ??
    raw?.evaluation?.id;
  const num = Number(val);
  return Number.isFinite(num) && num > 0 ? num : null;
}

const SnakeLoader: React.FC<{ label: string }> = ({ label }) => {
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loaderRef.current) return;

    const ctx = gsap.context(() => {
      const segments = gsap.utils.toArray<HTMLElement>('.gsap-snake-seg');
      segments.forEach((seg, idx) => {
        gsap.to(seg, {
          y: idx % 2 === 0 ? -7 : 7,
          scale: 1.15 - idx * 0.04,
          duration: 0.45,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: idx * 0.06,
        });
      });
    }, loaderRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={loaderRef} className="flex flex-col items-center justify-center gap-3 py-6">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className={`gsap-snake-seg rounded-full ${
              i === 7
                ? 'w-3.5 h-3.5 bg-[var(--accent)] shadow-sm'
                : 'w-2.5 h-2.5 bg-[var(--accent-soft)] border border-[var(--accent-border)]'
            }`}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-[var(--text-secondary)]">{label}</p>
    </div>
  );
};

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<'cours' | 'evaluations' | 'suivi'>('cours');
  const [courses, setCourses] = useState<Cours[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [currentUser, setCurrentUser] = useState<Utilisateur | null>(null);
  const [courseStats, setCourseStats] = useState<Record<number, TeacherCourseStats>>({});
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useToast();

  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [editCourseData, setEditCourseData] = useState<Cours | null>(null);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [selectedCourseForModules, setSelectedCourseForModules] = useState<Cours | null>(null);
  const [selectedCourseForRes, setSelectedCourseForRes] = useState<Cours | null>(null);
  const [selectedCourseForEval, setSelectedCourseForEval] = useState<Cours | null>(null);

  const [quizTargetEval, setQuizTargetEval] = useState<Evaluation | null>(null);
  const [quizInitialQuestions, setQuizInitialQuestions] = useState<DraftQuizQuestion[]>([]);

  const pageRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async () => {
    try {
      const [catData, courseData, profileData] = await Promise.all([
        getCategories().catch(() => []),
        getCatalog().catch(() => []),
        getProfile(),
      ]);

      setCategories(catData || []);
      setCurrentUser(profileData);

      const myCourses = (courseData || []).filter(
        (course) => course.id_enseignant === profileData.id_user
      );
      setCourses(myCourses);

      const statsMap: Record<number, TeacherCourseStats> = {};
      await Promise.all(
        myCourses.map(async (c) => {
          const [resList, evalList, stdList] = await Promise.all([
            getCourseResources(c.id_cours).catch(() => []),
            getCourseEvaluations(c.id_cours).catch(() => []),
            getCourseStudents(c.id_cours).catch(() => []),
          ]);
          const rArr = resList || [];
          const eArr = evalList || [];
          const sArr = stdList || [];

          const avgProg =
            sArr.length > 0
              ? Math.round(
                  sArr.reduce(
                    (acc: number, s: any) => acc + Number(s.progression_pourcentage || 0),
                    0
                  ) / sArr.length
                )
              : 0;

          statsMap[c.id_cours] = {
            resourceCount: rArr.length,
            evalCount: eArr.length,
            studentCount: sArr.length,
            avgProgress: avgProg,
          };
        })
      );
      setCourseStats(statsMap);
    } catch (err) {
      console.error('Erreur de chargement:', err);
      showError("Impossible de charger les données de l'espace enseignant.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (loading || !pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('.gsap-dash-hero', {
        y: 18,
        opacity: 0,
        duration: 0.65,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.gsap-dash-stat', {
        y: 14,
        opacity: 0,
        duration: 0.5,
        stagger: 0.07,
        delay: 0.15,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });
    }, pageRef);

    return () => ctx.revert();
  }, [loading]);

  const openQuizBuilderForEvaluation = async (ev: Evaluation) => {
    try {
      const existing = await getEvaluationQuiz(ev.id_evaluation).catch(() => []);
      const mapped: DraftQuizQuestion[] = (existing || []).map((q) => ({
        id: q.id_question,
        question_type: q.question_type,
        prompt: q.prompt,
        options: q.options || ['Choix 1', 'Choix 2'],
        correct_index: q.correct_index ?? 0,
        points: q.points ?? 2,
        explanation: q.explanation || '',
      }));
      setQuizInitialQuestions(mapped);
    } catch {
      setQuizInitialQuestions([]);
    }
    setQuizTargetEval(ev);
  };

  const handleOpenQuizForCourse = async (course: Cours) => {
    const evals = await getCourseEvaluations(course.id_cours).catch(() => []);
    const quizEval = (evals || []).find((ev: any) => ev.type_evaluation === 'quiz');
    if (quizEval) {
      await openQuizBuilderForEvaluation(quizEval);
      return;
    }
    setSelectedCourseForEval(course);
  };

  const handleEvaluationCreated = async (
    created?: any,
    evalType?: 'file' | 'quiz',
    courseId?: number
  ) => {
    await fetchData();
    const isQuiz = evalType === 'quiz' || created?.type_evaluation === 'quiz';
    if (!isQuiz) return;

    let targetId = resolveEvalId(created);
    const resolvedCourseId = Number(created?.id_cours ?? courseId ?? 0);

    if (!targetId && resolvedCourseId > 0) {
      const evals = await getCourseEvaluations(resolvedCourseId).catch(() => []);
      const list = Array.isArray(evals) ? evals : [];
      const matching =
        [...list].reverse().find((ev: any) => ev?.titre === created?.titre) ||
        [...list].reverse().find((ev: any) => ev?.type_evaluation === 'quiz') ||
        list[list.length - 1];
      targetId = resolveEvalId(matching);
    }

    if (targetId) {
      await openQuizBuilderForEvaluation({
        ...(typeof created === 'object' && created !== null ? created : {}),
        id_evaluation: targetId,
        id_cours: resolvedCourseId,
        titre: created?.titre || 'Quiz',
        bareme: Number(created?.bareme) || 20,
      } as Evaluation);
    }
  };

  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((cat) => map.set(cat.id_categorie, cat.nom));
    return map;
  }, [categories]);

  const globalStats = useMemo(() => {
    let totalStudents = 0;
    let totalResources = 0;
    let totalEvaluations = 0;

    courses.forEach((c) => {
      const st = courseStats[c.id_cours];
      if (st) {
        totalStudents += st.studentCount;
        totalResources += st.resourceCount;
        totalEvaluations += st.evalCount;
      }
    });

    return {
      totalCourses: courses.length,
      publishedCourses: courses.filter((c) => c.est_publie).length,
      draftCourses: courses.filter((c) => !c.est_publie).length,
      totalStudents,
      totalResources,
      totalEvaluations,
    };
  }, [courses, courseStats]);

  if (loading) {
    return (
      <div className="relative z-10 max-w-6xl mx-auto pb-16 px-4 sm:px-6 pt-6 space-y-6">
        <CrawlingPythonBg />
        <div className="surface-card rounded-2xl p-6 sm:p-8 space-y-5">
          <SnakeLoader label="Chargement de l'espace enseignant..." />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((idx) => (
              <Skeleton key={idx} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((idx) => (
            <Skeleton key={idx} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="relative z-10 space-y-8 max-w-6xl mx-auto pb-16 px-4 sm:px-6 pt-6">
      <CrawlingPythonBg />

      <section className="gsap-dash-hero surface-card rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)]">
            Portail enseignant
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl text-[var(--text-primary)]">
            Bonjour{currentUser ? `, Prof. ${currentUser.prenom} ${currentUser.nom}` : ''}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Organisez vos chapitres, rédigez vos notes en Markdown, créez des quiz auto-notés et suivez votre classe.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={() => setShowCreateCourse(true)}
              className="inline-flex items-center space-x-2 btn-accent text-xs sm:text-sm font-medium px-4 py-2 rounded-xl cursor-pointer transition-transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Créer un cours</span>
            </button>
            <button
              onClick={() => setShowCreateCategory(true)}
              className="inline-flex items-center space-x-2 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs sm:text-sm font-medium px-4 py-2 rounded-xl transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nouvelle catégorie</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="gsap-dash-stat surface-subtle rounded-xl p-3.5 text-center space-y-1">
            <BookOpen className="w-4 h-4 text-[var(--accent-text)] mx-auto" />
            <span className="block text-xl font-semibold text-[var(--text-primary)] tabular-nums">
              {globalStats.totalCourses}
            </span>
            <span className="block text-[11px] text-[var(--text-muted)]">Cours</span>
          </div>

          <div className="gsap-dash-stat surface-subtle rounded-xl p-3.5 text-center space-y-1">
            <Users className="w-4 h-4 text-[var(--success-text)] mx-auto" />
            <span className="block text-xl font-semibold text-[var(--text-primary)] tabular-nums">
              {globalStats.totalStudents}
            </span>
            <span className="block text-[11px] text-[var(--text-muted)]">Étudiants</span>
          </div>

          <div className="gsap-dash-stat surface-subtle rounded-xl p-3.5 text-center space-y-1">
            <FileText className="w-4 h-4 text-[var(--text-secondary)] mx-auto" />
            <span className="block text-xl font-semibold text-[var(--text-primary)] tabular-nums">
              {globalStats.totalResources}
            </span>
            <span className="block text-[11px] text-[var(--text-muted)]">Supports</span>
          </div>

          <div className="gsap-dash-stat surface-subtle rounded-xl p-3.5 text-center space-y-1">
            <CheckSquare className="w-4 h-4 text-[var(--accent-text)] mx-auto" />
            <span className="block text-xl font-semibold text-[var(--text-primary)] tabular-nums">
              {globalStats.totalEvaluations}
            </span>
            <span className="block text-[11px] text-[var(--text-muted)]">Évaluations</span>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 border-b border-[var(--border-subtle)] pb-3">
        <button
          onClick={() => setActiveTab('cours')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'cours'
              ? 'btn-accent'
              : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Mes cours ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('evaluations')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'evaluations'
              ? 'btn-accent'
              : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Corrections & notes</span>
        </button>

        <button
          onClick={() => setActiveTab('suivi')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'suivi'
              ? 'btn-accent'
              : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Suivi de classe</span>
        </button>
      </div>

      {activeTab === 'cours' && (
        <CoursesTab
          courses={courses}
          categoryMap={categoryMap}
          courseStats={courseStats}
          globalStats={globalStats}
          onOpenCreateCourse={() => setShowCreateCourse(true)}
          onEditCourse={(course) => setEditCourseData(course)}
          onOpenModules={(course) => setSelectedCourseForModules(course)}
          onOpenResourceUpload={(course) => setSelectedCourseForRes(course)}
          onOpenEvaluationCreate={(course) => setSelectedCourseForEval(course)}
          onOpenQuizForCourse={handleOpenQuizForCourse}
        />
      )}

      {activeTab === 'evaluations' && (
        <EvaluationsTab courses={courses} courseStats={courseStats} onGraded={fetchData} />
      )}

      {activeTab === 'suivi' && <ClassTrackingTab courses={courses} courseStats={courseStats} />}

      {selectedCourseForModules && (
        <ModuleManagerModal
          course={selectedCourseForModules}
          onClose={() => setSelectedCourseForModules(null)}
          onUpdated={fetchData}
        />
      )}

      {showCreateCategory && (
        <CategoryModal onClose={() => setShowCreateCategory(false)} onCreated={fetchData} />
      )}

      {showCreateCourse && (
        <CourseFormModal
          categories={categories}
          onClose={() => setShowCreateCourse(false)}
          onSaved={fetchData}
        />
      )}

      {editCourseData && (
        <CourseFormModal
          categories={categories}
          courseToEdit={editCourseData}
          onClose={() => setEditCourseData(null)}
          onSaved={fetchData}
        />
      )}

      {selectedCourseForRes && (
        <ResourceUploadModal
          course={selectedCourseForRes}
          onClose={() => setSelectedCourseForRes(null)}
          onUploaded={fetchData}
        />
      )}

      {selectedCourseForEval && (
        <EvaluationCreateModal
          course={selectedCourseForEval}
          onClose={() => setSelectedCourseForEval(null)}
          onCreated={handleEvaluationCreated}
        />
      )}

      {quizTargetEval && (
        <QuizBuilderModal
          evaluation={quizTargetEval}
          initialQuestions={quizInitialQuestions}
          onClose={() => setQuizTargetEval(null)}
          onSave={async (questions) => {
            try {
              await saveEvaluationQuiz(quizTargetEval.id_evaluation, questions);
              success('Questions du quiz enregistrées !');
              await fetchData();
            } catch {
              showError("Erreur lors de l'enregistrement des questions du quiz.");
            }
          }}
        />
      )}
    </div>
  );
}
