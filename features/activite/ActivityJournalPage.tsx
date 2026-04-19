'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Boutique } from '@/types/database';
import type { ActivityEventJournal } from '@/lib/supabase/getActivityJournal';
import { formatFCFA } from '@/lib/format';

type Filters = {
  boutique: string;
  type: string;
  from: string;
  to: string;
  q: string;
};

type Props = {
  boutiques: Boutique[];
  events: ActivityEventJournal[];
  totalCount: number;
  page: number;
  pageSize: number;
  filters: Filters;
};

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tout' },
  { value: 'ventes', label: 'Ventes' },
  { value: 'alertes', label: 'Alertes' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'personnel', label: 'Personnel' },
  { value: 'objectifs', label: 'Objectifs' },
];

const TYPE_ICON: Record<string, string> = {
  sale: '🛒',
  alert: '🚨',
  stock: '📦',
  staff: '👥',
  goal: '🎯',
  system: '⚙️',
};

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `il y a ${diff}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)}j`;
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(dateStr));
}

function formatAbsolute(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function ActivityJournalPage({
  boutiques,
  events,
  totalCount,
  page,
  pageSize,
  filters,
}: Props) {
  const router = useRouter();
  const [localQ, setLocalQ] = useState(filters.q);
  const [exporting, setExporting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasFilters =
    filters.boutique !== 'all' ||
    filters.type !== 'all' ||
    filters.from !== '' ||
    filters.to !== '' ||
    filters.q !== '';

  // Keep localQ in sync when navigating back/forward
  useEffect(() => {
    setLocalQ(filters.q);
  }, [filters.q]);

  const pushParams = useCallback(
    (overrides: Partial<Filters & { page: number }>) => {
      const current: Record<string, string> = {
        boutique: filters.boutique,
        type: filters.type,
        from: filters.from,
        to: filters.to,
        q: filters.q,
        page: String(page),
        ...Object.fromEntries(
          Object.entries(overrides).map(([k, v]) => [k, String(v)]),
        ),
      };
      const sp = new URLSearchParams();
      if (current.boutique && current.boutique !== 'all') sp.set('boutique', current.boutique);
      if (current.type && current.type !== 'all') sp.set('type', current.type);
      if (current.from) sp.set('from', current.from);
      if (current.to) sp.set('to', current.to);
      if (current.q) sp.set('q', current.q);
      if (current.page && current.page !== '1') sp.set('page', current.page);
      const qs = sp.toString();
      router.replace(`/dashboard/activite${qs ? `?${qs}` : ''}`);
    },
    [filters, page, router],
  );

  function handleSearchChange(v: string) {
    setLocalQ(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams({ q: v, page: 1 });
    }, 400);
  }

  function handleBoutiqueChange(v: string) {
    pushParams({ boutique: v, page: 1 });
  }

  function handleTypeChange(v: string) {
    pushParams({ type: v, page: 1 });
  }

  function handleFromChange(v: string) {
    pushParams({ from: v, page: 1 });
  }

  function handleToChange(v: string) {
    pushParams({ to: v, page: 1 });
  }

  function handlePreset(preset: 'today' | '7d' | '30d' | 'month') {
    const now = new Date();
    let from = '';
    let to = toISODate(now);
    if (preset === 'today') {
      from = toISODate(now);
    } else if (preset === '7d') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      from = toISODate(d);
    } else if (preset === '30d') {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      from = toISODate(d);
    } else {
      from = toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
      to = toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    }
    pushParams({ from, to, page: 1 });
  }

  function handleReset() {
    setLocalQ('');
    router.replace('/dashboard/activite');
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams(window.location.search);
      params.delete('page');
      const res = await fetch(`/api/activite/export?${params.toString()}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `xa-activite-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="xa-journal-wrap">
      {/* Header */}
      <div className="xa-journal-header">
        <div className="xa-journal-header-left">
          <h1 className="xa-journal-title">Journal d&apos;activité</h1>
        </div>
        <div className="xa-journal-header-right">
          <button
            type="button"
            className="xa-btn xa-btn-ghost xa-journal-reset-btn"
            onClick={handleReset}
            title="Réinitialiser les filtres"
          >
            ↻ Reset
          </button>
          <button
            type="button"
            className="xa-btn xa-btn-ghost xa-journal-export-btn"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? '…' : '📤 Exporter CSV'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="xa-journal-filters">
        {/* Search */}
        <div className="xa-journal-search-wrap">
          <span className="xa-journal-search-icon" aria-hidden>🔍</span>
          <input
            type="search"
            className="xa-journal-search"
            placeholder="Rechercher dans le journal…"
            value={localQ}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Selects row */}
        <div className="xa-journal-selects">
          <div className="xa-journal-field">
            <label className="xa-journal-label">Boutique</label>
            <select
              className="xa-journal-select"
              value={filters.boutique}
              onChange={(e) => handleBoutiqueChange(e.target.value)}
            >
              <option value="all">Toutes</option>
              {boutiques.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="xa-journal-field">
            <label className="xa-journal-label">Type</label>
            <select
              className="xa-journal-select"
              value={filters.type}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="xa-journal-field">
            <label className="xa-journal-label">Du</label>
            <input
              type="date"
              className="xa-journal-date"
              value={filters.from}
              onChange={(e) => handleFromChange(e.target.value)}
            />
          </div>

          <div className="xa-journal-field">
            <label className="xa-journal-label">Au</label>
            <input
              type="date"
              className="xa-journal-date"
              value={filters.to}
              onChange={(e) => handleToChange(e.target.value)}
            />
          </div>
        </div>

        {/* Date presets */}
        <div className="xa-journal-presets">
          <span className="xa-journal-preset-label">Période :</span>
          {[
            { key: 'today' as const, label: "Aujourd'hui" },
            { key: '7d' as const, label: '7 jours' },
            { key: '30d' as const, label: '30 jours' },
            { key: 'month' as const, label: 'Ce mois' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className="xa-fchip xa-journal-preset-btn"
              onClick={() => handlePreset(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="xa-journal-count">
        {totalCount === 0
          ? 'Aucun événement'
          : `${totalCount.toLocaleString('fr-FR')} événement${totalCount > 1 ? 's' : ''} trouvé${totalCount > 1 ? 's' : ''}`}
      </div>

      {/* Events list */}
      <div className="xa-journal-list">
        {events.length === 0 ? (
          <div className="xa-journal-empty">
            {hasFilters ? (
              <>
                Aucun événement ne correspond à ces filtres.{' '}
                <button type="button" className="xa-journal-empty-reset" onClick={handleReset}>
                  Effacer les filtres
                </button>
              </>
            ) : (
              <span>Aucune activité pour l&apos;instant. Les ventes, alertes stocks et actions du personnel apparaîtront ici.</span>
            )}
          </div>
        ) : (
          events.map((ev) => (
            <EventRow key={ev.id} event={ev} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="xa-journal-pagination">
          <button
            type="button"
            className="xa-btn xa-btn-ghost"
            disabled={page <= 1}
            onClick={() => pushParams({ page: page - 1 })}
          >
            ← Précédent
          </button>
          <span className="xa-journal-page-info">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            className="xa-btn xa-btn-ghost"
            disabled={page >= totalPages}
            onClick={() => pushParams({ page: page + 1 })}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: ActivityEventJournal }) {
  const icon = TYPE_ICON[event.type] ?? '📋';
  const boutiqueName = event.boutiques?.nom ?? null;

  return (
    <div className="xa-journal-event">
      <span className="xa-journal-event-icon" aria-hidden>{icon}</span>
      <div className="xa-journal-event-body">
        <div className="xa-journal-event-top">
          <span className="xa-journal-event-title">{event.title}</span>
          {event.amount != null && (
            <span className="xa-journal-event-amount">{formatFCFA(event.amount)}</span>
          )}
        </div>
        {event.description && (
          <p className="xa-journal-event-desc">{event.description}</p>
        )}
        <div className="xa-journal-event-meta">
          {boutiqueName && (
            <span className="xa-journal-event-boutique">{boutiqueName}</span>
          )}
          <span
            className="xa-journal-event-time"
            title={formatAbsolute(event.created_at)}
          >
            {formatRelative(event.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
