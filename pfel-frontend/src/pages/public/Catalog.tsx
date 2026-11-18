// File: src/pages/public/Catalog.tsx
import React, { useEffect, useState } from 'react';
import { getCatalog, getCategories, getMyEnrollments, enrollCourse } from '../../api/services';
import type { Cours, Categorie, Inscription } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, PlusCircle, CheckCircle, LogIn, UserPlus, ChevronDown, Folder, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Catalog() {
  const [courses, setCourses] = useState<Cours[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { token, role } = useAuth();

  const [openCategories, setOpenCategories] = useState<Record<number, boolean>>({});

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

      if (token && role === 'etudiant') {
        const enrollments = await getMyEnrollments();
        const ids = new Set((enrollments || []).map((e: Inscription) => e.id_cours));
        setEnrolledIds(ids);
      }
    } catch (err) {
      console.error(err);
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
    try {
      await enrollCourse(id);
      setEnrolledIds((prev) => new Set(prev).add(id));
      alert('Inscription réussie ! Le cours apparaît désormais comme inscrit.');
    } catch (err) {
      alert("Erreur lors de l'inscription");
    }
  };

  // Filter courses in real-time based on title or description
  const filteredCourses = courses.filter((course) =>
    course.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="text-center mt-12 text-gray-500 font-medium">Chargement du catalogue...</div>;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">Plateforme PFE-Learn</h1>
        <p className="text-indigo-100 text-lg max-w-2xl mb-6">
          Découvrez et suivez vos cours académiques organisés par catégories.
        </p>
        {!token && (
          <div className="flex space-x-4">
            <Link to="/login" className="bg-white text-indigo-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-50 transition shadow flex items-center space-x-2">
              <LogIn className="w-4 h-4" />
              <span>Se connecter</span>
            </Link>
            <Link to="/register" className="bg-indigo-700 text-white border border-indigo-400 px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-800 transition shadow flex items-center space-x-2">
              <UserPlus className="w-4 h-4" />
              <span>Créer un compte</span>
            </Link>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Search Bar Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Catalogue par Catégories</h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un cours..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm shadow-sm"
            />
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center shadow-sm max-w-xl mx-auto mt-12">
            <BookOpen className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">Aucune catégorie disponible</h3>
            <p className="text-gray-500 text-sm mb-6">
              Connectez-vous en tant qu'enseignant pour créer des catégories et publier des cours.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((cat) => {
              const catCourses = filteredCourses.filter((c) => c.id_categorie === cat.id_categorie);
              const isOpen = openCategories[cat.id_categorie] ?? true;

              // Optional: Skip rendering empty categories if a search query is active and yields no results for this category
              if (searchQuery && catCourses.length === 0) return null;

              return (
                <div key={cat.id_categorie} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all">
                  {/* Category Header (Clickable Accordion) */}
                  <button
                    onClick={() => toggleCategory(cat.id_categorie)}
                    className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{cat.nom}</h3>
                        <p className="text-sm text-gray-600">{cat.description || 'Aucune description'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                        {catCourses.length} cours
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Expandable Course List */}
                  {isOpen && (
                    <div className="p-6 border-t border-gray-100">
                      {catCourses.length === 0 ? (
                        <p className="text-sm text-gray-500 italic py-2">Aucun cours disponible dans cette catégorie pour le moment.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {catCourses.map((course) => {
                            const isEnrolled = enrolledIds.has(course.id_cours);

                            return (
                              <div key={course.id_cours} className="bg-gray-50 border border-gray-200/80 rounded-xl p-5 shadow-sm hover:shadow transition flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2 text-indigo-600">
                                      <BookOpen className="w-4 h-4" />
                                      <span className="text-xs font-bold uppercase tracking-wider">Cours #{course.id_cours}</span>
                                    </div>
                                    {isEnrolled && (
                                      <span className="inline-flex items-center space-x-1 text-xs font-semibold bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        <span>Inscrit</span>
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-lg font-bold text-gray-900 mb-2">{course.titre}</h4>
                                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{course.description}</p>
                                </div>
                                {token && role === 'etudiant' && (
                                  <div>
                                    {isEnrolled ? (
                                      <div className="w-full mt-2 flex items-center justify-center space-x-2 bg-green-50 text-green-700 py-2 rounded-lg font-medium text-sm border border-green-200 cursor-default">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Déjà inscrit</span>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleEnroll(course.id_cours)}
                                        className="w-full mt-2 flex items-center justify-center space-x-2 bg-indigo-600 text-white hover:bg-indigo-700 py-2 rounded-lg font-medium transition-colors cursor-pointer text-sm shadow-sm"
                                      >
                                        <PlusCircle className="w-4 h-4" />
                                        <span>S'inscrire au cours</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
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
    </div>
  );
}
