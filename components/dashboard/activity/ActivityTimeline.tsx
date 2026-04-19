'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase-browser';
import { useDashboardFilter } from '@/context/DashboardFilterContext';
import type { ActivityEvent } from '@/lib/supabase/dashboard/activity';
import ActivityItem from './ActivityItem';
import DayGroup from './DayGroup';

type Props = {
  initialEvents: ActivityEvent[];
  userId: string;
};

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const eventDay = new Date(d);
  eventDay.setHours(0, 0, 0, 0);

  if (eventDay.getTime() === today.getTime()) return "Aujourd'hui";
  if (eventDay.getTime() === yesterday.getTime()) return 'Hier';

  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function groupByDay(events: ActivityEvent[]): { label: string; events: ActivityEvent[] }[] {
  const groups: { label: string; events: ActivityEvent[] }[] = [];
  const labelMap = new Map<string, ActivityEvent[]>();

  for (const ev of events) {
    const label = getDayLabel(ev.created_at);
    if (!labelMap.has(label)) {
      labelMap.set(label, []);
      groups.push({ label, events: labelMap.get(label)! });
    }
    labelMap.get(label)!.push(ev);
  }

  return groups;
}

export default function ActivityTimeline({ initialEvents, userId }: Props) {
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents);
  const [, setTick] = useState(0);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  const { activeStoreId, activeType } = useDashboardFilter();

  // Auto-refresh relative times every 15s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  // Subscribe to Realtime
  useEffect(() => {
    const supabase = createClient();

    channelRef.current = supabase
      .channel(`activity:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_events',
          filter: `proprietaire_id=eq.${userId}`,
        },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          const newEvent: ActivityEvent = {
            id: raw.id as string,
            type: raw.type as ActivityEvent['type'],
            severity: raw.severity as ActivityEvent['severity'],
            title: raw.title as string,
            description: (raw.description as string | null) ?? null,
            amount: (raw.amount as number | null) ?? null,
            boutique: null, // Realtime doesn't include joins; resolved from existing data
            metadata: (raw.metadata as Record<string, unknown>) ?? {},
            created_at: raw.created_at as string,
          };
          setEvents((prev) => [newEvent, ...prev].slice(0, 200));
        },
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [userId]);

  // Apply client-side filters
  const filtered = useMemo(() => {
    return events.filter((ev) => {
      if (activeStoreId !== 'all' && ev.boutique?.id !== activeStoreId) {
        // Allow events without boutique link (system events) when filtering
        if (ev.boutique !== null) return false;
      }
      if (activeType !== 'all' && ev.type !== activeType) return false;
      return true;
    });
  }, [events, activeStoreId, activeType]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);
  const visibleCount = filtered.length;

  return (
    <div className="xa-timeline">
      {/* Header */}
      <div className="xa-tl-head">
        <div className="xa-tl-title">
          <div className="xa-tl-dot" />
          ACTIVITÉ LIVE
        </div>
        <span style={{ fontFamily: 'var(--font-plex-mono), monospace', fontSize: 10, color: 'var(--xa-muted)' }}>
          {visibleCount}
        </span>
      </div>

      {/* Events grouped by day */}
      {groups.length === 0 ? (
        <div className="xa-tl-empty">
          Aucune activité pour le moment
          {process.env.NODE_ENV === 'development' && (
            <div style={{ marginTop: '0.75rem', fontSize: 11, color: 'var(--xa-faint)' }}>
              Insérez un event via SQL pour le voir apparaître ici
            </div>
          )}
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {groups.map((group) => (
            <div key={group.label}>
              <DayGroup label={group.label} />
              {group.events.map((ev) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <ActivityItem event={ev} />
                </motion.div>
              ))}
            </div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
