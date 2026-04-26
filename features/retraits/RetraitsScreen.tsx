'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Boutique, RetraitClient } from '@/types/database';
import RetraitsHeader from '@/features/retraits/components/RetraitsHeader';
import RetraitsTabs, { type RetraitsTab } from '@/features/retraits/components/RetraitsTabs';
import CodeInput from '@/features/retraits/components/CodeInput';
import RetraitCard from '@/features/retraits/components/RetraitCard';
import RetraitDetail from '@/features/retraits/components/RetraitDetail';
import ValidateRetraitModal from '@/features/retraits/modals/ValidateRetraitModal';
import RetraitSuccessModal from '@/features/retraits/modals/RetraitSuccessModal';

type Props = {
  boutiques: Boutique[];
  initialBoutiqueId: string;
  isOwner: boolean;
  employeId: string;
};

export default function RetraitsScreen({
  boutiques,
  initialBoutiqueId,
  isOwner,
  employeId,
}: Props) {
  const [activeBoutiqueId, setActiveBoutiqueId] = useState(initialBoutiqueId);
  const [tab, setTab] = useState<RetraitsTab>('en_attente');
  const [code, setCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Scanned/validated retrait
  const [validatedRetrait, setValidatedRetrait] = useState<RetraitClient | null>(null);

  // List
  const [retraits, setRetraits] = useState<RetraitClient[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [counts, setCounts] = useState({ en_attente: 0, retire: 0, expire: 0 });

  // Selected retrait from list
  const [selectedRetrait, setSelectedRetrait] = useState<RetraitClient | null>(null);

  // Modals
  const [validateModalOpen, setValidateModalOpen] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ nom: string; total: number } | null>(null);

  // ── Load list ──────────────────────────────────────────────────────────────

  const loadRetraits = useCallback(
    async (statut: RetraitsTab, boutiqueId: string) => {
      setListLoading(true);
      try {
        const res = await fetch(
          `/api/retraits?boutique_id=${boutiqueId}&statut=${statut}&page=1`,
        );
        const json = (await res.json()) as { data?: RetraitClient[]; error?: string };
        setRetraits((json.data ?? []) as RetraitClient[]);
      } catch {
        setRetraits([]);
      } finally {
        setListLoading(false);
      }
    },
    [],
  );

  const loadCounts = useCallback(async (boutiqueId: string) => {
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(`/api/retraits?boutique_id=${boutiqueId}&statut=en_attente&page=1`),
        fetch(`/api/retraits?boutique_id=${boutiqueId}&statut=retire&page=1`),
        fetch(`/api/retraits?boutique_id=${boutiqueId}&statut=expire&page=1`),
      ]);
      const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]) as [
        { data?: unknown[] },
        { data?: unknown[] },
        { data?: unknown[] },
      ];
      setCounts({
        en_attente: (d1.data ?? []).length,
        retire: (d2.data ?? []).length,
        expire: (d3.data ?? []).length,
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadRetraits(tab, activeBoutiqueId);
    void loadCounts(activeBoutiqueId);
  }, [tab, activeBoutiqueId, loadRetraits, loadCounts]);

  // ── Code validation ────────────────────────────────────────────────────────

  useEffect(() => {
    if (code.length === 6) {
      void validateCode(code);
    } else {
      setCodeError(null);
      setValidatedRetrait(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function validateCode(c: string) {
    setCodeLoading(true);
    setCodeError(null);
    setValidatedRetrait(null);
    try {
      const res = await fetch('/api/retraits/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: c, boutique_id: activeBoutiqueId }),
      });
      const data = (await res.json()) as { retrait?: RetraitClient; error?: string };
      if (!res.ok) {
        setCodeError(data.error ?? 'Code invalide');
        return;
      }
      setValidatedRetrait(data.retrait ?? null);
    } catch {
      setCodeError('Erreur réseau');
    } finally {
      setCodeLoading(false);
    }
  }

  function handleValidateSuccess() {
    const r = validatedRetrait ?? selectedRetrait;
    if (r) {
      setSuccessInfo({ nom: r.client_nom, total: r.total });
    }
    setValidateModalOpen(false);
    setValidatedRetrait(null);
    setSelectedRetrait(null);
    setCode('');
  }

  function handleDismissSuccess() {
    setSuccessInfo(null);
    void loadRetraits(tab, activeBoutiqueId);
    void loadCounts(activeBoutiqueId);
  }

  async function handleCancel(retraitId: string) {
    try {
      await fetch(`/api/retraits/${retraitId}/cancel`, { method: 'POST' });
      setSelectedRetrait(null);
      void loadRetraits(tab, activeBoutiqueId);
      void loadCounts(activeBoutiqueId);
    } catch {
      // ignore
    }
  }

  const activeRetrait = validatedRetrait ?? selectedRetrait;

  return (
    <div className="min-h-screen bg-xa-bg">
      <RetraitsHeader
        boutiques={boutiques}
        activeBoutiqueId={activeBoutiqueId}
        onBoutiqueChange={(id) => {
          setActiveBoutiqueId(id);
          setCode('');
          setValidatedRetrait(null);
          setCodeError(null);
        }}
      />

      {/* Code input section */}
      <div className="border-b border-xa-border bg-xa-surface">
        <CodeInput
          value={code}
          onChange={(v) => {
            setCode(v);
            if (v.length < 6) setValidatedRetrait(null);
          }}
          loading={codeLoading}
          error={codeError}
        />

        {validatedRetrait && (
          <div className="px-4 pb-4">
            <RetraitDetail
              retrait={validatedRetrait}
              isOwner={isOwner}
              onValidate={() => setValidateModalOpen(true)}
              onCancel={() => void handleCancel(validatedRetrait.id)}
              onClose={() => {
                setValidatedRetrait(null);
                setCode('');
              }}
            />
          </div>
        )}
      </div>

      {/* Tabs + list */}
      <RetraitsTabs active={tab} onChange={setTab} counts={counts} />

      <div className="p-4 flex flex-col gap-3">
        {listLoading && (
          <p className="text-center text-xa-muted text-sm py-8">Chargement…</p>
        )}
        {!listLoading && retraits.length === 0 && (
          <p className="text-center text-xa-muted text-sm py-8">Aucun retrait</p>
        )}
        {!listLoading &&
          retraits.map((r) => (
            <RetraitCard key={r.id} retrait={r} onClick={() => setSelectedRetrait(r)} />
          ))}
      </div>

      {/* Detail modal for list-selected retrait */}
      {selectedRetrait && !validateModalOpen && (
        <div className="xa-modal-backdrop">
          <div className="xa-modal-box">
            <div className="xa-modal-body">
              <RetraitDetail
                retrait={selectedRetrait}
                isOwner={isOwner}
                onValidate={() => setValidateModalOpen(true)}
                onCancel={() => void handleCancel(selectedRetrait.id)}
                onClose={() => setSelectedRetrait(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Validate confirmation modal */}
      {validateModalOpen && activeRetrait && (
        <ValidateRetraitModal
          retrait={activeRetrait}
          employeId={employeId}
          onClose={() => setValidateModalOpen(false)}
          onSuccess={handleValidateSuccess}
        />
      )}

      {/* Success full-screen */}
      {successInfo && (
        <RetraitSuccessModal
          clientNom={successInfo.nom}
          total={successInfo.total}
          onDismiss={handleDismissSuccess}
        />
      )}
    </div>
  );
}
