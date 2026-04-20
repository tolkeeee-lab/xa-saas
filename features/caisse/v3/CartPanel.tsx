'use client';

import { useRef, type RefObject } from 'react';
import type { CartItem } from './useCart';
import CartItemRow from './CartItem';
import CartTotals from './CartTotals';
import PaymentSection, { type PayMode } from './PaymentSection';
import { formatFCFA } from '@/lib/format';

interface CartPanelProps {
  items: CartItem[];
  onUpdate: (produit_id: string, delta: number) => void;
  onRemove: (produit_id: string) => void;
  onClear: () => void;
  clientNom: string;
  onClientNomChange: (v: string) => void;
  clientTelephone: string;
  onClientTelephoneChange: (v: string) => void;
  remisePct: number;
  onRemisePctChange: (v: number) => void;
  payMode: PayMode;
  onPayModeChange: (mode: PayMode) => void;
  montantRecu: number;
  onMontantRecuChange: (v: number) => void;
  onEncaisser: () => void;
  loading?: boolean;
  clientNomRef?: RefObject<HTMLInputElement | null>;
  cashInputRef?: RefObject<HTMLInputElement | null>;
  isMobile?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function CartPanel({
  items,
  onUpdate,
  onRemove,
  onClear,
  clientNom,
  onClientNomChange,
  clientTelephone,
  onClientTelephoneChange,
  remisePct,
  onRemisePctChange,
  payMode,
  onPayModeChange,
  montantRecu,
  onMontantRecuChange,
  onEncaisser,
  loading,
  clientNomRef,
  cashInputRef,
  isMobile,
  isCollapsed,
  onToggleCollapse,
}: CartPanelProps) {
  const internalNomRef = useRef<HTMLInputElement>(null);
  const nomRef = clientNomRef ?? internalNomRef;

  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const sousTotal = items.reduce((s, i) => s + i.prix_vente * i.qty, 0);
  const remiseMontant = remisePct > 0 ? Math.round(sousTotal * remisePct / 100) : 0;
  const total = sousTotal - remiseMontant;

  const canEncaisser = items.length > 0 && !loading;

  return (
    <aside
      className={`c-cart${isMobile && isCollapsed ? ' collapsed' : ''}`}
      aria-label="Panier"
    >
      {/* Mobile drag handle */}
      {isMobile && (
        <div
          className="c-cart-toggle-bar"
          onClick={onToggleCollapse}
          role="button"
          tabIndex={0}
          aria-label={isCollapsed ? 'Ouvrir le panier' : 'Réduire le panier'}
          onKeyDown={(e) => e.key === 'Enter' && onToggleCollapse?.()}
        >
          <div className="drag-handle" />
          {isCollapsed && totalItems > 0 && (
            <span className="c-cart-toggle-hint">
              ↑ {totalItems} article{totalItems > 1 ? 's' : ''} — Tirer pour voir
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="c-cart-header">
        <h2 className="c-cart-title">PANIER</h2>
        {totalItems > 0 && (
          <span className="c-cart-count" aria-label={`${totalItems} article(s)`}>
            {totalItems} article{totalItems > 1 ? 's' : ''}
          </span>
        )}
        {items.length > 0 && (
          <button
            type="button"
            className="c-btn-vider"
            onClick={onClear}
            aria-label="Vider le panier"
          >
            ✕ Vider
          </button>
        )}
      </div>

      {/* Client row */}
      <div className="c-client-row" aria-label="Informations client">
        <input
          ref={nomRef}
          id="client-nom"
          type="text"
          className="c-client-input"
          placeholder="Nom client (optionnel)"
          value={clientNom}
          onChange={(e) => onClientNomChange(e.target.value)}
          aria-label="Nom du client"
          autoComplete="off"
        />
        <input
          id="client-tel"
          type="tel"
          className="c-client-input"
          placeholder="📱 Téléphone"
          value={clientTelephone}
          onChange={(e) => onClientTelephoneChange(e.target.value)}
          aria-label="Téléphone du client"
          autoComplete="tel"
          style={{ maxWidth: 120 }}
        />
      </div>

      {/* Items list */}
      <div className="c-cart-items" role="list" aria-label="Articles du panier">
        {items.length === 0 ? (
          <div className="c-empty-cart" aria-label="Panier vide">
            <span className="empty-icon" aria-hidden="true">🛒</span>
            <span className="empty-label">PANIER VIDE</span>
            <span style={{ fontSize: 12, color: 'var(--c-faint)', textAlign: 'center' }}>
              Cliquez sur un produit pour l&apos;ajouter
            </span>
          </div>
        ) : (
          items.map((item) => (
            <CartItemRow
              key={item.produit_id}
              item={item}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {/* Totals */}
      <CartTotals
        sousTotal={sousTotal}
        remisePct={remisePct}
        onRemisePctChange={onRemisePctChange}
      />

      {/* Payment */}
      <PaymentSection
        payMode={payMode}
        onPayModeChange={(mode) => {
          onPayModeChange(mode);
          if (mode !== 'especes') onMontantRecuChange(0);
        }}
        total={total}
        montantRecu={montantRecu}
        onMontantRecuChange={onMontantRecuChange}
        cashInputRef={cashInputRef}
      />

      {/* Encaisser button */}
      <div style={{ padding: '8px 14px 14px' }}>
        <button
          type="button"
          className="c-btn-encaisser"
          onClick={onEncaisser}
          disabled={!canEncaisser}
          aria-label={
            items.length === 0
              ? 'Panier vide — ajoutez des produits pour encaisser'
              : `Encaisser ${formatFCFA(total)}`
          }
        >
          {loading ? 'Traitement…' : `ENCAISSER ${items.length > 0 ? formatFCFA(total) : ''}`}
        </button>
      </div>
    </aside>
  );
}
