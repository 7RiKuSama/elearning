// File: src/pages/student/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyEnrollments, getCatalog } from '../../api/services';
import type { Inscription, Cours } from '../../types';
import { BookOpen, Award } from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Inscription[]>([]);
  const [catalog, setCatalog] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyEnrollments(), getCatalog()])
      .then(([userEnrollments, allCourses]) => {
        setEnrollments(userEnrollments || []); // Fallback to empty array if null
        setCatalog(allCourses || []);          // Fallback to empty array if null
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center mt-12 text-gray-500 font-medium">Chargement du tableau de bord...</div>;

  const enrolledCourseIds = new Set(enrollments.map((e) => e.id_cours));
  const myCourses = catalog.filter((c) => enrolledCourseIds.has(c.id_cours));

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord Étudiant</h1>
      <p className="text-gray-600 mb-8">Suivez votre progression et accédez à vos cours inscrits.</p>

      <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
        <BookOpen className="w-5 h-5 text-indigo-600" />
        <span>Mes Cours Inscrits ({myCourses.length})</span>
      </h2>

      {myCourses.length === 0 ? (
        <div className="bg-white p-6 rounded-xl border border-gray-200 text-gray-500 shadow-sm">
          Vous n'êtes inscrit à aucun cours pour le moment. Visitez le catalogue pour vous inscrire !
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myCourses.map((course) => (
            <div 
              key={course.id_cours} 
              onClick={() => navigate(`/cours/${course.id_cours}`)}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm cursor-pointer hover:border-indigo-400 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{course.titre}</h3>
                <p className="text-gray-600 text-sm mb-4">{course.description}</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-indigo-600 font-medium pt-2 border-t border-gray-100">
                <Award className="w-4 h-4" />
                <span>En cours</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
