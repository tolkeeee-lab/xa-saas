'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import EmployeLockScreen from './EmployeLockScreen';
import { EMPLOYE_STORAGE_KEY } from '@/lib/employe-session';

type BoutiqueInfo = { id: string; nom: string };

/**
 * Client component that resolves the current boutique from URL params /
 * localStorage, then renders the EmployeLockScreen.
 */
export default function EmployeLockScreenClient() {
  const searchParams = useSearchParams();
  const [boutiques, setBoutiques] = useState<BoutiqueInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [boutiqueId, setBoutiqueId] = useState<string>('');

  useEffect(() => {
    async function resolve() {
      // Priority: URL param > localStorage (last session boutique)
      const paramId = searchParams.get('boutique_id');
      let storedBoutiqueId: string | null = null;

      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(EMPLOYE_STORAGE_KEY);
          if (raw) {
            // Parse stored token to get boutique_id
            const parts = raw.split('.');
            if (parts.length >= 1) {
              const decoded = atob(
                parts[0].replace(/-/g, '+').replace(/_/g, '/') +
                  '='.repeat((4 - (parts[0].length % 4)) % 4),
              );
              const payload = JSON.parse(decoded) as { boutique_id?: string };
              storedBoutiqueId = payload.boutique_id ?? null;
            }
          }
        } catch {
          // ignore
        }
      }

      const resolvedId = paramId ?? storedBoutiqueId ?? '';
      setBoutiqueId(resolvedId);

      if (resolvedId) {
        try {
          const res = await fetch(`/api/employe/boutique-info?boutique_id=${encodeURIComponent(resolvedId)}`);
          if (res.ok) {
            const data = (await res.json()) as BoutiqueInfo;
            setBoutiques([data]);
          } else {
            setBoutiques([]);
          }
        } catch {
          setBoutiques([]);
        }
      }
      setLoading(false);
    }

    void resolve();
  }, [searchParams]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--c-bg, #f9fafb)',
        }}
      >
        <span
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 14,
            color: 'var(--c-muted, #6b7280)',
          }}
        >
          Chargement…
        </span>
      </div>
    );
  }

  return (
    <EmployeLockScreen
      defaultBoutiqueId={boutiqueId}
      boutiques={boutiques}
    />
  );
}
