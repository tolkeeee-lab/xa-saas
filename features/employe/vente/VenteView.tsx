'use client';

import { useState } from 'react';
import VenteTopbar from './VenteTopbar';
import VenteTabs from './VenteTabs';
import TabVentes from './TabVentes';
import TabHistorique from './TabHistorique';
import TabDettes from './TabDettes';
import type { VenteKpi, BoutiqueInfo, EmployeInfo, VenteTab, Transaction, TopProduit, DetteFiche } from './types';

interface Props {
  kpi: VenteKpi;
  boutique: BoutiqueInfo;
  employe: EmployeInfo;
  nbDettes: number;
  txJour: Transaction[];
  topProduits: TopProduit[];
  transactions: Transaction[];
  dettes: DetteFiche[];
}

export default function VenteView({ kpi, boutique, employe, nbDettes, txJour, topProduits, transactions, dettes }: Props) {
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
          <TabDettes dettes={dettes} />
        )}
      </div>
    </div>
  );
}
