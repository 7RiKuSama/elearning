// File: src/pages/admin/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { 
  getPlatformStats, 
  getAllUsers, 
  updateUserStatus, 
  updateUserRole, 
  deleteUser, 
  getCatalog, 
  assignTeacherToCourse 
} from '../../api/services';
import type { Utilisateur, Cours, PlatformStats } from '../../types';
import { 
  ShieldAlert, 
  Users, 
  BookOpen, 
  BarChart3, 
  UserCheck, 
  UserX, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Shield, 
  Layers, 
  Award 
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'assignment'>('stats');
  
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [courses, setCourses] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(true);

  // État pour l'affectation des enseignants (coursId -> enseignantId)
  const [selectedTeachers, setSelectedTeachers] = useState<{ [key: number]: string }>({});

  const fetchData = async () => {
    try {
      const [statsData, usersData, coursesData] = await Promise.all([
        getPlatformStats(),
        getAllUsers(),
        getCatalog()
      ]);
      setStats(statsData);
      setUsers(usersData || []);
      setCourses(coursesData || []);
    } catch (err) {
      console.error('Erreur lors du chargement des données admin :', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Activer / Suspendre un utilisateur
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await updateUserStatus(userId, !currentStatus);
      setUsers(users.map(u => u.id_user === userId ? { ...u, statut_actif: !currentStatus } : u));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification du statut.");
    }
  };

  // Modifier le rôle d'un utilisateur
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id_user === userId ? { ...u, role: newRole as any } : u));
      alert("Rôle mis à jour avec succès !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification du rôle.");
    }
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;
    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u.id_user !== userId));
      alert("Utilisateur supprimé.");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression.");
    }
  };

  // Assigner un enseignant à un cours
  const handleAssignTeacher = async (courseId: number) => {
    const teacherId = selectedTeachers[courseId];
    if (!teacherId) {
      alert("Veuillez sélectionner un enseignant.");
      return;
    }

    try {
      await assignTeacherToCourse(courseId, teacherId);
      alert("Enseignant assigné avec succès au cours !");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'affectation de l'enseignant.");
    }
  };

  if (loading) {
    return <div className="text-center mt-12 text-gray-500 font-medium">Chargement du panneau d'administration...</div>;
  }

  // Filtrer la liste des enseignants pour l'affectation
  const teachersList = users.filter(u => u.role === 'enseignant' || u.role === 'admin');

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* En-tête de l'espace Administrateur */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-sm font-semibold mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Panneau de Contrôle Global</span>
          </div>
          <h1 className="text-3xl font-extrabold mb-1">Administration & Gouvernance</h1>
          <p className="text-slate-300 text-sm">
            Gérez les utilisateurs, ajustez les rôles, assignez les enseignants et surveillez les statistiques de la plateforme.
          </p>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="flex space-x-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Statistiques Globales</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'users' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestion des Utilisateurs ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assignment')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'assignment' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Affectation des Enseignants</span>
        </button>
      </div>

      {/* CONTENU ONGLET 1 : STATISTIQUES */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Utilisateurs Actifs</span>
              <span className="text-3xl font-extrabold text-gray-900">{stats.active_users}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-4 bg-violet-50 text-violet-600 rounded-xl">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Cours Publiés</span>
              <span className="text-3xl font-extrabold text-gray-900">{stats.total_courses}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Total Soumissions</span>
              <span className="text-3xl font-extrabold text-gray-900">{stats.total_submissions}</span>
            </div>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 2 : GESTION DES UTILISATEURS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Répertoire des utilisateurs</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-700">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Nom & Prénom</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id_user} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900">{u.prenom} {u.nom}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <select 
                        value={u.role} 
                        onChange={(e) => handleRoleChange(u.id_user, e.target.value)}
                        className="px-3 py-1 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="etudiant">Étudiant</option>
                        <option value="enseignant">Enseignant</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        u.statut_actif ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {u.statut_actif ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{u.statut_actif ? 'Actif' : 'Suspendu'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleToggleStatus(u.id_user, u.statut_actif)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          u.statut_actif ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title={u.statut_actif ? "Suspendre le compte" : "Activer le compte"}
                      >
                        {u.statut_actif ? 'Suspendre' : 'Activer'}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u.id_user)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer inline-block"
                        title="Supprimer l'utilisateur"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 3 : AFFECTATION DES ENSEIGNANTS */}
      {activeTab === 'assignment' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Lier un enseignant à un cours</span>
            </h2>
          </div>

          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id_cours} className="p-5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Cours #{course.id_cours}</span>
                  <h3 className="font-bold text-gray-900 text-lg">{course.titre}</h3>
                  <p className="text-xs text-gray-500">Enseignant actuel ID : {course.id_enseignant || 'Aucun enseignant assigné'}</p>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                  <select
                    value={selectedTeachers[course.id_cours] || ''}
                    onChange={(e) => setSelectedTeachers({ ...selectedTeachers, [course.id_cours]: e.target.value })}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 md:w-64"
                  >
                    <option value="">-- Choisir un enseignant --</option>
                    {teachersList.map((t) => (
                      <option key={t.id_user} value={t.id_user}>
                        {t.prenom} {t.nom} ({t.email})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleAssignTeacher(course.id_cours)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition shadow-sm cursor-pointer shrink-0"
                  >
                    Assigner
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
