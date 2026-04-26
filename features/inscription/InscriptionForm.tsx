'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Loader2,
  User,
  Mail,
  Phone,
  Store,
  MapPin,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { COMMENT_CONNU_VALUES } from '@/lib/schemas/inscription';

// ─── Logo MAFRO ───────────────────────────────────────────────────────────────

function MafroLogo() {
  return (
    <div className="flex flex-col items-center mb-6">
      <div
        style={{
          animation: 'xa-ring-pulse 2s ease-in-out infinite',
          borderRadius: '50%',
          padding: '4px',
          display: 'inline-flex',
        }}
      >
        <svg
          width="88"
          height="62"
          viewBox="0 0 80 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="MAFRO logo"
          role="img"
        >
          <text
            x="4"
            y="46"
            fontFamily="Inter, sans-serif"
            fontWeight="700"
            fontSize="48"
            fill="currentColor"
          >
            x
          </text>
          <text
            x="38"
            y="46"
            fontFamily="Inter, sans-serif"
            fontWeight="700"
            fontSize="48"
            fill="#14d9eb"
          >
            à
          </text>
        </svg>
      </div>
      <span
        className="text-xs font-semibold tracking-widest uppercase mt-1"
        style={{ color: '#14d9eb' }}
      >
        MAFRO — Réseau Partenaires
      </span>
      <p className="mt-2 text-sm text-center" style={{ color: '#a782e3' }}>
        Gérez votre boutique. Vendez plus. Gratuitement.
      </p>
    </div>
  );
}

// ─── Password strength indicator ─────────────────────────────────────────────

function getPasswordStrength(password: string): {
  level: 'faible' | 'moyen' | 'fort';
  color: string;
  width: string;
} {
  if (password.length < 8) return { level: 'faible', color: '#D62828', width: '33%' };
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const variety = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
  if (password.length >= 12 && variety >= 3) return { level: 'fort', color: '#00C853', width: '100%' };
  if (password.length >= 8 && variety >= 2) return { level: 'moyen', color: '#FF9800', width: '66%' };
  return { level: 'faible', color: '#D62828', width: '33%' };
}

// ─── Shared input style helpers ───────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 1rem 0.65rem 2.75rem',
  border: '1px solid rgba(108,46,209,0.4)',
  borderRadius: '0.75rem',
  fontSize: '0.875rem',
  background: 'rgba(108,46,209,0.12)',
  color: '#f0eafa',
  outline: 'none',
  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
};

function onFocusInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108,46,209,0.45)';
  e.currentTarget.style.borderColor = '#8a58da';
}

function onBlurInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.boxShadow = 'none';
  e.currentTarget.style.borderColor = 'rgba(108,46,209,0.4)';
}

// ─── Field error ──────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs mt-1" style={{ color: '#ff3341' }}>
      {msg}
    </p>
  );
}

// ─── Form state & validation ──────────────────────────────────────────────────

interface FormState {
  nom_complet: string;
  email: string;
  telephone_whatsapp: string;
  boutique_nom: string;
  boutique_zone: string;
  password: string;
  password_confirm: string;
  comment_connu: string;
  cgu_accepted: boolean;
  website: string; // honeypot
}

