// File: src/pages/teacher/Dashboard.tsx
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { 
  getCatalog, 
  getCategories, 
  createCourse, 
  updateCourse, 
  uploadResource, 
  getCourseEvaluations, 
  createEvaluation, 
  getEvaluationSubmissions, 
  gradeSubmission, 
  getCourseStudents,
  createCategory,
  getProfile,
  uploadFileToServer
} from '../../api/services';
import type { Cours, Categorie, Evaluation, Soumission, Utilisateur } from '../../types';
import { 
  BookOpen, 
  PlusCircle, 
  CheckSquare, 
  Users, 
  Edit, 
  Upload, 
  Layers 
} from 'lucide-react';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'cours' | 'evaluations' | 'suivi'>('cours');
    
  const [courses, setCourses] = useState<Cours[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [currentUser, setCurrentUser] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals / Form states
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [editCourseData, setEditCourseData] = useState<Cours | null>(null);

  // New Category Form states
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
    
  // New Course Form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState<number>(1);
  const [newPub, setNewPub] = useState(true);

  // Resource Upload Modal (avec vrai fichier)
  const [selectedCourseForRes, setSelectedCourseForRes] = useState<Cours | null>(null);
  const [resName, setResName] = useState('');
  const [resFile, setResFile] = useState<File | null>(null);
  const [resType, setResType] = useState('pdf');

  // Evaluation Creation Modal (avec vrai fichier)
  const [selectedCourseForEval, setSelectedCourseForEval] = useState<Cours | null>(null);
  const [evalTitle, setEvalTitle] = useState('');
  const [evalInstructions, setEvalInstructions] = useState('');
  const [evalBareme, setEvalBareme] = useState(20);
  const [evalOpen, setEvalOpen] = useState('');
  const [evalClose, setEvalClose] = useState('');
  const [evalNomFichier, setEvalNomFichier] = useState('');
  const [evalFile, setEvalFile] = useState<File | null>(null);

  // Grading Modal / Drawer
  const [selectedEvalForGrading, setSelectedEvalForGrading] = useState<Evaluation | null>(null);
  const [evaluationsList, setEvaluationsList] = useState<Evaluation[]>([]);
  const [submissionsList, setSubmissionsList] = useState<Soumission[]>([]);
  const [gradingSubId, setGradingSubId] = useState<number | null>(null);
  const [gradeValue, setGradeValue] = useState<number>(0);
  const [gradeComment, setGradeComment] = useState('');

  // Class Tracking
  const [selectedCourseForTracking, setSelectedCourseForTracking] = useState<Cours | null>(null);
  const [studentsList, setStudentsList] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [catData, courseData, profileData] = await Promise.all([
        getCategories(),
        getCatalog(),
        getProfile()
      ]);
      setCategories(catData || []);
      setCurrentUser(profileData);

      const myCourses = (courseData || []).filter(
        (course) => course.id_enseignant === profileData.id_user
      );
      setCourses(myCourses);
    } catch (err) {
      console.error('Erreur de chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategory({ nom: catName, description: catDesc });
      alert('Catégorie créée avec succès !');
      setShowCreateCategory(false);
      setCatName('');
      setCatDesc('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de la catégorie.");
    }
  };

  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCourse({ titre: newTitle, description: newDesc, est_publie: newPub, id_categorie: Number(newCat) });
      alert('Cours créé avec succès !');
      setShowCreateCourse(false);
      setNewTitle('');
      setNewDesc('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création du cours.");
    }
  };

  const handleUpdateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCourseData) return;
    try {
      await updateCourse(editCourseData.id_cours, {
        titre: editCourseData.titre,
        description: editCourseData.description,
        est_publie: editCourseData.est_publie,
        id_categorie: editCourseData.id_categorie
      });
      alert('Cours mis à jour avec succès !');
      setEditCourseData(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour.");
    }
  };

  // Upload Ressource avec fichier physique
  const handleUploadResSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForRes || !resFile) return;
    try {
      const uploaded = await uploadFileToServer(resFile);
      await uploadResource(selectedCourseForRes.id_cours, {
        nom_fichier: resName || uploaded.nom_fichier,
        chemin_fichier: uploaded.chemin_fichier,
        type_fichier: resType,
        taille_fichier: uploaded.taille_fichier
      });
      alert('Ressource ajoutée avec succès !');
      setSelectedCourseForRes(null);
      setResName('');
      setResFile(null);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'upload de la ressource.");
    }
  };

  // Création d'évaluation avec fichier joint optionnel
  const handleCreateEvalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEval) return;
    try {
      let nomFichier = '';
      let cheminFichier = '';

      if (evalFile) {
        const uploaded = await uploadFileToServer(evalFile);
        nomFichier = evalNomFichier || uploaded.nom_fichier;
        cheminFichier = uploaded.chemin_fichier;
      }

      await createEvaluation(selectedCourseForEval.id_cours, {
        titre: evalTitle,
        instructions: evalInstructions,
        bareme: Number(evalBareme),
        date_ouverture: evalOpen ? new Date(evalOpen).toISOString() : new Date().toISOString(),
        date_cloture: evalClose ? new Date(evalClose).toISOString() : new Date().toISOString(),
        nom_fichier: nomFichier,
        chemin_fichier: cheminFichier
      });
      alert('Évaluation créée avec succès !');
      setSelectedCourseForEval(null);
      setEvalTitle('');
      setEvalInstructions('');
      setEvalNomFichier('');
      setEvalFile(null);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de l'évaluation.");
    }
  };

  const handleSelectCourseForEvaluations = async (course: Cours) => {
    try {
      const evals = await getCourseEvaluations(course.id_cours);
      setEvaluationsList(evals || []);
      setSelectedEvalForGrading(null);
      setSubmissionsList([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectEvalForGrading = async (evaluation: Evaluation) => {
    setSelectedEvalForGrading(evaluation);
    try {
      const subs = await getEvaluationSubmissions(evaluation.id_evaluation);
      setSubmissionsList(subs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGradeSubmit = async (subId: number) => {
    try {
      await gradeSubmission(subId, gradeValue, gradeComment);
      alert('Note enregistrée avec succès !');
      setGradingSubId(null);
      if (selectedEvalForGrading) {
        const subs = await getEvaluationSubmissions(selectedEvalForGrading.id_evaluation);
        setSubmissionsList(subs || []);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement de la note.");
    }
  };

  const handleSelectCourseForTracking = async (course: Cours) => {
    setSelectedCourseForTracking(course);
    try {
      const students = await getCourseStudents(course.id_cours);
      setStudentsList(students || []);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center mt-12 text-gray-500 font-medium">Chargement de votre espace enseignant...</div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* En-tête de l'espace Enseignant */}
      <div className="bg-gradient-to-r from-indigo-700 to-violet-800 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center space-x-2 text-indigo-200 text-sm font-semibold mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Portail Enseignant</span>
          </div>
          <h1 className="text-3xl font-extrabold mb-1">Gestion Pédagogique</h1>
          <p className="text-indigo-100 text-sm">
            Créez vos cours, déposez des supports, programmez des évaluations et suivez la progression de vos étudiants.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowCreateCategory(true)}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-4 py-3 rounded-xl transition flex items-center space-x-2 text-sm cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Créer une catégorie</span>
          </button>
          <button
            onClick={() => setShowCreateCourse(true)}
            className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-5 py-3 rounded-xl transition shadow-md flex items-center space-x-2 text-sm cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Créer un nouveau cours</span>
          </button>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="flex space-x-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('cours')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'cours' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Mes Cours & Supports</span>
        </button>

        <button
          onClick={() => setActiveTab('evaluations')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'evaluations' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Évaluations & Notes</span>
        </button>

        <button
          onClick={() => setActiveTab('suivi')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'suivi' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Suivi de Classe</span>
        </button>
      </div>

      {/* CONTENU ONGLET 1 : COURS & SUPPORTS */}
      {activeTab === 'cours' && (
        <div className="space-y-6">
          {courses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-gray-500 font-medium">Vous n'avez pas encore créé de cours.</p>
              <button
                onClick={() => setShowCreateCourse(true)}
                className="mt-4 inline-flex items-center space-x-2 text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Créer votre premier cours</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div 
                  key={course.id_cours} 
                  onClick={() => navigate(`/cours/${course.id_cours}`)}
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:border-indigo-400 hover:shadow-md transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                        Catégorie #{course.id_categorie}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${course.est_publie ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {course.est_publie ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{course.titre}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditCourseData(course)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl text-xs transition flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => setSelectedCourseForRes(course)}
                        className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 rounded-xl text-xs transition flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>+ Ressource</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setSelectedCourseForEval(course)}
                      className="w-full bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold py-2 rounded-xl text-xs transition flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Créer une évaluation</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTENU ONGLET 2 : EVALUATIONS & CORRECTION */}
      {activeTab === 'evaluations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">1. Choisir un cours</h2>
            <div className="space-y-2">
              {courses.map((course) => (
                <button
                  key={course.id_cours}
                  onClick={() => handleSelectCourseForEvaluations(course)}
                  className="w-full text-left p-3 rounded-xl border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition text-sm font-semibold text-gray-800 cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">{course.titre}</span>
                  <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">2. Choisir une évaluation</h2>
            {evaluationsList.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-4">Sélectionnez un cours pour voir ses évaluations.</p>
            ) : (
              <div className="space-y-2">
                {evaluationsList.map((ev) => (
                  <button
                    key={ev.id_evaluation}
                    onClick={() => handleSelectEvalForGrading(ev)}
                    className={`w-full text-left p-3 rounded-xl border transition text-sm font-semibold cursor-pointer flex items-center justify-between ${
                      selectedEvalForGrading?.id_evaluation === ev.id_evaluation 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'border-gray-200 hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div>
                      <span className="block font-bold">{ev.titre}</span>
                      <span className={`text-xs ${selectedEvalForGrading?.id_evaluation === ev.id_evaluation ? 'text-indigo-200' : 'text-gray-500'}`}>
                        Barème : {ev.bareme} pts
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4 lg:col-span-1">
            <h2 className="text-lg font-bold text-gray-900">3. Soumissions & Notes</h2>
            {!selectedEvalForGrading ? (
              <p className="text-sm text-gray-500 italic py-4">Sélectionnez une évaluation pour afficher les soumissions.</p>
            ) : submissionsList.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-4">Aucun étudiant n'a encore soumis de devoir pour cette évaluation.</p>
            ) : (
              <div className="space-y-4">
                {submissionsList.map((sub) => (
                  <div key={sub.id_soumission} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex justify-between items-start text-xs text-gray-500">
                      <span>Étudiant ID : {sub.id_etudiant.slice(0, 8)}...</span>
                      <span>{new Date(sub.date_envoi).toLocaleDateString()}</span>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-gray-700 block mb-1">Fichier rendu :</span>
                      <a href={sub.fichier_soumis} target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-600 hover:underline break-all">
                        Télécharger / Ouvrir le fichier
                      </a>
                    </div>

                    <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-500 block">Note actuelle :</span>
                        <span className="font-bold text-gray-900 text-sm">
                          {sub.note_obtenue !== null ? `${sub.note_obtenue} / ${selectedEvalForGrading.bareme}` : 'Non noté'}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setGradingSubId(sub.id_soumission);
                          setGradeValue(sub.note_obtenue || 0);
                          setGradeComment(sub.commentaire_professeur || '');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition cursor-pointer"
                      >
                        Noter / Corriger
                      </button>
                    </div>

                    {gradingSubId === sub.id_soumission && (
                      <div className="bg-white p-3 rounded-lg border border-indigo-200 space-y-3 mt-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Note (sur {selectedEvalForGrading.bareme})</label>
                          <input
                            type="number"
                            max={selectedEvalForGrading.bareme}
                            min={0}
                            step={0.5}
                            value={gradeValue}
                            onChange={(e) => setGradeValue(Number(e.target.value))}
                            className="w-full px-3 py-1.5 border rounded-lg text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Commentaires</label>
                          <textarea
                            value={gradeComment}
                            onChange={(e) => setGradeComment(e.target.value)}
                            placeholder="Remarques pour l'étudiant..."
                            className="w-full px-3 py-1.5 border rounded-lg text-sm"
                            rows={2}
                          />
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => setGradingSubId(null)}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-1.5 rounded-lg cursor-pointer"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => handleGradeSubmit(sub.id_soumission)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 rounded-lg cursor-pointer"
                          >
                            Enregistrer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 3 : SUIVI DE CLASSE */}
      {activeTab === 'suivi' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Sélectionner un cours</h2>
            <div className="space-y-2">
              {courses.map((course) => (
                <button
                  key={course.id_cours}
                  onClick={() => handleSelectCourseForTracking(course)}
                  className={`w-full text-left p-3 rounded-xl border transition text-sm font-semibold cursor-pointer flex items-center justify-between ${
                    selectedCourseForTracking?.id_cours === course.id_cours 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'border-gray-200 hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <span className="truncate">{course.titre}</span>
                  <Users className="w-4 h-4 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4 md:col-span-2">
            <h2 className="text-lg font-bold text-gray-900">
              {selectedCourseForTracking ? `Étudiants inscrits (${selectedCourseForTracking.titre})` : 'Liste des inscrits'}
            </h2>

            {!selectedCourseForTracking ? (
              <p className="text-sm text-gray-500 italic py-4">Veuillez sélectionner un cours pour afficher ses inscrits.</p>
            ) : studentsList.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-4">Aucun étudiant n'est inscrit à ce cours pour le moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-700">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Étudiant</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Date inscription</th>
                      <th className="px-4 py-3 rounded-r-lg">Progression</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {studentsList.map((st, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-gray-900">{st.prenom} {st.nom}</td>
                        <td className="px-4 py-3 text-gray-500">{st.email}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(st.date_inscription).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${st.progression_pourcentage}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-gray-700">{st.progression_pourcentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL : CRÉATION DE CATÉGORIE */}
      {showCreateCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Créer une catégorie</h3>
              <button onClick={() => setShowCreateCategory(false)} className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Nom de la catégorie</label>
                <input 
                  type="text" 
                  value={catName} 
                  onChange={(e) => setCatName(e.target.value)} 
                  placeholder="ex: Développement Web" 
                  required 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Description</label>
                <textarea 
                  value={catDesc} 
                  onChange={(e) => setCatDesc(e.target.value)} 
                  placeholder="Description de la catégorie..." 
                  required 
                  rows={3} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateCategory(false)} 
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium shadow-sm cursor-pointer"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : CRÉATION DE COURS */}
      {showCreateCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Créer un nouveau cours</h3>
              <button onClick={() => setShowCreateCourse(false)} className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateCourseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Titre du cours</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Description</label>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} required rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Catégorie</label>
                <select value={newCat} onChange={(e) => setNewCat(Number(e.target.value))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm">
                  {categories.map((cat) => (
                    <option key={cat.id_categorie} value={cat.id_categorie}>{cat.nom}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="pub" checked={newPub} onChange={(e) => setNewPub(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                <label htmlFor="pub" className="text-sm font-semibold text-gray-700">Publier immédiatement</label>
              </div>

              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setShowCreateCourse(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium cursor-pointer">Annuler</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium shadow-sm cursor-pointer">Créer le cours</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : MODIFICATION DE COURS */}
      {editCourseData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Modifier le cours</h3>
              <button onClick={() => setEditCourseData(null)} className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateCourseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Titre</label>
                <input type="text" value={editCourseData.titre} onChange={(e) => setEditCourseData({...editCourseData, titre: e.target.value})} required className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Description</label>
                <textarea value={editCourseData.description} onChange={(e) => setEditCourseData({...editCourseData, description: e.target.value})} required rows={3} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Catégorie</label>
                <select value={editCourseData.id_categorie} onChange={(e) => setEditCourseData({...editCourseData, id_categorie: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm">
                  {categories.map((cat) => (
                    <option key={cat.id_categorie} value={cat.id_categorie}>{cat.nom}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="editpub" checked={editCourseData.est_publie} onChange={(e) => setEditCourseData({...editCourseData, est_publie: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
                <label htmlFor="editpub" className="text-sm font-semibold text-gray-700">Publié</label>
              </div>

              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setEditCourseData(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium cursor-pointer">Annuler</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium shadow-sm cursor-pointer">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : UPLOAD RESSOURCE (AVEC SELECTEUR DE FICHIER) */}
      {selectedCourseForRes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Ajouter une ressource</h3>
              <button onClick={() => setSelectedCourseForRes(null)} className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUploadResSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Titre du support (optionnel)</label>
                <input 
                  type="text" 
                  value={resName} 
                  onChange={(e) => setResName(e.target.value)} 
                  placeholder="ex: Chapitre 1 - Introduction" 
                  className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Type de ressource</label>
                <select value={resType} onChange={(e) => setResType(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm">
                  <option value="pdf">PDF</option>
                  <option value="video">Vidéo</option>
                  <option value="image">Image</option>
                  <option value="text">Texte / Archive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Sélectionner le fichier</label>
                <input 
                  type="file" 
                  onChange={(e) => setResFile(e.target.files ? e.target.files[0] : null)} 
                  required 
                  className="w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" 
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setSelectedCourseForRes(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium cursor-pointer">Annuler</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium shadow-sm cursor-pointer">Uploader</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : CREATION D'EVALUATION (AVEC SELECTEUR DE FICHIER) */}
      {selectedCourseForEval && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Créer une évaluation</h3>
              <button onClick={() => setSelectedCourseForEval(null)} className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateEvalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Titre de l'évaluation</label>
                <input type="text" value={evalTitle} onChange={(e) => setEvalTitle(e.target.value)} placeholder="ex: Projet Final - API Go" required className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Instructions détaillées</label>
                <textarea value={evalInstructions} onChange={(e) => setEvalInstructions(e.target.value)} placeholder="Consignes de l'évaluation..." required rows={3} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Barème (ex: 20)</label>
                <input type="number" value={evalBareme} onChange={(e) => setEvalBareme(Number(e.target.value))} required className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Date d'ouverture</label>
                  <input type="date" value={evalOpen} onChange={(e) => setEvalOpen(e.target.value)} required className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Date de clôture</label>
                  <input type="date" value={evalClose} onChange={(e) => setEvalClose(e.target.value)} required className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Nom personnalisé du sujet (optionnel)</label>
                <input 
                  type="text" 
                  value={evalNomFichier} 
                  onChange={(e) => setEvalNomFichier(e.target.value)} 
                  placeholder="ex: Enonce_TP1.pdf" 
                  className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Fichier du sujet (optionnel)</label>
                <input 
                  type="file" 
                  onChange={(e) => setEvalFile(e.target.files ? e.target.files[0] : null)} 
                  className="w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer" 
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setSelectedCourseForEval(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium cursor-pointer">Annuler</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium shadow-sm cursor-pointer">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
