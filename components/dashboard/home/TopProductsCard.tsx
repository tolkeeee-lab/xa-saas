import type { TopProductsData } from '@/lib/supabase/dashboard/top-products';

type Props = { data: TopProductsData };

export default function TopProductsCard({ data }: Props) {
  return (
    <div className="xa-card">
      <div className="xa-card-header">
        <span className="xa-card-title">TOP 5 PRODUITS</span>
        <span className="xa-card-subtitle">Aujourd&apos;hui</span>
      </div>
      {!data.length ? (
        <div className="xa-card-empty">Aucune vente aujourd&apos;hui</div>
      ) : (
        <ol className="xa-top-products-list">
          {data.map((row) => (
            <li key={row.rank} className="xa-top-product-row">
              <span className="xa-tp-rank">{row.rank}</span>
              <div className="xa-tp-info">
                <span className="xa-tp-name">{row.name}</span>
                <span className="xa-tp-cat">{row.categorie}</span>
              </div>
              <span className="xa-tp-qty">{row.quantite} u.</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
