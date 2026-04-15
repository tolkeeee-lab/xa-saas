'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import type { AppNotification } from '@/lib/supabase/getNotifications';

type NotifContextType = {
  notifications: AppNotification[];
};

const NotifContext = createContext<NotifContextType>({ notifications: [] });

export function NotifProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const res = await fetch('/api/notifications');
        const data = (await res.json()) as { notifications?: AppNotification[] };
        setNotifications(data.notifications ?? []);
      } catch {
        // ignore
      }
    }
    void fetchNotifs();
    const interval = setInterval(() => void fetchNotifs(), 60_000);
    return () => clearInterval(interval);
  }, []);

  return <NotifContext.Provider value={{ notifications }}>{children}</NotifContext.Provider>;
}

export function useNotifs() {
  return useContext(NotifContext);
}
