'use client';

import { useState } from 'react';
import VenteTopbar from './VenteTopbar';
import VenteTabs from './VenteTabs';
import TabVentes from './TabVentes';
import TabHistorique from './TabHistorique';
import type { VenteKpi, BoutiqueInfo, EmployeInfo, VenteTab, Transaction, TopProduit } from './types';

interface Props {
  kpi: VenteKpi;
  boutique: BoutiqueInfo;
  employe: EmployeInfo;
  nbDettes: number;
  txJour: Transaction[];
  topProduits: TopProduit[];
  transactions: Transaction[];
}

export default function VenteView({ kpi, boutique, employe, nbDettes, txJour, topProduits, transactions }: Props) {
  const [tab, setTab] = useState<VenteTab>('ventes');

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', overflow: 'hidden',
      background: 'var(--xa-bg)',
      maxWidth: 430, margin: '0 auto',
    }}>
      <VenteTopbar kpi={kpi} boutique={boutique} employe={employe} />
      <VenteTabs active={tab} onChange={setTab} nbDettes={nbDettes} />

      {/* Corps — placeholder pour les prochaines PRs */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 16px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {tab === 'ventes' && (
          <TabVentes txJour={txJour} topProduits={topProduits} />
        )}
        {tab === 'historique' && (
          <TabHistorique transactions={transactions} />
        )}
        {tab === 'dettes' && (
          <div style={{
            background: 'var(--xa-surface)', borderRadius: 16,
            border: '1px solid var(--xa-border)', padding: 24,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <div style={{
              fontFamily: 'var(--font-familjen, system-ui)',
              fontSize: 14, fontWeight: 700, color: 'var(--xa-ink)',
            }}>Dettes en cours de construction</div>
            <div style={{ fontSize: 12, color: 'var(--xa-muted)', marginTop: 4 }}>
              PR 4/4 — Créances + Modal paiement
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
