'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Boutique } from '@/types/database';

interface CaisseHeaderProps {
  boutiques: Boutique[];
  boutiqueActive: string;
  onBoutiqueChange: (id: string) => void;
  caissierNom?: string;
  date: string;
}

export default function CaisseHeader({
  boutiques,
  boutiqueActive,
  onBoutiqueChange,
  caissierNom,
  date,
}: CaisseHeaderProps) {
  const [dropOpen, setDropOpen] = useState(false);
  const switchRef = useRef<HTMLDivElement>(null);
  const activeBoutique = boutiques.find((b) => b.id === boutiqueActive);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!dropOpen) return;
    function handleOutside(e: MouseEvent) {
      if (switchRef.current && !switchRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [dropOpen]);

  return (
    <div className="v4-header">
      <span className="v4-logo">XÀ</span>

      <div className="v4-header-info">
        <h1>Caisse Rapide</h1>
        <p>
          {caissierNom ? `${caissierNom} · ` : ''}
          {date}
        </p>
      </div>

      <div className="v4-header-actions">
        {/* Boutique switcher */}
        <div className="v4-bswitch" ref={switchRef}>
          <button
            type="button"
            className="v4-bswitch-btn"
            onClick={() => setDropOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={dropOpen}
          >
            <span
              className="v4-bdot"
              style={{ background: activeBoutique?.couleur_theme ?? '#00C853' }}
            />
            <span className="v4-bswitch-name">
              {activeBoutique?.nom ?? 'Boutique'}
            </span>
            <ChevronDown
              size={10}
              className={`v4-bswitch-arr${dropOpen ? ' open' : ''}`}
            />
          </button>

          {dropOpen && (
            <div className="v4-bdrop" role="listbox">
              {boutiques.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  role="option"
                  aria-selected={b.id === boutiqueActive}
                  className={`v4-bopt${b.id === boutiqueActive ? ' sel' : ''}`}
                  onClick={() => {
                    onBoutiqueChange(b.id);
                    setDropOpen(false);
                  }}
                >
                  <span
                    className="v4-bdot"
                    style={{ background: b.couleur_theme ?? '#00C853' }}
                  />
                  <span className="v4-bopt-info">
                    <span className="v4-bopt-nm">{b.nom}</span>
                    <span className="v4-bopt-sub">{b.ville}</span>
                  </span>
                  {b.id === boutiqueActive && (
                    <span className="v4-bopt-tag tg">Actif</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
