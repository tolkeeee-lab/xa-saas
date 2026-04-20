'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CartItem } from './useCart';
import type { PayMode } from './PaymentSection';
import { formatFCFA } from '@/lib/format';
import { buildWhatsAppMessage, buildWhatsAppUrl } from './lib/whatsappMessage';

export type VenteResult = {
  transaction_id: string;
  numero_facture: string;
  created_at: string;
  lignes: {
    produit_id: string;
    nom: string;
    quantite: number;
    prix_unitaire: number;
    sous_total: number;
    emoji?: string;
  }[];
  montant_total: number;
  remise_pct: number;
  remise_montant: number;
  sous_total: number;
  mode_paiement: PayMode;
  montant_recu?: number;
  monnaie_rendue?: number;
  client_nom?: string;
  client_telephone?: string;
  boutique_nom: string;
  boutique_ville?: string | null;
  caissier_nom?: string;
};

interface EncaissModalProps {
  items: CartItem[];
  sousTotal: number;
  remisePct: number;
  remiseMontant: number;
  total: number;
  payMode: PayMode;
  montantRecu: number;
  clientNom: string;
  clientTelephone: string;
  boutique_nom: string;
  boutique_ville?: string | null;
  caissier_nom?: string;
  onClose: () => void;
  /** Async — performs the sale RPC; returns VenteResult on success, null on error (caller shows toast) */
  onValider: () => Promise<VenteResult | null>;
  /** Sync — resets cart and closes modal; called after successful validation */
  onNouvelleVente: () => void;
  onShowInvoice: (vente: VenteResult, autoPrint?: boolean) => void;
}

const PAY_MODE_LABELS: Record<PayMode, string> = {
  especes: '💵 Espèces',
  momo: '📱 Mobile Money',
  credit: '🏦 Crédit',
};

