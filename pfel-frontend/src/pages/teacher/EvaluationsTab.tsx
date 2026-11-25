// File: src/pages/teacher/EvaluationsTab.tsx
import React, { useMemo, useState } from 'react';
import {
  getCourseEvaluations,
  getEvaluationSubmissions,
  gradeSubmission,
  getCourseStudents,
} from '../../api/services';
import type { Cours, Evaluation, Soumission } from '../../types';
import type { TeacherCourseStats } from './teacherDashboard.types';
import { resolveSafeUrl } from '../../utils/url';
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  Send,
} from 'lucide-react';

interface EvaluationsTabProps {
  courses: Cours[];
  courseStats: Record<number, TeacherCourseStats>;
  onGraded: () => void;
}

type SubmissionFilter = 'all' | 'pending' | 'graded';

export default function EvaluationsTab({ courses, courseStats, onGraded }: EvaluationsTabProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedEvalId, setSelectedEvalId] = useState<string>('');
  const [evaluationsList, setEvaluationsList] = useState<Evaluation[]>([]);
  const [submissionsList, setSubmissionsList] = useState<Soumission[]>([]);
  const [activeSubId, setActiveSubId] = useState<number | null>(null);
  const [filter, setFilter] = useState<SubmissionFilter>('all');

  const [courseStudentsMap, setCourseStudentsMap] = useState<
    Record<string, { nom: string; prenom: string; email: string }>
  >({});

  const [loadingEvals, setLoadingEvals] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [savingGrade, setSavingGrade] = useState(false);

  const [gradeValue, setGradeValue] = useState<number>(0);
  const [gradeComment, setGradeComment] = useState('');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedEvaluation = useMemo(
    () => evaluationsList.find((ev) => String(ev.id_evaluation) === selectedEvalId) ?? null,
    [evaluationsList, selectedEvalId]
  );

  const filteredSubmissions = useMemo(() => {
    return submissionsList.filter((sub) => {
      const isGraded = sub.note_obtenue !== null && sub.note_obtenue !== undefined;
      if (filter === 'pending') return !isGraded;
      if (filter === 'graded') return isGraded;
      return true;
    });
  }, [submissionsList, filter]);

  const activeSubmission = useMemo(
    () => submissionsList.find((s) => s.id_soumission === activeSubId) ?? null,
    [submissionsList, activeSubId]
  );

  const selectSubmissionForGrading = (sub: Soumission) => {
    setActiveSubId(sub.id_soumission);
    setGradeValue(sub.note_obtenue ?? 0);
    setGradeComment(sub.commentaire_professeur || '');
    setBanner(null);
  };

  const handleCourseChange = async (courseIdStr: string) => {
    setSelectedCourseId(courseIdStr);
    setSelectedEvalId('');
    setEvaluationsList([]);
    setSubmissionsList([]);
    setActiveSubId(null);
    setBanner(null);

    const courseId = Number(courseIdStr);
    if (!courseId) return;

    setLoadingEvals(true);
    try {
      const [evals, students] = await Promise.all([
        getCourseEvaluations(courseId).catch(() => []),
        getCourseStudents(courseId).catch(() => []),
      ]);
      setEvaluationsList(evals || []);

      const stdMap: Record<string, { nom: string; prenom: string; email: string }> = {};
      (students || []).forEach((st: any) => {
        if (st.id_user) {
          stdMap[st.id_user] = { nom: st.nom, prenom: st.prenom, email: st.email };
        }
      });
      setCourseStudentsMap(stdMap);
    } catch (err) {
      console.error(err);
      setBanner({ type: 'error', text: 'Impossible de charger les évaluations.' });
    } finally {
      setLoadingEvals(false);
    }
  };

  const handleEvaluationChange = async (evalIdStr: string) => {
    setSelectedEvalId(evalIdStr);
    setSubmissionsList([]);
    setActiveSubId(null);
    setBanner(null);

    const evalId = Number(evalIdStr);
    if (!evalId) return;

    setLoadingSubs(true);
    try {
      const subs = await getEvaluationSubmissions(evalId);
      const list = subs || [];
      setSubmissionsList(list);
      if (list.length > 0) {
        selectSubmissionForGrading(list[0]);
      }
    } catch (err) {
      console.error(err);
      setBanner({ type: 'error', text: 'Impossible de charger les copies.' });
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission || !selectedEvaluation) return;

    if (gradeValue < 0 || gradeValue > selectedEvaluation.bareme) {
      setBanner({
        type: 'error',
        text: `La note doit être comprise entre 0 et ${selectedEvaluation.bareme}.`,
      });
      return;
    }

    setSavingGrade(true);
    setBanner(null);
    try {
      await gradeSubmission(activeSubmission.id_soumission, gradeValue, gradeComment.trim());
      const subs = await getEvaluationSubmissions(selectedEvaluation.id_evaluation);
      const refreshed = subs || [];
      setSubmissionsList(refreshed);
      setBanner({ type: 'success', text: 'Correction enregistrée.' });
      onGraded();
    } catch (err) {
      console.error(err);
      setBanner({ type: 'error', text: "Erreur lors de l'enregistrement de la note." });
    } finally {
      setSavingGrade(false);
    }
  };

  const gradedTotal = submissionsList.filter(
    (s) => s.note_obtenue !== null && s.note_obtenue !== undefined
  ).length;
  const pendingTotal = submissionsList.length - gradedTotal;

  const controlClass =
    'w-full px-3.5 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-border)]';

  return (
    <div className="space-y-5">
      {/* Top Scope Bar */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label
              htmlFor="eval-course-select"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Cours
            </label>
            <select
              id="eval-course-select"
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className={controlClass}
            >
              <option value="">Sélectionner un cours…</option>
              {courses.map((c) => {
                const count = courseStats[c.id_cours]?.evalCount ?? 0;
                return (
                  <option key={c.id_cours} value={c.id_cours}>
                    {c.titre} ({count} éval.)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="md:col-span-5">
            <label
              htmlFor="eval-item-select"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Évaluation
            </label>
            <select
              id="eval-item-select"
              value={selectedEvalId}
              disabled={!selectedCourseId || loadingEvals}
              onChange={(e) => handleEvaluationChange(e.target.value)}
              className={`${controlClass} disabled:opacity-50`}
            >
              <option value="">
                {loadingEvals
                  ? 'Chargement des évaluations…'
                  : !selectedCourseId
                  ? 'Choisissez d’abord un cours'
                  : evaluationsList.length === 0
                  ? 'Aucune évaluation disponible'
                  : 'Sélectionner une évaluation…'}
              </option>
              {evaluationsList.map((ev) => (
                <option key={ev.id_evaluation} value={ev.id_evaluation}>
                  {ev.titre} — /{ev.bareme} pts
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2 pt-1">
            {selectedEvaluation ? (
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)]">Corrigées</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                  {gradedTotal} / {submissionsList.length}
                </p>
              </div>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">—</span>
            )}
          </div>
        </div>
      </div>

      {banner && (
        <div
          className={`px-4 py-3 rounded-xl border text-sm flex items-center justify-between ${
            banner.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-[var(--danger-bg)] border-[var(--danger-text)]/30 text-[var(--danger-text)]'
          }`}
        >
          <span>{banner.text}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-xs opacity-75 hover:opacity-100 ml-4 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Two-Pane Grading Workspace */}
      {!selectedEvaluation ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl py-16 px-6 text-center space-y-2">
          <Inbox className="w-6 h-6 text-[var(--text-muted)] mx-auto opacity-70" />
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Aucune évaluation sélectionnée
          </p>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Choisissez un cours puis une évaluation dans la barre supérieure pour ouvrir la file de
            correction.
          </p>
        </div>
      ) : loadingSubs ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl py-16 text-center text-sm text-[var(--text-muted)]">
          Chargement des soumissions…
        </div>
      ) : submissionsList.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl py-16 px-6 text-center space-y-1.5">
          <p className="text-sm font-medium text-[var(--text-primary)]">Aucune copie rendue</p>
          <p className="text-xs text-[var(--text-muted)]">
            Aucun étudiant n’a soumis de travail pour « {selectedEvaluation.titre} ».
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Submission Queue */}
          <aside className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-[var(--border-subtle)] flex items-center gap-1.5">
              {(
                [
                  { id: 'all', label: `Toutes (${submissionsList.length})` },
                  { id: 'pending', label: `À corriger (${pendingTotal})` },
                  { id: 'graded', label: `Notées (${gradedTotal})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    filter === tab.id
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="divide-y divide-[var(--border-subtle)] max-h-[540px] overflow-y-auto">
              {filteredSubmissions.length === 0 ? (
                <p className="p-8 text-center text-xs text-[var(--text-muted)]">
                  Aucune copie dans cette catégorie.
                </p>
              ) : (
                filteredSubmissions.map((sub) => {
                  const st = courseStudentsMap[sub.id_etudiant];
                  const isGraded = sub.note_obtenue !== null && sub.note_obtenue !== undefined;
                  const isCurrent = sub.id_soumission === activeSubId;
                  const fullName = st ? `${st.prenom} ${st.nom}` : `Étudiant (${sub.id_etudiant.slice(0, 6)})`;

                  return (
                    <button
                      key={sub.id_soumission}
                      type="button"
                      onClick={() => selectSubmissionForGrading(sub)}
                      className={`w-full text-left px-4 py-3.5 transition flex items-center justify-between gap-3 cursor-pointer ${
                        isCurrent
                          ? 'bg-[var(--accent-soft)]/50 border-l-2 border-l-[var(--accent)]'
                          : 'hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {fullName}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          Rendu le {new Date(sub.date_envoi).toLocaleDateString('fr-FR')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 tabular-nums">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {sub.note_obtenue}/{selectedEvaluation.bareme}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                            <Clock className="w-3.5 h-3.5" />
                            En attente
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right: Active Copy & Grading Form */}
          <section className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 sm:p-6">
            {!activeSubmission ? (
              <p className="py-12 text-center text-xs text-[var(--text-muted)]">
                Sélectionnez une copie dans la liste pour commencer la correction.
              </p>
            ) : (() => {
              const st = courseStudentsMap[activeSubmission.id_etudiant];
              const safeHref = resolveSafeUrl(activeSubmission.fichier_soumis);
              const ratioPct =
                selectedEvaluation.bareme > 0
                  ? Math.min(100, Math.max(0, (gradeValue / selectedEvaluation.bareme) * 100))
                  : 0;

              return (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        {st ? `${st.prenom} ${st.nom}` : 'Étudiant'}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {st?.email || activeSubmission.id_etudiant} · Soumis le{' '}
                        {new Date(activeSubmission.date_envoi).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    {safeHref ? (
                      <a
                        href={safeHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition"
                      >
                        <FileText className="w-4 h-4 text-[var(--accent-text)]" />
                        <span>Consulter la copie</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">Aucun fichier joint</span>
                    )}
                  </div>

                  <form onSubmit={handleSaveGrade} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <div>
                        <label
                          htmlFor="grade-score-input"
                          className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                        >
                          Note attribuée (max {selectedEvaluation.bareme})
                        </label>
                        <input
                          id="grade-score-input"
                          type="number"
                          min={0}
                          max={selectedEvaluation.bareme}
                          step={0.5}
                          value={gradeValue}
                          onChange={(e) => setGradeValue(Number(e.target.value))}
                          className={`${controlClass} font-semibold tabular-nums`}
                        />
                      </div>

                      <div className="sm:pt-5">
                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1.5">
                          <span>Équivalence</span>
                          <span className="tabular-nums font-medium text-[var(--text-secondary)]">
                            {ratioPct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                          <div
                            className="h-full bg-[var(--accent)] transition-all"
                            style={{ width: `${ratioPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="grade-comment-input"
                        className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                      >
                        Appréciation et remarques
                      </label>
                      <textarea
                        id="grade-comment-input"
                        rows={4}
                        value={gradeComment}
                        onChange={(e) => setGradeComment(e.target.value)}
                        placeholder="Ajoutez un retour constructif pour l'étudiant..."
                        className={controlClass}
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={savingGrade}
                        className="btn-accent inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{savingGrade ? 'Enregistrement…' : 'Enregistrer la note'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              );
            })()}
          </section>
        </div>
      )}
    </div>
  );
}
