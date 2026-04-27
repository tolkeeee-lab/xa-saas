'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Clock } from 'lucide-react';
import type { Boutique } from '@/types/database';
import type { BoutiqueActiveId } from '../types';

interface StockHeaderProps {
  boutiques: Boutique[];
  boutiqueActive: BoutiqueActiveId;
  onBoutiqueChange: (id: BoutiqueActiveId) => void;
}

export default function StockHeader({
  boutiques,
  boutiqueActive,
  onBoutiqueChange,
}: StockHeaderProps) {
  const [dropOpen, setDropOpen] = useState(false);
  const switchRef = useRef<HTMLDivElement>(null);

  const activeBoutique =
    boutiqueActive === 'all'
      ? null
      : boutiques.find((b) => b.id === boutiqueActive);

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
        <h1>Gestion des Stocks</h1>
        {boutiqueActive === 'all' ? (
          <p>Toutes mes boutiques</p>
        ) : (
          <p>
            {activeBoutique?.nom ?? 'Boutique'}
            {(activeBoutique?.zone ?? activeBoutique?.ville)
              ? ` — ${activeBoutique?.zone ?? activeBoutique?.ville}`
              : ''}
          </p>
        )}
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
            {boutiqueActive === 'all' ? (
              <span
                className="v4-bdot"
                style={{ background: 'var(--xa-blue)' }}
              />
            ) : (
              <span
                className="v4-bdot"
                style={{ background: activeBoutique?.couleur_theme ?? 'var(--xa-green)' }}
              />
            )}
            <span className="v4-bswitch-name">
              {boutiqueActive === 'all' ? 'Toutes' : (activeBoutique?.nom ?? 'Boutique')}
            </span>
            <ChevronDown
              size={10}
              className={`v4-bswitch-arr${dropOpen ? ' open' : ''}`}
            />
          </button>

          {dropOpen && (
            <div className="v4-bdrop" role="listbox">
              {/* "Toutes les boutiques" option */}
              <button
                type="button"
                role="option"
                aria-selected={boutiqueActive === 'all'}
                className={`v4-bopt${boutiqueActive === 'all' ? ' sel' : ''}`}
                onClick={() => {
                  onBoutiqueChange('all');
                  setDropOpen(false);
                }}
              >
                <span className="v4-bdot" style={{ background: 'var(--xa-blue)' }} />
                <span className="v4-bopt-info">
                  <span className="v4-bopt-nm">Toutes les boutiques</span>
                  <span className="v4-bopt-sub">Vue consolidée</span>
                </span>
                {boutiqueActive === 'all' && (
                  <span className="v4-bopt-tag tg">Actif</span>
                )}
              </button>

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
                    style={{ background: b.couleur_theme ?? 'var(--xa-green)' }}
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

        {/* Historique */}
        <button type="button" className="v4-icon-btn" aria-label="Historique">
          <Clock size={14} />
        </button>

        {/* Add button — soft green */}
        <button type="button" className="v4-icon-btn v4-icon-btn--add" aria-label="Nouveau produit">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
