import type { ActivityEvent } from '@/lib/supabase/dashboard/activity';
import { timeAgo } from '@/lib/format/time-ago';
import { formatFCFA } from '@/lib/format';

type Props = {
  event: ActivityEvent;
};

const DOT_CLASS: Record<string, string> = {
  sale: 'xa-event-dot xa-event-dot-sale',
  alert: 'xa-event-dot xa-event-dot-alert',
  stock: 'xa-event-dot xa-event-dot-stock',
  staff: 'xa-event-dot xa-event-dot-staff',
  goal: 'xa-event-dot xa-event-dot-goal',
  system: 'xa-event-dot xa-event-dot-system',
};

export default function ActivityItem({ event }: Props) {
  const dotClass = DOT_CLASS[event.type] ?? 'xa-event-dot xa-event-dot-system';

  return (
    <div className="xa-event">
      <div className={dotClass} />

      <div className="xa-event-title">
        <span>{event.title}</span>
        {event.amount != null && event.type === 'sale' && (
          <span className="xa-event-amount">{formatFCFA(event.amount)}</span>
        )}
      </div>

      {event.description && (
        <div className="xa-event-desc">{event.description}</div>
      )}

      <div className="xa-event-meta">
        {event.boutique?.name && (
          <>
            <span>{event.boutique.name}</span>
            <span> · </span>
          </>
        )}
        <span>{timeAgo(event.created_at)}</span>
      </div>
    </div>
  );
}