interface FormErrors {
  nom_complet?: string;
  email?: string;
  telephone_whatsapp?: string;
  boutique_nom?: string;
  boutique_zone?: string;
  password?: string;
  password_confirm?: string;
  cgu_accepted?: string;
  global?: string;
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.nom_complet.trim() || form.nom_complet.trim().length < 2)
    errors.nom_complet = 'Minimum 2 caractères.';
  if (form.nom_complet.trim().length > 80)
    errors.nom_complet = 'Maximum 80 caractères.';

  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = 'Email invalide.';

  const rawPhone = form.telephone_whatsapp.trim();
  if (!rawPhone) {
    errors.telephone_whatsapp = 'Téléphone requis.';
  } else if (!/^\d{8}$/.test(rawPhone) && !/^\+\d{7,15}$/.test(rawPhone)) {
    errors.telephone_whatsapp = '8 chiffres (BJ) ou format international (+229…).';
  }

  if (!form.boutique_nom.trim() || form.boutique_nom.trim().length < 2)
    errors.boutique_nom = 'Minimum 2 caractères.';
  if (form.boutique_nom.trim().length > 60)
    errors.boutique_nom = 'Maximum 60 caractères.';

  if (!form.boutique_zone.trim() || form.boutique_zone.trim().length < 2)
    errors.boutique_zone = 'Minimum 2 caractères.';
  if (form.boutique_zone.trim().length > 60)
    errors.boutique_zone = 'Maximum 60 caractères.';

  if (!form.password || form.password.length < 8)
    errors.password = 'Minimum 8 caractères.';

  if (form.password !== form.password_confirm)
    errors.password_confirm = 'Les mots de passe ne correspondent pas.';

  if (!form.cgu_accepted)
    errors.cgu_accepted = 'Vous devez accepter les conditions.';

  return errors;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function InscriptionForm() {
  const router = useRouter();
  const mountedAt = useRef(Date.now());

  const [form, setForm] = useState<FormState>({
    nom_complet: '',
    email: '',
    telephone_whatsapp: '',
    boutique_nom: '',
    boutique_zone: '',
    password: '',
    password_confirm: '',
    comment_connu: '',
    cgu_accepted: false,
    website: '', // honeypot — never shown to user
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pre-fill phone with +229 prefix on focus if empty
  function handlePhoneFocus() {
    if (!form.telephone_whatsapp) {
      setForm((f) => ({ ...f, telephone_whatsapp: '+229 ' }));
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, type } = e.target;
    const value =
      type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    setForm((f) => ({ ...f, [name]: value }));
    // Clear individual field error on change
    if (name in errors) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    // Anti-bot: reject if submitted < 3s after mount
    if (Date.now() - mountedAt.current < 3000) {
      // Silently reject bots (don't reveal why)
      return;
    }

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom_complet: form.nom_complet.trim(),
          email: form.email.trim().toLowerCase(),
          telephone_whatsapp: form.telephone_whatsapp.trim(),
          boutique_nom: form.boutique_nom.trim(),
          boutique_zone: form.boutique_zone.trim(),
          password: form.password,
          password_confirm: form.password_confirm,
          comment_connu: form.comment_connu || null,
          cgu_accepted: form.cgu_accepted,
          website: form.website, // honeypot
        }),
      });

      const data = await res.json() as { ok?: boolean; redirect?: string; error?: string };

      if (!res.ok) {
        setErrors({ global: data.error ?? 'Une erreur est survenue. Réessayez.' });
        return;
      }

      if (data.redirect) {
        router.push(data.redirect);
      }
    } catch {
      setErrors({ global: 'Erreur réseau. Vérifiez votre connexion.' });
    } finally {
      setLoading(false);
    }
  }

  const pwStrength = form.password ? getPasswordStrength(form.password) : null;

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        background: 'linear-gradient(135deg, #0f061d 0%, #6c2ed1 40%, #14d9eb 70%, #0f061d 100%)',
        backgroundSize: '300% 300%',
        animation: 'xa-gradient-rotate 10s ease infinite',
      }}
    >
      <div className="w-full max-w-sm md:max-w-md">
        <div
          style={{
            background: 'rgba(15, 6, 29, 0.82)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(108,46,209,0.35)',
            borderRadius: '1.25rem',
            boxShadow: '0 0 60px rgba(108,46,209,0.3), 0 4px 32px rgba(0,0,0,0.5)',
            padding: '2rem',
            position: 'relative',
          }}
        >
          <MafroLogo />

          <h1
            className="text-xl font-semibold text-center mb-6"
            style={{ color: '#f0eafa' }}
          >
            Devenir partenaire MAFRO
          </h1>

          {/* Global error */}
          {errors.global && (
            <div
              style={{
                fontSize: '0.875rem',
                color: '#ff3341',
                background: 'rgba(255,51,65,0.1)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
              }}
            >
              {errors.global}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* ── Honeypot (hidden from users) ── */}
            <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* ── Nom complet ── */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#c4abed' }}>
                Nom complet <span style={{ color: '#ff3341' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  color="#8a58da"
                  style={{ position: 'absolute', top: '50%', left: '0.875rem', transform: 'translateY(-50%)' }}
                />
                <input
                  id="nom_complet"
                  name="nom_complet"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.nom_complet}
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                  placeholder="Kodjo Amedegnato"
                  minLength={2}
                  maxLength={80}
                />
              </div>
              <FieldError msg={errors.nom_complet} />
            </div>

            {/* ── Email ── */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#c4abed' }}>
                Email <span style={{ color: '#ff3341' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  color="#8a58da"
                  style={{ position: 'absolute', top: '50%', left: '0.875rem', transform: 'translateY(-50%)' }}
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                  placeholder="kodjo@gmail.com"
                />
              </div>
              <FieldError msg={errors.email} />
            </div>

            {/* ── Téléphone WhatsApp ── */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#c4abed' }}>
                Téléphone WhatsApp <span style={{ color: '#ff3341' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Phone
                  size={16}
                  color="#8a58da"
                  style={{ position: 'absolute', top: '50%', left: '0.875rem', transform: 'translateY(-50%)' }}
                />
                <input
                  id="telephone_whatsapp"
                  name="telephone_whatsapp"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={form.telephone_whatsapp}
                  onChange={handleChange}
                  onFocus={(e) => {
                    handlePhoneFocus();
                    onFocusInput(e);
                  }}
                  onBlur={onBlurInput}
                  style={inputStyle}
                  placeholder="+229 97000000 ou 97000000"
                />
              </div>
              <p className="text-xs mt-1" style={{ color: '#7a5a9e' }}>
                8 chiffres (Bénin) ou format international
              </p>
              <FieldError msg={errors.telephone_whatsapp} />
            </div>

            {/* ── Nom boutique ── */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#c4abed' }}>
                Nom de la boutique <span style={{ color: '#ff3341' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Store
                  size={16}
                  color="#8a58da"
                  style={{ position: 'absolute', top: '50%', left: '0.875rem', transform: 'translateY(-50%)' }}
                />
                <input
                  id="boutique_nom"
                  name="boutique_nom"
                  type="text"
                  required
                  value={form.boutique_nom}
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                  placeholder="Épicerie Centrale"
                  minLength={2}
                  maxLength={60}
                />
              </div>
              <FieldError msg={errors.boutique_nom} />
            </div>

            {/* ── Zone / Quartier ── */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#c4abed' }}>
                Ville / Quartier <span style={{ color: '#ff3341' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin
                  size={16}
                  color="#8a58da"
                  style={{ position: 'absolute', top: '50%', left: '0.875rem', transform: 'translateY(-50%)' }}
                />
                <input
                  id="boutique_zone"
                  name="boutique_zone"
                  type="text"
                  required
                  value={form.boutique_zone}
                  onChange={handleChange}
                  style={inputStyle}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                  placeholder="Cotonou — Akpakpa"
                  minLength={2}
                  maxLength={60}
                />
              </div>
              <FieldError msg={errors.boutique_zone} />
            </div>

            {/* ── Mot de passe ── */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#c4abed' }}>
                Mot de passe <span style={{ color: '#ff3341' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color="#8a58da"
                  style={{ position: 'absolute', top: '50%', left: '0.875rem', transform: 'translateY(-50%)' }}
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  style={{ ...inputStyle, paddingRight: '3rem' }}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                  placeholder="Minimum 8 caractères"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    minWidth: 44,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword
                    ? <EyeOff size={16} color="#8a58da" />
                    : <Eye size={16} color="#8a58da" />
                  }
                </button>
              </div>
              {/* Password strength */}
              {pwStrength && (
                <div className="mt-2">
                  <div
                    style={{
                      height: 4,
                      background: 'rgba(108,46,209,0.2)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: pwStrength.width,
                        background: pwStrength.color,
                        borderRadius: 4,
                        transition: 'width 0.3s ease, background 0.3s ease',
                      }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: pwStrength.color }}>
                    Force : {pwStrength.level}
                  </p>
                </div>
              )}
              <FieldError msg={errors.password} />
            </div>

            {/* ── Confirmer mot de passe ── */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#c4abed' }}>
                Confirmer le mot de passe <span style={{ color: '#ff3341' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color="#8a58da"
                  style={{ position: 'absolute', top: '50%', left: '0.875rem', transform: 'translateY(-50%)' }}
                />
                <input
                  id="password_confirm"
                  name="password_confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={form.password_confirm}
                  onChange={handleChange}
                  style={{ ...inputStyle, paddingRight: '3rem' }}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                  placeholder="••••••••"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    minWidth: 44,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                  aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                >
                  {showConfirm
                    ? <EyeOff size={16} color="#8a58da" />
                    : <Eye size={16} color="#8a58da" />
                  }
                </button>
              </div>
              <FieldError msg={errors.password_confirm} />
            </div>

            {/* ── Comment as-tu connu MAFRO ── */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#c4abed' }}>
                Comment as-tu connu MAFRO ?{' '}
                <span style={{ color: '#7a5a9e', fontWeight: 400 }}>(optionnel)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  id="comment_connu"
                  name="comment_connu"
                  value={form.comment_connu}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.5rem 0.65rem 1rem',
                    border: '1px solid rgba(108,46,209,0.4)',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    background: 'rgba(108,46,209,0.12)',
                    color: form.comment_connu ? '#f0eafa' : '#7a5a9e',
                    outline: 'none',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer',
                  }}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                >
                  <option value="" style={{ background: '#1a0d35', color: '#c4abed' }}>
                    Sélectionner…
                  </option>
                  {COMMENT_CONNU_VALUES.map((opt) => (
                    <option key={opt} value={opt} style={{ background: '#1a0d35', color: '#f0eafa' }}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  color="#8a58da"
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
              </div>
            </div>

            {/* ── CGU ── */}
            <div className="flex items-start gap-3 pt-1">
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <input
                  id="cgu_accepted"
                  name="cgu_accepted"
                  type="checkbox"
                  checked={form.cgu_accepted}
                  onChange={handleChange}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    cursor: 'pointer',
                    accentColor: '#6c2ed1',
                    marginTop: 2,
                  }}
                />
              </div>
              <label htmlFor="cgu_accepted" className="text-sm cursor-pointer" style={{ color: '#c4abed' }}>
                J&apos;accepte les{' '}
                <span style={{ color: '#14d9eb', textDecoration: 'underline' }}>
                  conditions du partenariat MAFRO
                </span>{' '}
                et m&apos;engage à utiliser l&apos;application honnêtement.
              </label>
            </div>
            <FieldError msg={errors.cgu_accepted} />

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '0.75rem',
                fontWeight: '600',
                fontSize: '0.9375rem',
                color: '#fff',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                background: 'linear-gradient(90deg, #6c2ed1, #14d9eb, #6c2ed1)',
                backgroundSize: '200% auto',
                animation: 'xa-shimmer 2.5s linear infinite',
                transition: 'opacity 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: 48,
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Création de votre compte…
                </>
              ) : (
                'Devenir partenaire MAFRO →'
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-5 text-center text-sm" style={{ color: '#a782e3' }}>
            Déjà partenaire ?{' '}
            <Link
              href="/login"
              style={{ color: '#14d9eb', fontWeight: '500' }}
              className="hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
