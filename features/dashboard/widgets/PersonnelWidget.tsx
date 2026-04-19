'use client';

import { useRouter } from 'next/navigation';
import type {
  PersonnelActivityData,
  PersonnelActivityRow,
} from '@/lib/supabase/getPersonnelActivity';

type Props = { data: PersonnelActivityData };

export default function PersonnelWidget({ data }: Props) {
  const router = useRouter();

  function goToEquipe(employeId?: string) {
    const base = '/dashboard/equipe';
    router.push(employeId ? `${base}?highlight=${employeId}` : base);
  }

  const visible = data.rows.slice(0, 5);
  const hasMore = data.rows.length > 5;

  return (
    <div className="xa-card xa-personnel-widget">
      {/* Header */}
      <div
        className="xa-card-header xa-personnel-header"
        onClick={() => goToEquipe()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && goToEquipe()}
        aria-label="Voir tout le personnel"
      >
        <span className="xa-card-title">Personnel</span>
        <span className="xa-personnel-counter">
          {data.nb_actifs}/{data.nb_total} actifs
        </span>
      </div>

      {/* Empty state */}
      {data.rows.length === 0 && (
        <div className="xa-card-empty xa-personnel-empty">
          <p>Aucun employé actif</p>
          <button
            type="button"
            className="xa-personnel-cta"
            onClick={() => goToEquipe()}
          >
            + Ajouter un employé
          </button>
        </div>
      )}

      {/* List */}
      {visible.length > 0 && (
        <ul className="xa-personnel-list">
          {visible.map((row, idx) => (
            <PersonnelRow
              key={row.id}
              row={row}
              isLast={idx === visible.length - 1}
              onClick={() => goToEquipe(row.id)}
            />
          ))}
        </ul>
      )}

      {hasMore && (
        <button
          type="button"
          className="xa-personnel-see-all"
          onClick={() => goToEquipe()}
        >
          Voir tout l&apos;équipe →
        </button>
      )}
    </div>
  );
}

function PersonnelRow({
  row,
  isLast,
  onClick,
}: {
  row: PersonnelActivityRow;
  isLast: boolean;
  onClick: () => void;
}) {
  const isService = row.status === 'service';
  const avatarBg = isService ? 'rgba(0,200,83,.12)' : 'rgba(255,152,0,.14)';
  const avatarFg = isService ? 'var(--xa-green)' : 'var(--xa-amber)';
  const pillBg = isService ? 'rgba(0,200,83,.10)' : 'rgba(255,152,0,.12)';
  const pillFg = isService ? 'var(--xa-green)' : 'var(--xa-amber)';

  return (
    <li
      className="xa-personnel-row"
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--xa-rule)' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`${row.prenom} ${row.nom} — ${row.status}`}
    >
      <div
        className="xa-personnel-avatar"
        style={{ background: avatarBg, color: avatarFg }}
      >
        {row.initiales}
      </div>
      <div className="xa-personnel-info">
        <span className="xa-personnel-name">
          {row.prenom} {row.nom ? row.nom.charAt(0) + '.' : ''}
        </span>
        <span className="xa-personnel-sub">
          {row.boutique_nom} · {row.role_label}
        </span>
      </div>
      <span
        className="xa-personnel-pill"
        style={{ background: pillBg, color: pillFg }}
      >
        {isService ? 'Service' : 'Pause'}
      </span>
    </li>
  );
}
