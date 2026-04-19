'use client';

import { useEffect, useRef, useState } from 'react';
import type { CartItem } from './useCart';
import type { PayMode } from './PaymentSection';
import { formatFCFA } from '@/lib/format';
import { buildWhatsAppMessage, buildWhatsAppUrl, type WhatsAppInvoiceData } from './lib/whatsappMessage';

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
  /** Called when "NOUVELLE VENTE" is confirmed — performs the actual sale API call */
  onNouvelleVente: () => Promise<VenteResult | null>;
  onShowInvoice: (vente: VenteResult) => void;
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
  onNouvelleVente,
  onShowInvoice,
}: EncaissModalProps) {
  const [saving, setSaving] = useState(false);
  const [completedVente, setCompletedVente] = useState<VenteResult | null>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const rendu = payMode === 'especes' && montantRecu > 0 ? montantRecu - total : 0;

  // Trap focus & Esc close
  useEffect(() => {
    firstFocusRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleNouvelleVente() {
    if (saving) return;
    setSaving(true);
    try {
      const result = await onNouvelleVente();
      if (result) {
        setCompletedVente(result);
        // Auto close and show invoice after a brief moment
        setTimeout(() => {
          onClose();
          onShowInvoice(result);
        }, 300);
      }
    } finally {
      setSaving(false);
    }
  }

  function buildWaData(): WhatsAppInvoiceData {
    const now = new Date().toISOString();
    return {
      boutique_nom,
      boutique_ville,
      caissier_nom,
      lignes: items.map((i) => ({
        nom: i.nom,
        quantite: i.qty,
        prix_unitaire: i.prix_vente,
        sous_total: i.prix_vente * i.qty,
      })),
      sous_total: sousTotal,
      remise_pct: remisePct,
      remise_montant: remiseMontant,
      montant_total: total,
      mode_paiement: payMode,
      montant_recu: payMode === 'especes' ? montantRecu : undefined,
      monnaie_rendue: payMode === 'especes' ? Math.max(0, rendu) : undefined,
      client_nom: clientNom || undefined,
      client_telephone: clientTelephone || undefined,
      created_at: now,
    };
  }

  function handleWhatsApp() {
    const data = completedVente
      ? {
          ...buildWaData(),
          numero_facture: completedVente.numero_facture,
          created_at: completedVente.created_at,
        }
      : buildWaData();
    const msg = buildWhatsAppMessage(data);
    const url = buildWhatsAppUrl(clientTelephone || undefined, msg);
    window.open(url, '_blank');
  }

  function handleShowInvoice() {
    // Build a provisional vente data for preview
    const provisional: VenteResult = completedVente ?? {
      transaction_id: crypto.randomUUID(),
      numero_facture: 'APERÇU',
      created_at: new Date().toISOString(),
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
      montant_recu: payMode === 'especes' ? montantRecu : undefined,
      monnaie_rendue: payMode === 'especes' && rendu >= 0 ? rendu : undefined,
      client_nom: clientNom || undefined,
      client_telephone: clientTelephone || undefined,
      boutique_nom,
      boutique_ville,
      caissier_nom,
    };
    onShowInvoice(provisional);
  }

  function handlePrint() {
    handleShowInvoice();
    // window.print() will be called from InvoiceModal after it's open
  }

  const nbProduits = items.length;
  const totalArticles = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div
      className="c-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="encaiss-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="c-modal-card">
        {/* Header */}
        <div className="c-modal-header">
          <h2 id="encaiss-title" className="c-modal-title">
            CONFIRMER LA VENTE
          </h2>
          <button
            type="button"
            className="c-modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="c-modal-body">
          {/* Amount box */}
          <div className="c-amount-box">
            <p className="c-amount-label">MONTANT À ENCAISSER</p>
            <p className="c-amount-value">{formatFCFA(total)}</p>
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
            <div style={{ height: 1, background: 'var(--c-rule2)', margin: '6px 0' }} />
            <div className="c-summary-line accent">
              <span>TOTAL</span>
              <span>{formatFCFA(total)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="c-action-grid">
            <button
              type="button"
              className="c-action-btn wa"
              onClick={handleWhatsApp}
              aria-label="Envoyer la facture par WhatsApp"
            >
              <span className="btn-icon">📱</span>
              <span>WHATSAPP TEXTE</span>
            </button>

            <button
              type="button"
              className="c-action-btn pdf"
              onClick={handleShowInvoice}
              aria-label="Voir la facture PDF"
            >
              <span className="btn-icon">📄</span>
              <span>FACTURE PDF</span>
            </button>

            <button
              type="button"
              className="c-action-btn print"
              onClick={handlePrint}
              aria-label="Imprimer le ticket"
            >
              <span className="btn-icon">🖨️</span>
              <span>IMPRIMER</span>
            </button>

            <button
              ref={firstFocusRef}
              type="button"
              className="c-action-btn new-sale"
              onClick={handleNouvelleVente}
              disabled={saving}
              aria-label="Valider la vente et démarrer une nouvelle vente"
            >
              <span className="btn-icon">{saving ? '⏳' : '➕'}</span>
              <span>{saving ? 'ENREGISTREMENT…' : 'NOUVELLE VENTE'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
