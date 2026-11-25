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

  const { success, info, warning, error: showError } = useToast();
  const pageRef = useRef<HTMLDivElement | null>(null);

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
        showError('Impossible de charger le profil.');
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
        stagger: 0.09,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
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
      info('Avatar téléversé. Cliquez sur « Enregistrer le profil » pour sauvegarder.');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Échec du téléversement de l’avatar.';
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
      success('Profil et préférences enregistrés.');
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
      warning('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      warning('La confirmation du mot de passe ne correspond pas.');
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
      success('Mot de passe mis à jour.');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erreur lors du changement de mot de passe.';
      showError(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="relative z-10 max-w-3xl mx-auto p-6 space-y-6">
        <CrawlingPythonBg />
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-6 space-y-4">
          <SnakeLoader label="Chargement du profil..." />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const initials = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase() || 'U';
  const inputClass =
    'w-full border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-border)]';

  return (
    <div ref={pageRef} className="relative z-10 max-w-3xl mx-auto space-y-8">
      <CrawlingPythonBg />

      <div className="gsap-profile-item">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Profil et paramètres</h1>
        {profile && (
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {profile.email} · Rôle : <span className="font-medium">{profile.role}</span>
          </p>
        )}
      </div>

      <form
        onSubmit={handleProfileSubmit}
        className="gsap-profile-item bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-6 space-y-6"
      >
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Informations générales et préférences
        </h2>

        <div className="flex items-start gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${prenom} ${nom}`}
              className="w-16 h-16 rounded-full object-cover border border-[var(--border-subtle)] shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] font-semibold flex items-center justify-center text-lg shrink-0">
              {initials}
            </div>
          )}

          <div className="flex-1 space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Avatar</label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-medium px-3 py-2 rounded-lg transition-colors">
                {uploadingAvatar ? 'Téléversement...' : 'Choisir une image'}
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
                placeholder="https://... ou /uploads/..."
                className={`flex-1 min-w-[200px] ${inputClass}`}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
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
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
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

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Présentation courte, spécialité, parcours..."
            className={inputClass}
          />
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Préférences de notifications
          </h3>

          <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={notifEvaluations}
              onChange={(e) => setNotifEvaluations(e.target.checked)}
              className="rounded border-[var(--border-subtle)]"
            />
            <span>Nouvelles évaluations publiées</span>
          </label>

          <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={notifSubmissions}
              onChange={(e) => setNotifSubmissions(e.target.checked)}
              className="rounded border-[var(--border-subtle)]"
            />
            <span>Nouvelles soumissions d’étudiants</span>
          </label>

          <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={notifGrades}
              onChange={(e) => setNotifGrades(e.target.checked)}
              className="rounded border-[var(--border-subtle)]"
            />
            <span>Notes et corrections publiées</span>
          </label>

          <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={notifForum}
              onChange={(e) => setNotifForum(e.target.checked)}
              className="rounded border-[var(--border-subtle)]"
            />
            <span>Activité sur le forum</span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingProfile || uploadingAvatar}
            className="btn-accent px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
          >
            {savingProfile ? 'Enregistrement...' : 'Enregistrer le profil'}
          </button>
        </div>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="gsap-profile-item bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Changer le mot de passe</h2>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Mot de passe actuel
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingPassword}
            className="bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
          >
            {savingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileSettings;
