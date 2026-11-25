// File: src/utils/gradebookExport.ts
import * as XLSX from 'xlsx';
import type { Cours, Evaluation } from '../types';

export interface GradebookStudentRow {
  id_user?: string | number;
  nom?: string;
  prenom?: string;
  email?: string;
  progression_pourcentage?: number;
  date_inscription?: string;
}

export interface GradebookSubmissionItem {
  id_evaluation: number;
  id_etudiant: string | number;
  note: number | null;
  date_soumission?: string;
}

interface BuildExportParams {
  course: Cours;
  students: GradebookStudentRow[];
  evaluations: Evaluation[];
  submissions: GradebookSubmissionItem[];
}

function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function buildRows({ course, students, evaluations, submissions }: BuildExportParams) {
  const subIndex = new Map<string, GradebookSubmissionItem>();
  submissions.forEach((s) => {
    subIndex.set(`${s.id_etudiant}::${s.id_evaluation}`, s);
  });

  const sortedEvals = [...evaluations].sort((a, b) => a.id_evaluation - b.id_evaluation);

  return students.map((student) => {
    const studentId = String(student.id_user ?? '');
    let totalEarned = 0;
    let totalMax = 0;
    let submittedCount = 0;

    const evalColumns: Record<string, string | number> = {};

    sortedEvals.forEach((ev) => {
      const sub = subIndex.get(`${studentId}::${ev.id_evaluation}`);
      const isQuiz = (ev as any).type_evaluation === 'quiz';
      const colLabel = `${ev.titre} (${isQuiz ? 'Quiz' : 'Devoir'} /${ev.bareme})`;

      if (!sub) {
        evalColumns[colLabel] = 'Non rendu';
      } else {
        submittedCount += 1;
        if (sub.note === null || sub.note === undefined) {
          evalColumns[colLabel] = 'En attente';
        } else {
          evalColumns[colLabel] = Number(sub.note);
          totalEarned += Number(sub.note);
          totalMax += Number(ev.bareme || 0);
        }
      }
    });

    const avgOn20 =
      totalMax > 0 ? Number(((totalEarned / totalMax) * 20).toFixed(2)) : '';

    return {
      'Cours': course.titre,
      'Nom': student.nom || '',
      'Prénom': student.prenom || '',
      'Email': student.email || '',
      'Progression (%)': Number(student.progression_pourcentage ?? 0),
      'Évaluations remises': `${submittedCount}/${sortedEvals.length}`,
      'Moyenne (/20)': avgOn20,
      ...evalColumns,
    };
  });
}

export function exportGradebookToCSV(params: BuildExportParams) {
  const rows = buildRows(params);
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const escapeCell = (val: unknown) => {
    const str = val === null || val === undefined ? '' : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  // UTF-8 BOM (\uFEFF) ensures French accents open cleanly in Excel
  const csvContent =
    '\uFEFF' +
    [
      headers.map(escapeCell).join(';'),
      ...rows.map((row) => headers.map((h) => escapeCell((row as any)[h])).join(';')),
    ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `notes_${sanitizeFilename(params.course.titre)}_${dateStamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportGradebookToExcel(params: BuildExportParams) {
  const rows = buildRows(params);
  if (rows.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const headers = Object.keys(rows[0]);

  worksheet['!cols'] = headers.map((header) => {
    const maxLen = Math.max(
      header.length,
      ...rows.map((r) => String((r as any)[header] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 3, 14), 38) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relevé de notes');

  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `notes_${sanitizeFilename(params.course.titre)}_${dateStamp}.xlsx`);
}
