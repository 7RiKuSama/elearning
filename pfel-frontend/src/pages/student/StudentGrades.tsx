// File: src/pages/student/StudentGrades.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudentGrades } from '../../api/services';
import { 
  Award, 
  BookOpen, 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  AlertCircle 
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
    return <div className="text-center mt-12 text-gray-500 font-medium">Chargement de votre relevé de notes...</div>;
  }

  // Calcul d'une moyenne simple si des notes existent
  const gradedItems = grades.filter((g) => g.note !== null);
  const averageScore = gradedItems.length > 0 
    ? (gradedItems.reduce((acc, curr) => acc + (curr.note || 0), 0) / gradedItems.length).toFixed(2)
    : 'N/A';

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Bouton de retour */}
      <div>
        <Link 
          to="/student/dashboard" 
          className="inline-flex items-center space-x-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à mon tableau de bord</span>
        </Link>
      </div>

      {/* En-tête de la page */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center space-x-2 text-violet-200 text-sm font-semibold mb-2">
            <Award className="w-4 h-4" />
            <span>Suivi académique</span>
          </div>
          <h1 className="text-3xl font-extrabold mb-1">Mes Notes & Historique</h1>
          <p className="text-violet-100 text-sm">
            Retrouvez l'ensemble de vos travaux soumis, vos notes obtenues et les retours de vos enseignants.
          </p>
        </div>

        {/* Carte de résumé rapide */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex items-center space-x-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="block text-xs text-violet-200 uppercase tracking-wider font-bold">Moyenne générale</span>
            <span className="text-2xl font-extrabold">{averageScore} <span className="text-sm font-normal text-violet-200">/ 20</span></span>
          </div>
        </div>
      </div>

      {/* Liste des notes / soumissions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Détail des évaluations soumises ({grades.length})</span>
          </h2>
        </div>

        {grades.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-gray-600 font-medium">Aucun travail soumis pour le moment.</p>
            <p className="text-xs text-gray-400">Vos notes apparaîtront ici dès que vous aurez complété des devoirs.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grades.map((item) => (
              <div 
                key={item.id_soumission} 
                className="p-5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                      {item.cours_titre}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Soumis le {new Date(item.date_soumission).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg">{item.eval_titre}</h3>

                  {/* Commentaire de l'enseignant */}
                  {item.commentaires ? (
                    <div className="flex items-start space-x-2 bg-white p-3 rounded-lg border border-gray-200 text-sm text-gray-700 mt-2">
                      <MessageSquare className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-xs text-gray-900 block mb-0.5">Commentaire de l'enseignant :</span>
                        <span>{item.commentaires}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Aucun commentaire pour l'instant.</p>
                  )}
                </div>

                {/* Bloc Note */}
                <div className="flex items-center space-x-3 bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm shrink-0 self-end md:self-center">
                  <div className="text-right">
                    <span className="block text-xs text-gray-400 uppercase font-bold tracking-wider">Note</span>
                    <span className="text-xl font-extrabold text-gray-900">
                      {item.note !== null ? item.note : '—'} 
                      <span className="text-sm font-normal text-gray-500"> / {item.bareme}</span>
                    </span>
                  </div>
                  <div className={`p-2 rounded-lg ${item.note !== null ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {item.note !== null ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
