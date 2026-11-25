// File: src/pages/public/Register.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { register } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { CrawlingPythonBg } from '../../components/ui/CrawlingPythonBg';
import { UserPlus, GraduationCap, Presentation, ShieldCheck } from 'lucide-react';

type PublicRole = 'etudiant' | 'enseignant';

export default function Register() {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<PublicRole>('etudiant');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { error: showError, warning } = useToast();

  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.gsap-reg-item', {
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

    const cleanNom = nom.trim();
    const cleanPrenom = prenom.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanNom || !cleanPrenom) {
      const msg = 'Veuillez renseigner votre nom et votre prénom.';
      setError(msg);
      warning(msg);
      return;
    }

    if (password.length < 8) {
      const msg = 'Le mot de passe doit contenir au moins 8 caractères.';
      setError(msg);
      warning(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Les deux mots de passe ne correspondent pas.';
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
          : "Erreur lors de l'inscription. Vérifiez vos informations.";
      setError(finalMsg);
      showError(finalMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition';

  return (
    <div ref={cardRef} className="relative z-10 max-w-md mx-auto mt-8 px-4 pb-14">
      <CrawlingPythonBg />

      <div className="surface-card p-7 rounded-2xl space-y-6">
        <div className="gsap-reg-item space-y-1">
          <div className="flex items-center gap-2 text-[var(--accent-text)]">
            <UserPlus className="w-5 h-5" />
            <span className="text-xs font-medium">Nouveau compte PFE-Learn</span>
          </div>
          <h2 className="font-editorial text-2xl text-[var(--text-primary)]">Inscription</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Les comptes administrateurs sont attribués uniquement depuis l'espace d'administration.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-[var(--danger-bg)] text-[var(--danger-text)] border border-[var(--danger-border)] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="gsap-reg-item grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Nom
              </label>
              <input
                type="text"
                autoComplete="family-name"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Prénom
              </label>
              <input
                type="text"
                autoComplete="given-name"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="gsap-reg-item">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Email universitaire ou professionnel
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* Role selector restricted to Student & Teacher */}
          <div className="gsap-reg-item space-y-1.5">
            <span className="block text-xs font-medium text-[var(--text-secondary)]">
              Type de compte
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRole('etudiant')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                  role === 'etudiant'
                    ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--text-primary)]'
                    : 'bg-[var(--bg-subtle)]/60 border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Étudiant</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Suivre des cours</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('enseignant')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                  role === 'enseignant'
                    ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--text-primary)]'
                    : 'bg-[var(--bg-subtle)]/60 border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Presentation className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Enseignant</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Publier & noter</p>
                </div>
              </button>
            </div>
          </div>

          <div className="gsap-reg-item grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Mot de passe (8+ car.)
              </label>
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="gsap-reg-item flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
            <span>
              Les privilèges d'administration ne peuvent pas être demandés lors de l'inscription.
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="gsap-reg-item w-full btn-accent py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 cursor-pointer transition"
          >
            {submitting ? 'Création du compte...' : "S'inscrire"}
          </button>
        </form>

        <p className="gsap-reg-item text-center text-xs text-[var(--text-secondary)]">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-[var(--accent-text)] font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
