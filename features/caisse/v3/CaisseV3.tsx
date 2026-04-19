'use client';

/**
 * CaisseV3 — xà Fusion v3 POS interface.
 *
 * Replaces the legacy CaissePos with a complete redesign matching the
 * xà Fusion v3 design system: new palette, Black Han Sans / DM Sans /
 * Space Mono typography, two-column layout, discount, mobile money,
 * credit, WhatsApp invoice, printable PDF, scanner hook, keyboard
 * shortcuts, and mobile bottom sheet.
 *
 * Legacy code kept in features/caisse/legacy/ for rollback.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Boutique, ProduitPublic } from '@/types/database';
import CaisseLockScreen, { type LockReason } from '@/features/caisse/CaisseLockScreen';
import { useCaisseIdle } from '@/hooks/useCaisseIdle';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { enqueueSale, saveProduits, loadProduits, type OfflineSale } from '@/lib/offline/offlineQueue';
import { useCart } from './useCart';
import { useScannerInput } from './useScannerInput';
import CaisseTopbar from './CaisseTopbar';
import ProductCatalog from './ProductCatalog';
import CartPanel from './CartPanel';
import EncaissModal, { type VenteResult } from './EncaissModal';
import InvoiceModal from './InvoiceModal';
import type { PayMode } from './PaymentSection';
import './caisse-v3.css';

const CAISSE_SESSION_HEADER = 'x-caisse-token';
const BOUTIQUE_STORAGE_KEY = 'xa-boutique-active';

interface CaisseV3Props {
  boutiques: Boutique[];
  produits: ProduitPublic[];
  userId: string;
}

// ─── Toast types ──────────────────────────────────────────────────────────────

type ToastData = {
  message: string;
  type: 'success' | 'error';
  id: number;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CaisseV3({ boutiques, produits: initialProduits, userId }: CaisseV3Props) {
  // ── Boutique active ──────────────────────────────────────────────────────────
  const [boutiqueActive, setBoutiqueActive] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(BOUTIQUE_STORAGE_KEY);
      if (stored && boutiques.some((b) => b.id === stored)) return stored;
    }
    return boutiques[0]?.id ?? '';
  });

  useEffect(() => {
    if (boutiqueActive) {
      localStorage.setItem(BOUTIQUE_STORAGE_KEY, boutiqueActive);
    }
  }, [boutiqueActive]);

  // ── Products ─────────────────────────────────────────────────────────────────
  const [produits, setProduits] = useState<ProduitPublic[]>(initialProduits);
  const [fetching, setFetching] = useState(false);

  // ── Cart ─────────────────────────────────────────────────────────────────────
  const { items, addItem, updateQty, removeItem, clearCart } = useCart();

  // ── Cart panel state ──────────────────────────────────────────────────────────
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [remisePct, setRemisePct] = useState(0);
  const [payMode, setPayMode] = useState<PayMode>('especes');
  const [montantRecu, setMontantRecu] = useState(0);

  // ── Modals ───────────────────────────────────────────────────────────────────
  const [showEncaiss, setShowEncaiss] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceVente, setInvoiceVente] = useState<VenteResult | null>(null);
  const [autoPrint, setAutoPrint] = useState(false);

  // ── Catalogue filters ─────────────────────────────────────────────────────────
  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState('Tout');

  // ── Loading ───────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Mobile sheet ──────────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);
  const [cartCollapsed, setCartCollapsed] = useState(true);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth <= 860);
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── Refs for keyboard shortcuts ───────────────────────────────────────────────
  const searchInputRef = useRef<HTMLInputElement>(null);
  const clientNomRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);

  // Idempotency key — generated when modal opens, cleared on reset
  const localIdRef = useRef<string>(crypto.randomUUID());

  // ── Caisse session + idle lock ────────────────────────────────────────────────
  const [caisseToken, setCaisseToken] = useState<string | null>(null);
  const [caisseTokenExpiresAt, setCaisseTokenExpiresAt] = useState<string | null>(null);
  const [lockReason, setLockReason] = useState<LockReason>('idle');

  const clearCaisseSession = useCallback(() => {
    setCaisseToken(null);
    setCaisseTokenExpiresAt(null);
  }, []);

  const { isLocked, lock, unlock } = useCaisseIdle({
    onLock: () => {
      setLockReason('idle');
      clearCaisseSession();
    },
  });

  const handleManualLock = useCallback(() => {
    const tokenToRevoke = caisseToken;
    setLockReason('manual');
    clearCaisseSession();
    lock();
    if (tokenToRevoke) {
      fetch('/api/caisse/session', {
        method: 'DELETE',
        headers: { [CAISSE_SESSION_HEADER]: tokenToRevoke },
      }).catch(() => {});
    }
  }, [lock, caisseToken, clearCaisseSession]);

  const handleUnlock = useCallback(
    (token: string, expiresAt: string) => {
      setCaisseToken(token);
      setCaisseTokenExpiresAt(expiresAt);
      unlock();
    },
    [unlock],
  );

  // ── Offline sync ──────────────────────────────────────────────────────────────
  const { isOnline } = useOfflineSync({
    onSyncResult: (succeeded, failed) => {
      if (succeeded > 0) {
        showToast(`${succeeded} vente${succeeded !== 1 ? 's' : ''} synchronisée${succeeded !== 1 ? 's' : ''}`, 'success');
      }
      if (failed > 0) {
        showToast(`${failed} vente${failed !== 1 ? 's' : ''} en échec de sync`, 'error');
      }
    },
  });

  // ── Toast helper ──────────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToast({ message, type, id });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

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

  // ── Barcode scanner ───────────────────────────────────────────────────────────
  useScannerInput(
    useCallback(
      (barcode: string) => {
        // Try to find product by code_barres if the field exists on the product
        // (optional field — may not exist in current DB schema)
        const found = produits.find(
          (p) => (p as ProduitPublic & { code_barres?: string }).code_barres === barcode,
        );
        if (found) {
          addItem(found, found.categorie ?? '📦');
          showToast(`📷 Scanné : ${found.nom}`, 'success');
        } else {
          showToast(`Code-barres inconnu : ${barcode}`, 'error');
        }
      },
      [produits, addItem, showToast],
    ),
    !isLocked && !showEncaiss && !showInvoice,
  );

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleKey(e: KeyboardEvent) {
      if (isLocked) return;

      // Ctrl/Cmd+K → focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Only handle function keys if no input is focused
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      const isInputFocused = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';

      if (e.key === 'F2' && !isInputFocused) {
        e.preventDefault();
        if (items.length > 0 && !showEncaiss) setShowEncaiss(true);
        return;
      }

      if (e.key === 'F3' && !isInputFocused) {
        e.preventDefault();
        clientNomRef.current?.focus();
        return;
      }

      if (e.key === 'F4' && !isInputFocused) {
        e.preventDefault();
        cashInputRef.current?.focus();
        return;
      }

      if (e.key === 'Escape') {
        if (showInvoice) { setShowInvoice(false); return; }
        if (showEncaiss) { setShowEncaiss(false); return; }
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLocked, items.length, showEncaiss, showInvoice]);

  // ── Derived totals ─────────────────────────────────────────────────────────────
  const sousTotal = items.reduce((s, i) => s + i.prix_vente * i.qty, 0);
  const remiseMontant = remisePct > 0 ? Math.round(sousTotal * remisePct / 100) : 0;
  const total = sousTotal - remiseMontant;

  // ── Handle encaisser click ─────────────────────────────────────────────────────
  function handleEncaisser() {
    if (items.length === 0 || isLocked) return;
    // Check token expiry
    if (caisseTokenExpiresAt && new Date(caisseTokenExpiresAt) < new Date()) {
      setLockReason('expired');
      clearCaisseSession();
      lock();
      return;
    }
    // Generate a fresh idempotency key for this sale
    localIdRef.current = crypto.randomUUID();
    if (isMobile) setCartCollapsed(false);
    setShowEncaiss(true);
  }

  // ── Perform the actual API call ────────────────────────────────────────────────
  async function performSale(): Promise<VenteResult | null> {
    setLoading(true);

    const boutique = boutiques.find((b) => b.id === boutiqueActive);

    const body = {
      boutique_id: boutiqueActive,
      lignes: items.map((i) => ({
        produit_id: i.produit_id,
        quantite: i.qty,
        prix_unitaire: i.prix_vente,
      })),
      mode_paiement: payMode,
      montant_total: total,
      remise_pct: remisePct,
      montant_recu: payMode === 'especes' && montantRecu > 0 ? montantRecu : undefined,
      monnaie_rendue:
        payMode === 'especes' && montantRecu > 0
          ? Math.max(0, montantRecu - total)
          : undefined,
      client_nom: clientNom || undefined,
      client_telephone: clientTelephone || undefined,
      local_id: localIdRef.current,
    };

    // Offline handling
    if (!isOnline) {
      const sale: OfflineSale = {
        id: localIdRef.current,
        boutique_id: boutiqueActive,
        lignes: body.lignes,
        mode_paiement: payMode,
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
        mode_paiement: payMode,
        montant_recu: body.montant_recu,
        monnaie_rendue: body.monnaie_rendue,
        client_nom: clientNom || undefined,
        client_telephone: clientTelephone || undefined,
        boutique_nom: boutique?.nom ?? 'Boutique',
        boutique_ville: boutique?.ville,
        caissier_nom: undefined,
      };
      setLoading(false);
      resetAfterSale();
      showToast('⚠ Vente hors-ligne enregistrée', 'success');
      return result;
    }

    // Online
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (caisseToken) headers[CAISSE_SESSION_HEADER] = caisseToken;

      const res = await fetch('/api/caisse/vente', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error ?? 'Erreur lors de la validation', 'error');
        return null;
      }

      // Refresh products to reflect updated stocks
      const updated = await fetch(`/api/produits?boutique_id=${boutiqueActive}`).then((r) =>
        r.json(),
      );
      if (Array.isArray(updated)) setProduits(updated);

      const result: VenteResult = {
        transaction_id: data.transaction_id,
        numero_facture: data.numero_facture ?? `FAC-${data.transaction_id.slice(0, 8).toUpperCase()}`,
        created_at: data.created_at,
        lignes: (data.lignes ?? items.map((i) => ({
          produit_id: i.produit_id,
          nom: i.nom,
          quantite: i.qty,
          prix_unitaire: i.prix_vente,
          sous_total: i.prix_vente * i.qty,
          emoji: i.emoji,
        }))),
        montant_total: total,
        remise_pct: remisePct,
        remise_montant: remiseMontant,
        sous_total: sousTotal,
        mode_paiement: payMode,
        montant_recu: body.montant_recu,
        monnaie_rendue: body.monnaie_rendue,
        client_nom: clientNom || undefined,
        client_telephone: clientTelephone || undefined,
        boutique_nom: boutique?.nom ?? 'Boutique',
        boutique_ville: boutique?.ville,
        caissier_nom: undefined,
      };

      resetAfterSale();
      showToast('✅ Vente enregistrée', 'success');
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
    setClientNom('');
    setClientTelephone('');
    setRemisePct(0);
    setPayMode('especes');
    setMontantRecu(0);
    setRecherche('');
    setCategorie('Tout');
    localIdRef.current = crypto.randomUUID();
  }

  function handleShowInvoice(vente: VenteResult) {
    setInvoiceVente(vente);
    setAutoPrint(false);
    setShowInvoice(true);
  }

  // ── Active boutique ─────────────────────────────────────────────────────────────
  const activeBoutique = boutiques.find((b) => b.id === boutiqueActive);

  return (
    <div className="xa-caisse-v3">
      {/* Lock screen overlay */}
      {isLocked && activeBoutique && (
        <CaisseLockScreen
          boutiqueId={activeBoutique.id}
          boutiqueNom={activeBoutique.nom}
          reason={lockReason}
          onUnlock={handleUnlock}
        />
      )}

      {/* Topbar */}
      <CaisseTopbar
        boutiques={boutiques}
        boutiqueActive={boutiqueActive}
        onBoutiqueChange={(id) => {
          setBoutiqueActive(id);
          clearCart();
        }}
        onLock={handleManualLock}
      />

      {/* Online/offline indicator */}
      {!isOnline && (
        <div
          style={{
            background: '#FF9800',
            color: 'white',
            padding: '4px 16px',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          ⚠ Mode hors-ligne — les ventes seront synchronisées lors de la reconnexion
        </div>
      )}

      {/* Shell */}
      <div className="c-shell">
        {/* Left — catalogue */}
        <ProductCatalog
          produits={produits}
          recherche={recherche}
          onRechercheChange={setRecherche}
          categorie={categorie}
          onCategorieChange={setCategorie}
          onAdd={(produit, emoji) => {
            addItem(produit, emoji);
            if (isMobile) setCartCollapsed(false);
          }}
          fetching={fetching}
          searchInputRef={searchInputRef}
        />

        {/* Right — cart */}
        <CartPanel
          items={items}
          onUpdate={updateQty}
          onRemove={removeItem}
          onClear={clearCart}
          clientNom={clientNom}
          onClientNomChange={setClientNom}
          clientTelephone={clientTelephone}
          onClientTelephoneChange={setClientTelephone}
          remisePct={remisePct}
          onRemisePctChange={setRemisePct}
          payMode={payMode}
          onPayModeChange={(mode) => {
            setPayMode(mode);
            setMontantRecu(0);
          }}
          montantRecu={montantRecu}
          onMontantRecuChange={setMontantRecu}
          onEncaisser={handleEncaisser}
          loading={loading}
          clientNomRef={clientNomRef}
          cashInputRef={cashInputRef}
          isMobile={isMobile}
          isCollapsed={cartCollapsed}
          onToggleCollapse={() => setCartCollapsed((c) => !c)}
        />
      </div>

      {/* Encaissement modal */}
      {showEncaiss && (
        <EncaissModal
          items={items}
          sousTotal={sousTotal}
          remisePct={remisePct}
          remiseMontant={remiseMontant}
          total={total}
          payMode={payMode}
          montantRecu={montantRecu}
          clientNom={clientNom}
          clientTelephone={clientTelephone}
          boutique_nom={activeBoutique?.nom ?? 'Boutique'}
          boutique_ville={activeBoutique?.ville}
          onClose={() => setShowEncaiss(false)}
          onNouvelleVente={performSale}
          onShowInvoice={(vente) => {
            setShowEncaiss(false);
            handleShowInvoice(vente);
          }}
        />
      )}

      {/* Invoice modal */}
      {showInvoice && invoiceVente && (
        <InvoiceModal
          vente={invoiceVente}
          onClose={() => { setShowInvoice(false); setAutoPrint(false); }}
          autoPrint={autoPrint}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          key={toast.id}
          className={`c-toast${toast.type === 'error' ? ' error' : ''}`}
          role="status"
          aria-live="polite"
        >
          <span className="toast-dot" aria-hidden="true" />
          {toast.message}
        </div>
      )}
    </div>
  );
}
