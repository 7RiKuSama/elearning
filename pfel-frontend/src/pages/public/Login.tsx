// File: src/pages/public/Login.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CrawlingPythonBg } from '../../components/ui/CrawlingPythonBg';
import { LogIn, CheckCircle2 } from 'lucide-react';

interface LoginLocationState {
  registered?: boolean;
  email?: string;
}

export default function Login() {
  const location = useLocation();
  const state = (location.state as LoginLocationState | null) || null;

  const [email, setEmail] = useState(state?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const notifiedRegistrationRef = useRef(false);

  useEffect(() => {
    if (state?.registered && !notifiedRegistrationRef.current) {
      notifiedRegistrationRef.current = true;
      success('Compte créé avec succès. Connectez-vous pour continuer.', 'Inscription réussie');
    }
  }, [state?.registered, success]);

  useEffect(() => {
    if (!cardRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.gsap-login-item', {
        y: 16,
        opacity: 0,
        duration: 0.55,
        stagger: 0.06,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
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
          : 'Email ou mot de passe incorrect';
      setError(finalMsg);
      showError(finalMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={cardRef} className="relative z-10 max-w-md mx-auto mt-12 px-4 pb-14">
      <CrawlingPythonBg />

      <div className="surface-card p-7 rounded-2xl space-y-6">
        <div className="gsap-login-item space-y-1">
          <div className="flex items-center space-x-2 text-[var(--accent-text)]">
            <LogIn className="w-5 h-5" />
            <span className="text-xs font-medium">Bienvenue sur PFE-Learn</span>
          </div>
          <h2 className="font-editorial text-2xl text-[var(--text-primary)]">Connexion</h2>
        </div>

        {state?.registered && !error && (
          <div className="gsap-login-item bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Compte créé. Saisissez votre mot de passe pour accéder à votre espace.</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="bg-[var(--danger-bg)] text-[var(--danger-text)] border border-[var(--danger-border)] px-3.5 py-2.5 rounded-xl text-sm"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="gsap-login-item">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition"
              required
            />
          </div>
          <div className="gsap-login-item">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="gsap-login-item w-full btn-accent py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 cursor-pointer transition"
          >
            {submitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="gsap-login-item text-center text-xs text-[var(--text-secondary)]">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-[var(--accent-text)] font-medium hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
