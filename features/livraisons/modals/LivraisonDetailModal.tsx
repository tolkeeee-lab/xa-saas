'use client';

import { useEffect, useState } from 'react';
import { X, Phone, ExternalLink } from 'lucide-react';
import type { Livraison, CommandeB2B } from '@/types/database';
import StatutTimeline from '@/features/livraisons/components/StatutTimeline';
import MiniMap from '@/features/livraisons/components/MiniMap';
import RetardBadge from '@/features/livraisons/components/RetardBadge';

type Props = {
  livraisonId: string;
  onClose: () => void;
};

type LivraisonDetail = Livraison & {
  commande_b2b: CommandeB2B | null;
};

type TrackingData = {
  statut: Livraison['statut'];
  position_actuelle_lat: number | null;
  position_actuelle_lng: number | null;
  last_ping: string | null;
};

const STATUT_CONFIG: Record<Livraison['statut'], { label: string; classes: string }> = {
  preparation: {
    label: 'Préparation',
    classes: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  en_route: {
    label: 'En route',
    classes: 'bg-violet-100 text-violet-700 border-violet-200',
  },
  livree: {
    label: 'Livrée',
    classes: 'bg-green-100 text-green-700 border-green-200',
  },
  retournee: {
    label: 'Retournée',
    classes: 'bg-red-100 text-red-700 border-red-200',
  },
};

function getLastPingLabel(lastPing: string | null): string {
  if (!lastPing) return 'Jamais mise à jour';
  const diffMs = Date.now() - new Date(lastPing).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Position MAJ il y a moins de 1 min';
  if (diffMin < 60) return `Position MAJ il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  return `Position MAJ il y a ${diffH}h`;
}

function getETA(partiAt: string | null): string | null {
  if (!partiAt) return null;
  const eta = new Date(new Date(partiAt).getTime() + 2 * 60 * 60 * 1000);
  return eta.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function LivraisonDetailModal({ livraisonId, onClose }: Props) {
  const [detail, setDetail] = useState<LivraisonDetail | null>(null);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load full detail once on open
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/livraisons/${livraisonId}`);
        const data = (await res.json()) as LivraisonDetail & { error?: string };
        if (!res.ok) {
          setError(data.error ?? 'Erreur');
          return;
        }
        if (!cancelled) {
          setDetail(data);
          setTracking({
            statut: data.statut,
            position_actuelle_lat: data.position_actuelle_lat,
            position_actuelle_lng: data.position_actuelle_lng,
            last_ping: data.last_ping,
          });
        }
      } catch {
        if (!cancelled) setError('Erreur réseau');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [livraisonId]);

  // Polling for en_route status — refresh tracking every 30s
  useEffect(() => {
    if (!detail || detail.statut !== 'en_route') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/livraisons/${livraisonId}/tracking`);
        if (res.ok) {
          const data = (await res.json()) as TrackingData;
          setTracking(data);
          // If status changed, update detail too
          if (data.statut !== detail.statut) {
            setDetail((prev) => prev ? { ...prev, statut: data.statut } : prev);
          }
        }
      } catch {
        // silently ignore polling errors
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [detail, livraisonId]);

  const currentStatut = tracking?.statut ?? detail?.statut ?? 'preparation';
  const currentLat = tracking?.position_actuelle_lat ?? detail?.position_actuelle_lat ?? null;
  const currentLng = tracking?.position_actuelle_lng ?? detail?.position_actuelle_lng ?? null;
  const currentLastPing = tracking?.last_ping ?? detail?.last_ping ?? null;

  const statut = detail ? STATUT_CONFIG[currentStatut] : null;
  const eta = currentStatut === 'en_route' ? getETA(detail?.parti_at ?? null) : null;

  const destinationUrl =
    detail?.destination_lat && detail?.destination_lng
      ? `https://maps.google.com/?q=${detail.destination_lat},${detail.destination_lng}`
      : null;

  return (
    <div className="xa-modal-backdrop">
      <div className="xa-modal-box">
        <div className="xa-modal-body">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              {detail ? (
                <>
                  <h2 className="font-bold text-xa-text text-lg">{detail.numero}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {statut && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statut.classes}`}
                      >
                        {statut.label}
                      </span>
                    )}
                    <RetardBadge partiAt={detail.parti_at} statut={currentStatut} />
                  </div>
                </>
              ) : (
                <div className="h-6 w-32 bg-xa-border rounded animate-pulse" />
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-xa-muted hover:text-xa-text p-1 flex-shrink-0"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          {loading && (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-xa-border rounded animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3">
              {error}
            </p>
          )}

          {detail && !loading && (
            <div className="flex flex-col gap-5">
              {/* Timeline */}
              <div className="p-3 rounded-xl border border-xa-border bg-xa-bg">
                <StatutTimeline statut={currentStatut} />
              </div>

              {/* ETA */}
              {eta && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-xa-muted">ETA estimée</span>
                  <span className="font-semibold text-xa-text">{eta}</span>
                </div>
              )}

              {/* MiniMap — current position */}
              {currentLat !== null && currentLng !== null && (
                <div>
                  <p className="text-xs text-xa-muted mb-2">
                    {getLastPingLabel(currentLastPing)}
                  </p>
                  <MiniMap lat={currentLat} lng={currentLng} label="Position chauffeur" />
                </div>
              )}

              {/* Driver info */}
              {(detail.chauffeur || detail.vehicule) && (
                <div className="flex flex-col gap-2 p-3 rounded-xl border border-xa-border bg-xa-bg">
                  <p className="text-xs font-semibold text-xa-muted uppercase tracking-wide">
                    Chauffeur
                  </p>
                  {detail.chauffeur && (
                    <p className="text-sm text-xa-text font-medium">{detail.chauffeur}</p>
                  )}
                  {detail.vehicule && (
                    <p className="text-xs text-xa-muted">🚗 {detail.vehicule}</p>
                  )}
                  {/* Call button — only if chauffeur looks like a phone number */}
                  {detail.chauffeur && /^[+\d\s\-()]{7,}$/.test(detail.chauffeur) && (
                    <a
                      href={`tel:${detail.chauffeur.replace(/\s/g, '')}`}
                      className="flex items-center justify-center gap-2 w-full bg-green-600 text-white font-semibold rounded-xl py-2.5 text-sm min-h-[44px] mt-1"
                    >
                      <Phone size={16} />
                      Appeler le chauffeur
                    </a>
                  )}
                </div>
              )}

              {/* B2B commande link */}
              {detail.commande_b2b && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-xa-border bg-xa-bg">
                  <div>
                    <p className="text-xs text-xa-muted">Commande B2B liée</p>
                    <p className="text-sm font-medium text-xa-text">
                      {detail.commande_b2b.numero}
                    </p>
                  </div>
                  <a
                    href={`/dashboard/b2b?commande=${detail.commande_b2b_id}`}
                    className="flex items-center gap-1 text-xs text-xa-primary font-medium hover:underline min-h-[44px] px-2"
                  >
                    Voir <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {/* Destination link */}
              {destinationUrl && (
                <a
                  href={destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm text-xa-primary border border-xa-border rounded-xl py-2.5 min-h-[44px]"
                >
                  📍 Voir la destination
                </a>
              )}

              {/* Note */}
              {detail.note && (
                <div className="p-3 rounded-xl border border-xa-border bg-xa-bg">
                  <p className="text-xs text-xa-muted mb-1">Note</p>
                  <p className="text-sm text-xa-text">{detail.note}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
