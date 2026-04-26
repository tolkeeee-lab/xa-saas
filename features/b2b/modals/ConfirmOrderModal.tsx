'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Boutique, ProduitCatalogueAdmin } from '@/types/database';

type ModePaiement = 'a_la_livraison' | 'momo' | 'virement';

type Props = {
  panier: Map<string, number>;
  catalogue: ProduitCatalogueAdmin[];
  boutique: Boutique;
  onClose: () => void;
  onSuccess: (commandeId: string) => void;
};

const MODE_LABELS: Record<ModePaiement, string> = {
  a_la_livraison: 'À la livraison',
  momo: 'MoMo',
  virement: 'Virement',
};

export default function ConfirmOrderModal({
  panier,
  catalogue,
  boutique,
  onClose,
  onSuccess,
}: Props) {
  const [modePaiement, setModePaiement] = useState<ModePaiement>('a_la_livraison');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const produitMap = new Map(catalogue.map((p) => [p.id, p]));

  const lignes = Array.from(panier.entries())
    .map(([id, quantite]) => {
      const p = produitMap.get(id);
      if (!p) return null;
      return {
        produit_admin_id: p.id,
        produit_nom: p.nom,
        produit_emoji: p.emoji,
        unite: p.unite,
        quantite,
        prix_unitaire: p.prix_b2b,
        total_ligne: quantite * p.prix_b2b,
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const sousTotal = lignes.reduce((s, l) => s + l.total_ligne, 0);
  const fraisLivraison = 0;
  const total = sousTotal + fraisLivraison;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/b2b/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: boutique.id,
          lignes,
          mode_paiement: modePaiement,
          note: note.trim() || null,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        commande_id?: string | null;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la soumission');
        return;
      }
      onSuccess(data.commande_id ?? '');
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="xa-modal-backdrop">
      <div className="xa-modal-box">
        <div className="xa-modal-header">
          <h2 className="font-bold text-xa-text">Confirmer la commande</h2>
          <button
            type="button"
            className="xa-modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="xa-modal-body flex flex-col gap-4">
          {/* Lignes recap */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xa-muted border-b border-xa-border">
                  <th className="text-left py-1 font-normal">Produit</th>
                  <th className="text-right py-1 font-normal">Qté</th>
                  <th className="text-right py-1 font-normal">P.U.</th>
                  <th className="text-right py-1 font-normal">Total</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.produit_admin_id} className="border-b border-xa-border">
                    <td className="py-1 text-xa-text">
                      {l.produit_emoji} {l.produit_nom}
                    </td>
                    <td className="py-1 text-right text-xa-text">{l.quantite}</td>
                    <td className="py-1 text-right text-xa-muted">
                      {l.prix_unitaire.toLocaleString('fr-FR')}
                    </td>
                    <td className="py-1 text-right font-medium text-xa-text">
                      {l.total_ligne.toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between text-xa-muted">
              <span>Sous-total</span>
              <span>{sousTotal.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between text-xa-muted">
              <span>Frais de livraison</span>
              <span>{fraisLivraison.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between font-bold text-xa-text border-t border-xa-border pt-1">
              <span>Total</span>
              <span>{total.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>

          {/* Mode paiement */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-xa-text">Mode de paiement</label>
            <div className="flex gap-3 flex-wrap">
              {(Object.entries(MODE_LABELS) as [ModePaiement, string][]).map(([mode, label]) => (
                <label key={mode} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode_paiement"
                    value={mode}
                    checked={modePaiement === mode}
                    onChange={() => setModePaiement(mode)}
                    className="accent-xa-primary"
                  />
                  <span className="text-sm text-xa-text">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-xa-text">Note (optionnel)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="rounded-xl border border-xa-border bg-xa-bg text-xa-text px-3 py-2 text-sm resize-none"
              placeholder="Instructions de livraison…"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || lignes.length === 0}
            className="bg-xa-primary text-white rounded-xl px-4 py-3 font-semibold w-full disabled:opacity-50"
          >
            {loading ? 'Soumission…' : 'Soumettre la commande'}
          </button>
        </form>
      </div>
    </div>
  );
}
