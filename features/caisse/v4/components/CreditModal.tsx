'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { CartItem } from '@/features/caisse/v3/useCart';
import { useCredit } from '../hooks/useCredit';
import { formatFCFA } from '@/lib/format';

interface CreditModalProps {
  open: boolean;
  total: number;
  items: CartItem[];
  onClose: () => void;
  onConfirm: (
    clientNom: string,
    clientTel: string,
    versement: number,
    echeance: string,
  ) => void;
  loading?: boolean;
}

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];

export default function CreditModal({
  open,
  total,
  items,
  onClose,
  onConfirm,
  loading,
}: CreditModalProps) {
  const [clientNom, setClientNom] = useState('');
  const [clientTel, setClientTel] = useState('');
  const [echeance, setEcheance] = useState('');
  const { verseRaw, verse, solde, pressKey, deleteLast, reset } = useCredit(total);

  if (!open) return null;

  function handleConfirm() {
    if (!clientNom.trim()) return;
    onConfirm(clientNom.trim(), clientTel.trim(), verse, echeance);
    setClientNom('');
    setClientTel('');
    setEcheance('');
    reset();
  }

  function handleKey(k: string) {
    if (k === '⌫') {
      deleteLast();
    } else if (k === '000') {
      pressKey('0');
      pressKey('0');
      pressKey('0');
    } else {
      pressKey(k);
    }
  }

  return (
    <div
      className="v4-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="v4-credit-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="v4-modal-sheet">
        <div className="v4-modal-handle" />

        <div className="v4-modal-header">
          <h2 id="v4-credit-title" className="v4-modal-title">📝 Vente à crédit</h2>
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

        {/* Summary panel */}
        <div className="v4-credit-summary">
          <div className="v4-credit-summary-lbl">MONTANT TOTAL</div>
          <div className="v4-credit-total">{formatFCFA(total)}</div>
          <div className="v4-credit-items-mini">
            {items.map((i) => (
              <div key={i.produit_id} className="v4-credit-item-mini">
                <span>{i.emoji} {i.nom}</span>
                <span>×{i.qty}</span>
                <span>{formatFCFA(i.prix_vente * i.qty)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Client info */}
        <div className="v4-credit-section">
          <div className="v4-credit-section-lbl">CLIENT</div>
          <input
            type="text"
            className="v4-credit-field"
            placeholder="Nom du client *"
            value={clientNom}
            onChange={(e) => setClientNom(e.target.value)}
            aria-label="Nom du client"
            style={{ minHeight: 44 }}
          />
          <input
            type="tel"
            className="v4-credit-field"
            placeholder="Téléphone"
            value={clientTel}
            onChange={(e) => setClientTel(e.target.value)}
            aria-label="Téléphone du client"
            style={{ minHeight: 44 }}
          />
        </div>

        {/* Versement numpad */}
        <div className="v4-credit-section">
          <div className="v4-credit-section-lbl">VERSEMENT INITIAL</div>
          <div className="v4-credit-amount-display">
            {verseRaw ? formatFCFA(verse) : '0 FCFA'}
          </div>
          <div className="v4-numpad">
            {NUMPAD_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                className={`v4-numpad-key${k === '⌫' ? ' delete' : ''}`}
                onClick={() => handleKey(k)}
                aria-label={k === '⌫' ? 'Effacer' : k}
                style={{ minHeight: 44 }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Solde restant */}
        <div className="v4-credit-solde">
          <span>Solde restant :</span>
          <span className="v4-credit-solde-val">{formatFCFA(solde)}</span>
        </div>

        {/* Échéance */}
        <div className="v4-credit-section">
          <div className="v4-credit-section-lbl">ÉCHÉANCE</div>
          <input
            type="date"
            className="v4-credit-field"
            value={echeance}
            onChange={(e) => setEcheance(e.target.value)}
            aria-label="Date d'échéance"
            style={{ minHeight: 44 }}
          />
        </div>

        {/* Confirm */}
        <div className="v4-modal-new">
          <button
            type="button"
            className="v4-btn-new-sale"
            onClick={handleConfirm}
            disabled={!clientNom.trim() || loading}
            style={{ minHeight: 44 }}
          >
            {loading ? '⏳ Enregistrement…' : '✅ Confirmer le crédit'}
          </button>
        </div>
      </div>
    </div>
  );
}
