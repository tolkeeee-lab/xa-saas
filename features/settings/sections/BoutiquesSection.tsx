'use client';

import { useState, useEffect, useCallback } from 'react';
import { Store, ChevronRight, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import type { EffectiveRole } from '@/lib/auth/getEffectiveRole';
import type { Boutique } from '@/types/database';
import AddBoutiqueModal from '../modals/AddBoutiqueModal';
import EditBoutiqueModal from '../modals/EditBoutiqueModal';

type BoutiquesSectionProps = {
  role: EffectiveRole;
};

export default function BoutiquesSection({ role }: BoutiquesSectionProps) {
  const supabase = createClient();
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Boutique | null>(null);

  const loadBoutiques = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('boutiques').select('*').order('created_at', { ascending: true });
    if (role.role === 'owner') {
      query = query.eq('proprietaire_id', role.userId);
    }
    const { data } = await query;
    setBoutiques(data ?? []);
    setLoading(false);
  }, [supabase, role]);

  useEffect(() => {
    loadBoutiques();
  }, [loadBoutiques]);

  return (
    <section className="bg-xa-surface border border-xa-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-xa-muted uppercase tracking-wider">
          Boutiques
        </h2>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-xa-bg2 animate-pulse" />
          ))}
        </div>
      ) : boutiques.length === 0 ? (
        <p className="text-sm text-xa-muted py-4 text-center">Aucune boutique</p>
      ) : (
        <ul className="space-y-1 mb-4">
          {boutiques.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setEditTarget(b)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-xa-bg2 transition-colors text-left"
                style={{ minHeight: 48 }}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: b.couleur ?? b.couleur_theme ?? 'var(--xa-primary)' }}
                />
                <Store size={16} className="text-xa-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-xa-text truncate">{b.nom}</p>
                  {(b.zone ?? b.ville) && (
                    <p className="text-xs text-xa-muted truncate">{b.zone ?? b.ville}</p>
                  )}
                </div>
                {b.est_actif === false && (
                  <span className="text-xs text-xa-muted bg-xa-bg2 px-2 py-0.5 rounded-full flex-shrink-0">
                    Inactive
                  </span>
                )}
                <ChevronRight size={16} className="text-xa-muted flex-shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-colors"
        style={{
          minHeight: 48,
          background: 'var(--xa-primary)',
          color: '#fff',
        }}
      >
        <Plus size={18} />
        Ajouter une boutique
      </button>

      {addOpen && (
        <AddBoutiqueModal
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false);
            loadBoutiques();
          }}
        />
      )}

      {editTarget && (
        <EditBoutiqueModal
          boutique={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            loadBoutiques();
          }}
          onDeleted={() => {
            setEditTarget(null);
            loadBoutiques();
          }}
        />
      )}
    </section>
  );
}
