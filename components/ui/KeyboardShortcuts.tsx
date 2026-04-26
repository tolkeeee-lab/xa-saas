'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const PAGES = [
  { label: "Vue d'ensemble", href: '/dashboard' },
  { label: 'Caisse POS', href: '/dashboard/caisse' },
  { label: 'Stocks consolidés', href: '/dashboard/stocks' },
  { label: 'Transferts', href: '/dashboard/transferts' },
  { label: 'Boutiques', href: '/dashboard/boutiques' },
  { label: 'Produits', href: '/dashboard/produits' },
  { label: 'Dettes clients', href: '/dashboard/dettes' },
  { label: 'Péremptions', href: '/dashboard/perimes' },
  { label: 'Rapports', href: '/dashboard/rapports' },
  { label: 'Charges fixes', href: '/dashboard/charges' },
  { label: 'Personnel', href: '/dashboard/personnel' },
  { label: 'Fournisseurs', href: '/dashboard/fournisseurs' },
  { label: 'Comparatif boutiques', href: '/dashboard/comparatif' },
  { label: 'Employés', href: '/dashboard/employes' },
  { label: 'Paramètres', href: '/dashboard/settings' },
];

export default function KeyboardShortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? PAGES.filter((p) =>
        p.label.toLowerCase().includes(query.toLowerCase()),
      )
    : PAGES;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      // Escape closes
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      // N → new sale (only when not in input/textarea)
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey && tag !== 'input' && tag !== 'textarea') {
        router.push('/dashboard/caisse');
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [router]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          margin: '0 1rem',
          background: 'var(--xa-surface)',
          border: '1px solid rgba(108,46,209,0.4)',
          borderRadius: '1rem',
          boxShadow: '0 0 60px rgba(108,46,209,0.3), 0 16px 48px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            borderBottom: '1px solid var(--xa-border)',
          }}
        >
          <span style={{ fontSize: '1rem', opacity: 0.7 }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une page…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.9375rem',
              color: 'var(--xa-text)',
            }}
          />
          <kbd
            style={{
              fontSize: '0.7rem',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--xa-border)',
              color: 'var(--xa-muted)',
              fontFamily: 'monospace',
            }}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <ul
          style={{
            maxHeight: '320px',
            overflowY: 'auto',
            padding: '0.5rem',
          }}
        >
          {filtered.length === 0 ? (
            <li
              style={{
                padding: '1rem',
                textAlign: 'center',
                color: 'var(--xa-muted)',
                fontSize: '0.875rem',
              }}
            >
              Aucun résultat
            </li>
          ) : (
            filtered.map((page) => (
              <li key={page.href}>
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push(page.href);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.625rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--xa-text)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(108,46,209,0.12)';
                    e.currentTarget.style.color = 'var(--xa-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--xa-text)';
                  }}
                >
                  {page.label}
                  <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                    {page.href}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        {/* Footer hints */}
        <div
          style={{
            padding: '0.625rem 1rem',
            borderTop: '1px solid var(--xa-border)',
            display: 'flex',
            gap: '1rem',
            fontSize: '0.7rem',
            color: 'var(--xa-muted)',
          }}
        >
          <span>
            <kbd style={{ fontFamily: 'monospace' }}>↵</kbd> sélectionner
          </span>
          <span>
            <kbd style={{ fontFamily: 'monospace' }}>Esc</kbd> fermer
          </span>
          <span>
            <kbd style={{ fontFamily: 'monospace' }}>N</kbd> nouvelle vente
          </span>
        </div>
      </div>
    </div>
  );
}
