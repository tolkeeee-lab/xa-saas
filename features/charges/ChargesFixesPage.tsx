'use client';

import { useState } from 'react';
import { formatFCFA } from '@/lib/format';
import type { ChargesFixesData, ChargeFixe } from '@/lib/supabase/getChargesFixes';
import type { Boutique, DetteProprio } from '@/types/database';

type ChargesFixesPageProps = {
  data: ChargesFixesData;
  boutiques: Boutique[];
};

type ToastState = { message: string; type: 'success' | 'error' } | null;

type ModalMode = 'create' | 'edit';

const EMPTY_FORM = {
  libelle: '',
  categorie: 'autre' as ChargeFixe['categorie'],
  boutique_id: '',
  montant: '',
  periodicite: 'mensuel' as ChargeFixe['periodicite'],
};

const CATEGORIE_LABELS: Record<ChargeFixe['categorie'], string> = {
  loyer: 'Loyer',
  salaire: 'Salaire',
  fournisseur: 'Fournisseur',
  autre: 'Autre',
};

const CATEGORIE_COLORS: Record<ChargeFixe['categorie'], string> = {
  loyer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20',
  salaire: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20',
  fournisseur: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20',
  autre: 'bg-xa-surface text-xa-muted border border-xa-border',
};

const PERIODICITE_LABELS: Record<ChargeFixe['periodicite'], string> = {
  mensuel: 'Mensuel',
  hebdo: 'Hebdomadaire',
  annuel: 'Annuel',
};

const STATUT_LABELS: Record<DetteProprio['statut'], string> = {
  en_cours: 'En cours',
  rembourse: 'Remboursé',
  en_retard: 'En retard',
};

const STATUT_COLORS: Record<DetteProprio['statut'], string> = {
  en_cours: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20',
  rembourse: 'bg-green-100 text-green-700 dark:bg-green-900/20',
  en_retard: 'bg-red-100 text-red-700 dark:bg-red-900/20',
};

const EMPTY_DETTE_FORM = {
  libelle: '',
  creancier: '',
  montant: '',
  montant_rembourse: '0',
  date_echeance: '',
  notes: '',
};

