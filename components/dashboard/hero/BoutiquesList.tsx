'use client';

import type { BoutiqueSummary } from '@/lib/supabase/dashboard/hero';
import BoutiqueListItem from './BoutiqueListItem';

type Props = {
  boutiques: BoutiqueSummary[];
};

export default function BoutiquesList({ boutiques }: Props) {
  if (!boutiques.length) {
    return (
      <div style={{ padding: '1rem', fontSize: 12, color: 'var(--xa-muted)', textAlign: 'center' }}>
        Aucune boutique active
      </div>
    );
  }

  return (
    <div>
      <div className="xa-bl-head">Boutiques</div>
      {boutiques.map((b, i) => (
        <BoutiqueListItem key={b.id} boutique={b} index={i} />
      ))}
    </div>
  );
}
