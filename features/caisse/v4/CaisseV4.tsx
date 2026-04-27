'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Boutique, ProduitPublic } from '@/types/database';
import { useCart } from './hooks/usePanier';
import { useCatalogue } from './hooks/useCatalogue';
import { useRetrait } from './hooks/useRetrait';
import type { RetraitCommande } from './hooks/useRetrait';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { enqueueSale, saveProduits, loadProduits } from '@/lib/offline/offlineQueue';
import type { OfflineSale } from '@/lib/offline/offlineQueue';
import { formatFCFA } from '@/lib/format';
import { getCategoryEmoji } from '@/features/caisse/v3/lib/categoryEmoji';
import type { VenteResult } from './types';

type PayMode = 'especes' | 'momo' | 'carte' | 'credit';

import CaisseHeader from './components/CaisseHeader';
import SyncBar from './components/SyncBar';
import RetraitCodeBar from './components/RetraitCodeBar';
import SearchBar from './components/SearchBar';
import CategoryChips from './components/CategoryChips';
import PanierStrip from './components/PanierStrip';
import ProductGrid from './components/ProductGrid';
import CaisseFooter from './components/CaisseFooter';
import RecuModal from './components/RecuModal';
import CreditModal from './components/CreditModal';
import RetraitModal from './components/RetraitModal';

import './caisse-v4.css';

const BOUTIQUE_STORAGE_KEY = 'xa-boutique-active';

// Stub — no real retrait codes yet
const STUB_RETRAIT_CODES: RetraitCommande[] = [];

interface CaisseV4Props {
  boutiques: Boutique[];
  produits: ProduitPublic[];
  userId: string;
  caissierNom?: string;
  employeId?: string;
}

type ToastData = {
  message: string;
  type: 'success' | 'error';
  id: number;
};