export default function ChargesFixesPage({ data: initialData, boutiques }: ChargesFixesPageProps) {
  const [charges, setCharges] = useState<ChargeFixe[]>(initialData.charges);
  const [data, setData] = useState<ChargesFixesData>(initialData);
  const [toast, setToast] = useState<ToastState>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Dettes state
  const [dettes, setDettes] = useState<DetteProprio[]>(initialData.dettes_proprio);
  const [showDetteModal, setShowDetteModal] = useState(false);
  const [detteForm, setDetteForm] = useState(EMPTY_DETTE_FORM);
  const [detteFormError, setDetteFormError] = useState<string | null>(null);
  const [detteSubmitting, setDetteSubmitting] = useState(false);
  const [deletingDetteId, setDeletingDetteId] = useState<string | null>(null);

  // Remboursement partiel modal
  const [showRembModal, setShowRembModal] = useState(false);
  const [rembDette, setRembDette] = useState<DetteProprio | null>(null);
  const [rembMontant, setRembMontant] = useState('');
  const [rembError, setRembError] = useState<string | null>(null);
  const [rembSubmitting, setRembSubmitting] = useState(false);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalMode('create');
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(c: ChargeFixe) {
    setForm({
      libelle: c.libelle,
      categorie: c.categorie,
      boutique_id: c.boutique_id ?? '',
      montant: String(c.montant),
      periodicite: c.periodicite,
    });
    setFormError(null);
    setModalMode('edit');
    setEditingId(c.id);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const montant = parseFloat(form.montant);
    if (!form.libelle.trim()) {
      setFormError('Le libellé est requis.');
      return;
    }
    if (isNaN(montant) || montant < 0) {
      setFormError('Montant invalide.');
      return;
    }

    setSubmitting(true);

    const body = {
      libelle: form.libelle.trim(),
      categorie: form.categorie,
      boutique_id: form.boutique_id || null,
      montant,
      periodicite: form.periodicite,
    };

    const isEdit = modalMode === 'edit' && editingId;
    const url = isEdit ? `/api/charges-fixes/${editingId}` : '/api/charges-fixes';
    const method = isEdit ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setSubmitting(false);

    if (!res.ok) {
      const err = await res.json();
      setFormError(err.error ?? 'Erreur lors de la sauvegarde.');
      return;
    }

    const saved: ChargeFixe = await res.json();

    const updatedCharges = isEdit
      ? charges.map((c) => (c.id === editingId ? saved : c))
      : [saved, ...charges];

    setCharges(updatedCharges);
    showToast(isEdit ? 'Charge mise à jour.' : 'Charge créée.', 'success');

    // Recalculate totals with the updated array
    refreshTotals(updatedCharges);
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/charges-fixes/${id}`, { method: 'DELETE' });
    setDeletingId(null);

    if (res.ok) {
      const updated = charges.filter((c) => c.id !== id);
      setCharges(updated);
      refreshTotals(updated);
      showToast('Charge supprimée.', 'success');
    } else {
      const err = await res.json();
      showToast(err.error ?? 'Erreur lors de la suppression.', 'error');
    }
  }

  function toMensuel(montant: number, periodicite: ChargeFixe['periodicite']): number {
    if (periodicite === 'hebdo') return montant * (52 / 12);
    if (periodicite === 'annuel') return montant / 12;
    return montant;
  }

  function refreshTotals(updatedCharges: ChargeFixe[], updatedDettes?: DetteProprio[]) {
    const active = updatedCharges.filter((c) => c.actif);
    const total_mensuel = active.reduce((s, c) => s + toMensuel(c.montant, c.periodicite), 0);

    const par_categorie: Record<string, number> = {};
    for (const c of active) {
      par_categorie[c.categorie] = (par_categorie[c.categorie] ?? 0) + toMensuel(c.montant, c.periodicite);
    }

    const benefice_net_reel = data.benefice_brut - total_mensuel;

    const activeDettes = updatedDettes ?? dettes;
    const total_dettes_en_cours = activeDettes
      .filter((d) => d.statut === 'en_cours' || d.statut === 'en_retard')
      .reduce((s, d) => s + Math.max(0, d.montant - d.montant_rembourse), 0);

    const reste_proprio = benefice_net_reel - total_dettes_en_cours;

    setData((prev) => ({
      ...prev,
      charges: updatedCharges,
      total_mensuel,
      par_categorie,
      benefice_net_reel,
      reste_proprio,
      total_dettes_en_cours,
    }));
  }

  const activeCharges = charges.filter((c) => c.actif);

  // --- Dettes handlers ---

  function openNovelleDette() {
    setDetteForm(EMPTY_DETTE_FORM);
    setDetteFormError(null);
    setShowDetteModal(true);
  }

  async function handleDetteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDetteFormError(null);

    const montant = parseFloat(detteForm.montant);
    const montant_rembourse = parseFloat(detteForm.montant_rembourse || '0');

    if (!detteForm.libelle.trim()) {
      setDetteFormError('Le libellé est requis.');
      return;
    }
    if (!detteForm.creancier.trim()) {
      setDetteFormError('Le créancier est requis.');
      return;
    }
    if (isNaN(montant) || montant < 0) {
      setDetteFormError('Montant invalide.');
      return;
    }
    if (isNaN(montant_rembourse) || montant_rembourse < 0) {
      setDetteFormError('Montant remboursé invalide.');
      return;
    }

    setDetteSubmitting(true);

    const body = {
      libelle: detteForm.libelle.trim(),
      creancier: detteForm.creancier.trim(),
      montant,
      montant_rembourse,
      date_echeance: detteForm.date_echeance || null,
      notes: detteForm.notes.trim() || null,
    };

    const res = await fetch('/api/dettes-proprio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setDetteSubmitting(false);

    if (!res.ok) {
      const err = await res.json();
      setDetteFormError(err.error ?? 'Erreur lors de la création.');
      return;
    }

    const saved: DetteProprio = await res.json();
    const updatedDettes = [saved, ...dettes];
    setDettes(updatedDettes);
    refreshTotals(charges, updatedDettes);
    showToast('Dette ajoutée.', 'success');
    setShowDetteModal(false);
  }

  async function handleDeleteDette(id: string) {
    setDeletingDetteId(id);
    const res = await fetch(`/api/dettes-proprio/${id}`, { method: 'DELETE' });
    setDeletingDetteId(null);

    if (res.ok) {
      const updated = dettes.filter((d) => d.id !== id);
      setDettes(updated);
      refreshTotals(charges, updated);
      showToast('Dette supprimée.', 'success');
    } else {
      const err = await res.json();
      showToast(err.error ?? 'Erreur lors de la suppression.', 'error');
    }
  }

  async function handleMarkRembourse(id: string) {
    const res = await fetch(`/api/dettes-proprio/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'rembourse' }),
    });

    if (res.ok) {
      const updated: DetteProprio = await res.json();
      const updatedDettes = dettes.map((d) => (d.id === id ? updated : d));
      setDettes(updatedDettes);
      refreshTotals(charges, updatedDettes);
      showToast('Dette marquée remboursée.', 'success');
    } else {
      const err = await res.json();
      showToast(err.error ?? 'Erreur.', 'error');
    }
  }

  function openRemboursement(d: DetteProprio) {
    setRembDette(d);
    setRembMontant('');
    setRembError(null);
    setShowRembModal(true);
  }

  async function handleRembSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rembDette) return;
    setRembError(null);

    const montantCeJour = parseFloat(rembMontant);
    if (isNaN(montantCeJour) || montantCeJour <= 0) {
      setRembError('Montant invalide.');
      return;
    }

    const newMontantRembourse = rembDette.montant_rembourse + montantCeJour;

    setRembSubmitting(true);

    const res = await fetch(`/api/dettes-proprio/${rembDette.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ montant_rembourse: newMontantRembourse }),
    });

    setRembSubmitting(false);

    if (res.ok) {
      const updated: DetteProprio = await res.json();
      const updatedDettes = dettes.map((d) => (d.id === rembDette.id ? updated : d));
      setDettes(updatedDettes);
      refreshTotals(charges, updatedDettes);
      showToast('Remboursement enregistré.', 'success');
      setShowRembModal(false);
    } else {
      const err = await res.json();
      setRembError(err.error ?? 'Erreur.');
    }
  }

  function getBoutiqueName(id: string | null) {
    return boutiques.find((b) => b.id === id)?.nom ?? 'Globale';
  }

  // Decomposition percentages for the visual bar
  const totalBar = data.ca_mois || 1;
  const pctAchats = Math.round((data.cout_achats_mois / totalBar) * 100);
  const pctCharges = Math.round((data.total_mensuel / totalBar) * 100);
  const pctDettes = Math.round((data.total_dettes_en_cours / totalBar) * 100);
  const pctReste = Math.max(0, 100 - pctAchats - pctCharges - pctDettes);

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-xa-danger'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-xa-text">Charges fixes</h1>
          <p className="text-sm text-xa-muted mt-0.5">
            Gérez vos charges mensuelles et calculez votre bénéfice net réel
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + Nouvelle charge
        </button>
      </div>

      {/* Résumé financier */}
      <div className="bg-xa-surface border border-xa-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-xa-text text-sm">Résumé financier — ce mois</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <FinCard label="CA du mois" value={formatFCFA(data.ca_mois)} color="text-xa-primary" />
          <FinCard label="Coût achats" value={formatFCFA(data.cout_achats_mois)} color="text-xa-danger" />
          <FinCard label="Charges fixes" value={formatFCFA(data.total_mensuel)} color="text-orange-500" />
          <FinCard label="Dettes en cours" value={formatFCFA(data.total_dettes_en_cours)} color="text-red-800" />
          <FinCard
            label="Reste au proprio"
            value={formatFCFA(data.reste_proprio)}
            color={data.reste_proprio >= 0 ? 'text-green-600' : 'text-xa-danger'}
          />
        </div>

        {/* Barre de décomposition visuelle */}
        {data.ca_mois > 0 && (
          <div>
            <div className="flex w-full h-4 rounded-full overflow-hidden">
              <div
                className="bg-xa-danger transition-all"
                style={{ width: `${pctAchats}%` }}
                title={`Coût achats : ${pctAchats}%`}
              />
              <div
                className="bg-orange-400 transition-all"
                style={{ width: `${pctCharges}%` }}
                title={`Charges fixes : ${pctCharges}%`}
              />
              <div
                className="bg-red-800 transition-all"
                style={{ width: `${pctDettes}%` }}
                title={`Dettes : ${pctDettes}%`}
              />
              <div
                className="bg-green-500 transition-all flex-1"
                title={`Reste proprio : ${pctReste}%`}
              />
            </div>
            <div className="flex gap-4 mt-2 flex-wrap">
              <LegendItem color="bg-xa-danger" label={`Coût achats ${pctAchats}%`} />
              <LegendItem color="bg-orange-400" label={`Charges ${pctCharges}%`} />
              <LegendItem color="bg-red-800" label={`Dettes ${pctDettes}%`} />
              <LegendItem color="bg-green-500" label={`Reste ${pctReste}%`} />
            </div>
          </div>
        )}
      </div>

      {/* Par catégorie */}
      {Object.keys(data.par_categorie).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(data.par_categorie) as [string, number][]).map(([cat, val]) => (
            <div key={cat} className="bg-xa-surface border border-xa-border rounded-xl p-3">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORIE_COLORS[cat as ChargeFixe['categorie']]}`}
              >
                {CATEGORIE_LABELS[cat as ChargeFixe['categorie']] ?? cat}
              </span>
              <p className="text-lg font-bold text-xa-text mt-2">{formatFCFA(Math.round(val))}</p>
              <p className="text-xs text-xa-muted">/mois</p>
            </div>
          ))}
        </div>
      )}

      {/* Liste des charges */}
      {activeCharges.length === 0 ? (
        <div className="bg-xa-surface border border-xa-border rounded-xl p-12 text-center">
          <p className="text-xa-muted">Aucune charge fixe définie.</p>
          <button
            onClick={openCreate}
            className="mt-4 px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Ajouter une charge
          </button>
        </div>
      ) : (
        <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-xa-border">
            <h2 className="font-semibold text-xa-text text-sm">Charges actives</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border bg-xa-bg">
                  {['Libellé', 'Catégorie', 'Boutique', 'Montant', 'Périodicité', 'Mensuel équiv.', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-xs font-semibold text-xa-muted uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {activeCharges.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-xa-text">{c.libelle}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORIE_COLORS[c.categorie]}`}
                      >
                        {CATEGORIE_LABELS[c.categorie]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xa-muted">{getBoutiqueName(c.boutique_id)}</td>
                    <td className="px-4 py-3 text-xa-text font-semibold">{formatFCFA(c.montant)}</td>
                    <td className="px-4 py-3 text-xa-muted">{PERIODICITE_LABELS[c.periodicite]}</td>
                    <td className="px-4 py-3 text-xa-text">
                      {formatFCFA(Math.round(toMensuel(c.montant, c.periodicite)))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="px-3 py-1 rounded-lg border border-xa-border text-xa-text text-xs font-semibold hover:bg-xa-bg transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="px-3 py-1 rounded-lg bg-xa-danger text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                        >
                          {deletingId === c.id ? '…' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-xa-border bg-xa-bg">
                  <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider text-right">
                    Total mensuel
                  </td>
                  <td className="px-4 py-3 font-bold text-orange-500">
                    {formatFCFA(Math.round(data.total_mensuel))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Section Mes dettes personnelles */}
      <div className="bg-xa-surface border border-xa-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-xa-border flex items-center justify-between">
          <h2 className="font-semibold text-xa-text text-sm">Mes dettes personnelles</h2>
          <button
            onClick={openNovelleDette}
            className="px-3 py-1.5 rounded-lg bg-xa-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            + Nouvelle dette
          </button>
        </div>

        {dettes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xa-muted text-sm">Aucune dette personnelle enregistrée.</p>
            <button
              onClick={openNovelleDette}
              className="mt-4 px-4 py-2 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Ajouter une dette
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-xa-border bg-xa-bg">
                  {['Libellé', 'Créancier', 'Montant total', 'Remboursé', 'Reste dû', 'Échéance', 'Statut', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-xs font-semibold text-xa-muted uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {dettes.map((d) => {
                  const resteDu = Math.max(0, d.montant - d.montant_rembourse);
                  return (
                    <tr
                      key={d.id}
                      className="border-b border-xa-border last:border-0 hover:bg-xa-bg transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-xa-text">{d.libelle}</td>
                      <td className="px-4 py-3 text-xa-muted">{d.creancier}</td>
                      <td className="px-4 py-3 text-xa-text font-semibold">{formatFCFA(d.montant)}</td>
                      <td className="px-4 py-3 text-green-600">{formatFCFA(d.montant_rembourse)}</td>
                      <td className="px-4 py-3 font-bold text-red-800">{formatFCFA(resteDu)}</td>
                      <td className="px-4 py-3 text-xa-muted">
                        {d.date_echeance
                          ? new Date(d.date_echeance).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUT_COLORS[d.statut]}`}>
                          {STATUT_LABELS[d.statut]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {d.statut !== 'rembourse' && (
                            <>
                              <button
                                onClick={() => openRemboursement(d)}
                                className="px-2 py-1 rounded-lg border border-xa-border text-xa-text text-xs font-semibold hover:bg-xa-bg transition-colors whitespace-nowrap"
                              >
                                Rembourser
                              </button>
                              <button
                                onClick={() => handleMarkRembourse(d.id)}
                                className="px-2 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
                              >
                                Tout remboursé
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteDette(d.id)}
                            disabled={deletingDetteId === d.id}
                            className="px-2 py-1 rounded-lg bg-xa-danger text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                          >
                            {deletingDetteId === d.id ? '…' : 'Supprimer'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {data.total_dettes_en_cours > 0 && (
                <tfoot>
                  <tr className="border-t border-xa-border bg-xa-bg">
                    <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-xa-muted uppercase tracking-wider text-right">
                      Total dettes en cours
                    </td>
                    <td className="px-4 py-3 font-bold text-red-800">
                      {formatFCFA(Math.round(data.total_dettes_en_cours))}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Modal charge fixe */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-xa-surface rounded-xl shadow-xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-xa-border flex items-center justify-between">
              <h3 className="font-semibold text-xa-text">
                {modalMode === 'create' ? 'Nouvelle charge' : 'Modifier la charge'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-xa-muted hover:text-xa-text transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg border border-xa-danger text-xa-danger text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Libellé <span className="text-xa-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.libelle}
                  onChange={(e) => setForm((f) => ({ ...f, libelle: e.target.value }))}
                  placeholder="Ex: Loyer boutique principale"
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Catégorie <span className="text-xa-danger">*</span>
                </label>
                <select
                  value={form.categorie}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categorie: e.target.value as ChargeFixe['categorie'] }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                >
                  {Object.entries(CATEGORIE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Boutique concernée
                </label>
                <select
                  value={form.boutique_id}
                  onChange={(e) => setForm((f) => ({ ...f, boutique_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                >
                  <option value="">Globale (toutes boutiques)</option>
                  {boutiques.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Montant (FCFA) <span className="text-xa-danger">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.montant}
                  onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Périodicité
                </label>
                <select
                  value={form.periodicite}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, periodicite: e.target.value as ChargeFixe['periodicite'] }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                >
                  {Object.entries(PERIODICITE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-xa-border text-xa-text text-sm font-semibold hover:bg-xa-bg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? '…' : modalMode === 'create' ? 'Ajouter' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal nouvelle dette */}
      {showDetteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDetteModal(false);
          }}
        >
          <div className="bg-xa-surface rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-xa-border flex items-center justify-between">
              <h3 className="font-semibold text-xa-text">Nouvelle dette</h3>
              <button
                onClick={() => setShowDetteModal(false)}
                className="text-xa-muted hover:text-xa-text transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleDetteSubmit} className="p-5 space-y-4">
              {detteFormError && (
                <div className="p-3 rounded-lg border border-xa-danger text-xa-danger text-sm">
                  {detteFormError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Libellé <span className="text-xa-danger">*</span>
                </label>
                <input
                  type="text"
                  value={detteForm.libelle}
                  onChange={(e) => setDetteForm((f) => ({ ...f, libelle: e.target.value }))}
                  placeholder="Ex: Prêt pour stock janvier"
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Créancier <span className="text-xa-danger">*</span>
                </label>
                <input
                  type="text"
                  value={detteForm.creancier}
                  onChange={(e) => setDetteForm((f) => ({ ...f, creancier: e.target.value }))}
                  placeholder="Ex: Famille Koffi, Banque BOA"
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Montant emprunté (FCFA) <span className="text-xa-danger">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={detteForm.montant}
                  onChange={(e) => setDetteForm((f) => ({ ...f, montant: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Montant déjà remboursé (FCFA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={detteForm.montant_rembourse}
                  onChange={(e) => setDetteForm((f) => ({ ...f, montant_rembourse: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Date d&#39;échéance
                </label>
                <input
                  type="date"
                  value={detteForm.date_echeance}
                  onChange={(e) => setDetteForm((f) => ({ ...f, date_echeance: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Notes
                </label>
                <textarea
                  value={detteForm.notes}
                  onChange={(e) => setDetteForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Informations complémentaires…"
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDetteModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-xa-border text-xa-text text-sm font-semibold hover:bg-xa-bg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={detteSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {detteSubmitting ? '…' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal remboursement partiel */}
      {showRembModal && rembDette && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRembModal(false);
          }}
        >
          <div className="bg-xa-surface rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-5 py-4 border-b border-xa-border flex items-center justify-between">
              <h3 className="font-semibold text-xa-text">Remboursement partiel</h3>
              <button
                onClick={() => setShowRembModal(false)}
                className="text-xa-muted hover:text-xa-text transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="px-5 pt-4">
              <p className="text-sm text-xa-muted">
                Dette : <span className="font-semibold text-xa-text">{rembDette.libelle}</span>
              </p>
              <p className="text-sm text-xa-muted mt-1">
                Reste dû :{' '}
                <span className="font-bold text-red-800">
                  {formatFCFA(Math.max(0, rembDette.montant - rembDette.montant_rembourse))}
                </span>
              </p>
            </div>
            <form onSubmit={handleRembSubmit} className="p-5 space-y-4">
              {rembError && (
                <div className="p-3 rounded-lg border border-xa-danger text-xa-danger text-sm">
                  {rembError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-xa-text mb-1">
                  Montant remboursé ce jour (FCFA) <span className="text-xa-danger">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={rembMontant}
                  onChange={(e) => setRembMontant(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg border border-xa-border bg-xa-bg text-xa-text text-sm focus:outline-none focus:ring-2 focus:ring-xa-primary"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRembModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-xa-border text-xa-text text-sm font-semibold hover:bg-xa-bg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={rembSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-xa-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {rembSubmitting ? '…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FinCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-xa-bg border border-xa-border rounded-xl p-3">
      <p className="text-xs font-semibold text-xa-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded-sm shrink-0 ${color}`} />
      <span className="text-xs text-xa-muted">{label}</span>
    </div>
  );
}
