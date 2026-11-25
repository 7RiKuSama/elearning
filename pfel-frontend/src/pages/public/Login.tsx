// File: src/pages/public/Login.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CrawlingPythonBg } from '../../components/ui/CrawlingPythonBg';
import SlangLogo from '../../components/SlangLogo';
import {
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface LoginLocationState {
  registered?: boolean;
  email?: string;
}

export default function Login() {
  const location = useLocation();
  const state = (location.state as LoginLocationState | null) || null;

  const [email, setEmail] = useState(state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const notifiedRegistrationRef = useRef(false);

  useEffect(() => {
    if (state?.registered && !notifiedRegistrationRef.current) {
      notifiedRegistrationRef.current = true;
      success('Bienvenue dans la troupe ! Connecte-toi pour lancer la session.', 'Compte prêt');
    }
  }, [state?.registered, success]);

  useEffect(() => {
    if (!cardRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.gsap-login-item', {
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
    setSubmitting(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      navigate('/');
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      const finalMsg =
        typeof serverMsg === 'string' && serverMsg.trim()
          ? serverMsg
          : "Cet email ou ce mot de passe n'a pas passé le barrage !";
      setError(finalMsg);
      showError(finalMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className="relative z-10 max-w-md mx-auto mt-8 sm:mt-12 px-4 pb-16"
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
        <div className="gsap-login-item space-y-3">
          <div className="flex items-center justify-between gap-2">
            <SlangLogo width={112} label="Slang" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-border)]">
              <Sparkles className="w-3 h-3" />
              <span>Mode terrain</span>
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <h2 className="font-editorial text-2xl sm:text-3xl text-[var(--text-primary)] tracking-tight">
              Content de te revoir !
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Glisse tes identifiants et reprends là où le boomslang t&apos;a laissé.
            </p>
          </div>
        </div>

        {/* Registered Banner */}
        {state?.registered && !error && (
          <div className="gsap-login-item bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Compte tout neuf activé ! Entre ton mot de passe pour entrer.</span>
          </div>
        )}

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
          <div className="gsap-login-item space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-secondary)]">
              Ton email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@exemple.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition"
                required
              />
            </div>
          </div>

          <div className="gsap-login-item space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                Mot de passe secret
              </label>
              <span className="text-[11px] text-[var(--text-muted)] inline-flex items-center gap-1">
                <Zap className="w-3 h-3 text-[var(--accent-text)]" />
                <span>Accès direct</span>
              </span>
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={
                  showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                }
                title={showPassword ? 'Cacher' : 'Voir'}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] absolute right-2 top-1/2 -translate-y-1/2 transition cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="gsap-login-item w-full btn-accent py-2.5 px-4 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer transition-transform active:scale-[0.99] inline-flex items-center justify-center gap-2 shadow-md shadow-[var(--accent)]/15"
          >
            <span>{submitting ? 'Allumage de la mèche...' : 'Entrer dans l’arène'}</span>
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Footer CTA */}
        <div className="gsap-login-item pt-3 border-t border-[var(--border-subtle)] text-center">
          <p className="text-xs text-[var(--text-secondary)]">
            Nouveau par ici ?{' '}
            <Link
              to="/register"
              className="text-[var(--accent-text)] font-semibold hover:underline"
            >
              Crée ton passeport Slang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
