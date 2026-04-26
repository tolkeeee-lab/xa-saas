'use client';

import Link from 'next/link';
import { formatFCFA } from '@/lib/format';
import type { DashboardTopProduit } from '@/app/api/dashboard/home/route';

type Props = {
  produits: DashboardTopProduit[];
};

export default function TopProduits({ produits }: Props) {
  return (
    <div className="xa-home-section">
      <div className="xa-home-section-header">
        <h2 className="xa-home-section-title">Top produits du jour</h2>
        <Link href="/dashboard/stock" className="xa-home-section-link">
          Voir stock →
        </Link>
      </div>
      {produits.length === 0 ? (
        <div className="xa-home-top-produits-empty">
          Aucune vente aujourd&apos;hui
        </div>
      ) : (
        <ol className="xa-home-top-produits-list">
          {produits.map((p, idx) => (
            <li key={`${idx}-${p.produit_id || p.nom}`} className="xa-home-top-produit-row">
              <span className="xa-home-top-produit-rank">{idx + 1}</span>
              <span className="xa-home-top-produit-nom">{p.nom}</span>
              <span className="xa-home-top-produit-qte">{p.qte} u.</span>
              <span className="xa-home-top-produit-ca">{formatFCFA(p.ca)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
