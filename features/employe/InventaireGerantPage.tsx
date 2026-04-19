'use client';

import Link from 'next/link';
import type { EmployeSession } from '@/lib/employe-session';

type Props = {
  session: EmployeSession;
};

/**
 * Placeholder inventaire page for gérant role.
 * Reuses the inventaire feature scope if already available;
 * otherwise shows a placeholder with link to the full feature.
 */
export default function InventaireGerantPage({ session }: Props) {
  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: '"Black Han Sans", sans-serif',
            fontSize: 22,
            color: 'var(--c-ink, #0a120a)',
            margin: 0,
          }}
        >
          📋 Inventaire
        </h1>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: 'var(--c-muted, #6b7280)',
            margin: '4px 0 0',
          }}
        >
          {session.boutique_nom} · Vue gérant
        </p>
      </div>

      <div
        style={{
          background: 'var(--c-surface, #fff)',
          border: '1px solid var(--c-rule2, #e5e7eb)',
          borderRadius: 20,
          padding: 40,
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 48 }} role="img" aria-label="Inventaire">
          📋
        </span>
        <h2
          style={{
            fontFamily: '"Black Han Sans", sans-serif',
            fontSize: 18,
            color: 'var(--c-ink, #0a120a)',
            margin: '14px 0 8px',
          }}
        >
          Inventaire gérant
        </h2>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 14,
            color: 'var(--c-muted, #6b7280)',
            margin: '0 0 20px',
            maxWidth: 400,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Utilisez l&apos;inventaire complet depuis le tableau de bord propriétaire pour la boutique{' '}
          <strong>{session.boutique_nom}</strong>.
        </p>
        <Link
          href="/stock"
          style={{
            display: 'inline-flex',
            padding: '10px 20px',
            borderRadius: 12,
            background: 'var(--c-accent, #00c853)',
            color: '#fff',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Voir le stock
        </Link>
      </div>
    </div>
  );
}
