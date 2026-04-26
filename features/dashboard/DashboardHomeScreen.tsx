'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Boutique, Profile } from '@/types/database';
import type { DashboardHomeData } from '@/app/api/dashboard/home/route';
import DashboardHeader from './components/DashboardHeader';
import KpiGrid from './components/KpiGrid';
import QuickActions from './components/QuickActions';
import AlertesStrip from './components/AlertesStrip';
import ActiviteRecente from './components/ActiviteRecente';
import TopProduits from './components/TopProduits';
import GraphCAMois from './components/GraphCAMois';

// ── Skeleton loaders ─────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="xa-home-kpi-grid xa-home-kpi-grid--skeleton">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="xa-home-kpi-card xa-home-skeleton" />
      ))}
    </div>
  );
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="xa-home-section xa-home-section--skeleton">
      <div className="xa-home-skeleton xa-home-skeleton--title" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="xa-home-skeleton xa-home-skeleton--row" />
      ))}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  profile: Pick<Profile, 'nom_complet'> | null;
  boutiques: Pick<Boutique, 'id' | 'nom' | 'couleur_theme'>[];
  initialBoutiqueId?: string | null;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardHomeScreen({ profile, boutiques, initialBoutiqueId }: Props) {
  const searchParams = useSearchParams();
  const boutiqueId = searchParams.get('boutique_id') ?? initialBoutiqueId ?? null;

  const [data, setData] = useState<DashboardHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const url = boutiqueId
      ? `/api/dashboard/home?boutique_id=${encodeURIComponent(boutiqueId)}`
      : '/api/dashboard/home';

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json() as Promise<DashboardHomeData>;
      })
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  const prenom = profile?.nom_complet?.split(' ')[0] ?? 'vous';

  return (
    <div className="xa-home">
      <DashboardHeader
        prenom={prenom}
        boutiques={boutiques}
        boutique_id={boutiqueId}
        synced={!error}
      />

      {error && (
        <div className="xa-home-error">
          ⚠️ Impossible de charger les données. Vérifiez votre connexion.
        </div>
      )}

      {/* KPI Grid */}
      {loading ? (
        <KpiSkeleton />
      ) : data ? (
        <KpiGrid kpis={data.kpis} />
      ) : null}

      {/* Quick Actions */}
      <QuickActions />

      {/* Alertes */}
      <div className="xa-home-section">
        <h2 className="xa-home-section-title">Alertes</h2>
        {loading ? (
          <div className="xa-home-alertes-strip xa-home-alertes-strip--skeleton">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="xa-home-skeleton xa-home-skeleton--chip" />
            ))}
          </div>
        ) : data ? (
          <AlertesStrip alertes={data.alertes} />
        ) : null}
      </div>

      {/* 2-column grid on desktop */}
      <div className="xa-home-grid-2col">
        <div>
          {loading ? (
            <SectionSkeleton rows={5} />
          ) : data ? (
            <ActiviteRecente activite={data.activite_recente} />
          ) : null}
        </div>
        <div>
          {loading ? (
            <SectionSkeleton rows={5} />
          ) : data ? (
            <TopProduits produits={data.top_produits} />
          ) : null}
        </div>
      </div>

      {/* CA 7 jours */}
      {loading ? (
        <SectionSkeleton rows={1} />
      ) : data ? (
        <GraphCAMois ca7j={data.ca_7_jours} />
      ) : null}
    </div>
  );
}
