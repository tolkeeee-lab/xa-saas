'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Boutique } from '@/types/database';
import PartenaireDetailDrawer from './PartenaireDetailDrawer';

type Props = {
  initialBoutiques: Boutique[];
};

export default function PartenairesList({ initialBoutiques }: Props) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = initialBoutiques.filter((b) =>
    b.nom.toLowerCase().includes(search.toLowerCase()) ||
    b.ville.toLowerCase().includes(search.toLowerCase()),
  );

  const selected = initialBoutiques.find((b) => b.id === selectedId) ?? null;

  return (
    <div className="xa-partenaires">
      <div className="xa-partenaires__toolbar">
        <div className="xa-search-wrap">
          <Search size={16} />
          <input
            className="xa-input xa-input--search"
            type="text"
            placeholder="Rechercher par nom ou ville…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="xa-table-wrap">
        <table className="xa-table">
          <thead>
            <tr>
              <th>Boutique</th>
              <th>Ville</th>
              <th>Quartier</th>
              <th>Code</th>
              <th>Statut</th>
              <th>Inscrit le</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--xa-muted)' }}>
                  Aucune boutique
                </td>
              </tr>
            )}
            {filtered.map((b) => (
              <tr key={b.id}>
                <td className="xa-table__name">{b.nom}</td>
                <td>{b.ville}</td>
                <td>{b.quartier ?? '—'}</td>
                <td><code className="xa-code">{b.code_unique}</code></td>
                <td>
                  <span className={`xa-badge xa-badge--${b.actif ? 'green' : 'red'}`}>
                    {b.actif ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(b.created_at).toLocaleDateString('fr-FR')}</td>
                <td>
                  <button
                    className="xa-btn xa-btn--sm xa-btn--ghost"
                    onClick={() => setSelectedId(b.id)}
                  >
                    Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <PartenaireDetailDrawer
          boutique={selected}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
