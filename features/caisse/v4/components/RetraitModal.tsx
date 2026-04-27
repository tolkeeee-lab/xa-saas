'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { RetraitCommande } from '../hooks/useRetrait';
import { formatFCFA } from '@/lib/format';

interface RetraitModalProps {
  open: boolean;
  data: RetraitCommande | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RetraitModal({
  open,
  data,
  onClose,
  onConfirm,
}: RetraitModalProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [validated, setValidated] = useState(false);

  if (!open || !data) return null;

  const allChecked = data.items.length > 0 && checked.size === data.items.length;
  const total = data.items.reduce((s, i) => s + i.qty * i.pr, 0);

  function toggleItem(idx: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function handleConfirm() {
    if (!allChecked) return;
    setValidated(true);
    onConfirm();
  }

  function handleClose() {
    setChecked(new Set());
    setValidated(false);
    onClose();
  }

  const initials = data.client
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const progress = data.items.length > 0 ? (checked.size / data.items.length) * 100 : 0;

  return (
    <div
      className="v4-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="v4-retrait-title"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') handleClose(); }}
    >
      <div className="v4-ret-sheet">
        <div className="v4-modal-handle" />

        {validated ? (
          /* Validated state */
          <div className="v4-ret-validated">
            <div className="v4-ret-check">✅</div>
            <p>Retrait confirmé !</p>
            <button
              type="button"
              className="v4-btn-new-sale"
              onClick={handleClose}
              style={{ minHeight: 44 }}
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="v4-modal-header">
              <h2 id="v4-retrait-title" className="v4-modal-title">
                📦 Retrait commande
              </h2>
              <button
                type="button"
                className="v4-modal-close"
                onClick={handleClose}
                aria-label="Fermer"
                style={{ minHeight: 44, minWidth: 44 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Hero client */}
            <div className="v4-ret-hero">
              <div className="v4-ret-avatar">{initials}</div>
              <div className="v4-ret-client-info">
                <div className="v4-ret-client-name">{data.client}</div>
                <div className="v4-ret-client-phone">{data.phone}</div>
              </div>
              <span className={`v4-ret-status${data.paye ? ' paye' : ' credit'}`}>
                {data.paye ? '✅ Payé' : '📝 Crédit'}
              </span>
            </div>

            {/* Meta grid */}
            <div className="v4-ret-meta">
              <div className="v4-ret-meta-item">
                <span>Réf</span>
                <strong>{data.ref}</strong>
              </div>
              <div className="v4-ret-meta-item">
                <span>Mode</span>
                <strong>{data.mode}</strong>
              </div>
              <div className="v4-ret-meta-item">
                <span>Date</span>
                <strong>{data.date}</strong>
              </div>
              <div className="v4-ret-meta-item">
                <span>Expire</span>
                <strong>{data.expire}</strong>
              </div>
            </div>

            {/* Progress bar */}
            <div className="v4-ret-progress-wrap">
              <div
                className="v4-ret-progress-bar"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={checked.size}
                aria-valuemin={0}
                aria-valuemax={data.items.length}
              />
            </div>
            <p className="v4-ret-progress-lbl">
              {checked.size} / {data.items.length} articles vérifiés
            </p>

            {/* Checklist */}
            <div className="v4-ret-checklist">
              {data.items.map((item, idx) => (
                <label key={idx} className="v4-ret-check-item">
                  <input
                    type="checkbox"
                    checked={checked.has(idx)}
                    onChange={() => toggleItem(idx)}
                    aria-label={`Vérifier ${item.nm}`}
                  />
                  <span className="v4-ret-check-em">{item.em}</span>
                  <span className="v4-ret-check-name">{item.nm}</span>
                  <span className="v4-ret-check-qty">×{item.qty}</span>
                  <span className="v4-ret-check-price">{formatFCFA(item.pr)}</span>
                  {checked.has(idx) && (
                    <Check size={14} className="v4-ret-check-icon" />
                  )}
                </label>
              ))}
            </div>

            {/* Total bar */}
            <div className="v4-ret-total">
              <span>Total</span>
              <span>{formatFCFA(total)}</span>
            </div>

            {/* Confirm */}
            <div className="v4-modal-new">
              <button
                type="button"
                className="v4-btn-new-sale"
                onClick={handleConfirm}
                disabled={!allChecked}
                style={{ minHeight: 44 }}
              >
                ✅ Confirmer le retrait
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
