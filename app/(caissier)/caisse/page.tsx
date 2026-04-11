'use client';

import { useState, useCallback } from 'react';
import { formatPrice } from '@/lib/format';
import { hashPin } from '@/lib/pinHash';
import { savePendingTransaction, syncPendingTransactions } from '@/lib/offlineSync';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { ProduitPublic, ModePaiement } from '@/types/database';

interface CartItem {
  produit: ProduitPublic;
  quantite: number;
}

interface BoutiqueInfo {
  id: string;
  nom: string;
  code_unique: string | null;
}

type Step = 'select-boutique' | 'verify-pin' | 'caisse';

export default function CaissePage() {
  const [step, setStep] = useState<Step>('select-boutique');
  const [codeInput, setCodeInput] = useState('');
  const [boutique, setBoutique] = useState<BoutiqueInfo | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [employe, setEmploye] = useState<{ id: string; nom: string } | null>(null);

  const [produits, setProduits] = useState<ProduitPublic[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modePaiement, setModePaiement] = useState<ModePaiement>('especes');
  const [montantRecu, setMontantRecu] = useState('');
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<{ total: number; monnaie: number } | null>(null);
  const [search, setSearch] = useState('');

  const total = cart.reduce((sum, item) => sum + item.produit.prix_vente * item.quantite, 0);
  const monnaie = Math.max(0, Number(montantRecu) - total);

  async function handleFindBoutique(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/caisse/boutique?code=${encodeURIComponent(codeInput.trim())}`);
    if (!res.ok) { alert('Boutique introuvable.'); return; }
    const data = await res.json() as BoutiqueInfo;
    setBoutique(data);
    setStep('verify-pin');
  }

  async function handleVerifyPin(e: React.FormEvent) {
    e.preventDefault();
    setPinError('');
    const hash = await hashPin(pinInput);
    const res = await fetch('/api/caisse/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boutique_id: boutique!.id, pin: hash }),
    });
    const data = await res.json() as { ok: boolean; employe?: { id: string; nom: string }; error?: string };
    if (!data.ok) { setPinError(data.error ?? 'PIN incorrect.'); return; }
    setEmploye(data.employe ?? null);
    setStep('caisse');
    loadProduits();
    syncPendingTransactions().catch(() => null);
  }

  const loadProduits = useCallback(async () => {
    if (!boutique) return;
    const res = await fetch(`/api/caisse/produits?boutique_id=${boutique.id}`);
    if (res.ok) setProduits(await res.json() as ProduitPublic[]);
  }, [boutique]);

  function addToCart(produit: ProduitPublic) {
    setCart(prev => {
      const existing = prev.find(i => i.produit.id === produit.id);
      if (existing) return prev.map(i => i.produit.id === produit.id ? { ...i, quantite: i.quantite + 1 } : i);
      return [...prev, { produit, quantite: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(i => i.produit.id !== id));
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.produit.id === id ? { ...i, quantite: qty } : i));
  }

  async function handleSell() {
    if (!boutique || cart.length === 0) return;
    setProcessing(true);

    const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const transactionData = {
      local_id: localId,
      boutique_id: boutique.id,
      employe_id: employe?.id ?? null,
      client_debiteur_id: null,
      type: 'vente' as const,
      statut: 'validee' as const,
      mode_paiement: modePaiement,
      montant_total: total,
      montant_recu: Number(montantRecu) || total,
      monnaie_rendue: monnaie,
      montant_credit: 0,
      reference: null,
      notes: null,
      sync_statut: 'local' as const,
      synced_at: null,
      created_at: new Date().toISOString(),
    };

    const lignes = cart.map(item => ({
      transaction_id: '',
      produit_id: item.produit.id,
      nom_produit: item.produit.nom,
      quantite: item.quantite,
      prix_unitaire: item.produit.prix_vente,
    }));

    try {
      const res = await fetch('/api/caisse/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: transactionData, lignes }),
      });

      if (!res.ok) throw new Error('Erreur réseau');
      setReceipt({ total, monnaie });
      setCart([]);
      setMontantRecu('');
      loadProduits();
    } catch {
      await savePendingTransaction({ localId, transaction: transactionData, lignes, createdAt: new Date().toISOString() });
      setReceipt({ total, monnaie });
      setCart([]);
      setMontantRecu('');
    }
    setProcessing(false);
  }

  const filteredProduits = produits.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase()) && p.stock_actuel > 0
  );

  if (step === 'select-boutique') {
    return (
      <main className="min-h-screen bg-xa-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-4xl font-bold text-xa-primary text-center mb-2">xà</h1>
          <p className="text-gray-500 text-center mb-6">Caisse</p>
          <Card>
            <form onSubmit={handleFindBoutique} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code boutique</label>
                <input
                  type="text"
                  required
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.toUpperCase())}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-xa-primary/30"
                  placeholder="ABC123"
                />
              </div>
              <Button type="submit" className="w-full">Accéder</Button>
            </form>
          </Card>
        </div>
      </main>
    );
  }

  if (step === 'verify-pin') {
    return (
      <main className="min-h-screen bg-xa-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-bold text-xa-primary text-center mb-1">{boutique?.nom}</h1>
          <p className="text-gray-500 text-center mb-6">Entrez votre PIN</p>
          <Card>
            <form onSubmit={handleVerifyPin} className="space-y-4">
              {pinError && <div className="text-xa-danger text-sm">{pinError}</div>}
              <input
                type="password"
                required
                inputMode="numeric"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                className="w-full text-center text-2xl tracking-[0.5em] border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-xa-primary/30"
                placeholder="••••"
                autoFocus
              />
              <Button type="submit" className="w-full">Valider</Button>
              <button type="button" onClick={() => setStep('select-boutique')} className="w-full text-sm text-gray-400 hover:text-gray-600">
                ← Changer de boutique
              </button>
            </form>
          </Card>
        </div>
      </main>
    );
  }

  if (receipt) {
    return (
      <main className="min-h-screen bg-xa-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-xa-primary mb-1">Vente enregistrée</h2>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatPrice(receipt.total)}</p>
          {receipt.monnaie > 0 && <p className="text-gray-600 mb-6">Monnaie : <strong>{formatPrice(receipt.monnaie)}</strong></p>}
          <Button onClick={() => setReceipt(null)} className="w-full">Nouvelle vente</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-xa-bg px-4 py-4 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-xa-primary">{boutique?.nom}</h2>
          {employe && <p className="text-xs text-gray-500">{employe.nom}</p>}
        </div>
        <button onClick={() => { setStep('select-boutique'); setCart([]); }} className="text-xs text-gray-400 hover:text-xa-danger">Quitter</button>
      </div>

      {/* Recherche produit */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Rechercher un produit…"
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-xa-primary/30"
      />

      {/* Liste produits */}
      <div className="grid grid-cols-2 gap-2 mb-4 max-h-48 overflow-y-auto">
        {filteredProduits.map(p => (
          <button
            key={p.id}
            onClick={() => addToCart(p)}
            className="bg-white rounded-2xl p-3 text-left shadow-sm hover:shadow-md transition-shadow border border-transparent hover:border-xa-primary/20"
          >
            <p className="text-sm font-semibold text-gray-900 truncate">{p.nom}</p>
            <p className="text-xs text-xa-primary font-bold">{formatPrice(p.prix_vente)}</p>
            <p className="text-xs text-gray-400">Stock : {p.stock_actuel}</p>
          </button>
        ))}
        {filteredProduits.length === 0 && <p className="col-span-2 text-center text-gray-400 text-sm py-4">Aucun produit.</p>}
      </div>

      {/* Panier */}
      {cart.length > 0 && (
        <Card title="Panier" className="mb-4">
          <div className="space-y-2">
            {cart.map(item => (
              <div key={item.produit.id} className="flex items-center justify-between gap-2">
                <span className="text-sm flex-1 truncate">{item.produit.nom}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.produit.id, item.quantite - 1)} className="w-6 h-6 rounded-full bg-gray-100 text-sm font-bold text-gray-600">−</button>
                  <span className="text-sm w-6 text-center">{item.quantite}</span>
                  <button onClick={() => updateQty(item.produit.id, item.quantite + 1)} className="w-6 h-6 rounded-full bg-gray-100 text-sm font-bold text-gray-600">+</button>
                </div>
                <span className="text-sm font-semibold text-xa-primary w-20 text-right">{formatPrice(item.produit.prix_vente * item.quantite)}</span>
                <button onClick={() => removeFromCart(item.produit.id)} className="text-xa-danger text-xs">✕</button>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-xa-primary">{formatPrice(total)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Paiement */}
      {cart.length > 0 && (
        <Card className="mb-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mode de paiement</label>
              <select
                value={modePaiement}
                onChange={e => setModePaiement(e.target.value as ModePaiement)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              >
                <option value="especes">Espèces</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="virement">Virement</option>
                <option value="carte">Carte</option>
                <option value="credit">Crédit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Montant reçu (F)</label>
              <input
                type="number"
                value={montantRecu}
                onChange={e => setMontantRecu(e.target.value)}
                placeholder={String(total)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            {Number(montantRecu) > total && (
              <p className="text-sm text-green-700 font-medium">Monnaie : {formatPrice(monnaie)}</p>
            )}
            <Button onClick={handleSell} className="w-full" loading={processing} disabled={cart.length === 0}>
              Encaisser {formatPrice(total)}
            </Button>
          </div>
        </Card>
      )}
    </main>
  );
}
