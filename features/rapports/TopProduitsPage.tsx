'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Boutique } from '@/types/database';
import type { TopProduit, TopProduitsParBoutique } from '@/lib/supabase/getTopProduits';
import { formatFCFA } from '@/lib/format';

// ——— Types ——————————————————————————————————————————————————————————————————

type Raccourci = 'aujourd_hui' | 'cette_semaine' | 'ce_mois' | '30_jours' | 'personnalise';

interface TopProduitsPageProps {
  boutiques: Boutique[];
}

// ——— Helpers ————————————————————————————————————————————————————————————————

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getRaccourciDates(r: Raccourci): { debut: string; fin: string } {
  const now = new Date();
  switch (r) {
    case 'aujourd_hui': {
      const s = toDateStr(now);
      return { debut: s, fin: s };
    }
    case 'cette_semaine': {
      const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const debut = new Date(now);
      debut.setDate(now.getDate() - day);
      return { debut: toDateStr(debut), fin: toDateStr(now) };
    }
    case 'ce_mois': {
      return {
        debut: toDateStr(new Date(now.getFullYear(), now.getMonth(), 1)),
        fin: toDateStr(now),
      };
    }
    case '30_jours': {
      const debut = new Date(now);
      debut.setDate(now.getDate() - 29);
      return { debut: toDateStr(debut), fin: toDateStr(now) };
    }
    default:
      return { debut: toDateStr(now), fin: toDateStr(now) };
  }
}

// ——— Sub-component: product row ——————————————————————————————————————————————

