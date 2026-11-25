// File: src/pages/student/StudentGrades.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudentGrades } from '../../api/services';
import {
  Award,
  FileText,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

interface GradeRecord {
  id_soumission: number;
  id_evaluation: number;
  eval_titre: string;
  cours_titre: string;
  bareme: number;
  note: number | null;
  commentaires: string;
  date_soumission: string;
}

export default function StudentGrades() {
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const data = await getStudentGrades();
        setGrades(data || []);
      } catch (err) {
        console.error('Erreur lors de la récupération des notes :', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-14 text-sm text-[var(--text-muted)]">
        Chargement de votre relevé de notes...
      </div>
    );
  }

  const gradedItems = grades.filter((g) => g.note !== null);
  const averageScore =
    gradedItems.length > 0
      ? (gradedItems.reduce((acc, curr) => acc + (curr.note || 0), 0) / gradedItems.length).toFixed(2)
      : 'N/A';

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-14 px-4 sm:px-6 pt-6">
      <div>
        <Link
          to="/student/dashboard"
          className="inline-flex items-center space-x-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au tableau de bord</span>
        </Link>
      </div>

      <header className="surface-card rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <span className="inline-flex items-center space-x-1.5 text-xs font-medium text-[var(--accent-text)] bg-[var(--accent-soft)] border border-[var(--accent-border)] px-2.5 py-0.5 rounded-full">
            <Award className="w-3.5 h-3.5" />
            <span>Suivi académique</span>
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl text-[var(--text-primary)]">
            Mes notes & historique
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Retrouvez vos travaux soumis, notes obtenues et retours de vos enseignants.
          </p>
        </div>

        <div className="surface-subtle rounded-xl p-4 flex items-center space-x-3.5 shrink-0">
          <div className="p-2.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] text-[var(--text-muted)]">Moyenne générale</span>
            <span className="text-xl font-semibold text-[var(--text-primary)]">
              {averageScore}{' '}
              <span className="text-xs font-normal text-[var(--text-muted)]">/ 20</span>
            </span>
          </div>
        </div>
      </header>

      <section className="surface-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[var(--accent-text)]" />
            <span>Évaluations soumises ({grades.length})</span>
          </h2>
        </div>

        {grades.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <AlertCircle className="w-7 h-7 text-[var(--text-muted)] mx-auto" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Aucun travail soumis pour le moment.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Vos notes apparaîtront ici dès qu'un devoir sera corrigé.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {grades.map((item) => (
              <div
                key={item.id_soumission}
                className="p-4 rounded-xl bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)] px-2.5 py-0.5 rounded-full">
                      {item.cours_titre}
                    </span>
                    <span className="text-[var(--text-muted)] flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Soumis le {new Date(item.date_soumission).toLocaleDateString('fr-FR')}
                      </span>
                    </span>
                  </div>

                  <h3 className="font-semibold text-[var(--text-primary)] text-base">
                    {item.eval_titre}
                  </h3>

                  {item.commentaires ? (
                    <div className="flex items-start space-x-2 bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                      <MessageSquare className="w-3.5 h-3.5 text-[var(--accent-text)] mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium text-[var(--text-primary)] block mb-0.5">
                          Commentaire de l'enseignant
                        </span>
                        <span>{item.commentaires}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] italic">
                      Aucun commentaire pour l'instant.
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-3 bg-[var(--bg-surface)] px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] shrink-0 self-end md:self-center">
                  <div className="text-right">
                    <span className="block text-[11px] text-[var(--text-muted)]">Note</span>
                    <span className="text-lg font-semibold text-[var(--text-primary)]">
                      {item.note !== null ? item.note : '—'}{' '}
                      <span className="text-xs font-normal text-[var(--text-muted)]">
                        / {item.bareme}
                      </span>
                    </span>
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      item.note !== null
                        ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]'
                        : 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]'
                    }`}
                  >
                    {item.note !== null ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
