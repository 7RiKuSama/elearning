// File: src/components/layout/Navbar.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getNotifications,
  getProfile,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../api/services';
import type { AppNotification } from '../../types/notification';
import type { Utilisateur } from '../../types';
import SlangLogo from '../SlangLogo';
import {
  LogOut,
  User,
  Sparkles,
  Shield,
  LogIn,
  UserPlus,
  Sun,
  Moon,
  Bell,
  CheckCheck,
  ChevronDown,
  Layers,
  BrainCircuit,
  Code2,
  Box,
} from 'lucide-react';

const QUICK_CATEGORIES = [
  {
    id: 4,
    label: 'IA & Data',
    subtitle: 'ML, NLP, RAG & vision',
    to: '/?category=4',
    icon: BrainCircuit,
  },
  {
    id: 5,
    label: 'Web & API',
    subtitle: 'React, APIs, SQL & Docker',
    to: '/?category=5',
    icon: Code2,
  },
  {
    id: 6,
    label: '3D, Audio & Systèmes',
    subtitle: '3D, son, shaders & systèmes',
    to: '/?category=6',
    icon: Box,
  },
];

function getInitialDark(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('pfe-theme');
  if (saved === 'dark') return true;
  if (saved === 'light') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [dark, setDark] = useState<boolean>(getInitialDark);
  const [profileOverride, setProfileOverride] = useState<Utilisateur | null>(null);

  const [catOpen, setCatOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const catDropdownRef = useRef<HTMLDivElement | null>(null);
  const notifDropdownRef = useRef<HTMLDivElement | null>(null);

  const activeUser = profileOverride ?? user;
  const currentUrl = `${pathname}${search}`;

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('pfe-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('pfe-theme', 'light');
    }
  }, [dark]);

  useEffect(() => {
    setCatOpen(false);
    setNotifOpen(false);
  }, [pathname, search]);

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (catDropdownRef.current && !catDropdownRef.current.contains(target)) {
        setCatOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  const syncProfile = useCallback(async () => {
    if (!user) {
      setProfileOverride(null);
      return;
    }
    try {
      const fresh = await getProfile();
      setProfileOverride(fresh);
    } catch {
      // keep existing auth user if profile request fails
    }
  }, [user]);

  useEffect(() => {
    setProfileOverride(null);
  }, [user]);

  useEffect(() => {
    const onProfileUpdated = () => {
      syncProfile();
    };
    window.addEventListener('profile:updated', onProfileUpdated);
    return () => window.removeEventListener('profile:updated', onProfileUpdated);
  }, [syncProfile]);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }
    try {
      const data = await getNotifications();
      setUnreadCount(data.unread_count ?? 0);
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch {
      // ignore transient errors
    }
  }, [user]);

  useEffect(() => {
    refreshNotifications();
    if (!user) return;
    const timer = window.setInterval(refreshNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [refreshNotifications, user]);

  const handleOpenNotification = async (n: AppNotification) => {
    if (!n.is_read) {
      await markNotificationRead(n.id_notification);
      await refreshNotifications();
    }
    setNotifOpen(false);
    if (n.lien) {
      navigate(n.lien);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    await refreshNotifications();
  };

  const handleLogout = () => {
    setCatOpen(false);
    setNotifOpen(false);
    setProfileOverride(null);
    logout();
    navigate('/login');
  };

  const isCatalogActive = pathname === '/' && !search.includes('category=');
  const isCategoryFilterActive = pathname === '/' && search.includes('category=');

  const navLinkClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center space-x-1.5 ${
      active
        ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]/70'
    }`;

  return (
    <nav className="sticky top-0 z-30 bg-[var(--bg-canvas)]/90 backdrop-blur-md border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              aria-label="Accueil Slang"
              title="Retour au terrain de jeu Slang"
              className="flex items-center text-[var(--text-primary)] hover:opacity-90 transition shrink-0"
            >
              <SlangLogo width={116} label="Slang" />
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              <Link to="/" className={navLinkClass(isCatalogActive)}>
                <Sparkles className="w-4 h-4 text-[var(--accent-text)]" />
                <span>Explorer</span>
              </Link>

              {/* Catégories Dropdown */}
              <div className="relative" ref={catDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setCatOpen((prev) => !prev);
                    setNotifOpen(false);
                  }}
                  aria-expanded={catOpen}
                  className={`${navLinkClass(isCategoryFilterActive)} cursor-pointer`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Catégories</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${catOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {catOpen && (
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xl z-50 p-2">
                    <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Choisis ton terrain
                    </div>

                    <div className="space-y-1">
                      {QUICK_CATEGORIES.map((item) => {
                        const IconComponent = item.icon;
                        const active = currentUrl === item.to;
                        return (
                          <Link
                            key={item.id}
                            to={item.to}
                            onClick={() => setCatOpen(false)}
                            className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition ${
                              active
                                ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                                : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
                            }`}
                          >
                            <span className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-text)] flex items-center justify-center shrink-0 mt-0.5">
                              <IconComponent className="w-4 h-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[var(--text-primary)]">
                                {item.label}
                              </p>
                              <p className="text-[11px] text-[var(--text-secondary)]">
                                {item.subtitle}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    <div className="mt-1.5 pt-1.5 border-t border-[var(--border-subtle)]">
                      <Link
                        to="/"
                        onClick={() => setCatOpen(false)}
                        className="block px-3 py-2 rounded-xl text-xs font-medium text-[var(--accent-text)] hover:bg-[var(--bg-hover)] transition"
                      >
                        Voir tous les cours →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {user && role === 'etudiant' && (
                <Link
                  to="/student/dashboard"
                  className={navLinkClass(pathname === '/student/dashboard')}
                >
                  <span>Mes Cours</span>
                </Link>
              )}

              {user && role === 'enseignant' && (
                <Link
                  to="/teacher/dashboard"
                  className={navLinkClass(pathname === '/teacher/dashboard')}
                >
                  <span>Atelier Cours</span>
                </Link>
              )}

              {user && role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  className={navLinkClass(pathname === '/admin/dashboard')}
                >
                  <Shield className="w-4 h-4" />
                  <span>QG Admin</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              aria-label="Basculer le thème sombre"
              title={dark ? 'Mode jour activé — cliquer pour lumière' : 'Mode nuit activé — cliquer pour sombre'}
              className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition"
            >
              {dark ? <Sun className="w-4 h-4 text-[var(--accent)]" /> : <Moon className="w-4 h-4" />}
            </button>

            {user && activeUser ? (
              <>
                <div className="relative" ref={notifDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !notifOpen;
                      setNotifOpen(next);
                      setCatOpen(false);
                      if (next) refreshNotifications();
                    }}
                    aria-label="Notifications"
                    title="Tes alertes fraîches"
                    className="relative p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--danger-text)] text-[var(--text-inverse)] text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          Alertes ({unreadCount} à voir)
                        </span>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="inline-flex items-center gap-1 text-[11px] text-[var(--accent-text)] hover:underline"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Tout marquer lu</span>
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-subtle)]">
                        {notifications.length === 0 ? (
                          <p className="p-6 text-xs text-[var(--text-muted)] text-center">
                            Rien de neuf sous le capot — tout est calme !
                          </p>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.id_notification}
                              type="button"
                              onClick={() => handleOpenNotification(n)}
                              className={`w-full text-left px-4 py-3 transition hover:bg-[var(--bg-hover)] ${
                                !n.is_read ? 'bg-[var(--accent-soft)]/30' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-[var(--text-primary)]">
                                  {n.titre}
                                </p>
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] mt-1 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                                {n.message}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to="/profil"
                  title="Mon espace profil"
                  className={`hidden sm:flex items-center space-x-2 text-sm text-[var(--text-primary)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border px-3 py-1.5 rounded-full transition ${
                    pathname === '/profil'
                      ? 'border-[var(--accent-border)] ring-1 ring-[var(--accent-border)]'
                      : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {activeUser.avatar_url ? (
                    <img
                      src={activeUser.avatar_url}
                      alt={`${activeUser.prenom} ${activeUser.nom}`}
                      className="w-5 h-5 rounded-full object-cover border border-[var(--border-subtle)]"
                    />
                  ) : (
                    <User className="w-4 h-4 text-[var(--accent-text)]" />
                  )}
                  <span className="font-medium">
                    {activeUser.prenom} {activeUser.nom}
                  </span>
                  <span className="text-[11px] bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)] px-2 py-0.5 rounded-full font-semibold">
                    {role}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 text-[var(--danger-text)] hover:bg-[var(--danger-bg)] text-sm font-medium px-3 py-1.5 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>À bientôt</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="flex items-center space-x-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-lg text-sm font-medium transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Se connecter</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-1.5 btn-accent px-3.5 py-1.5 rounded-lg text-sm font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Rejoindre</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
