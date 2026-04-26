'use client';

import { useState } from 'react';
import { User, Pencil } from 'lucide-react';
import type { EffectiveRole } from '@/lib/auth/getEffectiveRole';
import EditProfilModal from '../modals/EditProfilModal';

const ROLE_LABELS: Record<EffectiveRole['role'], string> = {
  admin: 'Admin MAFRO',
  owner: 'Owner',
  manager: 'Gérant',
  staff: 'Caissier',
};

const ROLE_COLORS: Record<EffectiveRole['role'], string> = {
  admin: 'var(--xa-purple)',
  owner: 'var(--xa-primary)',
  manager: 'var(--xa-blue)',
  staff: 'var(--xa-muted)',
};

type ProfilSectionProps = {
  role: EffectiveRole;
};

export default function ProfilSection({ role }: ProfilSectionProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<EffectiveRole>(role);

  const initials = currentRole.displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

  return (
    <section className="bg-xa-surface border border-xa-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-xa-muted uppercase tracking-wider">Profil</h2>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-xa-border text-xa-text text-sm hover:bg-xa-bg2 transition-colors"
          style={{ minHeight: 40 }}
        >
          <Pencil size={14} />
          Modifier
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="flex items-center justify-center rounded-full text-white text-lg font-bold flex-shrink-0"
          style={{
            width: 56,
            height: 56,
            background: ROLE_COLORS[currentRole.role],
          }}
        >
          {initials || <User size={24} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-xa-text truncate">
              {currentRole.displayName}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold text-white flex-shrink-0"
              style={{ background: ROLE_COLORS[currentRole.role] }}
            >
              {ROLE_LABELS[currentRole.role]}
            </span>
          </div>
          <p className="text-sm text-xa-muted mt-0.5 truncate">{currentRole.email}</p>
          {currentRole.whatsapp && (
            <p className="text-sm text-xa-muted mt-0.5">{currentRole.whatsapp}</p>
          )}
        </div>
      </div>

      {editOpen && (
        <EditProfilModal
          role={currentRole}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            setCurrentRole((r) => ({
              ...r,
              displayName: updated.displayName ?? r.displayName,
              whatsapp: updated.whatsapp ?? r.whatsapp,
            }));
            setEditOpen(false);
          }}
        />
      )}
    </section>
  );
}
