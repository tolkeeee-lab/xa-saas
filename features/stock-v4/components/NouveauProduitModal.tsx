'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import {
  calcPrixUnitaireAchat,
  calcMarge,
  decompose,
} from '../utils/produitCalculs';

interface NouveauProduitModalProps {
  boutiqueId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type ModeAchat = 'unite' | 'lot';

const QTY_PRESETS = [6, 12, 24, 48];

export default function NouveauProduitModal({
  boutiqueId,
  onClose,
  onSuccess,
}: NouveauProduitModalProps) {
  // ── Section 1 — Identification ────────────────────────────────────────────────
  const [nom, setNom] = useState('');
  const nomRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setTimeout(() => nomRef.current?.focus(), 80);
  }, []);

  // ── Section 2 — Conditionnement ───────────────────────────────────────────────
  const [modeAchat, setModeAchat] = useState<ModeAchat>('lot');
  const [lotLabel, setLotLabel] = useState('carton');
  const [uniteLabel, setUniteLabel] = useState('pièce');
  const [qtyParLot, setQtyParLot] = useState<number | ''>(24);
  const [qtyCustom, setQtyCustom] = useState('');
  const [showCustomQty, setShowCustomQty] = useState(false);
  const [prixLot, setPrixLot] = useState<number | ''>('');
  const [prixAchatUnite, setPrixAchatUnite] = useState<number | ''>('');

  const effectiveQtyParLot: number =
    showCustomQty ? (Number(qtyCustom) || 0) : (Number(qtyParLot) || 0);

  const computedPrixUnitaire =
    modeAchat === 'lot' && prixLot !== '' && effectiveQtyParLot > 0
      ? calcPrixUnitaireAchat(Number(prixLot), effectiveQtyParLot)
      : modeAchat === 'unite' && prixAchatUnite !== ''
      ? Number(prixAchatUnite)
      : 0;

  // ── Section 3 — Vente ─────────────────────────────────────────────────────────
  const [prixVente, setPrixVente] = useState<number | ''>('');

  const marge =
    prixVente !== '' && computedPrixUnitaire > 0
      ? calcMarge(Number(prixVente), computedPrixUnitaire)
      : null;

  // ── Section 4 — Stock ─────────────────────────────────────────────────────────
  const [stockActuel, setStockActuel] = useState<number | ''>('');
  const [seuilAlerte, setSeuilAlerte] = useState<number | ''>('');
  const [datePeremption, setDatePeremption] = useState('');

  // Auto-fill seuil from stock
  useEffect(() => {
    if (stockActuel !== '' && seuilAlerte === '') {
      setSeuilAlerte(Math.max(1, Math.round(Number(stockActuel) * 0.2)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockActuel]);

  const decomposeResult =
    modeAchat === 'lot' && stockActuel !== '' && effectiveQtyParLot > 0
      ? decompose(Number(stockActuel), effectiveQtyParLot)
      : null;

  // ── Touched (show hints only after user interacts) ────────────────────────────
  const [touched, setTouched] = useState(false);

  // ── Validation ────────────────────────────────────────────────────────────────
  const getValidationHint = useCallback((): string => {
    if (!nom.trim()) return 'Saisissez un nom de produit';
    if (modeAchat === 'lot' && effectiveQtyParLot <= 0) return 'Saisissez la quantité par lot';
    if (modeAchat === 'lot' && (prixLot === '' || Number(prixLot) <= 0)) return 'Saisissez le prix d\'achat du lot';
    if (modeAchat === 'unite' && (prixAchatUnite === '' || Number(prixAchatUnite) <= 0)) return 'Saisissez le prix d\'achat unitaire';
    if (prixVente === '' || Number(prixVente) <= 0) return 'Saisissez un prix de vente positif';
    if (stockActuel === '') return 'Saisissez le stock initial (0 si vide)';
    if (computedPrixUnitaire > 0 && Number(prixVente) <= computedPrixUnitaire)
      return `Prix de vente trop bas — doit être > ${formatF(computedPrixUnitaire)} (prix achat unitaire)`;
    return '';
  }, [nom, modeAchat, effectiveQtyParLot, prixLot, prixAchatUnite, prixVente, stockActuel, computedPrixUnitaire]);

  const isValid = useCallback(() => {
    if (!nom.trim()) return false;
    if (prixVente === '' || Number(prixVente) <= 0) return false;
    if (stockActuel === '') return false;
    if (modeAchat === 'lot') {
      if (effectiveQtyParLot <= 0) return false;
      if (prixLot === '' || Number(prixLot) <= 0) return false;
    } else {
      if (prixAchatUnite === '' || Number(prixAchatUnite) <= 0) return false;
    }
    if (computedPrixUnitaire > 0 && Number(prixVente) <= computedPrixUnitaire) return false;
    return true;
  }, [nom, prixVente, stockActuel, modeAchat, effectiveQtyParLot, prixLot, prixAchatUnite, computedPrixUnitaire]);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!isValid()) return;
    setSubmitting(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        boutique_id: boutiqueId,
        nom: nom.trim(),
        prix_vente: Number(prixVente),
        stock_actuel: Number(stockActuel),
        seuil_alerte: seuilAlerte !== '' ? Number(seuilAlerte) : Math.max(1, Math.round(Number(stockActuel) * 0.2)),
        mode_achat: modeAchat,
        unite_label: uniteLabel.trim() || 'pièce',
        date_peremption: datePeremption || null,
      };

      if (modeAchat === 'lot') {
        body.qty_par_lot = effectiveQtyParLot;
        body.prix_lot_achat = Number(prixLot);
        body.lot_label = lotLabel.trim() || 'carton';
        body.unite = uniteLabel.trim() || 'pièce';
        // prix_achat is computed server-side
      } else {
        body.prix_achat = Number(prixAchatUnite);
        body.unite = uniteLabel.trim() || 'pièce';
      }

      const res = await fetch('/api/produits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json() as { error?: string };
      if (!res.ok) {
        if (res.status === 400) {
          setError(json.error ?? 'Données invalides — vérifiez les champs');
        } else if (res.status === 401 || res.status === 403) {
          setError('Session expirée — veuillez vous reconnecter');
        } else {
          setError(json.error ?? `Erreur serveur (${res.status}) — réessayez`);
        }
        return;
      }

      onSuccess();
    } catch {
      setError('Erreur réseau — réessayez');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Close on Escape ───────────────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // ── Marge color class ─────────────────────────────────────────────────────────
  function margeClass(level: 'ok' | 'warn' | 'bad' | 'neg') {
    if (level === 'ok') return 'v4-np-margin-card--ok';
    if (level === 'warn') return 'v4-np-margin-card--warn';
    if (level === 'bad') return 'v4-np-margin-card--bad';
    return 'v4-np-margin-card--neg';
  }

  function formatF(n: number) {
    return `${Math.round(n).toLocaleString('fr-FR')} F`;
  }

  return (
    <div className="v4-np-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Nouveau produit">
      <div className="v4-np-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Sticky header ───────────────────────────────── */}
        <div className="v4-np-header">
          <span className="v4-np-title">Nouveau produit</span>
          <button type="button" className="v4-np-close" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable body ─────────────────────────────── */}
        <div className="v4-np-body">

          {/* ─ Section 1 — Identification ─────────────────── */}
          <div className="v4-np-section">
            <div className="v4-np-section-title">📦 Identification</div>

            <div className="v4-np-field">
              <label className="v4-np-label" htmlFor="np-nom">Nom du produit *</label>
              <input
                ref={nomRef}
                id="np-nom"
                type="text"
                className="v4-np-input"
                placeholder="ex: Coca-Cola 33cl"
                value={nom}
                onChange={(e) => { setNom(e.target.value); setTouched(true); }}
              />
            </div>

            <div className="v4-np-field">
              <label className="v4-np-label" htmlFor="np-sku">Code-barre / SKU</label>
              <div className="v4-np-input-row">
                <input
                  id="np-sku"
                  type="text"
                  className="v4-np-input"
                  placeholder="Optionnel"
                />
                <button
                  type="button"
                  className="v4-np-scan-btn"
                  disabled
                  title="Bientôt disponible"
                >
                  📷 Scanner
                </button>
              </div>
            </div>

            <div className="v4-np-field">
              <label className="v4-np-label">Photo</label>
              <button
                type="button"
                className="v4-np-photo-btn"
                disabled
                title="Bientôt disponible"
              >
                📷 Ajouter une photo
              </button>
            </div>
          </div>

          {/* ─ Section 2 — Conditionnement & Achat ───────── */}
          <div className="v4-np-section">
            <div className="v4-np-section-title">🛒 Achat &amp; conditionnement</div>

            {/* Radio pills */}
            <div className="v4-np-radio-pills">
              <button
                type="button"
                className={`v4-np-radio-pill${modeAchat === 'unite' ? ' v4-np-radio-pill--active' : ''}`}
                onClick={() => { setModeAchat('unite'); setTouched(true); }}
              >
                ⭕ À l&apos;unité
              </button>
              <button
                type="button"
                className={`v4-np-radio-pill${modeAchat === 'lot' ? ' v4-np-radio-pill--active' : ''}`}
                onClick={() => { setModeAchat('lot'); setTouched(true); }}
              >
                🔘 En lot / carton
              </button>
            </div>

            {modeAchat === 'lot' && (
              <>
                {/* Conditionnement */}
                <div className="v4-np-field">
                  <label className="v4-np-label" htmlFor="np-lot-label">Conditionnement</label>
                  <input
                    id="np-lot-label"
                    type="text"
                    className="v4-np-input"
                    value={lotLabel}
                    onChange={(e) => setLotLabel(e.target.value)}
                    placeholder="carton, sachet, bidon..."
                    list="np-lot-suggestions"
                  />
                  <datalist id="np-lot-suggestions">
                    <option value="carton" />
                    <option value="pack" />
                    <option value="sachet" />
                    <option value="bidon" />
                    <option value="caisse" />
                    <option value="palette" />
                    <option value="sac" />
                  </datalist>
                </div>

                {/* Unité de vente */}
                <div className="v4-np-field">
                  <label className="v4-np-label" htmlFor="np-unite-label">Unité de vente</label>
                  <input
                    id="np-unite-label"
                    type="text"
                    className="v4-np-input"
                    value={uniteLabel}
                    onChange={(e) => setUniteLabel(e.target.value)}
                    placeholder="bouteille, pièce, paquet..."
                    list="np-unite-suggestions"
                  />
                  <datalist id="np-unite-suggestions">
                    <option value="bouteille" />
                    <option value="pièce" />
                    <option value="paquet" />
                    <option value="litre" />
                    <option value="kg" />
                    <option value="sachet" />
                  </datalist>
                </div>

                {/* Quantité par lot */}
                <div className="v4-np-field">
                  <label className="v4-np-label">Quantité par {lotLabel || 'lot'}</label>
                  <div className="v4-np-presets">
                    {QTY_PRESETS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        className={`v4-np-preset-pill${!showCustomQty && qtyParLot === q ? ' v4-np-preset-pill--active' : ''}`}
                        onClick={() => {
                          setQtyParLot(q);
                          setShowCustomQty(false);
                        }}
                      >
                        {q}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`v4-np-preset-pill${showCustomQty ? ' v4-np-preset-pill--active' : ''}`}
                      onClick={() => setShowCustomQty(true)}
                    >
                      Autre
                    </button>
                  </div>
                  {showCustomQty && (
                    <input
                      type="number"
                      min={1}
                      className="v4-np-input"
                      placeholder="Quantité personnalisée"
                      value={qtyCustom}
                      onChange={(e) => setQtyCustom(e.target.value)}
                    />
                  )}
                </div>

                {/* Prix du lot */}
                <div className="v4-np-field">
                  <label className="v4-np-label" htmlFor="np-prix-lot">
                    Prix d&apos;achat d&apos;un {lotLabel || 'lot'}
                  </label>
                  <div className="v4-np-input-row">
                    <input
                      id="np-prix-lot"
                      type="number"
                      min={0}
                      className="v4-np-input"
                      placeholder="ex: 8000"
                      value={prixLot}
                      onChange={(e) => {
                        setPrixLot(e.target.value === '' ? '' : Number(e.target.value));
                        setTouched(true);
                      }}
                    />
                    <span className="v4-np-suffix">F</span>
                  </div>
                </div>

                {/* Calcul live */}
                {computedPrixUnitaire > 0 && (
                  <div className="v4-np-calc-card">
                    <div className="v4-np-calc-label">💡 Prix d&apos;achat unitaire calculé :</div>
                    <div className="v4-np-calc-value">
                      {formatF(computedPrixUnitaire)} / {uniteLabel || 'unité'}
                    </div>
                    <div className="v4-np-calc-detail">
                      ({formatF(Number(prixLot))} ÷ {effectiveQtyParLot} {uniteLabel || 'unités'})
                    </div>
                  </div>
                )}
              </>
            )}

            {modeAchat === 'unite' && (
              <>
                <div className="v4-np-field">
                  <label className="v4-np-label" htmlFor="np-unite-label-u">Unité</label>
                  <input
                    id="np-unite-label-u"
                    type="text"
                    className="v4-np-input"
                    value={uniteLabel}
                    onChange={(e) => setUniteLabel(e.target.value)}
                    placeholder="pièce, kg, litre..."
                    list="np-unite-suggestions-u"
                  />
                  <datalist id="np-unite-suggestions-u">
                    <option value="pièce" />
                    <option value="kg" />
                    <option value="litre" />
                    <option value="sachet" />
                    <option value="paquet" />
                  </datalist>
                </div>

                <div className="v4-np-field">
                  <label className="v4-np-label" htmlFor="np-prix-achat-u">
                    Prix d&apos;achat unitaire
                  </label>
                  <div className="v4-np-input-row">
                    <input
                      id="np-prix-achat-u"
                      type="number"
                      min={0}
                      className="v4-np-input"
                      placeholder="ex: 333"
                      value={prixAchatUnite}
                      onChange={(e) => {
                        setPrixAchatUnite(e.target.value === '' ? '' : Number(e.target.value));
                        setTouched(true);
                      }}
                    />
                    <span className="v4-np-suffix">F</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ─ Section 3 — Vente ──────────────────────────── */}
          <div className="v4-np-section">
            <div className="v4-np-section-title">💵 Prix de vente</div>

            <div className="v4-np-field">
              <label className="v4-np-label" htmlFor="np-prix-vente">
                Prix de vente unitaire *
              </label>
              <div className="v4-np-input-row">
                <input
                  id="np-prix-vente"
                  type="number"
                  min={0}
                  className="v4-np-input"
                  placeholder="ex: 400"
                  value={prixVente}
                  onChange={(e) => {
                    setPrixVente(e.target.value === '' ? '' : Number(e.target.value));
                    setTouched(true);
                  }}
                />
                <span className="v4-np-suffix">F / {uniteLabel || 'unité'}</span>
              </div>
            </div>

            {marge && (
              <div className={`v4-np-margin-card ${margeClass(marge.level)}`}>
                <div className="v4-np-margin-main">
                  {marge.level === 'neg' ? '⚠️' : '📈'} Marge :{' '}
                  {marge.montant >= 0 ? '+' : ''}{formatF(marge.montant)} / {uniteLabel || 'unité'}{' '}
                  ({marge.pct.toFixed(0)}%)
                </div>
                {marge.level === 'neg' && (
                  <div className="v4-np-margin-warn">⚠️ Vous vendez à perte !</div>
                )}
                {marge.level === 'bad' && (
                  <div className="v4-np-margin-warn">🚨 Marge faible — vérifiez votre prix</div>
                )}
                {modeAchat === 'lot' && effectiveQtyParLot > 0 && marge.montant >= 0 && (
                  <div className="v4-np-margin-secondary">
                    Sur 1 {lotLabel || 'lot'} vendu : +{formatF(marge.montant * effectiveQtyParLot)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─ Section 4 — Stock initial ───────────────────── */}
          <div className="v4-np-section">
            <div className="v4-np-section-title">📊 Stock initial</div>

            <div className="v4-np-field">
              <label className="v4-np-label" htmlFor="np-stock">
                Stock actuel *
              </label>
              <div className="v4-np-input-row">
                <input
                  id="np-stock"
                  type="number"
                  min={0}
                  className="v4-np-input"
                  placeholder="0"
                  value={stockActuel}
                  onChange={(e) => {
                    setStockActuel(e.target.value === '' ? '' : Number(e.target.value));
                    setTouched(true);
                  }}
                />
                <span className="v4-np-suffix">{uniteLabel || 'unités'}</span>
              </div>
              {decomposeResult && (
                <div className="v4-np-stock-helper">
                  Soit {decomposeResult.lots} {lotLabel || 'lot'}{decomposeResult.lots > 1 ? 's' : ''}
                  {decomposeResult.reste > 0
                    ? ` + ${decomposeResult.reste} ${uniteLabel || 'unité'}${decomposeResult.reste > 1 ? 's' : ''}`
                    : ''}
                </div>
              )}
            </div>

            <div className="v4-np-field">
              <label className="v4-np-label" htmlFor="np-seuil">
                Seuil d&apos;alerte (bas)
              </label>
              <div className="v4-np-input-row">
                <input
                  id="np-seuil"
                  type="number"
                  min={0}
                  className="v4-np-input"
                  placeholder="Défaut: 20% du stock"
                  value={seuilAlerte}
                  onChange={(e) =>
                    setSeuilAlerte(e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
                <span className="v4-np-suffix">{uniteLabel || 'unités'}</span>
              </div>
            </div>

            <div className="v4-np-field">
              <label className="v4-np-label" htmlFor="np-date-peremption">
                Date de péremption
              </label>
              <div className="v4-np-input-row">
                <input
                  id="np-date-peremption"
                  type="date"
                  className="v4-np-input"
                  value={datePeremption}
                  onChange={(e) => setDatePeremption(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && <div className="v4-np-error">{error}</div>}
        </div>

        {/* ── Sticky footer ───────────────────────────────── */}
        <div className="v4-np-footer">
          {touched && !isValid() && (
            <div className="v4-np-hint">{getValidationHint()}</div>
          )}
          <button
            type="button"
            className="v4-np-submit"
            disabled={!isValid() || submitting}
            onClick={() => { void handleSubmit(); }}
          >
            {submitting ? 'Enregistrement…' : '✅ Enregistrer le produit'}
          </button>
        </div>
      </div>
    </div>
  );
}
