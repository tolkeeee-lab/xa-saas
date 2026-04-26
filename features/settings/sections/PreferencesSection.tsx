'use client';

import { useState, useEffect } from 'react';
import { Bell, Volume2, Moon } from 'lucide-react';

type PrefKey = 'notif_whatsapp' | 'sons_caisse' | 'mode_sombre';

const PREFS: { key: PrefKey; label: string; icon: React.ReactNode; disabled?: boolean; soon?: boolean }[] = [
  {
    key: 'notif_whatsapp',
    label: 'Notifications WhatsApp',
    icon: <Bell size={18} className="text-xa-muted" />,
  },
  {
    key: 'sons_caisse',
    label: 'Sons caisse',
    icon: <Volume2 size={18} className="text-xa-muted" />,
  },
  {
    key: 'mode_sombre',
    label: 'Mode sombre',
    icon: <Moon size={18} className="text-xa-muted" />,
    disabled: true,
    soon: true,
  },
];

export default function PreferencesSection() {
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({
    notif_whatsapp: false,
    sons_caisse: true,
    mode_sombre: false,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('xa-settings-prefs');
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Record<PrefKey, boolean>>;
        setPrefs((p) => ({ ...p, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  function toggle(key: PrefKey) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('xa-settings-prefs', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <section className="bg-xa-surface border border-xa-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-xa-muted uppercase tracking-wider mb-4">
        Préférences
      </h2>

      <ul className="space-y-1">
        {PREFS.map(({ key, label, icon, disabled, soon }) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => !disabled && toggle(key)}
              disabled={disabled}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-xa-bg2 transition-colors disabled:cursor-default"
              style={{ minHeight: 48 }}
            >
              {icon}
              <span className="flex-1 text-sm text-xa-text text-left">
                {label}
                {soon && <span className="ml-2 text-xs text-xa-muted">(Bientôt)</span>}
              </span>
              {/* Toggle pill */}
              <span
                className="relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200"
                style={{
                  background: prefs[key] && !disabled ? 'var(--xa-primary)' : 'var(--xa-border)',
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                <span
                  className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                  style={{ transform: prefs[key] ? 'translateX(16px)' : 'translateX(0)' }}
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
