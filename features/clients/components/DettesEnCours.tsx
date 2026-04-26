'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatFCFA } from '@/lib/format';
import type { Dette } from '@/types/database';

type Props = {
  clientId: string;
};

type DettesResponse = {
  data: Dette[];
  total_du: number;
};

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  en_retard: 'En retard',
};

const STATUT_COLORS: Record<string, string> = {
  en_attente: 'text-amber-600',
  en_retard: 'text-red-600',
};

export default function DettesEnCours({ clientId }: Props) {
  const [dettes, setDettes] = useState<Dette[]>([]);
  const [totalDu, setTotalDu] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/clients/${clientId}/dettes`)
      .then((r) => r.json())
      .then((json: DettesResponse) => {
        setDettes(json.data ?? []);
        setTotalDu(json.total_du ?? 0);
      })
      .catch(() => {
        setDettes([]);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-xa-border/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (dettes.length === 0) {
    return (
      <p className="text-xs text-xa-muted text-center py-4">
        Aucune dette en cours pour ce client. ✅
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-xa-muted font-medium">Total dû</p>
        <p className="text-sm font-bold text-amber-600">{formatFCFA(totalDu)}</p>
      </div>
      {dettes.map((dette) => {
        const restant = dette.montant - dette.montant_rembourse;
        return (
          <div
            key={dette.id}
            className="flex items-start gap-2 py-2 border-b border-xa-border last:border-0"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle size={14} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-xa-text truncate">
                {dette.description ?? 'Crédit boutique'}
              </p>
              <p className={`text-xs ${STATUT_COLORS[dette.statut] ?? 'text-xa-muted'}`}>
                {STATUT_LABELS[dette.statut] ?? dette.statut}
                {dette.date_echeance &&
                  ` · ${new Date(dette.date_echeance).toLocaleDateString('fr-FR')}`}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-amber-600">{formatFCFA(restant)}</p>
              <p className="text-xs text-xa-muted">/ {formatFCFA(dette.montant)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
