'use client';

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  accent?: boolean;
  animate?: boolean;
  color?: string;
  badge?: string;
  emoji?: string;
};

function useCountUp(target: number, duration = 1200, enabled = false) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || target === 0) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, enabled]);

  return display;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accent,
  animate = false,
  color,
  badge,
  emoji,
}: StatCardProps) {
  const isNumeric = typeof value === 'number';
  const numericTarget = isNumeric ? (value as number) : 0;
  const counted = useCountUp(numericTarget, 1200, animate && isNumeric);

  const displayValue = animate && isNumeric ? counted : value;

  const borderLeftStyle: CSSProperties = color
    ? { borderLeftColor: color, borderLeftWidth: '4px' }
    : {};

  return (
    <div
      className={`bg-xa-surface border border-xa-border rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-md ${
        accent && !color ? 'border-l-4 border-l-xa-accent' : ''
      } ${color ? 'border-l-4' : ''}`}
      style={{
        ...borderLeftStyle,
        animation: 'xa-fade-up 0.4s ease both',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-xa-muted uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {badge && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(245,116,10,0.15)',
                color: '#f5740a',
                animation: 'xa-badge-pulse 2s ease-in-out infinite',
              }}
            >
              {badge}
            </span>
          )}
          {emoji && (
            <span className="text-xl leading-none select-none">{emoji}</span>
          )}
          {icon && !emoji && <span className="text-xa-muted">{icon}</span>}
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-bold text-xa-text tabular-nums">{displayValue}</span>
        {trend && (
          <span
            className={`text-xs font-semibold ${
              trend === 'up'
                ? 'text-aquamarine-600'
                : trend === 'down'
                ? 'text-xa-danger'
                : 'text-xa-muted'
            }`}
          >
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-xa-muted">{subtitle}</p>}
    </div>
  );
}
