'use client';
import { useState } from 'react';

// ── Types légers (sans données sensibles) ────────────────────────────────────

type BoutiqueInfo = { id: string; nom: string; ville?: string | null };
type EmployeInfo  = { id: string; nom: string; prenom: string | null; role: string };
type ProduitInfo  = { id: string; nom: string; prix_unitaire: number; stock_actuel: number; unite: string | null };
type CartItem     = { produit_id: string | null; nom: string; prix_unitaire: number; quantite: number };

type Step = 'code' | 'boutique' | 'role' | 'pin' | 'caisse';
type ActeurType = 'proprietaire' | 'employe';

interface Session {
  boutiqueId: string;
  boutiqueNom: string;
  employeId: string | null;
  acteurNom: string;
  acteurType: ActeurType;
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function CaissePage() {
  const [step, setStep] = useState<Step>('code');
  const [codeInput, setCodeInput] = useState('');
  const [boutiques, setBoutiques] = useState<BoutiqueInfo[]>([]);
  const [employes, setEmployes] = useState<EmployeInfo[]>([]);
  const [selectedBoutique, setSelectedBoutique] = useState<BoutiqueInfo | null>(null);
  const [acteurType, setActeurType] = useState<ActeurType>('proprietaire');
  const [selectedEmploye, setSelectedEmploye] = useState<EmployeInfo | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  // Caisse state
  const [produits, setProduits] = useState<ProduitInfo[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modePaiement, setModePaiement] = useState<string>('especes');
  const [montantRecu, setMontantRecu] = useState('');
  const [venteLibre, setVenteLibre] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Étape 1 : Saisie du code ─────────────────────────────────────────────

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/caisse/boutique?code=${encodeURIComponent(codeInput)}`);
    const json = await res.json() as { boutiques?: BoutiqueInfo[]; error?: string };
    setLoading(false);
    if (!res.ok || !json.boutiques) {
      setError('Code introuvable. Vérifiez le code donné par votre patron.');
      return;
    }
    setBoutiques(json.boutiques);
    if (json.boutiques.length === 1) {
      await pickBoutique(json.boutiques[0]);
    } else {
      setStep('boutique');
    }
  };

  const pickBoutique = async (b: BoutiqueInfo) => {
    setSelectedBoutique(b);
    setLoading(true);
    const res = await fetch(`/api/caisse/employes?boutique_id=${b.id}`);
    const json = await res.json() as { employes?: EmployeInfo[] };
    setLoading(false);
    setEmployes(json.employes ?? []);
    setStep('role');
  };

  // ── Étape 2 : Sélection rôle ────────────────────────────────────────────

  const selectActeur = (type: ActeurType, emp?: EmployeInfo) => {
    setActeurType(type);
    setSelectedEmploye(emp ?? null);
    setPin('');
    setError(null);
    setStep('pin');
  };

  // ── Étape 3 : Saisie PIN ─────────────────────────────────────────────────

  const handleDigit = (d: string) => {
    if (pin.length >= 4 || loading) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) void verifyPin(next);
  };

  const handleDelete = () => { setPin(p => p.slice(0, -1)); setError(null); };

  const verifyPin = async (p: string) => {
    setLoading(true);
    const res = await fetch('/api/caisse/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boutique_id: selectedBoutique!.id,
        type: acteurType,
        employe_id: selectedEmploye?.id,
        pin: p,
      }),
    });
    const json = await res.json() as { valid?: boolean };
    setLoading(false);
    if (json.valid) {
      const nom = acteurType === 'proprietaire'
        ? 'Patron'
        : `${selectedEmploye!.nom}${selectedEmploye?.prenom ? ' ' + selectedEmploye.prenom : ''}`;
      const s: Session = {
        boutiqueId: selectedBoutique!.id,
        boutiqueNom: selectedBoutique!.nom,
        employeId: selectedEmploye?.id ?? null,
        acteurNom: nom,
        acteurType,
      };
      setSession(s);
      void loadProduits(s.boutiqueId);
      setStep('caisse');
    } else {
      setError('PIN incorrect, réessayez');
      setPin('');
    }
  };

  // ── Caisse : chargement produits ────────────────────────────────────────

  const loadProduits = async (boutiqueId: string) => {
    const res = await fetch(`/api/caisse/produits?boutique_id=${boutiqueId}`);
    const json = await res.json() as { produits?: ProduitInfo[] };
    setProduits(json.produits ?? []);
  };

  // ── Caisse : gestion panier ──────────────────────────────────────────────

  const addToCart = (p: ProduitInfo) => {
    setCart(prev => {
      const existing = prev.find(i => i.produit_id === p.id);
      if (existing) {
        return prev.map(i => i.produit_id === p.id ? { ...i, quantite: i.quantite + 1 } : i);
      }
      return [...prev, { produit_id: p.id, nom: p.nom, prix_unitaire: p.prix_unitaire, quantite: 1 }];
    });
    setSuccessMsg(null);
  };

  const updateQty = (idx: number, delta: number) => {
    setCart(prev => {
      const updated = prev.map((item, i) => i === idx ? { ...item, quantite: item.quantite + delta } : item);
      return updated.filter(i => i.quantite > 0);
    });
  };

  const totalCart = cart.reduce((sum, i) => sum + i.prix_unitaire * i.quantite, 0);
  const totalVente = venteLibre ? parseFloat(venteLibre) || 0 : totalCart;
  const montantRecuNum = parseFloat(montantRecu) || 0;
  const monnaieRendue = Math.max(0, montantRecuNum - totalVente);

  // ── Caisse : enregistrement transaction ─────────────────────────────────

  const handleVente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (totalVente <= 0) return;
    if (modePaiement === 'especes' && montantRecuNum < totalVente) return;

    setSubmitting(true);
    setError(null);
    const localId = crypto.randomUUID();

    const body = {
      boutique_id: session.boutiqueId,
      employe_id: session.employeId,
      type: 'vente',
      mode_paiement: modePaiement,
      montant_total: totalVente,
      montant_recu: montantRecuNum,
      monnaie_rendue: monnaieRendue,
      montant_credit: 0,
      statut: 'validee',
      local_id: localId,
    };

    let saved = false;
    if (navigator.onLine) {
      const res = await fetch('/api/caisse/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      saved = res.ok;
    }

    if (!saved) {
      await saveOffline(body);
    }

    setSuccessMsg(`Vente de ${totalVente.toLocaleString('fr-FR')} FCFA enregistrée ${saved ? '✓' : '(hors ligne — sera synchronisée)'}`);
    setCart([]);
    setMontantRecu('');
    setVenteLibre('');
    setSubmitting(false);
  };

  // ── Réinitialisation ────────────────────────────────────────────────────

  const reset = () => {
    setStep('code'); setCodeInput(''); setBoutiques([]); setEmployes([]);
    setSelectedBoutique(null); setActeurType('proprietaire'); setSelectedEmploye(null);
    setPin(''); setError(null); setSession(null);
    setCart([]); setProduits([]); setMontantRecu(''); setVenteLibre(''); setSuccessMsg(null);
  };

  // ── Rendu par étape ─────────────────────────────────────────────────────

  if (step === 'caisse' && session) {
    return (
      <main className="min-h-screen bg-xa-bg p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-xa-primary">{session.boutiqueNom}</h1>
              <p className="text-xs text-gray-400">{session.acteurNom}</p>
            </div>
            <button onClick={reset} className="text-sm text-gray-400 border border-gray-200 rounded-lg px-3 py-1.5">
              ⏏ Déconnexion
            </button>
          </div>

          {successMsg && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-sm text-green-700">
              {successMsg}
            </div>
          )}

          {produits.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <h2 className="font-semibold text-gray-700 mb-3 text-sm">Produits</h2>
              <div className="grid grid-cols-2 gap-2">
                {produits.map(p => (
                  <button key={p.id} onClick={() => addToCart(p)}
                    disabled={p.stock_actuel <= 0}
                    className="rounded-xl border border-gray-100 p-3 text-left hover:ring-2 hover:ring-xa-primary transition disabled:opacity-40">
                    <p className="font-medium text-gray-800 text-sm truncate">{p.nom}</p>
                    <p className="text-xa-primary font-bold text-sm">{p.prix_unitaire.toLocaleString('fr-FR')} F</p>
                    <p className="text-xs text-gray-400">Stock : {p.stock_actuel} {p.unite ?? ''}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleVente} className="bg-white rounded-2xl shadow p-4 space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm">Nouvelle vente</h2>

            {cart.length > 0 && (
              <div className="space-y-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.nom}</p>
                      <p className="text-xs text-gray-400">{item.prix_unitaire.toLocaleString('fr-FR')} F × {item.quantite}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button type="button" onClick={() => updateQty(idx, -1)}
                        className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center">−</button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantite}</span>
                      <button type="button" onClick={() => updateQty(idx, 1)}
                        className="w-6 h-6 rounded-full bg-xa-primary text-white text-xs font-bold flex items-center justify-center">+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length === 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Montant (FCFA)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={venteLibre}
                  onChange={e => setVenteLibre(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-center outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                />
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-t border-gray-100">
              <span className="font-semibold text-gray-700">Total</span>
              <span className="text-xl font-bold text-xa-primary">{totalVente.toLocaleString('fr-FR')} F</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Mode de paiement</label>
              <select value={modePaiement} onChange={e => setModePaiement(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-xa-primary bg-white">
                <option value="especes">Espèces</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="carte">Carte bancaire</option>
                <option value="virement">Virement</option>
              </select>
            </div>

            {modePaiement === 'especes' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Montant reçu (FCFA)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={montantRecu}
                    onChange={e => setMontantRecu(e.target.value)}
                    placeholder={String(totalVente)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-center outline-none focus:ring-2 focus:ring-xa-primary bg-white"
                  />
                </div>
                {montantRecuNum >= totalVente && totalVente > 0 && (
                  <div className="bg-xa-primary/10 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Monnaie à rendre</p>
                    <p className="text-2xl font-bold text-xa-primary">{monnaieRendue.toLocaleString('fr-FR')} F</p>
                  </div>
                )}
              </>
            )}

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button type="submit"
              disabled={submitting || totalVente <= 0 || (modePaiement === 'especes' && montantRecuNum < totalVente)}
              className="w-full bg-xa-primary text-white font-semibold rounded-xl py-3 hover:bg-xa-primary/90 transition disabled:opacity-50">
              {submitting ? 'Enregistrement...' : `Valider ${totalVente > 0 ? totalVente.toLocaleString('fr-FR') + ' F' : ''}`}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (step === 'pin') {
    const nom = acteurType === 'proprietaire' ? 'Propriétaire' : selectedEmploye?.nom ?? '';
    return (
      <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <button onClick={() => { setStep('role'); setPin(''); setError(null); }} className="text-sm text-gray-400 mb-6 block">← Retour</button>
          <h1 className="text-xl font-bold text-gray-800 mb-1 text-center">{selectedBoutique?.nom}</h1>
          <p className="text-gray-500 text-sm mb-8 text-center">PIN de {nom}</p>
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-4">
              {[0,1,2,3].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition ${i < pin.length ? 'bg-xa-primary border-xa-primary' : 'border-gray-300 bg-white'}`} />
              ))}
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {loading && <p className="text-gray-400 text-sm">Vérification...</p>}
            <div className="grid grid-cols-3 gap-3">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, idx) => (
                <button key={idx}
                  onClick={() => { if (key === '⌫') handleDelete(); else if (key) handleDigit(key); }}
                  disabled={key === '' || loading}
                  className={`w-16 h-16 rounded-xl text-xl font-bold flex items-center justify-center transition ${key === '' ? 'invisible' : key === '⌫' ? 'bg-white shadow border border-gray-200 text-red-400 active:bg-gray-100' : 'bg-white shadow border border-gray-200 text-gray-800 active:bg-xa-primary active:text-white'}`}>
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (step === 'role' && selectedBoutique) {
    return (
      <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <button onClick={() => boutiques.length > 1 ? setStep('boutique') : setStep('code')} className="text-sm text-gray-400 mb-6 block">← Retour</button>
          <h1 className="text-xl font-bold text-gray-800 mb-1 text-center">{selectedBoutique.nom}</h1>
          <p className="text-gray-500 text-sm mb-8 text-center">Qui êtes-vous ?</p>
          <div className="space-y-3">
            <button onClick={() => selectActeur('proprietaire')}
              className="w-full bg-xa-primary text-white rounded-2xl p-4 text-left font-semibold flex items-center gap-3 hover:bg-xa-primary/90 transition">
              <span className="text-2xl">👔</span>
              <span>Je suis le propriétaire</span>
            </button>
            {employes.length > 0 && <p className="text-xs text-gray-400 text-center pt-2">— ou sélectionnez votre nom —</p>}
            {employes.map(emp => (
              <button key={emp.id} onClick={() => selectActeur('employe', emp)}
                className="w-full bg-white rounded-2xl shadow p-4 text-left hover:ring-2 hover:ring-xa-primary transition">
                <p className="font-semibold text-gray-800">{emp.nom}{emp.prenom ? ` ${emp.prenom}` : ''}</p>
                <p className="text-xs text-gray-400 capitalize">{emp.role}</p>
              </button>
            ))}
            {employes.length === 0 && <p className="text-gray-400 text-sm text-center">Aucun employé enregistré</p>}
          </div>
        </div>
      </main>
    );
  }

  if (step === 'boutique') {
    return (
      <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <button onClick={() => setStep('code')} className="text-sm text-gray-400 mb-6 block">← Retour</button>
          <h1 className="text-xl font-bold text-gray-800 mb-1 text-center">Sélectionnez votre boutique</h1>
          <p className="text-gray-500 text-sm mb-8 text-center">Code : {codeInput.toUpperCase()}</p>
          <div className="space-y-3">
            {boutiques.map(b => (
              <button key={b.id} onClick={() => void pickBoutique(b)}
                className="w-full bg-white rounded-2xl shadow p-4 text-left hover:ring-2 hover:ring-xa-primary transition">
                <p className="font-semibold text-gray-800">{b.nom}</p>
                {b.ville && <p className="text-sm text-gray-400">{b.ville}</p>}
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // step === 'code'
  return (
    <main className="min-h-screen bg-xa-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-xa-primary mb-1 text-center">xà</h1>
        <p className="text-gray-500 text-sm mb-8 text-center">Entrez le code de votre patron</p>
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <input
            type="text"
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            required
            minLength={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-4 text-center text-2xl font-mono font-bold tracking-widest outline-none focus:ring-2 focus:ring-xa-primary bg-white uppercase"
            placeholder="EX: DUPONT42"
            autoCapitalize="characters"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-xa-primary text-white font-semibold rounded-xl py-3 hover:bg-xa-primary/90 transition disabled:opacity-50">
            {loading ? 'Recherche...' : 'Valider'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-8">
          Vous êtes patron ?{' '}
          <a href="/login" className="text-xa-primary font-medium">Connexion admin</a>
        </p>
      </div>
    </main>
  );
}

// ── Helper IndexedDB pour offline ────────────────────────────────────────────

async function saveOffline(data: Record<string, unknown>): Promise<void> {
  if (typeof window === 'undefined') return;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('xa-offline', 1);
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('pending_transactions')) {
        db.createObjectStore('pending_transactions', { keyPath: 'local_id' });
      }
    };
    req.onsuccess = e => {
      const db = (e.target as IDBOpenDBRequest).result;
      const tx = db.transaction('pending_transactions', 'readwrite');
      tx.objectStore('pending_transactions').put(data);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}
