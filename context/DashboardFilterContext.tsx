'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export type DashboardFilter = {
  activeStoreId: string;
  activeType: string;
  setStoreFilter: (storeId: string) => void;
  setTypeFilter: (type: string) => void;
  clearFilters: () => void;
};

const DashboardFilterContext = createContext<DashboardFilter>({
  activeStoreId: 'all',
  activeType: 'all',
  setStoreFilter: () => {},
  setTypeFilter: () => {},
  clearFilters: () => {},
});

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeStoreId, setActiveStoreId] = useState<string>(
    searchParams.get('store') ?? 'all',
  );
  const [activeType, setActiveType] = useState<string>(
    searchParams.get('type') ?? 'all',
  );

  // Sync state when URL changes externally (e.g. navigation)
  useEffect(() => {
    setActiveStoreId(searchParams.get('store') ?? 'all');
    setActiveType(searchParams.get('type') ?? 'all');
  }, [searchParams]);

  const setStoreFilter = useCallback(
    (storeId: string) => {
      setActiveStoreId(storeId);
      const params = new URLSearchParams(searchParams.toString());
      if (storeId === 'all') {
        params.delete('store');
      } else {
        params.set('store', storeId);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const setTypeFilter = useCallback(
    (type: string) => {
      setActiveType(type);
      const params = new URLSearchParams(searchParams.toString());
      if (type === 'all') {
        params.delete('type');
      } else {
        params.set('type', type);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const clearFilters = useCallback(() => {
    setActiveStoreId('all');
    setActiveType('all');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('store');
    params.delete('type');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  return (
    <DashboardFilterContext.Provider
      value={{ activeStoreId, activeType, setStoreFilter, setTypeFilter, clearFilters }}
    >
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilter() {
  return useContext(DashboardFilterContext);
}
