type Produit = {
  nom: string;
  quantite: number;
  ca: number;
};

type Props = {
  produits: Produit[];
};

export default function TopProduits({ produits }: Props) {
  const maxCa = produits[0]?.ca ?? 1;

  return (
    <div className="xa-stats-card">
      <h2 className="xa-stats-card__title">🏆 Top Produits (CA)</h2>
      {produits.length === 0 ? (
        <p style={{ color: 'var(--xa-muted)' }}>Aucune donnée ce mois</p>
      ) : (
        <ol className="xa-stats-list">
          {produits.map((p, i) => (
            <li key={p.nom} className="xa-stats-list__item">
              <span className="xa-stats-list__rank">#{i + 1}</span>
              <div className="xa-stats-list__info">
                <span className="xa-stats-list__name">{p.nom}</span>
                <span className="xa-stats-list__sub">{p.quantite} unités vendues</span>
              </div>
              <div className="xa-stats-list__bar-wrap">
                <div
                  className="xa-stats-list__bar"
                  style={{ width: `${Math.round((p.ca / maxCa) * 100)}%` }}
                />
              </div>
              <span className="xa-stats-list__value">
                {(p.ca / 1000).toFixed(0)}k
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