export default function CaisseV4({
  boutiques,
  produits: initialProduits,
  userId: _userId,
  caissierNom,
  employeId,
}: CaisseV4Props) {
  // ── Boutique ─────────────────────────────────────────────────────────────────
  const [boutiqueActive, setBoutiqueActive] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(BOUTIQUE_STORAGE_KEY);
      if (stored && boutiques.some((b) => b.id === stored)) return stored;
    }
    return boutiques[0]?.id ?? '';
  });

  useEffect(() => {
    if (boutiqueActive) localStorage.setItem(BOUTIQUE_STORAGE_KEY, boutiqueActive);
  }, [boutiqueActive]);

  // ── Products ──────────────────────────────────────────────────────────────────
  const [produits, setProduits] = useState<ProduitPublic[]>(initialProduits);
  const [fetching, setFetching] = useState(false);

  // ── Cart ──────────────────────────────────────────────────────────────────────
  const { items, addItem, removeItem, clearCart, totalItems, nbProduits } = useCart();

  // ── Filters ───────────────────────────────────────────────────────────────────
  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState('Tout');

  const { produitsFiltres, categories } = useCatalogue(produits, recherche, categorie);

  // ── Remise ────────────────────────────────────────────────────────────────────
  const [remisePct, setRemisePct] = useState(0);

  const sousTotal = items.reduce((s, i) => s + i.prix_vente * i.qty, 0);
  const remiseMontant = remisePct > 0 ? Math.round(sousTotal * remisePct / 100) : 0;
  const total = sousTotal - remiseMontant;

  // ── Loading / Toast ───────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToast({ message, type, id });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  // ── Modals ────────────────────────────────────────────────────────────────────
  const [showRecuModal, setShowRecuModal] = useState(false);
  const [venteResult, setVenteResult] = useState<VenteResult | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showRetraitModal, setShowRetraitModal] = useState(false);
  const [currentRetrait, setCurrentRetrait] = useState<RetraitCommande | null>(null);

  // ── Caissier name ─────────────────────────────────────────────────────────────
  const [resolvedCaissierNom, setResolvedCaissierNom] = useState<string | undefined>(caissierNom);

  useEffect(() => {
    if (caissierNom) {
      setResolvedCaissierNom(caissierNom);
      return;
    }
    import('@/lib/supabase-browser').then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth
        .getUser()
        .then((resp: { data: { user: { email?: string; user_metadata?: Record<string, string> } | null }; error: unknown }) => {
          const authUser = resp.data.user;
          const meta = authUser?.user_metadata;
          const nom =
            meta?.full_name ??
            meta?.nom_complet ??
            authUser?.email?.split('@')[0] ??
            'Caissier';
          setResolvedCaissierNom(nom);
        })
        .catch(() => {});
    }).catch(() => {});
  }, [caissierNom]);

  // ── Offline sync ──────────────────────────────────────────────────────────────
  const { isOnline } = useOfflineSync({
    onSyncResult: (succeeded, failed) => {
      if (succeeded > 0) showToast(`${succeeded} vente${succeeded !== 1 ? 's' : ''} synchronisée${succeeded !== 1 ? 's' : ''}`, 'success');
      if (failed > 0) showToast(`${failed} vente${failed !== 1 ? 's' : ''} en échec`, 'error');
    },
  });

  // ── Retrait hook ──────────────────────────────────────────────────────────────
  const { code: retraitCode, setCode: setRetraitCode, retraitResult, retraitData, validate: validateRetrait } = useRetrait(STUB_RETRAIT_CODES);

  const retraitResultMessage =
    retraitResult === 'ok'
      ? `✅ Commande trouvée — ${retraitData?.client ?? ''}`
      : retraitResult === 'err'
      ? '❌ Code introuvable'
      : '';

  // Open modal when ok
  useEffect(() => {
    if (retraitResult === 'ok' && retraitData) {
      setCurrentRetrait(retraitData);
      setShowRetraitModal(true);
    }
  }, [retraitResult, retraitData]);

  // ── Re-fetch products when boutique changes ────────────────────────────────────
  useEffect(() => {
    if (!boutiqueActive) return;
    setFetching(true);
    fetch(`/api/produits?boutique_id=${boutiqueActive}`)
      .then((r) => r.json())
      .then(async (data: ProduitPublic[]) => {
        if (Array.isArray(data)) {
          setProduits(data);
          clearCart();
          setCategorie('Tout');
          await saveProduits(boutiqueActive, data);
        }
      })
      .catch(async () => {
        const cached = await loadProduits(boutiqueActive);
        if (cached) {
          setProduits(cached as ProduitPublic[]);
        } else {
          setProduits([]);
          showToast('Catalogue non disponible hors connexion', 'error');
        }
      })
      .finally(() => setFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boutiqueActive]);

  // Idempotency key
  const localIdRef = useRef<string>(crypto.randomUUID());

  // ── Sale logic ────────────────────────────────────────────────────────────────
  async function performSale(
    modePaiement: PayMode,
    clientNom?: string,
    clientTel?: string,
  ): Promise<VenteResult | null> {
    setLoading(true);
    const boutique = boutiques.find((b) => b.id === boutiqueActive);

    const body = {
      boutique_id: boutiqueActive,
      lignes: items.map((i) => ({
        produit_id: i.produit_id,
        quantite: i.qty,
        prix_unitaire: i.prix_vente,
      })),
      mode_paiement: modePaiement,
      montant_total: total,
      remise_pct: remisePct,
      local_id: localIdRef.current,
      caissier_nom: resolvedCaissierNom,
      employe_id: employeId ?? undefined,
      client_nom: clientNom || undefined,
      client_telephone: clientTel || undefined,
    };

    if (!isOnline) {
      const sale: OfflineSale = {
        id: localIdRef.current,
        boutique_id: boutiqueActive,
        lignes: body.lignes,
        mode_paiement: modePaiement,
        montant_total: total,
        created_at: new Date().toISOString(),
      };
      await enqueueSale(sale);

      const result: VenteResult = {
        transaction_id: sale.id,
        numero_facture: 'OFFLINE',
        created_at: sale.created_at,
        lignes: items.map((i) => ({
          produit_id: i.produit_id,
          nom: i.nom,
          quantite: i.qty,
          prix_unitaire: i.prix_vente,
          sous_total: i.prix_vente * i.qty,
          emoji: i.emoji,
        })),
        montant_total: total,
        remise_pct: remisePct,
        remise_montant: remiseMontant,
        sous_total: sousTotal,
        mode_paiement: modePaiement,
        client_nom: clientNom,
        client_telephone: clientTel,
        boutique_nom: boutique?.nom ?? 'Boutique',
        boutique_ville: boutique?.ville,
        caissier_nom: resolvedCaissierNom,
      };
      setLoading(false);
      showToast('⚠ Vente hors-ligne enregistrée', 'success');
      return result;
    }

    try {
      const res = await fetch('/api/caisse/vente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error ?? 'Erreur lors de la validation', 'error');
        return null;
      }

      const updated = await fetch(`/api/produits?boutique_id=${boutiqueActive}`).then((r) => r.json());
      if (Array.isArray(updated)) setProduits(updated);

      const result: VenteResult = {
        transaction_id: data.transaction_id,
        numero_facture:
          data.numero_facture ??
          `FAC-${(data.transaction_id as string).slice(0, 8).toUpperCase()}`,
        created_at: data.created_at,
        lignes:
          data.lignes ??
          items.map((i) => ({
            produit_id: i.produit_id,
            nom: i.nom,
            quantite: i.qty,
            prix_unitaire: i.prix_vente,
            sous_total: i.prix_vente * i.qty,
            emoji: i.emoji,
          })),
        montant_total: total,
        remise_pct: remisePct,
        remise_montant: remiseMontant,
        sous_total: sousTotal,
        mode_paiement: modePaiement,
        client_nom: clientNom,
        client_telephone: clientTel,
        boutique_nom: boutique?.nom ?? 'Boutique',
        boutique_ville: boutique?.ville,
        caissier_nom: resolvedCaissierNom,
      };

      showToast(`✅ Vente ${result.numero_facture} enregistrée`, 'success');
      return result;
    } catch {
      showToast('Erreur réseau — vérifiez votre connexion', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }

  function resetAfterSale() {
    clearCart();
    setRemisePct(0);
    setRecherche('');
    setCategorie('Tout');
    localIdRef.current = crypto.randomUUID();
  }

  // ── Handle Vendu ──────────────────────────────────────────────────────────────
  async function handleVendu() {
    if (items.length === 0) return;
    const result = await performSale('especes');
    if (result) {
      setVenteResult(result);
      setShowRecuModal(true);
    }
  }

  // ── Handle Credit confirm ─────────────────────────────────────────────────────
  async function handleCreditConfirm(
    clientNom: string,
    clientTel: string,
    _versement: number,
    _echeance: string,
  ) {
    setShowCreditModal(false);
    const result = await performSale('credit', clientNom, clientTel);
    if (result) {
      setVenteResult(result);
      setShowRecuModal(true);
    }
  }

  // ── Print/PDF/WhatsApp (without completed sale, just cart preview) ─────────────
  function handlePrint() {
    const zone = document.getElementById('v4-print-zone');
    if (!zone) return;
    const html = buildPreviewTicket();
    zone.innerHTML = html;
    window.print();
    zone.innerHTML = '';
  }

  function handlePDF() {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ticket</title></head><body>${buildPreviewTicket()}</body></html>`,
    );
    w.document.close();
    setTimeout(() => w.print(), 500);
  }

  function handleWhatsApp() {
    const boutique = boutiques.find((b) => b.id === boutiqueActive);
    const lines = items
      .map((i) => `• ${i.nom} ×${i.qty} = ${formatFCFA(i.prix_vente * i.qty)}`)
      .join('\n');
    const msg = [
      `🧾 *Ticket — ${boutique?.nom ?? 'Boutique'}*`,
      ``,
      lines,
      ``,
      remisePct > 0 ? `Remise (${remisePct}%) : −${formatFCFA(remiseMontant)}` : null,
      `*TOTAL : ${formatFCFA(total)}*`,
    ]
      .filter(Boolean)
      .join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function buildPreviewTicket(): string {
    const boutique = boutiques.find((b) => b.id === boutiqueActive);
    const lignesHTML = items
      .map(
        (i) =>
          `<tr><td>${getCategoryEmoji(i.emoji ?? i.nom)} ${i.nom}</td><td style="text-align:right">${i.qty}</td><td style="text-align:right">${formatFCFA(i.prix_vente)}</td><td style="text-align:right">${formatFCFA(i.prix_vente * i.qty)}</td></tr>`,
      )
      .join('');

    return `<div style="font-family:'Courier New',monospace;max-width:320px;margin:0 auto;padding:16px">
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-weight:900;font-size:20px;letter-spacing:2px">XÀ</div>
        <div style="font-size:13px;font-weight:700">${boutique?.nom ?? 'Boutique'}</div>
        ${boutique?.ville ? `<div style="font-size:11px;color:#666">${boutique.ville}</div>` : ''}
        <div style="font-size:10px;color:#666;margin-top:4px">${new Date().toLocaleString('fr-FR')}</div>
        ${resolvedCaissierNom ? `<div style="font-size:10px;color:#666">Caissier : ${resolvedCaissierNom}</div>` : ''}
      </div>
      <hr style="border:none;border-top:1px dashed #ccc;margin:8px 0"/>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr style="border-bottom:1px dashed #ccc"><th style="text-align:left">Produit</th><th style="text-align:right">Qté</th><th style="text-align:right">PU</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>${lignesHTML}</tbody>
      </table>
      <hr style="border:none;border-top:1px dashed #ccc;margin:8px 0"/>
      ${remisePct > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px"><span>Remise (${remisePct}%)</span><span>−${formatFCFA(remiseMontant)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;margin-top:4px"><span>TOTAL</span><span>${formatFCFA(total)}</span></div>
      <div style="text-align:center;margin-top:12px;font-size:9px;color:#999">Merci de votre confiance · xà</div>
    </div>`;
  }

  // ── Current date string ────────────────────────────────────────────────────────
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const activeBoutique = boutiques.find((b) => b.id === boutiqueActive);

  return (
    <div className="xa-caisse-v4">
      {/* Toast */}
      {toast && (
        <div
          key={toast.id}
          className={`v4-toast ${toast.type}`}
          role="alert"
          aria-live="assertive"
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <CaisseHeader
        boutiques={boutiques}
        boutiqueActive={boutiqueActive}
        onBoutiqueChange={(id) => {
          setBoutiqueActive(id);
          clearCart();
        }}
        caissierNom={resolvedCaissierNom}
        date={dateStr}
      />

      {/* Sync bar */}
      <SyncBar isOnline={isOnline} />

      {/* Retrait bar */}
      <RetraitCodeBar
        code={retraitCode}
        onCodeChange={setRetraitCode}
        onValidate={validateRetrait}
        result={retraitResult}
        resultMessage={retraitResultMessage}
      />

      {/* Search */}
      <SearchBar value={recherche} onChange={setRecherche} />

      {/* Category chips */}
      <CategoryChips
        categories={categories}
        active={categorie}
        onChange={setCategorie}
      />

      {/* Panier strip */}
      <PanierStrip
        items={items}
        onRemove={removeItem}
        onClear={clearCart}
      />

      {/* Product grid */}
      <div className="v4-grid-scroll">
        <ProductGrid
          produits={produitsFiltres}
          cartItems={items}
          onAdd={(p) => addItem(p, getCategoryEmoji(p.categorie))}
          fetching={fetching}
        />
      </div>

      {/* Footer */}
      <CaisseFooter
        total={total}
        sousTotal={sousTotal}
        remisePct={remisePct}
        onRemisePctChange={setRemisePct}
        nbArticles={totalItems}
        nbProduits={nbProduits}
        onVendu={() => void handleVendu()}
        onCredit={() => setShowCreditModal(true)}
        onPrint={handlePrint}
        onPDF={handlePDF}
        onWhatsApp={handleWhatsApp}
        loading={loading}
        hasItems={items.length > 0}
      />

      {/* Reçu modal */}
      <RecuModal
        vente={showRecuModal ? venteResult : null}
        onClose={() => {
          setShowRecuModal(false);
          setVenteResult(null);
        }}
        onNewSale={() => {
          setShowRecuModal(false);
          setVenteResult(null);
          resetAfterSale();
        }}
      />

      {/* Credit modal */}
      <CreditModal
        open={showCreditModal}
        total={total}
        items={items}
        onClose={() => setShowCreditModal(false)}
        onConfirm={(nom, tel, versement, echeance) =>
          void handleCreditConfirm(nom, tel, versement, echeance)
        }
        loading={loading}
      />

      {/* Retrait modal */}
      <RetraitModal
        open={showRetraitModal}
        data={currentRetrait}
        onClose={() => {
          setShowRetraitModal(false);
          setCurrentRetrait(null);
        }}
        onConfirm={() => {
          showToast('✅ Retrait confirmé', 'success');
          setShowRetraitModal(false);
          setCurrentRetrait(null);
        }}
      />

      {/* Hidden print zone */}
      <div id="v4-print-zone" style={{ display: 'none' }} aria-hidden="true" />

      {/* Boutique info for aria (hidden) */}
      <p className="sr-only" aria-live="polite">
        Boutique active : {activeBoutique?.nom ?? ''}
      </p>
    </div>
  );
}
