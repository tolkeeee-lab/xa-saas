'use client';

import Link from 'next/link';
import { CheckCircle2, Check } from 'lucide-react';

interface Props {
  email: string;
}

export default function InscriptionSuccess({ email }: Props) {
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
            padding: '2.5rem 2rem',
            textAlign: 'center',
          }}
        >
          {/* Success icon */}
          <div className="flex justify-center mb-5">
            <div
              style={{
                background: 'rgba(0, 200, 83, 0.15)',
                borderRadius: '50%',
                padding: '1rem',
                display: 'inline-flex',
              }}
            >
              <CheckCircle2 size={52} color="#00C853" strokeWidth={1.5} />
            </div>
          </div>

          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: '#f0eafa' }}
          >
            Bienvenue dans MAFRO&nbsp;🎉
          </h1>

          <p className="text-sm mb-1" style={{ color: '#c4abed' }}>
            Ton compte partenaire est créé.
          </p>
          {email && (
            <p className="text-sm mb-5" style={{ color: '#a782e3' }}>
              Vérifie ta boîte mail&nbsp;
              <span style={{ color: '#14d9eb', fontWeight: 600 }}>{email}</span>
              &nbsp;pour confirmer ton adresse.
            </p>
          )}

          {/* Next steps */}
          <div
            className="text-left space-y-3 mb-8"
            style={{
              background: 'rgba(108,46,209,0.1)',
              border: '1px solid rgba(108,46,209,0.25)',
              borderRadius: '0.875rem',
              padding: '1.25rem 1.25rem',
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: '#a782e3' }}
            >
              Prochaines étapes
            </p>
            {[
              'Confirmer ton email (lien envoyé)',
              'Te connecter à /login',
              'Personnaliser ta boutique dans Settings',
              'Commencer à vendre avec la Caisse',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  style={{
                    background: 'rgba(0,200,83,0.15)',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Check size={13} color="#00C853" strokeWidth={2.5} />
                </div>
                <span className="text-sm" style={{ color: '#d8c8f0' }}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <Link
            href="/login"
            style={{
              display: 'block',
              width: '100%',
              padding: '0.8rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              fontSize: '0.9375rem',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(90deg, #6c2ed1, #14d9eb, #6c2ed1)',
              backgroundSize: '200% auto',
              animation: 'xa-shimmer 2.5s linear infinite',
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Aller à la connexion
          </Link>

          {/* WhatsApp support link */}
          <p className="mt-5 text-sm" style={{ color: '#a782e3' }}>
            Besoin d&apos;aide ?{' '}
            <a
              href="https://wa.me/2290154330545"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#14d9eb', fontWeight: 500 }}
              className="hover:underline"
            >
              Contacte le support MAFRO sur WhatsApp
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
