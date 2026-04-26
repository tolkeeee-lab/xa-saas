'use client';

import { X, CheckCircle, XCircle } from 'lucide-react';
import type { RetraitClient } from '@/types/database';

type Props = {
  retrait: RetraitClient;
  isOwner: boolean;
  onValidate: () => void;
  onCancel: () => void;
  onClose: () => void;
};

export default function RetraitDetail({ retrait, isOwner, onValidate, onCancel, onClose }: Props) {
  const canValidate = retrait.statut === 'en_attente';
  const canCancel = isOwner && retrait.statut === 'en_attente';

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xa-text text-lg">#{retrait.numero}</h2>
          <p className="text-xa-muted text-sm">{retrait.client_nom} · {retrait.client_telephone}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-xa-bg transition-colors text-xa-muted"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Lignes */}
      <div className="rounded-xl border border-xa-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-xa-bg text-xa-muted">
              <th className="text-left px-3 py-2 font-normal">Produit</th>
              <th className="text-right px-3 py-2 font-normal">Qté</th>
              <th className="text-right px-3 py-2 font-normal">P.U.</th>
            </tr>
          </thead>
          <tbody>
            {retrait.lignes.map((ligne, i) => (
              <tr key={i} className="border-t border-xa-border">
                <td className="px-3 py-2 text-xa-text">{ligne.produit}</td>
                <td className="px-3 py-2 text-right text-xa-text">{ligne.qty}</td>
                <td className="px-3 py-2 text-right text-xa-muted">
                  {ligne.prix.toLocaleString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center font-bold text-xa-text">
        <span>Total</span>
        <span>{retrait.total.toLocaleString('fr-FR')} FCFA</span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {canValidate && (
          <button
            type="button"
            onClick={onValidate}
            className="flex items-center justify-center gap-2 bg-xa-primary text-white rounded-xl px-4 py-3 font-semibold text-base w-full min-h-[44px]"
          >
            <CheckCircle size={20} />
            Valider le retrait
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center justify-center gap-2 border border-red-400 text-red-500 rounded-xl px-4 py-3 font-medium text-sm w-full min-h-[44px] hover:bg-red-50 transition-colors"
          >
            <XCircle size={18} />
            Annuler ce retrait
          </button>
        )}
      </div>
    </div>
  );
}
