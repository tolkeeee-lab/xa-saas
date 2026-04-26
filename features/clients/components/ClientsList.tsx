'use client';

import ClientCard from './ClientCard';
import type { Client } from '@/types/database';

type Props = {
  clients: Client[];
  loading: boolean;
  onClientClick: (c: Client) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
};

export default function ClientsList({
  clients,
  loading,
  onClientClick,
  onLoadMore,
  hasMore,
}: Props) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-xa-surface border border-xa-border animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-xa-muted text-sm">Aucun client trouvé.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {clients.map((client) => (
        <ClientCard key={client.id} client={client} onClick={() => onClientClick(client)} />
      ))}
      {hasMore && onLoadMore && (
        <button
          type="button"
          onClick={onLoadMore}
          className="w-full py-3 text-sm text-xa-primary font-semibold hover:underline"
        >
          Voir plus
        </button>
      )}
    </div>
  );
}