function ProduitRow({
  rang,
  produit,
  max,
}: {
  rang: number;
  produit: TopProduit;
  max: number;
}) {
  const pct = max > 0 ? Math.round((produit.quantite_totale / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2 border-b border-xa-border last:border-0">
      <span className="w-6 text-center text-xs font-bold text-xa-muted shrink-0">{rang}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xa-text font-medium text-sm truncate">{produit.nom}</p>
        <div className="mt-1 h-1.5 rounded-full bg-xa-bg overflow-hidden">
          <div
            className="h-full rounded-full bg-xa-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xa-quantite font-bold text-sm">{produit.quantite_totale}</p>
        <p className="text-xa-montant font-semibold text-xs">{formatFCFA(produit.ca_total)}</p>
      </div>
    </div>
  );
}

// ——— Sub-component: section card ————————————————————————————————————————————

function SectionCard({
  titre,
  emoji,
  colorClass,
  produits,
  emptyMsg,
}: {
  titre: string;
  emoji: string;
  colorClass: string;
  produits: TopProduit[];
  emptyMsg: string;
}) {
  const max = produits[0]?.quantite_totale ?? 0;
  return (
    <div className="bg-xa-surface border border-xa-border rounded-xl flex flex-col">
      <div className="px-4 py-3 border-b border-xa-border">
        <h3 className={`text-sm font-semibold ${colorClass}`}>
          {emoji} {titre}
        </h3>
      </div>
      <div className="flex-1 px-4 py-2 overflow-y-auto max-h-[400px]">
        {produits.length === 0 ? (
          <p className="text-xa-muted text-sm text-center py-8">{emptyMsg}</p>
        ) : (
          produits.map((p, i) => (
            <ProduitRow
              key={p.produit_id ?? p.nom}
              rang={i + 1}
              produit={p}
              max={max}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ——— Sub-component: accordion for per-boutique ——————————————————————————————

function BoutiqueAccordion({
  data,
}: {
  data: TopProduitsParBoutique;
}) {
  const [open, setOpen] = useState(false);
  const produits = data.produits;
  const mid = Math.ceil(produits.length / 2);
  const top10 = produits.slice(0, 10);
  const moyens = produits.slice(10, mid);
  const peuVendus = produits.slice(mid);

  return (
    <div className="border border-xa-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-xa-surface hover:bg-xa-bg transition-colors"
      >
        <span className="text-sm font-semibold text-xa-boutique">{data.boutique_nom}</span>
        <svg
          className={`w-4 h-4 text-xa-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-xa-bg">
          <SectionCard
            titre="Top vendeurs"
            emoji="🥇"
            colorClass="text-xa-ok"
            produits={top10}
            emptyMsg="Aucune vente sur la période"
          />
          <SectionCard
            titre="Vendeurs moyens"
            emoji="📊"
            colorClass="text-xa-boutique"
            produits={moyens}
            emptyMsg="Pas assez de données"
          />
          <SectionCard
            titre="Peu vendus"
            emoji="🔻"
            colorClass="text-xa-alerte"
            produits={peuVendus}
            emptyMsg="Pas de données"
          />
        </div>
      )}
    </div>
  );
}

// ——— Main component ——————————————————————————————————————————————————————————

export default function TopProduitsPage({ boutiques }: TopProduitsPageProps) {
  const defaultDates = getRaccourciDates('ce_mois');
  const [raccourci, setRaccourci] = useState<Raccourci>('ce_mois');
  const [dateDebut, setDateDebut] = useState(defaultDates.debut);
  const [dateFin, setDateFin] = useState(defaultDates.fin);
  const [boutiqueId, setBoutiqueId] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalProduits, setGlobalProduits] = useState<TopProduit[]>([]);
  const [parBoutique, setParBoutique] = useState<TopProduitsParBoutique[]>([]);

  const raccourcis: { label: string; value: Raccourci }[] = [
    { label: "Aujourd'hui", value: 'aujourd_hui' },
    { label: 'Cette semaine', value: 'cette_semaine' },
    { label: 'Ce mois', value: 'ce_mois' },
    { label: '30 jours', value: '30_jours' },
    { label: 'Personnalisé', value: 'personnalise' },
  ];

  function applyRaccourci(r: Raccourci) {
    setRaccourci(r);
    if (r !== 'personnalise') {
      const { debut, fin } = getRaccourciDates(r);
      setDateDebut(debut);
      setDateFin(fin);
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        dateDebut,
        dateFin,
        boutiqueId,
      });
      const res = await fetch(`/api/top-produits?${params}`);
      if (!res.ok) {
        const e = await res.json();
        setError(e.error ?? 'Erreur lors du chargement');
        return;
      }
      const data = await res.json();
      setGlobalProduits(data.global ?? []);
      setParBoutique(data.parBoutique ?? []);
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin, boutiqueId]);

  // Fetch on mount only — the user must press "Appliquer" to re-fetch after changing filters.
  // fetchData is intentionally omitted from deps to avoid auto-fetch on every filter change
  // (period raccourcis update 2 state values at once which would trigger duplicate requests).
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Split global into 3 sections
  const mid = Math.ceil(globalProduits.length / 2);
  const top10 = globalProduits.slice(0, 10);
  const moyens = globalProduits.slice(10, mid);
  const peuVendus = globalProduits.slice(mid);

  const showGlobal = boutiqueId === 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-xa-titre">Top Produits vendus</h2>
        <p className="text-sm text-xa-muted">
          Analyse des ventes par produit sur la période sélectionnée
        </p>
      </div>

      {/* Filters */}
      <div className="bg-xa-surface border border-xa-border rounded-xl p-4 space-y-3">
        {/* Period shortcuts */}
        <div className="flex flex-wrap gap-2">
          {raccourcis.map((r) => (
            <button
              key={r.value}
              onClick={() => applyRaccourci(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                raccourci === r.value
                  ? 'bg-xa-primary text-white'
                  : 'border border-xa-border text-xa-muted hover:bg-xa-bg'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Custom dates */}
        {raccourci === 'personnalise' && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-xa-muted">Du</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-xa-muted">Au</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
              />
            </div>
          </div>
        )}

        {/* Boutique + Apply */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={boutiqueId}
            onChange={(e) => setBoutiqueId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
          >
            <option value="all">Toutes les boutiques</option>
            {boutiques.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom}
              </option>
            ))}
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Chargement…' : 'Appliquer'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-xa-danger/10 border border-xa-danger text-xa-danger text-sm">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 rounded-full border-2 border-xa-primary border-t-transparent animate-spin" />
        </div>
      )}

      {/* Global view (all boutiques) */}
      {!loading && showGlobal && (
        <>
          <h3 className="text-sm font-semibold text-xa-titre">Vue globale — Toutes boutiques</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SectionCard
              titre="Top vendeurs"
              emoji="🥇"
              colorClass="text-xa-ok"
              produits={top10}
              emptyMsg="Aucune vente sur la période"
            />
            <SectionCard
              titre="Vendeurs moyens"
              emoji="📊"
              colorClass="text-xa-boutique"
              produits={moyens}
              emptyMsg="Pas assez de données"
            />
            <SectionCard
              titre="Peu vendus"
              emoji="🔻"
              colorClass="text-xa-alerte"
              produits={peuVendus}
              emptyMsg="Pas de données"
            />
          </div>

          {/* Per-boutique accordions */}
          {parBoutique.length > 1 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-xa-titre">Détail par boutique</h3>
              {parBoutique.map((b) => (
                <BoutiqueAccordion key={b.boutique_id} data={b} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Single boutique view */}
      {!loading && !showGlobal && (
        <>
          {parBoutique.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-xa-boutique">
                {parBoutique[0].boutique_nom}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SectionCard
                  titre="Top vendeurs"
                  emoji="🥇"
                  colorClass="text-xa-ok"
                  produits={parBoutique[0].produits.slice(0, 10)}
                  emptyMsg="Aucune vente sur la période"
                />
                <SectionCard
                  titre="Vendeurs moyens"
                  emoji="📊"
                  colorClass="text-xa-boutique"
                  produits={parBoutique[0].produits.slice(
                    10,
                    Math.ceil(parBoutique[0].produits.length / 2),
                  )}
                  emptyMsg="Pas assez de données"
                />
                <SectionCard
                  titre="Peu vendus"
                  emoji="🔻"
                  colorClass="text-xa-alerte"
                  produits={parBoutique[0].produits.slice(
                    Math.ceil(parBoutique[0].produits.length / 2),
                  )}
                  emptyMsg="Pas de données"
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
