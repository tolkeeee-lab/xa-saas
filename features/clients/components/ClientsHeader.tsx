'use client';

import { Search, SlidersHorizontal, UserPlus } from 'lucide-react';

type SortField = 'nom' | 'derniere_visite_at' | 'total_achats';

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  sort: SortField;
  onSortChange: (s: SortField) => void;
  onNewClient: () => void;
};

export default function ClientsHeader({
  search,
  onSearchChange,
  sort,
  onSortChange,
  onNewClient,
}: Props) {
  return (
    <div className="bg-xa-surface border-b border-xa-border">
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className="flex-1 min-w-0">
          <span className="font-bold text-xa-text text-lg block">Clients</span>
          <span className="text-xs text-xa-muted">Fiches clients &amp; fidélisation</span>
        </div>
        <button
          type="button"
          onClick={onNewClient}
          className="flex items-center gap-2 bg-xa-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl min-h-[44px] hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <UserPlus size={16} />
          <span className="hidden sm:inline">Nouveau client</span>
          <span className="sm:hidden">+</span>
        </button>
      </div>
      <div className="flex gap-2 px-4 pb-3">
        <div className="relative flex-1 min-w-0">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xa-muted pointer-events-none"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Nom, prénom ou téléphone…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
          />
        </div>
        <div className="relative flex-shrink-0">
          <SlidersHorizontal
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xa-muted pointer-events-none"
          />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortField)}
            className="pl-9 pr-3 py-2 rounded-xl border border-xa-border bg-xa-bg text-xa-text text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-xa-primary"
          >
            <option value="nom">Alphabétique</option>
            <option value="derniere_visite_at">Dernière visite</option>
            <option value="total_achats">Total dépensé</option>
          </select>
        </div>
      </div>
    </div>
  );
}
