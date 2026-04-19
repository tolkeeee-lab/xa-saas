'use client';

import { useEffect, useRef } from 'react';
import type { VenteResult } from './EncaissModal';
import { formatFCFA } from '@/lib/format';
import { buildWhatsAppMessage, buildWhatsAppUrl } from './lib/whatsappMessage';

interface InvoiceModalProps {
  vente: VenteResult;
  onClose: () => void;
  autoPrint?: boolean;
}

const PAY_MODE_LABELS: Record<string, string> = {
  especes: 'Espèces',
  momo: 'Mobile Money',
  credit: 'Crédit',
  carte: 'Carte',
};

export default function InvoiceModal({ vente, onClose, autoPrint }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 300);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        clearTimeout(t);
      };
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, autoPrint]);

  function handleWhatsApp() {
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
    const url = buildWhatsAppUrl(vente.client_telephone, msg);
    window.open(url, '_blank');
  }

  const date = new Date(vente.created_at);
  const dateStr = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Generate pseudo-barcode from transaction_id
  const barcode = vente.transaction_id.replace(/-/g, '').slice(0, 20).toUpperCase();

  return (
    <div
      className="c-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="c-modal-card wide">
        {/* Header */}
        <div className="c-modal-header">
          <h2 id="invoice-title" className="c-modal-title">FACTURE</h2>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              type="button"
              className="c-inv-btn wa"
              onClick={handleWhatsApp}
              aria-label="Envoyer par WhatsApp"
              style={{ flex: 'none', padding: '5px 10px', fontSize: 11 }}
            >
              📱 Envoyer WA
            </button>
            <button
              type="button"
              className="c-inv-btn print"
              onClick={() => window.print()}
              aria-label="Imprimer la facture"
              style={{ flex: 'none', padding: '5px 10px', fontSize: 11 }}
            >
              🖨️ Imprimer
            </button>
            <button
              type="button"
              className="c-modal-close"
              onClick={onClose}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Invoice preview — this div is targeted by print styles */}
        <div
          className="c-modal-body xa-print-target"
          ref={printRef}
        >
          <div className="invoice-preview">
            {/* Invoice header */}
            <div className="inv-header">
              <div>
                <div className="inv-brand">xà</div>
                <div className="inv-boutique">{vente.boutique_nom}</div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                  {vente.boutique_ville ?? 'Cotonou'}, Bénin
                </div>
              </div>
              <div className="inv-meta">
                <div className="inv-num">{vente.numero_facture}</div>
                <div>{dateStr}</div>
                <div>{timeStr}</div>
                {vente.caissier_nom && <div>Caissier : {vente.caissier_nom}</div>}
              </div>
            </div>

            {/* Client box */}
            {(vente.client_nom || vente.client_telephone) && (
              <div className="inv-client-box">
                {vente.client_nom && (
                  <div>
                    <strong>Client :</strong> {vente.client_nom}
                  </div>
                )}
                {vente.client_telephone && (
                  <div>
                    <strong>Tél :</strong> {vente.client_telephone}
                  </div>
                )}
              </div>
            )}

            {/* Line items table */}
            <table className="inv-table">
              <thead>
                <tr>
                  <th>DÉSIGNATION</th>
                  <th className="right">QTÉ</th>
                  <th className="right">PU</th>
                  <th className="right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {vente.lignes.map((l) => (
                  <tr key={l.produit_id}>
                    <td>
                      {l.emoji && <span aria-hidden="true">{l.emoji} </span>}
                      {l.nom}
                    </td>
                    <td className="right">{l.quantite}</td>
                    <td className="right">{formatFCFA(l.prix_unitaire)}</td>
                    <td className="right">{formatFCFA(l.sous_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="inv-totals">
              <div className="inv-totals-inner">
                <div className="inv-total-row">
                  <span>Sous-total</span>
                  <span style={{ fontFamily: 'Space Mono, monospace' }}>{formatFCFA(vente.sous_total)}</span>
                </div>
                {vente.remise_montant > 0 && (
                  <div className="inv-total-row" style={{ color: 'var(--c-amber)' }}>
                    <span>Remise ({vente.remise_pct}%)</span>
                    <span style={{ fontFamily: 'Space Mono, monospace' }}>− {formatFCFA(vente.remise_montant)}</span>
                  </div>
                )}
                <div className="inv-total-row">
                  <span>Paiement</span>
                  <span>{PAY_MODE_LABELS[vente.mode_paiement] ?? vente.mode_paiement}</span>
                </div>
                {vente.mode_paiement === 'especes' && (vente.montant_recu ?? 0) > 0 && (
                  <>
                    <div className="inv-total-row">
                      <span>Reçu</span>
                      <span style={{ fontFamily: 'Space Mono, monospace' }}>{formatFCFA(vente.montant_recu!)}</span>
                    </div>
                    <div className="inv-total-row">
                      <span>Rendu</span>
                      <span style={{ fontFamily: 'Space Mono, monospace' }}>{formatFCFA(vente.monnaie_rendue ?? 0)}</span>
                    </div>
                  </>
                )}
                <div className="inv-total-row grand">
                  <span>TOTAL TTC</span>
                  <span>{formatFCFA(vente.montant_total)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="inv-footer">
              <div className="inv-merci">MERCI POUR VOTRE ACHAT</div>
              <div className="inv-barcode">{barcode}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
