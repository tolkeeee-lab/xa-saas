import type { StaffData } from '@/lib/supabase/dashboard/staff-status';

type Props = { data: StaffData };

const STATUS_COLORS: Record<string, string> = {
  SERVICE: 'var(--xa-green)',
  PAUSE: 'var(--xa-amber)',
  OFF: 'var(--xa-muted)',
};

export default function StaffCard({ data }: Props) {
  return (
    <div className="xa-card">
      <div className="xa-card-header">
        <span className="xa-card-title">PERSONNEL</span>
        <span className="xa-card-subtitle">{data.activeCount}/{data.totalCount} en service</span>
      </div>
      {!data.rows.length ? (
        <div className="xa-card-empty">Aucun employé</div>
      ) : (
        <div className="xa-staff-list">
          {data.rows.map((row) => (
            <div key={row.id} className="xa-staff-row">
              <div className="xa-staff-avatar">{row.initials}</div>
              <div className="xa-staff-info">
                <span className="xa-staff-name">{row.name}</span>
                <span className="xa-staff-boutique">{row.boutique} · {row.role}</span>
              </div>
              <span className="xa-staff-status" style={{ color: STATUS_COLORS[row.status] }}>
                {row.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
