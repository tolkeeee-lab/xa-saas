import type { ReactNode } from 'react';
import { Suspense } from 'react';
import FilterBar from './FilterBar';
import { DashboardFilterProvider } from '@/context/DashboardFilterContext';
import type { Boutique } from '@/types/database';

type DashboardShellProps = {
  userInitials: string;
  unreadCount?: number;
  boutiques: Boutique[];
  leftColumn: ReactNode;
  centerColumn: ReactNode;
  rightColumn: ReactNode;
};

export default function DashboardShell({
  boutiques,
  leftColumn,
  centerColumn,
  rightColumn,
}: DashboardShellProps) {
  return (
    <DashboardFilterProvider>
      <div className="xa-shell-wrap xa-dashboard-body">
        {/* Filter bar */}
        <Suspense>
          <FilterBar boutiques={boutiques} />
        </Suspense>

        {/* 3-column grid */}
        <div className="xa-shell">
          <div className="xa-col xa-col-left">{leftColumn}</div>
          <div className="xa-col xa-col-center">{centerColumn}</div>
          <div className="xa-col xa-col-right">{rightColumn}</div>
        </div>
      </div>
    </DashboardFilterProvider>
  );
}
