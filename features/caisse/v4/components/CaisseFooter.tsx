'use client';

import { Tag, ChevronUp } from 'lucide-react';
import { formatFCFA } from '@/lib/format';

interface CaisseFooterProps {
  total: number;
  sousTotal: number;
  remisePct: number;
  onRemisePctChange: (v: number) => void;
  nbArticles: number;
  nbProduits: number;
  onVendu: () => void;
  onCredit: () => void;
  onPrint: () => void;
  onPDF: () => void;
  onWhatsApp: () => void;
  loading?: boolean;
  hasItems: boolean;
  /** Whether the expandable section is shown (mobile only) */
  isExpanded?: boolean;
  /** Called when the user taps the handle bar (mobile only) */
  onToggleExpand?: () => void;
}

export default function CaisseFooter({
  total,
  sousTotal,
  remisePct,
  onRemisePctChange,
  nbArticles,
  nbProduits,
  onVendu,
  onCredit,
  onPrint,
  onPDF,
  onWhatsApp,
  loading,
  hasItems,
  isExpanded = true,
  onToggleExpand,
}: CaisseFooterProps) {
  const remiseMontant = remisePct > 0 ? Math.round(sousTotal * remisePct / 100) : 0;

  return (
    <div className="v4-footer">
      {/* Compact handle bar — mobile only: toggle area + quick Vendu button side-by-side */}
      <div className="v4-footer-handle-row">
        {/* Drag handle indicator (visible on mobile) */}
        <div className="v4-footer-handle-drag" aria-hidden="true" />
        <button
          type="button"
          className="v4-footer-handle"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          aria-controls="v4-footer-body"
          aria-label={isExpanded ? 'Réduire le panier' : 'Déplier le panier'}
        >
          <span className="v4-footer-handle-total">{formatFCFA(total)}</span>
          <span className="v4-footer-handle-meta">
            {nbArticles} art.
          </span>
          <ChevronUp
            size={16}
            className={`v4-footer-handle-chevron${isExpanded ? ' up' : ''}`}
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          className="v4-footer-handle-vendu"
          onClick={onVendu}
          disabled={!hasItems || loading}
          aria-label="Enregistrer la vente comptant"
        >
          {loading ? '⏳' : '✅ Vendu'}
        </button>
      </div>

      {/* Expandable body */}
      <div
        id="v4-footer-body"
        className={`v4-footer-expandable${isExpanded ? '' : ' collapsed'}`}
      >
        {/* Remise row */}
        <div className="v4-remise-row">
          <Tag size={12} />
          <span className="v4-remise-lbl">Remise</span>
          <input
            type="number"
            className="v4-remise-input"
            min={0}
            max={100}
            value={remisePct || ''}
            onChange={(e) => {
              const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
              onRemisePctChange(val);
            }}
            placeholder="0"
            aria-label="Pourcentage de remise"
            style={{ minHeight: 44 }}
          />
          <span className="v4-remise-pct">%</span>
          {remiseMontant > 0 && (
            <span className="v4-remise-badge">−{formatFCFA(remiseMontant)}</span>
          )}
        </div>

        {/* Total */}
        <div className="v4-total-row">
          <div className="v4-total-label">
            <span>TOTAL</span>
            <span className="v4-total-meta">
              {nbArticles} art. · {nbProduits} prod.
            </span>
          </div>
          <span className="v4-total-value">{formatFCFA(total)}</span>
        </div>

        {/* Primary action buttons */}
        <div className="v4-action-row">
          <button
            type="button"
            className="v4-btn-vendu"
            onClick={onVendu}
            disabled={!hasItems || loading}
            aria-label="Enregistrer la vente comptant"
            style={{ minHeight: 44 }}
          >
            {loading ? '⏳ …' : '✅ Vendu'}
          </button>
          <button
            type="button"
            className="v4-btn-credit"
            onClick={onCredit}
            disabled={!hasItems || loading}
            aria-label="Enregistrer une vente à crédit"
            style={{ minHeight: 44 }}
          >
            📝 Crédit
          </button>
        </div>

        {/* Secondary actions */}
        <div className="v4-secondary-row">
          <button
            type="button"
            className="v4-btn-secondary"
            onClick={onPrint}
            disabled={!hasItems}
            aria-label="Imprimer le ticket"
            style={{ minHeight: 44 }}
          >
            🖨 Imprimer
          </button>
          <button
            type="button"
            className="v4-btn-secondary"
            onClick={onPDF}
            disabled={!hasItems}
            aria-label="Exporter en PDF"
            style={{ minHeight: 44 }}
          >
            📄 PDF
          </button>
          <button
            type="button"
            className="v4-btn-secondary v4-btn-wa"
            onClick={onWhatsApp}
            disabled={!hasItems}
            aria-label="Envoyer par WhatsApp"
            style={{ minHeight: 44 }}
          >
            📱 WA
          </button>
        </div>
      </div>
    </div>
  );
}
