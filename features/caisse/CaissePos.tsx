'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Boutique, ProduitPublic, Client } from '@/types/database';
import ProduitCard from '@/features/stocks/ProduitCard';
import Panier, { type CartItem, type PayMode } from '@/features/caisse/Panier';
import TicketCaisse, { type TicketData } from '@/features/caisse/TicketCaisse';
import { formatFCFA } from '@/lib/format';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { enqueueSale, saveProduits, loadProduits, type OfflineSale } from '@/lib/offline/offlineQueue';
import { calculatePrix, POINTS_REMISE_SEUIL } from '@/lib/pricing';

interface CaissePosProps {
  boutiques: Boutique[];
  produits: ProduitPublic[];
  userId: string;
}

// ——— Types for day summary ——————————————————————————————————————————————————

type ResumeTransaction = {
  id: string;
  montant_total: number;
  mode_paiement: string;
  created_at: string;
};

type ResumeCaisse = {
  transactions: ResumeTransaction[];
  total_encaisse: number;
  nb_transactions: number;
  par_mode: Record<string, number>;
};

// ——— ResumeCaissePanel ————————————————————————————————————————————————————————

function ResumeCaissePanel({
  boutiqueId,
  refreshKey,
}: {
  boutiqueId: string;
  refreshKey: number;
}) {
  const [resume, setResume] = useState<ResumeCaisse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!boutiqueId) return;
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/api/transactions?boutique_id=${boutiqueId}&date=${today}`)
      .then((r) => r.json())
      .then((data: ResumeCaisse) => setResume(data))
      .catch(() => setResume(null))
      .finally(() => setLoading(false));
  }, [boutiqueId, refreshKey]);

  const modeLabel: Record<string, string> = {
    especes: '💵 Espèces',
    momo: '📱 MoMo',
    carte: '💳 Carte',
    credit: '📋 Crédit',
  };

  const modeColor: Record<string, string> = {
    especes: 'text-xa-ok',
    momo: 'text-xa-boutique',
    carte: 'text-xa-date',
    credit: 'text-xa-alerte',
  };

  return (
    <aside className="flex flex-col bg-xa-surface border-l border-xa-border h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-xa-border">
        <h2 className="font-semibold text-xa-titre text-sm">Caisse du jour</h2>
        <p className="text-xs text-xa-muted">
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 rounded-full border-2 border-xa-primary border-t-transparent animate-spin" />
        </div>
      ) : resume ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Total */}
          <div className="bg-xa-bg rounded-xl p-4 text-center">
            <p className="text-xs text-xa-muted mb-1">Total encaissé</p>
            <p className="text-2xl font-bold text-xa-montant">
              {formatFCFA(resume.total_encaisse)}
            </p>
            <p className="text-xs text-xa-muted mt-1">{resume.nb_transactions} transaction(s)</p>
          </div>

          {/* Par mode */}
          {Object.keys(resume.par_mode).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider">
                Par mode
              </p>
              {Object.entries(resume.par_mode).map(([mode, montant]) => (
                <div key={mode} className="flex items-center justify-between">
                  <span className={`text-xs ${modeColor[mode] ?? 'text-xa-text'}`}>
                    {modeLabel[mode] ?? mode}
                  </span>
                  <span className="text-xs font-semibold text-xa-montant">
                    {formatFCFA(montant)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Dernières transactions */}
          {resume.transactions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider">
                Dernières ventes
              </p>
              {resume.transactions.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-1.5 border-b border-xa-border last:border-0"
                >
                  <div>
                    <p className="text-xs text-xa-date">
                      {new Date(t.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className={`text-xs ${modeColor[t.mode_paiement] ?? 'text-xa-muted'}`}>
                      {modeLabel[t.mode_paiement] ?? t.mode_paiement}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-xa-montant">
                    {formatFCFA(t.montant_total)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {resume.nb_transactions === 0 && (
            <p className="text-xs text-xa-muted text-center py-4">
              Aucune vente aujourd&apos;hui
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-xa-muted text-center py-8 px-4">
          Impossible de charger le résumé
        </p>
      )}
    </aside>
  );
}

// ——— Main component ——————————————————————————————————————————————————————————

export default function CaissePos({ boutiques, produits: initialProduits }: CaissePosProps) {
  const [boutiqueActive, setBoutiqueActive] = useState(boutiques[0]?.id ?? '');
  const [produits, setProduits] = useState<ProduitPublic[]>(initialProduits);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payMode, setPayMode] = useState<PayMode>('especes');
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [montantRecu, setMontantRecu] = useState(0);
  const [categorie, setCategorie] = useState('Tous');
  const [recherche, setRecherche] = useState('');
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingProduits, setFetchingProduits] = useState(false);
  const [resumeRefreshKey, setResumeRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Client fidélité
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  const { isOnline } = useOfflineSync({
    onSyncResult: (succeeded, failed) => {
      if (succeeded > 0) {
        showToast(`${succeeded} vente${succeeded !== 1 ? 's' : ''} synchronisée${succeeded !== 1 ? 's' : ''}`, 'success');
        setResumeRefreshKey((k) => k + 1);
      }
      if (failed > 0) {
        showToast(`${failed} vente${failed !== 1 ? 's' : ''} non synchronisée${failed !== 1 ? 's' : ''}`, 'error');
      }
    },
  });

  // Re-fetch products when boutique changes
  useEffect(() => {
    if (!boutiqueActive) return;
    setFetchingProduits(true);
    fetch(`/api/produits?boutique_id=${boutiqueActive}`)
      .then((r) => r.json())
      .then(async (data: ProduitPublic[]) => {
        if (Array.isArray(data)) {
          setProduits(data);
          setCart([]);
          setCategorie('Tous'); // reset filter when switching boutique (C5)
          await saveProduits(boutiqueActive, data);
        }
      })
      .catch(async () => {
        // Network error — try IndexedDB cache
        const cached = await loadProduits(boutiqueActive);
        if (cached) {
          setProduits(cached as ProduitPublic[]);
        } else {
          // Cache absent or expired (TTL) — show empty catalogue with a warning
          setProduits([]);
          showToast(
            'Catalogue non disponible hors connexion — veuillez vous reconnecter pour synchroniser',
            'error',
          );
        }
      })
      .finally(() => setFetchingProduits(false));
  }, [boutiqueActive]);

  // Fetch clients fidélité au montage
  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data: Client[]) => setClients(Array.isArray(data) ? data : []))
      .catch(() => {}); // silencieux si hors-ligne
  }, []);

  const produitsFiltres = useMemo(() => {
    return produits.filter((p) => {
      const matchCat = categorie === 'Tous' || p.categorie === categorie;
      const matchSearch = p.nom.toLowerCase().includes(recherche.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [produits, categorie, recherche]);

  // Derive unique categories from the current boutique's products (C5)
  // Falls back to 'Général' for products with a null/empty category.
  const categoriesDynamiques = useMemo(() => {
    const cats = produits
      .map((p) => (p.categorie?.trim() || 'Général') as string)
      .filter(Boolean);
    return ['Tous', ...Array.from(new Set(cats)).sort()];
  }, [produits]);

  const addToCart = useCallback(
    (produit: ProduitPublic) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.produit_id === produit.id);
        if (existing) {
          if (existing.qty >= existing.stock_actuel) return prev;
          return prev.map((i) =>
            i.produit_id === produit.id ? { ...i, qty: i.qty + 1 } : i,
          );
        }
        return [
          ...prev,
          {
            produit_id: produit.id,
            nom: produit.nom,
            prix_vente: produit.prix_vente,
            qty: 1,
            stock_actuel: produit.stock_actuel,
            unite: produit.unite,
          },
        ];
      });
    },
    [],
  );

  const updateCart = useCallback((produitId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => (i.produit_id === produitId ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0);
    });
  }, []);

  async function validerVente() {
    if (cart.length === 0) return;
    setLoading(true);

    const clientHasRemise = Boolean(selectedClient && selectedClient.points >= POINTS_REMISE_SEUIL);
    const { remise, montantTotal: montant_total } = calculatePrix(
      cart.map((i) => ({ prix_unitaire: i.prix_vente, quantite: i.qty })),
      clientHasRemise,
    );
    const monnaie_rendue =
      payMode === 'especes' && montantRecu > montant_total ? montantRecu - montant_total : 0;

    const body = {
      boutique_id: boutiqueActive,
      lignes: cart.map((i) => ({
        produit_id: i.produit_id,
        quantite: i.qty,
        prix_unitaire: i.prix_vente,
      })),
      mode_paiement: payMode,
      montant_total,
      ...(selectedClient && { client_id: selectedClient.id }),
      ...(payMode === 'credit' && {
        client_nom: clientNom || 'Client anonyme',
        client_telephone: clientTelephone || undefined,
      }),
    };

    // Si hors-ligne → enqueue et afficher un ticket provisoire
    if (!isOnline) {
      const sale: OfflineSale = {
        id: crypto.randomUUID(),
        ...body,
        created_at: new Date().toISOString(),
      };
      await enqueueSale(sale);
      const boutique = boutiques.find((b) => b.id === boutiqueActive);
      setTicket({
        transaction_id: sale.id,
        created_at: sale.created_at,
        lignes: cart.map((i) => ({
          produit_id: i.produit_id,
          nom: i.nom,
          quantite: i.qty,
          prix_unitaire: i.prix_vente,
          sous_total: i.prix_vente * i.qty,
        })),
        montant_total,
        remise,
        mode_paiement: payMode,
        boutique_nom: boutique?.nom ?? 'Boutique',
        offline: true,
        ...(payMode === 'especes' && montantRecu > 0 && {
          montant_recu: montantRecu,
          monnaie_rendue,
        }),
        ...(payMode === 'credit' && {
          client_nom: clientNom || 'Client anonyme',
        }),
      });
      setLoading(false);
      return;
    }

    // En ligne → logique normale
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? 'Erreur lors de la validation');
        return;
      }

      // Update local client state from server response (C10 — no more client PATCH)
      if (selectedClient && data.client) {
        setClients((prev) =>
          prev.map((c) =>
            c.id === selectedClient.id
              ? {
                  ...c,
                  points: data.client.points,
                  total_achats: data.client.total_achats,
                  nb_visites: data.client.nb_visites,
                }
              : c,
          ),
        );
        setSelectedClient(null);
      } else if (selectedClient) {
        setSelectedClient(null);
      }

      const boutique = boutiques.find((b) => b.id === boutiqueActive);
      setTicket({
        ...data,
        boutique_nom: boutique?.nom ?? 'Boutique',
        ...(payMode === 'especes' && montantRecu > 0 && {
          montant_recu: montantRecu,
          monnaie_rendue,
        }),
        ...(payMode === 'credit' && {
          client_nom: clientNom || 'Client anonyme',
        }),
      } as TicketData);

      // Refresh product list to reflect updated stocks
      const updated = await fetch(`/api/produits?boutique_id=${boutiqueActive}`).then((r) =>
        r.json(),
      );
      if (Array.isArray(updated)) setProduits(updated);

      // Refresh day summary
      setResumeRefreshKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  function nouvelleVente() {
    setCart([]);
    setTicket(null);
    setSelectedClient(null);
    setClientSearch('');
  }

  const activeBoutique = boutiques.find((b) => b.id === boutiqueActive);

  if (ticket) {
    return (
      <div className="h-[calc(100vh-120px)]">
        <TicketCaisse ticket={ticket} onNouvelleVente={nouvelleVente} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Toast */}
      {toast && (
        <div
          style={{
            background: toast.type === 'success' ? '#00d68f' : '#ff3341',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '0.8125rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top bar: boutique selector */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          {activeBoutique && (
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: activeBoutique.couleur_theme }}
            />
          )}
          <select
            value={boutiqueActive}
            onChange={(e) => setBoutiqueActive(e.target.value)}
            className="px-3 py-2 rounded-lg border border-xa-border bg-xa-surface text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
          >
            {boutiques.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom}
              </option>
            ))}
          </select>
        </div>
        {activeBoutique && (
          <span className="text-xs text-xa-boutique font-medium">
            Caisse principale — {activeBoutique.nom}
          </span>
        )}
      </div>

      {/* Main grid: catalogue | panier | résumé du jour */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_290px_220px] gap-0 overflow-hidden rounded-xl border border-xa-border">
        {/* Catalogue */}
        <div className="flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="px-4 py-3 border-b border-xa-border flex flex-wrap gap-2">
            {categoriesDynamiques.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategorie(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  categorie === cat
                    ? 'bg-xa-primary text-white'
                    : 'bg-xa-bg text-xa-muted hover:text-xa-text'
                }`}
              >
                {cat}
              </button>
            ))}
            <input
              type="text"
              placeholder="Rechercher…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="ml-auto px-3 py-1 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-xs focus:outline-none focus:ring-2 focus:ring-xa-primary"
            />
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {fetchingProduits ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-xa-primary border-t-transparent animate-spin" />
              </div>
            ) : produitsFiltres.length === 0 ? (
              <p className="text-center text-xa-muted text-sm py-12">Aucun produit trouvé</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {produitsFiltres.map((p) => (
                  <ProduitCard key={p.id} produit={p} onAdd={() => addToCart(p)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panier + sélecteur client */}
        <div className="flex flex-col bg-xa-surface border-l border-xa-border h-full overflow-hidden">
          {/* Sélecteur client fidélité */}
          <div className="px-3 pt-3 pb-2 border-b border-xa-border space-y-2">
            <div className="relative">
              <label className="text-xs text-xa-muted font-semibold block mb-1">
                Client fidélité (optionnel)
              </label>
              <input
                type="text"
                placeholder="🔍 Nom ou téléphone..."
                value={
                  selectedClient
                    ? `${selectedClient.nom}${selectedClient.telephone ? ` · ${selectedClient.telephone}` : ''}`
                    : clientSearch
                }
                onChange={(e) => {
                  if (!selectedClient) {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                  }
                }}
                onFocus={() => {
                  if (!selectedClient) setShowClientDropdown(true);
                }}
                readOnly={!!selectedClient}
                className="w-full px-3 py-1.5 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-xs focus:outline-none focus:border-xa-primary"
              />
              {selectedClient && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null);
                    setClientSearch('');
                  }}
                  className="absolute right-2 top-6 text-xa-muted hover:text-xa-danger text-xs"
                >
                  ✕
                </button>
              )}
              {showClientDropdown && clientSearch && !selectedClient && (
                <div className="absolute top-full left-0 right-0 z-20 bg-xa-surface border border-xa-border rounded-lg shadow-lg mt-1 max-h-36 overflow-y-auto">
                  {clients
                    .filter(
                      (c) =>
                        c.nom.toLowerCase().includes(clientSearch.toLowerCase()) ||
                        (c.telephone ?? '').includes(clientSearch),
                    )
                    .slice(0, 5)
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedClient(c);
                          setShowClientDropdown(false);
                          setClientSearch('');
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-xa-bg flex justify-between items-center"
                      >
                        <span className="font-semibold text-xa-text">
                          {c.nom}
                          {c.telephone ? ` · ${c.telephone}` : ''}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${c.points >= 100 ? 'bg-aquamarine-500/20 text-aquamarine-600' : 'text-xa-muted'}`}
                        >
                          {c.points} pts{c.points >= 100 ? ' 🎁' : ''}
                        </span>
                      </button>
                    ))}
                  {clients.filter(
                    (c) =>
                      c.nom.toLowerCase().includes(clientSearch.toLowerCase()) ||
                      (c.telephone ?? '').includes(clientSearch),
                  ).length === 0 && (
                    <p className="px-3 py-2 text-xs text-xa-muted">Aucun client trouvé</p>
                  )}
                </div>
              )}
            </div>
            {selectedClient && selectedClient.points >= 100 && (
              <div className="px-3 py-2 rounded-lg bg-aquamarine-500/10 border border-aquamarine-500/30 text-xs text-aquamarine-600 font-semibold">
                🎁 Remise 5% débloquée pour {selectedClient.nom} !
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            <Panier
              items={cart}
              onUpdate={updateCart}
              payMode={payMode}
              onPayModeChange={(mode) => {
                setPayMode(mode);
                setMontantRecu(0);
                if (mode !== 'credit') {
                  setClientNom('');
                  setClientTelephone('');
                }
              }}
              onValider={validerVente}
              loading={loading}
              boutiqueName={activeBoutique?.nom ?? ''}
              clientNom={clientNom}
              onClientNomChange={setClientNom}
              clientTelephone={clientTelephone}
              onClientTelephoneChange={setClientTelephone}
              montantRecu={montantRecu}
              onMontantRecuChange={setMontantRecu}
              clientHasRemise={Boolean(selectedClient && selectedClient.points >= POINTS_REMISE_SEUIL)}
            />
          </div>
        </div>

        {/* Résumé caisse du jour */}
        <ResumeCaissePanel boutiqueId={boutiqueActive} refreshKey={resumeRefreshKey} />
      </div>
    </div>
  );
}
