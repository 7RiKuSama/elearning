// File: src/pages/public/Register.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { register } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { CrawlingPythonBg } from '../../components/ui/CrawlingPythonBg';
import SlangLogo from '../../components/SlangLogo';
import {
  Sparkles,
  GraduationCap,
  Presentation,
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
} from 'lucide-react';

type PublicRole = 'etudiant' | 'enseignant';

export default function Register() {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<PublicRole>('etudiant');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { error: showError, warning } = useToast();

  const cardRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.gsap-reg-item', {
        y: 18,
        opacity: 0,
        duration: 0.58,
        stagger: 0.06,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      if (glowRef.current) {
        gsap.to(glowRef.current, {
          scale: 1.12,
          opacity: 0.75,
          duration: 3.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    }, cardRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanNom = nom.trim();
    const cleanPrenom = prenom.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanNom || !cleanPrenom) {
      const msg = 'Dis-nous ton prénom et ton nom pour qu’on sache qui débarque !';
      setError(msg);
      warning(msg);
      return;
    }

    if (password.length < 8) {
      const msg = 'Choisis un mot de passe d’au moins 8 caractères pour blinder ton compte.';
      setError(msg);
      warning(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Les deux mots de passe ne collent pas ensemble — vérifie ta frappe !';
      setError(msg);
      warning(msg);
      return;
    }

    // Explicitly restrict public registration strictly to 'etudiant' or 'enseignant'
    const safeRole: PublicRole = role === 'enseignant' ? 'enseignant' : 'etudiant';

    setSubmitting(true);
    try {
      await register({
        nom: cleanNom,
        prenom: cleanPrenom,
        email: cleanEmail,
        password,
        role: safeRole,
      });
      navigate('/login', {
        replace: true,
        state: { registered: true, email: cleanEmail },
      });
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      const finalMsg =
        typeof serverMsg === 'string' && serverMsg.trim()
          ? serverMsg
          : "L'inscription a calé en route — vérifie tes infos et réessaie !";
      setError(finalMsg);
      showError(finalMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition';

  return (
    <div
      ref={cardRef}
      className="relative z-10 max-w-md mx-auto mt-6 sm:mt-10 px-4 pb-16"
    >
      <CrawlingPythonBg />

      {/* Subtle ambient glow behind the card */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-[380px] h-[220px] rounded-full bg-[var(--accent)]/20 blur-3xl -z-10"
      />

      <div
        className="surface-card p-6 sm:p-8 rounded-3xl space-y-6 border border-[var(--border-subtle)]"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        {/* Brand & Header */}
        <div className="gsap-reg-item space-y-3">
          <div className="flex items-center justify-between gap-2">
            <SlangLogo width={112} label="Slang" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)]">
              <Sparkles className="w-3 h-3" />
              <span>Nouveau passeport</span>
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <h2 className="font-editorial text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight">
              Rejoins la troupe Slang
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Monte à bord en quelques secondes pour explorer, tester et faire grimper ton niveau.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="bg-[var(--danger-bg)] text-[var(--danger-text)] border border-[var(--danger-border)] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium"
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="gsap-reg-item grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                Prénom
              </label>
              <input
                type="text"
                autoComplete="given-name"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="ex: Maya"
                className={inputClass}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                Nom
              </label>
              <input
                type="text"
                autoComplete="family-name"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="ex: Benali"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="gsap-reg-item space-y-1">
            <label className="block text-xs font-medium text-[var(--text-secondary)]">
              Ton email (fac ou studio)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@exemple.com"
                className={`${inputClass} pl-10`}
                required
              />
            </div>
          </div>

          {/* Role selector restricted to Student & Teacher */}
          <div className="gsap-reg-item space-y-1.5">
            <span className="block text-xs font-medium text-[var(--text-secondary)]">
              Tu viens jouer quel rôle ?
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRole('etudiant')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                  role === 'etudiant'
                    ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--text-primary)] shadow-2xs'
                    : 'bg-[var(--bg-subtle)]/60 border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4 text-[var(--accent-text)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">Étudiant</p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">
                    Explorer &amp; relever des défis
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('enseignant')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                  role === 'enseignant'
                    ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--text-primary)] shadow-2xs'
                    : 'bg-[var(--bg-subtle)]/60 border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                  <Presentation className="w-4 h-4 text-[var(--accent-text)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">Enseignant</p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">
                    Coacher &amp; lancer des cours
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="gsap-reg-item grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                Mot de passe (8+ car.)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pl-9 pr-9`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                  }
                  title={showPassword ? 'Cacher' : 'Voir'}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] absolute right-1.5 top-1/2 -translate-y-1/2 transition cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                Encore une fois
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pl-9 pr-9`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? 'Masquer la confirmation du mot de passe'
                      : 'Afficher la confirmation du mot de passe'
                  }
                  title={showConfirmPassword ? 'Cacher' : 'Voir'}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] absolute right-1.5 top-1/2 -translate-y-1/2 transition cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="gsap-reg-item flex items-start gap-2 text-[11px] text-[var(--text-muted)] bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] rounded-xl p-2.5">
            <ShieldCheck className="w-4 h-4 text-[var(--accent-text)] shrink-0 mt-0.5" />
            <span>
              Les galons d&apos;admin se gagnent en interne — ici tu démarres comme étudiant ou
              enseignant.
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="gsap-reg-item w-full btn-accent py-2.5 px-4 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer transition-transform active:scale-[0.99] inline-flex items-center justify-center gap-2 shadow-md shadow-[var(--accent)]/15"
          >
            <span>{submitting ? 'Préparation du passeport...' : 'Créer mon compte'}</span>
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Footer CTA */}
        <div className="gsap-reg-item pt-3 border-t border-[var(--border-subtle)] text-center">
          <p className="text-xs text-[var(--text-secondary)]">
            Déjà un passeport Slang ?{' '}
            <Link
              to="/login"
              className="text-[var(--accent-text)] font-semibold hover:underline"
            >
              Connecte-toi ici
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
