'use client';

import { X } from 'lucide-react';
import type { VenteResult } from '../types';
import { formatFCFA } from '@/lib/format';

interface RecuModalProps {
  vente: VenteResult | null;
  onClose: () => void;
  onNewSale: () => void;
}

function buildTicketHTML(vente: VenteResult): string {
  const lignesHTML = vente.lignes
    .map(
      (l) =>
        `<tr><td>${l.emoji ?? ''}${l.nom}</td><td style="text-align:right">${l.quantite}</td><td style="text-align:right">${formatFCFA(l.prix_unitaire)}</td><td style="text-align:right">${formatFCFA(l.sous_total)}</td></tr>`,
    )
    .join('');

  return `
    <div style="font-family:'Courier New',monospace;max-width:320px;margin:0 auto;padding:16px">
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-weight:900;font-size:20px;letter-spacing:2px">XÀ</div>
        <div style="font-size:13px;font-weight:700">${vente.boutique_nom}</div>
        ${vente.boutique_ville ? `<div style="font-size:11px;color:#666">${vente.boutique_ville}</div>` : ''}
        <div style="font-size:10px;color:#666;margin-top:4px">${new Date(vente.created_at).toLocaleString('fr-FR')}</div>
        <div style="font-size:10px;color:#666">N° ${vente.numero_facture}</div>
        ${vente.caissier_nom ? `<div style="font-size:10px;color:#666">Caissier : ${vente.caissier_nom}</div>` : ''}
      </div>
      <hr style="border:none;border-top:1px dashed #ccc;margin:8px 0"/>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr style="border-bottom:1px dashed #ccc"><th style="text-align:left">Produit</th><th style="text-align:right">Qté</th><th style="text-align:right">PU</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>${lignesHTML}</tbody>
      </table>
      <hr style="border:none;border-top:1px dashed #ccc;margin:8px 0"/>
      ${vente.remise_pct > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px"><span>Remise (${vente.remise_pct}%)</span><span>−${formatFCFA(vente.remise_montant)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;margin-top:4px"><span>TOTAL</span><span>${formatFCFA(vente.montant_total)}</span></div>
      ${vente.client_nom ? `<div style="font-size:10px;color:#666;margin-top:8px">Client : ${vente.client_nom}</div>` : ''}
      <div style="text-align:center;margin-top:12px;font-size:9px;color:#999">Merci de votre confiance · xà</div>
    </div>`;
}

export default function RecuModal({ vente, onClose, onNewSale }: RecuModalProps) {
  if (!vente) return null;

  function handlePrint() {
    const zone = document.getElementById('v4-print-zone');
    if (!zone) return;
    zone.innerHTML = buildTicketHTML(vente!);
    window.print();
    zone.innerHTML = '';
  }

  function handlePDF() {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reçu ${vente!.numero_facture}</title></head><body>${buildTicketHTML(vente!)}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }

  function handleWhatsApp() {
    const lines = vente!.lignes
      .map((l) => `• ${l.nom} ×${l.quantite} = ${formatFCFA(l.sous_total)}`)
      .join('\n');
    const msg = [
      `🧾 *Reçu — ${vente!.boutique_nom}*`,
      `N° ${vente!.numero_facture}`,
      ``,
      lines,
      ``,
      vente!.remise_pct > 0 ? `Remise (${vente!.remise_pct}%) : −${formatFCFA(vente!.remise_montant)}` : null,
      `*TOTAL : ${formatFCFA(vente!.montant_total)}*`,
      vente!.client_nom ? `Client : ${vente!.client_nom}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const phone = vente!.client_telephone?.replace(/\D/g, '') ?? '';
    window.open(`https://wa.me/${phone ? phone : ''}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  return (
    <div
      className="v4-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="v4-recu-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="v4-modal-sheet">
        {/* Handle */}
        <div className="v4-modal-handle" />

        {/* Header */}
        <div className="v4-modal-header">
          <h2 id="v4-recu-title" className="v4-modal-title">🧾 Vente enregistrée</h2>
          <button
            type="button"
            className="v4-modal-close"
            onClick={onClose}
            aria-label="Fermer"
            style={{ minHeight: 44, minWidth: 44 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Ticket */}
        <div className="v4-ticket">
          <div className="v4-ticket-header">
            <div className="v4-ticket-logo">XÀ</div>
            <div className="v4-ticket-boutique">{vente.boutique_nom}</div>
            {vente.boutique_ville && (
              <div className="v4-ticket-ville">{vente.boutique_ville}</div>
            )}
            <div className="v4-ticket-meta">
              {new Date(vente.created_at).toLocaleString('fr-FR')} · N°{' '}
              {vente.numero_facture}
            </div>
            {vente.caissier_nom && (
              <div className="v4-ticket-meta">Caissier : {vente.caissier_nom}</div>
            )}
          </div>

          <div className="v4-ticket-divider" />

          <table className="v4-ticket-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Qté</th>
                <th>PU</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {vente.lignes.map((l) => (
                <tr key={l.produit_id}>
                  <td>
                    {l.emoji ? `${l.emoji} ` : ''}
                    {l.nom}
                  </td>
                  <td>{l.quantite}</td>
                  <td>{formatFCFA(l.prix_unitaire)}</td>
                  <td>{formatFCFA(l.sous_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="v4-ticket-divider" />

          {vente.remise_pct > 0 && (
            <div className="v4-ticket-line">
              <span>Remise ({vente.remise_pct}%)</span>
              <span>−{formatFCFA(vente.remise_montant)}</span>
            </div>
          )}
          <div className="v4-ticket-line total">
            <span>TOTAL</span>
            <span>{formatFCFA(vente.montant_total)}</span>
          </div>
          {vente.client_nom && (
            <div className="v4-ticket-line">
              <span>Client</span>
              <span>{vente.client_nom}</span>
            </div>
          )}

          <div className="v4-ticket-footer">Merci de votre confiance · xà</div>
        </div>

        {/* Action buttons */}
        <div className="v4-modal-btns">
          <button
            type="button"
            className="v4-btn-secondary"
            onClick={handlePrint}
            style={{ minHeight: 44 }}
          >
            🖨 Imprimer
          </button>
          <button
            type="button"
            className="v4-btn-secondary"
            onClick={handlePDF}
            style={{ minHeight: 44 }}
          >
            📄 PDF
          </button>
        </div>
        <div className="v4-modal-wa">
          <button
            type="button"
            className="v4-btn-wa-full"
            onClick={handleWhatsApp}
            style={{ minHeight: 44 }}
          >
            📱 Envoyer par WhatsApp
          </button>
        </div>
        <div className="v4-modal-new">
          <button
            type="button"
            className="v4-btn-new-sale"
            onClick={onNewSale}
            style={{ minHeight: 44 }}
          >
            ➕ Nouvelle Vente
          </button>
        </div>
      </div>

      {/* Print zone (hidden) */}
      <div id="v4-print-zone" style={{ display: 'none' }} aria-hidden="true" />
    </div>
  );
}
