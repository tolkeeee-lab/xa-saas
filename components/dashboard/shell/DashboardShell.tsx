import type { ReactNode } from 'react';
import { Suspense } from 'react';
import TopBar from './TopBar';
import FilterBar from './FilterBar';
import { DashboardFilterProvider } from '@/context/DashboardFilterContext';
import { NotifProvider } from '@/context/NotifContext';
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
  userInitials,
  unreadCount = 0,
  boutiques,
  leftColumn,
  centerColumn,
  rightColumn,
}: DashboardShellProps) {
  return (
    <NotifProvider>
      <DashboardFilterProvider>
        <div className="xa-shell-wrap xa-dashboard-body">
          {/* Top bar */}
          <TopBar userInitials={userInitials} unreadCount={unreadCount} />

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
    </NotifProvider>
  );
}
