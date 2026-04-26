type Partenaire = {
  boutiqueId: string;
  nom: string;
  nbCommandes: number;
  ca: number;
};

type Props = {
  partenaires: Partenaire[];
};

export default function TopPartenaires({ partenaires }: Props) {
  const maxCa = partenaires[0]?.ca ?? 1;

  return (
    <div className="xa-stats-card">
      <h2 className="xa-stats-card__title">🏪 Top Partenaires (CA)</h2>
      {partenaires.length === 0 ? (
        <p style={{ color: 'var(--xa-muted)' }}>Aucune donnée ce mois</p>
      ) : (
        <ol className="xa-stats-list">
          {partenaires.map((p, i) => (
            <li key={p.boutiqueId} className="xa-stats-list__item">
              <span className="xa-stats-list__rank">#{i + 1}</span>
              <div className="xa-stats-list__info">
                <span className="xa-stats-list__name">{p.nom}</span>
                <span className="xa-stats-list__sub">{p.nbCommandes} commande(s)</span>
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
