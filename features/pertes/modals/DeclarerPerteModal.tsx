'use client';

import { useState, useRef } from 'react';
import { X, Upload, AlertTriangle, Clock, ShoppingBag, FileText, Package } from 'lucide-react';
import type { PerteDeclaration } from '@/types/database';

type PerteMotif = PerteDeclaration['motif'];

type Produit = {
  id: string;
  nom: string;
  stock_actuel: number;
  unite?: string | null;
};

type Props = {
  boutiqueId: string;
  onClose: () => void;
  onSuccess: () => void;
};

const MOTIF_OPTIONS: { value: PerteMotif; label: string; icon: React.ReactNode }[] = [
  { value: 'sac_perce', label: 'Sac percé', icon: <Package size={16} /> },
  { value: 'perime', label: 'Périmé', icon: <Clock size={16} /> },
  { value: 'vol', label: 'Vol', icon: <AlertTriangle size={16} /> },
  { value: 'erreur_saisie', label: 'Erreur de saisie', icon: <FileText size={16} /> },
  { value: 'autre', label: 'Autre', icon: <ShoppingBag size={16} /> },
];

export default function DeclarerPerteModal({ boutiqueId, onClose, onSuccess }: Props) {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [produitSearch, setProduitSearch] = useState('');
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [motif, setMotif] = useState<PerteMotif>('autre');
  const [quantite, setQuantite] = useState('');
  const [note, setNote] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function searchProduits(q: string) {
    if (q.length < 2) {
      setProduits([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(
        `/api/stock/produits?boutique_id=${encodeURIComponent(boutiqueId)}&q=${encodeURIComponent(q)}&tab=tous&page=1`,
      );
      const json = (await res.json()) as { data?: Produit[] };
      setProduits(json.data ?? []);
    } catch {
      setProduits([]);
    } finally {
      setSearchLoading(false);
    }
  }

  function handleSearchChange(v: string) {
    setProduitSearch(v);
    setSelectedProduit(null);
    setShowSuggestions(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      void searchProduits(v);
    }, 300);
  }

  function handleSelectProduit(p: Produit) {
    setSelectedProduit(p);
    setProduitSearch(p.nom);
    setShowSuggestions(false);
    setProduits([]);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo trop volumineuse (max 5MB)');
      return;
    }
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduit) {
      setError('Sélectionnez un produit');
      return;
    }
    const qty = parseInt(quantite, 10);
    if (!qty || qty <= 0) {
      setError('Quantité invalide');
      return;
    }
    if (selectedProduit.stock_actuel > 0 && qty > selectedProduit.stock_actuel) {
      setError(`La quantité ne peut pas dépasser le stock actuel (${selectedProduit.stock_actuel})`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let photo_url: string | null = null;

      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        const uploadRes = await fetch('/api/pertes/upload-photo', {
          method: 'POST',
          body: formData,
        });
        const uploadJson = (await uploadRes.json()) as { photo_url?: string; error?: string };
        if (!uploadRes.ok) throw new Error(uploadJson.error ?? 'Erreur upload photo');
        photo_url = uploadJson.photo_url ?? null;
      }

      const res = await fetch('/api/pertes/declarer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: boutiqueId,
          produit_id: selectedProduit.id,
          motif,
          quantite: qty,
          note: note.trim() || null,
          photo_url,
        }),
      });

      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Erreur serveur');

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="xa-modal-backdrop">
      <div className="xa-modal-box">
        <div className="xa-modal-body">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xa-text text-lg">Déclarer une perte</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-xa-muted hover:text-xa-text p-1"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            {/* Produit search */}
            <div className="relative">
              <label className="block text-sm text-xa-muted mb-1">Produit *</label>
              <input
                type="text"
                value={produitSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Rechercher un produit…"
                className="w-full rounded-xl border border-xa-border bg-xa-bg text-xa-text text-sm px-3 py-3"
                autoComplete="off"
              />
              {showSuggestions && produits.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 bg-xa-surface border border-xa-border rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {searchLoading && (
                    <p className="text-center text-xa-muted text-sm py-2">Chargement…</p>
                  )}
                  {produits.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProduit(p)}
                      className="w-full text-left px-3 py-2 hover:bg-xa-bg text-sm flex justify-between items-center"
                    >
                      <span className="text-xa-text">{p.nom}</span>
                      <span className="text-xa-muted text-xs">Stock: {p.stock_actuel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Motif */}
            <div>
              <label className="block text-sm text-xa-muted mb-2">Motif *</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {MOTIF_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMotif(opt.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      motif === opt.value
                        ? 'border-xa-primary bg-xa-primary/5 text-xa-primary'
                        : 'border-xa-border text-xa-muted hover:border-xa-primary/40'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantité */}
            <div>
              <label className="block text-sm text-xa-muted mb-1">
                Quantité *{selectedProduit ? ` (max: ${selectedProduit.stock_actuel})` : ''}
              </label>
              <input
                type="number"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                min={1}
                max={selectedProduit?.stock_actuel ?? undefined}
                placeholder="0"
                className="w-full rounded-xl border border-xa-border bg-xa-bg text-xa-text text-sm px-3 py-3"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm text-xa-muted mb-1">Note (optionnelle)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Décrivez la situation…"
                className="w-full rounded-xl border border-xa-border bg-xa-bg text-xa-text text-sm px-3 py-3 resize-none"
              />
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-sm text-xa-muted mb-1">Photo justificative</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              {photoPreview ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-xa-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-xa-border text-xa-muted text-sm hover:border-xa-primary/40 transition-colors w-full justify-center"
                >
                  <Upload size={16} />
                  Ajouter une photo (max 5MB)
                </button>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !selectedProduit || !quantite}
              className="w-full py-4 rounded-2xl bg-xa-primary text-white text-base font-bold disabled:opacity-40 transition-opacity mt-2"
            >
              {submitting ? 'Déclaration en cours…' : 'Déclarer la perte'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
