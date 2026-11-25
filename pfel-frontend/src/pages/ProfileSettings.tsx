// File: src/pages/ProfileSettings.tsx
import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  profileService,
  uploadFileToServer,
  type UserProfile,
} from '../api/services';
import { useToast } from '../context/ToastContext';
import { Skeleton } from '../components/ui/Skeleton';
import { CrawlingPythonBg } from '../components/ui/CrawlingPythonBg';
import SlangLogo from '../components/SlangLogo';
import {
  Sparkles,
  User,
  Bell,
  Lock,
  Upload,
  Eye,
  EyeOff,
  Check,
  Shield,
  Mail,
} from 'lucide-react';

function resolveUploadUrl(cheminFichier: string): string {
  if (!cheminFichier) return '';
  if (cheminFichier.startsWith('http://') || cheminFichier.startsWith('https://')) {
    return cheminFichier;
  }
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(
    /\/api\/?$/,
    ''
  );
  const normalizedPath = cheminFichier.startsWith('/') ? cheminFichier : `/${cheminFichier}`;
  return `${baseUrl}${normalizedPath}`;
}

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

interface NotifToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}

const NotifToggle: React.FC<NotifToggleProps> = ({
  checked,
  onChange,
  title,
  description,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between gap-4 cursor-pointer ${
      checked
        ? 'bg-[var(--bg-subtle)]/85 border-[var(--border-strong)]'
        : 'bg-[var(--bg-subtle)]/35 border-[var(--border-subtle)] opacity-80 hover:opacity-100'
    }`}
  >
    <div className="space-y-0.5 min-w-0">
      <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="text-[11px] text-[var(--text-muted)]">{description}</p>
    </div>

    <span
      aria-hidden="true"
      className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
        checked ? 'bg-[var(--accent)] justify-end' : 'bg-[var(--border-strong)] justify-start'
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-white shadow-xs transition-transform" />
    </span>
  </button>
);

export function ProfileSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [notifEvaluations, setNotifEvaluations] = useState(true);
  const [notifSubmissions, setNotifSubmissions] = useState(true);
  const [notifGrades, setNotifGrades] = useState(true);
  const [notifForum, setNotifForum] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  const { success, info, warning, error: showError } = useToast();
  const pageRef = useRef<HTMLDivElement | null>(null);
  const auraRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    profileService
      .getProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setNom(data.nom || '');
        setPrenom(data.prenom || '');
        setAvatarUrl(data.avatar_url || '');
        setBio(data.bio || '');
        setNotifEvaluations(data.notif_evaluations ?? true);
        setNotifSubmissions(data.notif_submissions ?? true);
        setNotifGrades(data.notif_grades ?? true);
        setNotifForum(data.notif_forum ?? true);
      })
      .catch(() => {
        if (!active) return;
        showError("Impossible de charger ton profil pour l'instant !");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showError]);

  useEffect(() => {
    if (loading || !pageRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('.gsap-profile-item', {
        y: 18,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      if (auraRef.current) {
        gsap.to(auraRef.current, {
          scale: 1.12,
          opacity: 0.72,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    }, pageRef);

    return () => ctx.revert();
  }, [loading]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);

    try {
      const uploaded = await uploadFileToServer(file);
      const nextUrl = resolveUploadUrl(uploaded.chemin_fichier);
      if (!nextUrl) {
        throw new Error('Missing chemin_fichier');
      }
      setAvatarUrl(nextUrl);
      info('Nouvel avatar prêt ! Clique sur « Enregistrer le profil » pour figer le tout.');
    } catch (err: any) {
      const msg = err?.response?.data?.error || "L'envoi de l'avatar a glissé — réessaie !";
      showError(msg);
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await profileService.updateProfile({
        nom: nom.trim(),
        prenom: prenom.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
        notif_evaluations: notifEvaluations,
        notif_submissions: notifSubmissions,
        notif_grades: notifGrades,
        notif_forum: notifForum,
      });
      setProfile(updated);
      setNom(updated.nom);
      setPrenom(updated.prenom);
      setAvatarUrl(updated.avatar_url);
      setBio(updated.bio);
      setNotifEvaluations(updated.notif_evaluations);
      setNotifSubmissions(updated.notif_submissions);
      setNotifGrades(updated.notif_grades);
      setNotifForum(updated.notif_forum);

      window.dispatchEvent(new Event('profile:updated'));
      success('Profil et réglages enregistrés aux petits oignons !', 'C’est à jour');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erreur lors de la mise à jour du profil.';
      showError(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      warning('Choisis un nouveau mot de passe d’au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      warning('Les deux nouveaux mots de passe ne collent pas ensemble.');
      return;
    }

    setSavingPassword(true);
    try {
      await profileService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      success('Mot de passe mis à jour avec succès.', 'Coffre-fort blindé');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erreur lors du changement de mot de passe.';
      showError(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="relative z-10 max-w-4xl mx-auto p-6 space-y-6">
        <CrawlingPythonBg />
        <div className="surface-card border border-[var(--border-subtle)] rounded-3xl p-6 space-y-4">
          <SnakeLoader label="Préparation de ton espace perso..." />
          <div className="space-y-3">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const initials = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase() || 'U';
  const fullName = `${prenom || ''} ${nom || ''}`.trim() || 'Explorateur';
  const inputClass =
    'w-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition';

  return (
    <div
      ref={pageRef}
      className="relative z-10 max-w-4xl mx-auto space-y-7 pb-16 px-4 sm:px-6 pt-6"
    >
      <CrawlingPythonBg />

      <div
        ref={auraRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-[740px] h-[260px] rounded-full bg-[var(--accent)]/15 blur-3xl -z-10"
      />

      <header
        className="gsap-profile-item surface-card rounded-3xl p-6 sm:p-8 border border-[var(--border-subtle)] relative overflow-hidden"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none -right-14 -top-14 w-60 h-60 rounded-full bg-[var(--accent)]/12 blur-2xl absolute"
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[var(--accent-border)] shadow-md shrink-0"
              />
            ) : (
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[var(--accent-soft)] border-2 border-[var(--accent-border)] text-[var(--accent-text)] font-bold flex items-center justify-center text-2xl shrink-0">
                {initials}
              </div>
            )}

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <SlangLogo width={88} label="Slang" />
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)]">
                  <Sparkles className="w-3 h-3" />
                  <span>{profile?.role || 'Membre'}</span>
                </span>
              </div>

              <h1 className="font-editorial text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight truncate">
                {fullName}
              </h1>

              {profile?.email && (
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] inline-flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
                  <span>{profile.email}</span>
                </p>
              )}
            </div>
          </div>

          <div className="surface-subtle rounded-2xl px-4 py-3 border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] max-w-xs">
            Personnalise ton avatar, ta bio et tes alertes pour garder le contrôle sur ton espace.
          </div>
        </div>
      </header>

      <form
        onSubmit={handleProfileSubmit}
        className="gsap-profile-item surface-card border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 space-y-7"
      >
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="p-2.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-text)]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Identité &amp; style de profil
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Visible sur ton compte, tes échanges et ton suivi
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-subtle)]/45 border border-[var(--border-subtle)] space-y-3">
          <label className="block text-xs font-semibold text-[var(--text-secondary)]">
            Avatar &amp; lien d&apos;image
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="cursor-pointer inline-flex items-center justify-center gap-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-semibold px-4 py-2.5 rounded-xl transition shrink-0">
              <Upload className="w-3.5 h-3.5 text-[var(--accent-text)]" />
              <span>{uploadingAvatar ? 'Envoi...' : 'Uploader une image'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://... ou /uploads/avatar.png"
              className={`flex-1 ${inputClass}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-secondary)]">
              Prénom
            </label>
            <input
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-secondary)]">
              Nom
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            Ta bio express
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ce que tu kiffes apprendre, ton domaine, tes projets..."
            className={inputClass}
          />
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-[var(--accent-text)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Réglages des alertes
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <NotifToggle
              checked={notifEvaluations}
              onChange={setNotifEvaluations}
              title="Nouveaux défis & quiz"
              description="Prévenu dès qu'un exercice tombe"
            />
            <NotifToggle
              checked={notifSubmissions}
              onChange={setNotifSubmissions}
              title="Nouveaux rendus"
              description="Alerte quand un rendu est déposé"
            />
            <NotifToggle
              checked={notifGrades}
              onChange={setNotifGrades}
              title="Scores & retours"
              description="Sache direct quand tes notes tombent"
            />
            <NotifToggle
              checked={notifForum}
              onChange={setNotifForum}
              title="Vie du Salon"
              description="Réponses et discussions en cours"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingProfile || uploadingAvatar}
            className="btn-accent px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50 cursor-pointer inline-flex items-center gap-2 shadow-md shadow-[var(--accent)]/15 transition-transform active:scale-[0.99]"
          >
            <Check className="w-4 h-4" />
            <span>{savingProfile ? 'Sauvegarde...' : 'Enregistrer le profil'}</span>
          </button>
        </div>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="gsap-profile-item surface-card border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="p-2.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-text)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Sécurité &amp; mot de passe
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Change ta clé d&apos;accès quand tu veux
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            Mot de passe actuel
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showCurrentPwd ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className={`${inputClass} pl-10 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPwd((p) => !p)}
              aria-label={showCurrentPwd ? 'Masquer' : 'Afficher'}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] absolute right-2 top-1/2 -translate-y-1/2 transition cursor-pointer"
            >
              {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-secondary)]">
              Nouveau mot de passe (6+ car.)
            </label>
            <div className="relative">
              <input
                type={showNewPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowNewPwd((p) => !p)}
                aria-label={showNewPwd ? 'Masquer' : 'Afficher'}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] absolute right-2 top-1/2 -translate-y-1/2 transition cursor-pointer"
              >
                {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-secondary)]">
              Confirme le nouveau mot de passe
            </label>
            <input
              type={showNewPwd ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingPassword}
            className="bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50 cursor-pointer transition"
          >
            {savingPassword ? 'Mise à jour...' : 'Mettre à jour la clé'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileSettings;
