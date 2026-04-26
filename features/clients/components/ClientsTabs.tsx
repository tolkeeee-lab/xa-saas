'use client';

import type { Client } from '@/types/database';
import { getInactiveThresholdDate } from '@/features/clients/utils/clientUtils';

export type ClientsTab = 'tous' | 'avec_credit' | 'opt_in_whatsapp' | 'inactifs';

type Props = {
  active: ClientsTab;
  onChange: (t: ClientsTab) => void;
  counts: Record<ClientsTab, number>;
};

const TAB_LABELS: Record<ClientsTab, string> = {
  tous: 'Tous',
  avec_credit: 'Avec crédit',
  opt_in_whatsapp: '📱 WhatsApp',
  inactifs: 'Inactifs',
};

export default function ClientsTabs({ active, onChange, counts }: Props) {
  return (
    <div className="flex border-b border-xa-border bg-xa-surface overflow-x-auto">
      {(Object.keys(TAB_LABELS) as ClientsTab[]).map((tab) => {
        const count = counts[tab];
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={`flex-1 min-w-max py-3 text-sm font-medium flex items-center justify-center gap-1 transition-colors whitespace-nowrap px-3 ${
              active === tab
                ? 'border-b-2 border-xa-primary text-xa-text font-semibold'
                : 'text-xa-muted'
            }`}
          >
            {TAB_LABELS[tab]}
            {count > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  active === tab
                    ? 'bg-xa-primary/10 text-xa-primary'
                    : 'bg-xa-border text-xa-muted'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Utility: compute tab counts from client list
export function computeTabCounts(clients: Client[]): Record<ClientsTab, number> {
  const threshold = getInactiveThresholdDate();
  return {
    tous: clients.length,
    avec_credit: clients.filter((c) => (c.credit_actuel ?? 0) > 0).length,
    opt_in_whatsapp: clients.filter((c) => c.opt_in_whatsapp).length,
    inactifs: clients.filter(
      (c) => !c.derniere_visite_at || c.derniere_visite_at < threshold,
    ).length,
  };
}
