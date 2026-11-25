// File: src/pages/teacher/ClassTrackingTab.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Mail,
  Search,
  Users,
} from 'lucide-react';
import {
  getCourseEvaluations,
  getCourseStudents,
  getEvaluationSubmissions,
} from '../../api/services';
import type { Cours, Evaluation } from '../../types';
import {
  exportGradebookToCSV,
  exportGradebookToExcel,
  type GradebookStudentRow,
  type GradebookSubmissionItem,
} from '../../utils/gradebookExport';

interface ClassTrackingTabProps {
  courses: Cours[];
}

export default function ClassTrackingTab({ courses }: ClassTrackingTabProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>(
    courses[0]?.id_cours ?? ''
  );
  const [students, setStudents] = useState<GradebookStudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id_cours);
    }
  }, [courses, selectedCourseId]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id_cours === Number(selectedCourseId)) ?? null,
    [courses, selectedCourseId]
  );

  useEffect(() => {
    if (!selectedCourseId) {
      setStudents([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getCourseStudents(Number(selectedCourseId))
      .then((data: any) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.students ?? [];
        setStudents(list);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Erreur lors du chargement des étudiants:', err);
        setStudents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCourseId]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((st) => {
      const fullName = `${st.prenom ?? ''} ${st.nom ?? ''}`.toLowerCase();
      const email = (st.email ?? '').toLowerCase();
      return fullName.includes(q) || email.includes(q);
    });
  }, [students, searchQuery]);

  const averageProgress = useMemo(() => {
    if (students.length === 0) return 0;
    const sum = students.reduce(
      (acc, st) => acc + Number(st.progression_pourcentage ?? 0),
      0
    );
    return Math.round(sum / students.length);
  }, [students]);

  const completedCount = useMemo(
    () =>
      students.filter((st) => Number(st.progression_pourcentage ?? 0) >= 100)
        .length,
    [students]
  );

  const handleExportGradebook = async (format: 'csv' | 'xlsx') => {
    if (!selectedCourse || students.length === 0) return;
    setExporting(true);
    try {
      const evalsData = await getCourseEvaluations(selectedCourse.id_cours).catch(
        () => []
      );
      const evals: Evaluation[] = Array.isArray(evalsData) ? evalsData : [];

      const allSubsNested = await Promise.all(
        evals.map((ev) =>
          getEvaluationSubmissions(ev.id_evaluation)
            .then((res: any) => (Array.isArray(res) ? res : []))
            .catch(() => [])
        )
      );
      const submissions: GradebookSubmissionItem[] = allSubsNested.flat();

      const payload = {
        course: selectedCourse,
        students,
        evaluations: evals,
        submissions,
      };

      if (format === 'csv') {
        exportGradebookToCSV(payload);
      } else {
        exportGradebookToExcel(payload);
      }
    } catch (err) {
      console.error("Erreur lors de l'export du carnet de notes:", err);
      alert("Impossible d'exporter le relevé de notes.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Course Selector + Export Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label
            htmlFor="tracking-course-select"
            className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
          >
            Cours :
          </label>
          <select
            id="tracking-course-select"
            value={selectedCourseId}
            onChange={(e) =>
              setSelectedCourseId(e.target.value ? Number(e.target.value) : '')
            }
            className="px-3.5 py-2 rounded-xl text-sm bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent)]"
          >
            {courses.map((course) => (
              <option key={course.id_cours} value={course.id_cours}>
                {course.titre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={exporting || students.length === 0}
            onClick={() => handleExportGradebook('csv')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] disabled:opacity-50 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Export...' : 'Exporter CSV'}</span>
          </button>

          <button
            type="button"
            disabled={exporting || students.length === 0}
            onClick={() => handleExportGradebook('xlsx')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium btn-accent disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{exporting ? 'Export...' : 'Exporter Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Étudiants inscrits</span>
            <Users className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {students.length}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Progression moyenne</span>
            <span className="font-mono text-[var(--accent-text)]">AVG</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {averageProgress}%
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Cours terminés (100%)</span>
            <CheckCircle2 className="w-4 h-4 text-[var(--success-text)]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {completedCount}
          </p>
        </div>
      </div>

      {/* Search & Student Table */}
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Progression des étudiants
            {selectedCourse ? ` — ${selectedCourse.titre}` : ''}
          </h3>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un étudiant..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-[var(--bg-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">
            Chargement des étudiants...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">
            Aucun étudiant trouvé pour ce cours.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
                  <th className="py-3 px-4">Étudiant</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Progression</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                {filteredStudents.map((st, idx) => {
                  const pct = Math.min(
                    100,
                    Math.max(0, Number(st.progression_pourcentage ?? 0))
                  );
                  const displayName =
                    `${st.prenom ?? ''} ${st.nom ?? ''}`.trim() ||
                    `Étudiant #${st.id_user ?? idx + 1}`;

                  return (
                    <tr
                      key={String(st.id_user ?? st.email ?? idx)}
                      className="hover:bg-[var(--bg-hover)] transition"
                    >
                      <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                        {displayName}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          {st.email || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 min-w-[160px]">
                          <div className="flex-1 h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--accent)] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)] w-10 text-right">
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