export default function EncaissModal({
  items,
  sousTotal,
  remisePct,
  remiseMontant,
  total,
  payMode,
  montantRecu,
  clientNom,
  clientTelephone,
  boutique_nom,
  boutique_ville,
  caissier_nom,
  onClose,
  onValider,
  onNouvelleVente,
  onShowInvoice,
}: EncaissModalProps) {
  const [saving, setSaving] = useState(false);
  const [completedVente, setCompletedVente] = useState<VenteResult | null>(null);
  const validateBtnRef = useRef<HTMLButtonElement>(null);
  const nouvVenteBtnRef = useRef<HTMLButtonElement>(null);
  const rendu = payMode === 'especes' && montantRecu > 0 ? montantRecu - total : 0;

  // Focus the primary action button on mount and when state transitions
  useEffect(() => {
    if (completedVente) {
      nouvVenteBtnRef.current?.focus();
    } else {
      validateBtnRef.current?.focus();
    }
  }, [completedVente]);

  const handleValider = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const result = await onValider();
      if (result) {
        setCompletedVente(result);
        navigator.vibrate?.(50);
      }
    } finally {
      setSaving(false);
    }
  }, [onValider, saving]);

  // Keyboard shortcuts — different behaviour per state
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      const isInputFocused =
        activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';

      if (completedVente) {
        // ── State 2 shortcuts ──────────────────────────────────────────────────
        switch (e.key) {
          case 'Escape':
            e.preventDefault();
            onNouvelleVente();
            break;
          case 'Enter':
          case 'n':
          case 'N':
            if (!isInputFocused) {
              e.preventDefault();
              onNouvelleVente();
            }
            break;
          case 'w':
          case 'W':
            if (!isInputFocused) {
              e.preventDefault();
              handleWaOpen(completedVente, clientTelephone);
            }
            break;
          case 'p':
          case 'P':
            if (!isInputFocused) {
              e.preventDefault();
              onShowInvoice(completedVente, true);
            }
            break;
          case 'f':
          case 'F':
            if (!isInputFocused) {
              e.preventDefault();
              onShowInvoice(completedVente);
            }
            break;
        }
      } else {
        // ── State 1 shortcuts ──────────────────────────────────────────────────
        switch (e.key) {
          case 'Escape':
            e.preventDefault();
            onClose();
            break;
          case 'Enter':
            if (!isInputFocused && !saving) {
              e.preventDefault();
              void handleValider();
            }
            break;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [completedVente, onClose, onNouvelleVente, onShowInvoice, handleValider, clientTelephone, saving]);

  function handleWaOpen(vente: VenteResult, phone: string) {
    const msg = buildWhatsAppMessage({
      boutique_nom: vente.boutique_nom,
      boutique_ville: vente.boutique_ville,
      caissier_nom: vente.caissier_nom,
      numero_facture: vente.numero_facture,
      created_at: vente.created_at,
      lignes: vente.lignes.map((l) => ({
        nom: l.nom,
        quantite: l.quantite,
        prix_unitaire: l.prix_unitaire,
        sous_total: l.sous_total,
      })),
      sous_total: vente.sous_total,
      remise_pct: vente.remise_pct,
      remise_montant: vente.remise_montant,
      montant_total: vente.montant_total,
      mode_paiement: vente.mode_paiement,
      montant_recu: vente.montant_recu,
      monnaie_rendue: vente.monnaie_rendue,
      client_nom: vente.client_nom,
      client_telephone: vente.client_telephone,
    });
    window.open(buildWhatsAppUrl(phone || undefined, msg), '_blank');
  }

  const nbProduits = items.length;
  const totalArticles = items.reduce((s, i) => s + i.qty, 0);
  const isCompleted = completedVente !== null;

  return (
    <div
      className="c-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="encaiss-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (isCompleted) onNouvelleVente();
          else onClose();
        }
      }}
    >
      <div className="c-modal-card">
        {/* Header */}
        <div className="c-modal-header">
          <h2 id="encaiss-title" className="c-modal-title">
            {isCompleted ? 'VENTE ENREGISTRÉE ✅' : 'CONFIRMER LA VENTE'}
          </h2>
          <button
            type="button"
            className="c-modal-close"
            onClick={isCompleted ? onNouvelleVente : onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="c-modal-body">
          {/* Amount box */}
          <div className="c-amount-box">
            <p className="c-amount-label">
              {isCompleted ? 'MONTANT ENCAISSÉ' : 'MONTANT À ENCAISSER'}
            </p>
            <p className="c-amount-value">{formatFCFA(total)}</p>
            {isCompleted && (
              <p className="c-amount-facture">
                N° {completedVente.numero_facture}
              </p>
            )}
            {isCompleted && completedVente.caissier_nom && (
              <p className="c-amount-meta" style={{ fontSize: 11, marginTop: 2 }}>
                Caissier : {completedVente.caissier_nom}
              </p>
            )}
            <p className="c-amount-meta">
              {totalArticles} article{totalArticles > 1 ? 's' : ''} · {nbProduits} produit{nbProduits > 1 ? 's' : ''}
            </p>
          </div>

          {/* Summary lines */}
          <div style={{ marginBottom: 4 }}>
            <div className="c-summary-line">
              <span>Sous-total</span>
              <span style={{ fontFamily: 'Space Mono, monospace' }}>{formatFCFA(sousTotal)}</span>
            </div>
            {remiseMontant > 0 && (
              <div className="c-summary-line" style={{ color: 'var(--c-amber)' }}>
                <span>Remise ({remisePct}%)</span>
                <span style={{ fontFamily: 'Space Mono, monospace' }}>− {formatFCFA(remiseMontant)}</span>
              </div>
            )}
            <div className="c-summary-line">
              <span>Paiement</span>
              <span>{PAY_MODE_LABELS[payMode]}</span>
            </div>
            {payMode === 'especes' && montantRecu > 0 && (
              <>
                <div className="c-summary-line">
                  <span>Reçu</span>
                  <span style={{ fontFamily: 'Space Mono, monospace' }}>{formatFCFA(montantRecu)}</span>
                </div>
                <div className="c-summary-line" style={{ color: rendu >= 0 ? 'var(--c-accent)' : 'var(--c-red)' }}>
                  <span>Rendu</span>
                  <span style={{ fontFamily: 'Space Mono, monospace' }}>
                    {rendu >= 0 ? formatFCFA(rendu) : `⚠ −${formatFCFA(-rendu)}`}
                  </span>
                </div>
              </>
            )}
            {clientNom && (
              <div className="c-summary-line">
                <span>Client</span>
                <span>{clientNom}</span>
              </div>
            )}
            {caissier_nom && (
              <div className="c-summary-line" style={{ color: 'var(--c-muted)', fontSize: 11 }}>
                <span>Caissier</span>
                <span>{caissier_nom}</span>
              </div>
            )}
            <div style={{ height: 1, background: 'var(--c-rule2)', margin: '6px 0' }} />
            <div className="c-summary-line accent">
              <span>TOTAL</span>
              <span>{formatFCFA(total)}</span>
            </div>
          </div>

          {/* ── State 1: Single validate button ─────────────────────────────── */}
          {!isCompleted && (
            <button
              ref={validateBtnRef}
              type="button"
              className="c-btn-valider"
              onClick={() => void handleValider()}
              disabled={saving}
              aria-label={saving ? 'Enregistrement en cours…' : 'Valider la vente'}
            >
              {saving ? (
                <span>⏳ ENREGISTREMENT…</span>
              ) : (
                <>
                  <span className="valider-label">✅ VALIDER LA VENTE</span>
                  <span className="valider-amount">{formatFCFA(total)}</span>
                </>
              )}
            </button>
          )}

          {/* ── State 2: Post-sale action buttons ──────────────────────────── */}
          {isCompleted && (
            <>
              <div className="c-action-grid">
                <button
                  type="button"
                  className="c-action-btn wa"
                  onClick={() => handleWaOpen(completedVente, clientTelephone)}
                  aria-label="Envoyer la facture par WhatsApp [W]"
                >
                  <span className="btn-icon">📱</span>
                  <span>WHATSAPP TEXTE</span>
                </button>

                <button
                  type="button"
                  className="c-action-btn pdf"
                  onClick={() => onShowInvoice(completedVente)}
                  aria-label="Voir la facture PDF [F]"
                >
                  <span className="btn-icon">📄</span>
                  <span>FACTURE PDF</span>
                </button>

                <button
                  type="button"
                  className="c-action-btn print"
                  onClick={() => onShowInvoice(completedVente, true)}
                  aria-label="Imprimer le ticket [P]"
                >
                  <span className="btn-icon">🖨️</span>
                  <span>IMPRIMER</span>
                </button>

                <button
                  ref={nouvVenteBtnRef}
                  type="button"
                  className="c-action-btn new-sale"
                  onClick={onNouvelleVente}
                  aria-label="Démarrer une nouvelle vente [N]"
                >
                  <span className="btn-icon">➕</span>
                  <span>NOUVELLE VENTE</span>
                </button>
              </div>

              {/* Keyboard shortcut hints */}
              <p className="c-kbd-hints">
                <kbd>N</kbd> Nouvelle · <kbd>W</kbd> WhatsApp · <kbd>P</kbd> Imprimer · <kbd>F</kbd> Facture · <kbd>Esc</kbd> Fermer
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
