// File: src/pages/admin/Dashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  getPlatformStats,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getCatalog,
  assignTeacherToCourse,
} from '../../api/services';
import type { Utilisateur, Cours, PlatformStats } from '../../types';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Skeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { CrawlingPythonBg } from '../../components/ui/CrawlingPythonBg';
import {
  ShieldAlert,
  Users,
  BookOpen,
  BarChart3,
  Trash2,
  CheckCircle,
  XCircle,
  Award,
  Search,
  UserCheck,
  Layers,
} from 'lucide-react';

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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'assignment'>('stats');

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [courses, setCourses] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTeachers, setSelectedTeachers] = useState<Record<number, string>>({});
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'etudiant' | 'enseignant' | 'admin'>('ALL');
  const [userToDelete, setUserToDelete] = useState<Utilisateur | null>(null);
  const [busyId, setBusyId] = useState<string | number | null>(null);

  const { success, error: showError, warning } = useToast();
  const pageRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async () => {
    try {
      const [statsData, usersData, coursesData] = await Promise.all([
        getPlatformStats(),
        getAllUsers(),
        getCatalog(),
      ]);
      const safeUsers = usersData || [];
      const safeCourses = coursesData || [];

      setStats(statsData);
      setUsers(safeUsers);
      setCourses(safeCourses);

      setSelectedTeachers((prev) => {
        const next = { ...prev };
        safeCourses.forEach((c) => {
          if (!next[c.id_cours] && c.id_enseignant) {
            next[c.id_cours] = c.id_enseignant;
          }
        });
        return next;
      });
    } catch (err) {
      console.error('Erreur lors du chargement des données admin :', err);
      showError("Impossible de charger les données d'administration.");
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
      gsap.from('.gsap-admin-hero', {
        y: 18,
        opacity: 0,
        duration: 0.65,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      gsap.from('.gsap-admin-card', {
        y: 16,
        opacity: 0,
        duration: 0.5,
        stagger: 0.07,
        delay: 0.12,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });
    }, pageRef);

    return () => ctx.revert();
  }, [loading, activeTab]);

  const userMap = useMemo(() => {
    const map = new Map<string, Utilisateur>();
    users.forEach((u) => map.set(u.id_user, u));
    return map;
  }, [users]);

  const breakdown = useMemo(() => {
    const students = users.filter((u) => u.role === 'etudiant').length;
    const teachers = users.filter((u) => u.role === 'enseignant').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const activeAccounts = users.filter((u) => u.statut_actif).length;
    const suspendedAccounts = users.length - activeAccounts;
    const publishedCourses = courses.filter((c) => c.est_publie).length;
    const draftCourses = courses.length - publishedCourses;
    const assignedCourses = courses.filter((c) => Boolean(c.id_enseignant)).length;

    return {
      students,
      teachers,
      admins,
      activeAccounts,
      suspendedAccounts,
      publishedCourses,
      draftCourses,
      assignedCourses,
    };
  }, [users, courses]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    return users.filter((u) => {
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const fullName = `${u.prenom || ''} ${u.nom || ''}`.toLowerCase();
      const matchesQuery =
        !q ||
        fullName.includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  }, [users, userSearch, roleFilter]);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setBusyId(userId);
    try {
      await updateUserStatus(userId, !currentStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id_user === userId ? { ...u, statut_actif: !currentStatus } : u))
      );
      success(!currentStatus ? 'Compte activé.' : 'Compte suspendu.');
    } catch (err) {
      console.error(err);
      showError('Erreur lors de la modification du statut.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setBusyId(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id_user === userId ? { ...u, role: newRole as any } : u))
      );
      success('Rôle mis à jour.');
    } catch (err) {
      console.error(err);
      showError('Erreur lors de la modification du rôle.');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    const targetId = userToDelete.id_user;
    setBusyId(targetId);
    try {
      await deleteUser(targetId);
      setUsers((prev) => prev.filter((u) => u.id_user !== targetId));
      setUserToDelete(null);
      success('Utilisateur supprimé.');
    } catch (err) {
      console.error(err);
      showError('Erreur lors de la suppression.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAssignTeacher = async (courseId: number) => {
    const teacherId = selectedTeachers[courseId];
    if (!teacherId) {
      warning('Veuillez sélectionner un enseignant.');
      return;
    }

    setBusyId(courseId);
    try {
      await assignTeacherToCourse(courseId, teacherId);
      setCourses((prev) =>
        prev.map((c) => (c.id_cours === courseId ? { ...c, id_enseignant: teacherId } : c))
      );
      success('Enseignant assigné au cours.');
    } catch (err) {
      console.error(err);
      showError("Erreur lors de l'affectation de l'enseignant.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="relative z-10 max-w-6xl mx-auto pb-14 px-4 sm:px-6 pt-6 space-y-6">
        <CrawlingPythonBg />
        <div className="surface-card rounded-2xl p-6 sm:p-8 space-y-5">
          <SnakeLoader label="Chargement du panneau d'administration..." />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((idx) => (
              <Skeleton key={idx} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <TableSkeleton rows={4} cols={5} />
      </div>
    );
  }

  const teachersList = users.filter((u) => u.role === 'enseignant' || u.role === 'admin');
  const totalUsersForPct = Math.max(users.length, 1);
  const totalCoursesForPct = Math.max(courses.length, 1);

  return (
    <div ref={pageRef} className="relative z-10 space-y-7 max-w-6xl mx-auto pb-14 px-4 sm:px-6 pt-6">
      <CrawlingPythonBg />

      <header className="gsap-admin-hero surface-card rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-text)] bg-[var(--accent-soft)] border border-[var(--accent-border)] px-2.5 py-0.5 rounded-full">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Gouvernance & supervision</span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl text-[var(--text-primary)]">
            Administration de la plateforme
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Supervisez l'activité globale, gérez les comptes et rôles, et affectez les enseignants
            aux cours.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition cursor-pointer"
          >
            {breakdown.suspendedAccounts} suspendu{breakdown.suspendedAccounts > 1 ? 's' : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('assignment')}
            className="px-3.5 py-2 rounded-xl text-xs font-medium btn-accent transition cursor-pointer"
          >
            {breakdown.assignedCourses}/{courses.length} cours assignés
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border-subtle)] pb-3">
        {[
          { id: 'stats', label: "Vue d'ensemble", icon: BarChart3 },
          { id: 'users', label: `Utilisateurs (${users.length})`, icon: Users },
          { id: 'assignment', label: `Affectation enseignants (${courses.length})`, icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition flex items-center gap-2 cursor-pointer ${
                active
                  ? 'btn-accent'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview & Analytics Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="gsap-admin-card surface-card rounded-2xl p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-text)]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs text-[var(--text-muted)]">Utilisateurs actifs</span>
                <span className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
                  {stats?.active_users ?? breakdown.activeAccounts}
                </span>
                <span className="block text-[11px] text-[var(--text-secondary)]">
                  sur {users.length} inscrits
                </span>
              </div>
            </div>

            <div className="gsap-admin-card surface-card rounded-2xl p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs text-[var(--text-muted)]">Cours au catalogue</span>
                <span className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
                  {stats?.total_courses ?? courses.length}
                </span>
                <span className="block text-[11px] text-[var(--text-secondary)]">
                  {breakdown.publishedCourses} publiés · {breakdown.draftCourses} brouillons
                </span>
              </div>
            </div>

            <div className="gsap-admin-card surface-card rounded-2xl p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[var(--success-bg)] border border-[var(--success-border)] text-[var(--success-text)]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs text-[var(--text-muted)]">Total soumissions</span>
                <span className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
                  {stats?.total_submissions ?? 0}
                </span>
                <span className="block text-[11px] text-[var(--text-secondary)]">
                  Copies & travaux reçus
                </span>
              </div>
            </div>

            <div className="gsap-admin-card surface-card rounded-2xl p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--accent-text)]">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs text-[var(--text-muted)]">Encadrement</span>
                <span className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
                  {breakdown.teachers}
                </span>
                <span className="block text-[11px] text-[var(--text-secondary)]">
                  enseignants · {breakdown.students} étudiants
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <section className="gsap-admin-card surface-card rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Répartition des comptes par rôle
                </h2>
                <span className="text-xs text-[var(--text-muted)] tabular-nums">
                  {users.length} comptes
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {[
                  { label: 'Étudiants', count: breakdown.students, color: 'bg-[var(--accent)]' },
                  {
                    label: 'Enseignants',
                    count: breakdown.teachers,
                    color: 'bg-emerald-500',
                  },
                  {
                    label: 'Administrateurs',
                    count: breakdown.admins,
                    color: 'bg-amber-500',
                  },
                ].map((row) => {
                  const pct = Math.round((row.count / totalUsersForPct) * 100);
                  return (
                    <div key={row.label} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[var(--text-primary)]">{row.label}</span>
                        <span className="text-[var(--text-secondary)] tabular-nums">
                          {row.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                        <div
                          className={`h-full ${row.color} transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[var(--bg-canvas)]/60 border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] block">Comptes actifs</span>
                  <span className="text-base font-semibold text-emerald-400 tabular-nums">
                    {breakdown.activeAccounts}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-canvas)]/60 border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] block">Comptes suspendus</span>
                  <span className="text-base font-semibold text-[var(--danger-text)] tabular-nums">
                    {breakdown.suspendedAccounts}
                  </span>
                </div>
              </div>
            </section>

            <section className="gsap-admin-card surface-card rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--accent-text)]" />
                  <span>État récent des cours</span>
                </h2>
                <span className="text-xs text-[var(--text-muted)] tabular-nums">
                  {Math.round((breakdown.publishedCourses / totalCoursesForPct) * 100)}% publiés
                </span>
              </div>

              {courses.length === 0 ? (
                <p className="py-8 text-center text-xs text-[var(--text-muted)]">
                  Aucun cours enregistré pour le moment.
                </p>
              ) : (
                <div className="divide-y divide-[var(--border-subtle)] max-h-[260px] overflow-y-auto">
                  {courses.slice(0, 8).map((c) => {
                    const teacher = c.id_enseignant ? userMap.get(c.id_enseignant) : undefined;
                    return (
                      <div
                        key={c.id_cours}
                        className="py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--text-primary)] truncate">{c.titre}</p>
                          <p className="text-[var(--text-muted)] truncate mt-0.5">
                            {teacher
                              ? `Prof. ${teacher.prenom} ${teacher.nom}`
                              : 'Enseignant non assigné'}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full border shrink-0 font-medium ${
                            c.est_publie
                              ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]'
                              : 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]'
                          }`}
                        >
                          {c.est_publie ? 'Publié' : 'Brouillon'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Users Directory Tab */}
      {activeTab === 'users' && (
        <section className="gsap-admin-card surface-card rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--accent-text)]" />
              <span>Répertoire des utilisateurs ({filteredUsers.length})</span>
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Rechercher nom ou email..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-border)]"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)]"
              >
                <option value="ALL">Tous les rôles</option>
                <option value="etudiant">Étudiants</option>
                <option value="enseignant">Enseignants</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--text-secondary)]">
              <thead className="bg-[var(--bg-subtle)] text-xs font-medium text-[var(--text-secondary)]">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Nom & Prénom</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">
                      Aucun utilisateur ne correspond aux filtres.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isBusy = busyId === u.id_user;

                    return (
                      <tr key={u.id_user} className="hover:bg-[var(--bg-subtle)]/40 transition">
                        <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                          {u.prenom} {u.nom}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{u.email}</td>
                        <td className="px-4 py-3">
                          <select
                            disabled={isBusy}
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id_user, e.target.value)}
                            className="px-2.5 py-1 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg text-xs font-medium text-[var(--text-primary)] cursor-pointer"
                          >
                            <option value="etudiant">Étudiant</option>
                            <option value="enseignant">Enseignant</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              u.statut_actif
                                ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]'
                                : 'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)]'
                            }`}
                          >
                            {u.statut_actif ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            <span>{u.statut_actif ? 'Actif' : 'Suspendu'}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleToggleStatus(u.id_user, u.statut_actif)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                                u.statut_actif
                                  ? 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]'
                                  : 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]'
                              }`}
                            >
                              {u.statut_actif ? 'Suspendre' : 'Activer'}
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setUserToDelete(u)}
                              className="p-1.5 bg-[var(--danger-bg)] text-[var(--danger-text)] border border-[var(--danger-border)] rounded-lg transition inline-flex items-center cursor-pointer"
                              title="Supprimer l'utilisateur"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Teacher Assignment Tab */}
      {activeTab === 'assignment' && (
        <section className="gsap-admin-card surface-card rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3.5 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--accent-text)]" />
            <span>Lier un enseignant à un cours</span>
          </h2>

          <div className="space-y-3.5">
            {courses.map((course) => {
              const currentTeacher = course.id_enseignant
                ? userMap.get(course.id_enseignant)
                : undefined;
              const isBusy = busyId === course.id_cours;

              return (
                <div
                  key={course.id_cours}
                  className="p-4 bg-[var(--bg-subtle)]/50 rounded-xl border border-[var(--border-subtle)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-[var(--accent-text)] tabular-nums">
                        Cours #{course.id_cours}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          course.est_publie
                            ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]'
                            : 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]'
                        }`}
                      >
                        {course.est_publie ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] text-base">
                      {course.titre}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Enseignant actuel :{' '}
                      <span className="text-[var(--text-secondary)] font-medium">
                        {currentTeacher
                          ? `Prof. ${currentTeacher.prenom} ${currentTeacher.nom}`
                          : 'Non assigné'}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    <select
                      disabled={isBusy}
                      value={selectedTeachers[course.id_cours] || ''}
                      onChange={(e) =>
                        setSelectedTeachers((prev) => ({
                          ...prev,
                          [course.id_cours]: e.target.value,
                        }))
                      }
                      className="flex-1 md:w-56 px-3 py-2 bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-xl text-xs font-medium text-[var(--text-primary)] cursor-pointer"
                    >
                      <option value="">Sélectionner un enseignant...</option>
                      {teachersList.map((t) => (
                        <option key={t.id_user} value={t.id_user}>
                          Prof. {t.prenom} {t.nom} ({t.role})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleAssignTeacher(course.id_cours)}
                      className="btn-accent px-4 py-2 rounded-xl text-xs font-medium disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {isBusy ? 'Affectation...' : 'Assigner'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Confirmation Modal for Deleting User */}
      <ConfirmModal
        open={Boolean(userToDelete)}
        title="Supprimer l'utilisateur"
        description={
          userToDelete
            ? `Voulez-vous vraiment supprimer le compte de ${userToDelete.prenom} ${userToDelete.nom} (${userToDelete.email}) ? Cette action est irréversible.`
            : ''
        }
        confirmLabel="Supprimer"
        variant="danger"
        loading={Boolean(userToDelete && busyId === userToDelete.id_user)}
        onCancel={() => {
          if (!busyId) setUserToDelete(null);
        }}
        onConfirm={handleConfirmDeleteUser}
      />
    </div>
  );
}
