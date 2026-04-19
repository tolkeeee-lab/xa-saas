'use client';

import { useState, useMemo } from 'react';
import { formatFCFA } from '@/lib/format';
import type { Client } from '@/types/database';
import type { ClientsEmployeData } from '@/lib/supabase/getClientsForEmploye';
import type { EmployeSession } from '@/lib/employe-session';

type Props = {
  initialData: ClientsEmployeData;
  session: EmployeSession;
};

type CreateForm = { nom: string; telephone: string };
type ToastState = { message: string; type: 'success' | 'error' } | null;

export default function EmployeClientsPage({ initialData, session }: Props) {
  const [clients, setClients] = useState<Client[]>(initialData.clients);
  const [recherche, setRecherche] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>({ nom: '', telephone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  const filtered = useMemo(() => {
    if (!recherche) return clients;
    const q = recherche.toLowerCase();
    return clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        (c.telephone ?? '').includes(q),
    );
  }, [clients, recherche]);

  function handleCancelCreate() {
    setShowCreate(false);
    setForm({ nom: '', telephone: '' });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/employe/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: form.nom.trim(), telephone: form.telephone.trim() || undefined }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        showToast(data.error ?? 'Erreur lors de la création', 'error');
        return;
      }

      const data = (await res.json()) as { client: Client };
      setClients((prev) => [data.client, ...prev]);
      showToast(`Client ${data.client.nom} créé ✅`, 'success');
      setShowCreate(false);
      setForm({ nom: '', telephone: '' });
    } catch {
      showToast('Erreur réseau', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 900, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 300,
            padding: '12px 18px',
            borderRadius: 12,
            background: toast.type === 'success' ? '#00c853' : '#ff3341',
            color: '#fff',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,.15)',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: '"Black Han Sans", sans-serif',
              fontSize: 22,
              color: 'var(--c-ink, #0a120a)',
              margin: 0,
            }}
          >
            👥 Clients
          </h1>
          <p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              color: 'var(--c-muted, #6b7280)',
              margin: '4px 0 0',
            }}
          >
            {clients.length} client{clients.length !== 1 ? 's' : ''} · {session.boutique_nom}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          style={{
            padding: '8px 16px',
            borderRadius: 12,
            border: 'none',
            background: 'var(--c-accent, #00c853)',
            color: '#fff',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Nouveau client
        </button>
      </div>

      {/* Inline create form */}
      {showCreate && (
        <form
          onSubmit={(e) => void handleCreate(e)}
          style={{
            background: 'var(--c-surface, #fff)',
            border: '1px solid var(--c-accent, #00c853)',
            borderRadius: 16,
            padding: '16px',
            marginBottom: 16,
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ flex: 1, minWidth: 160 }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'Space Mono, monospace',
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--c-muted, #6b7280)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 5,
              }}
            >
              Nom *
            </label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              placeholder="Nom du client"
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid var(--c-rule2, #e5e7eb)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                color: 'var(--c-ink, #0a120a)',
                background: 'var(--c-bg, #f9fafb)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'Space Mono, monospace',
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--c-muted, #6b7280)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 5,
              }}
            >
              Téléphone
            </label>
            <input
              type="tel"
              value={form.telephone}
              onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
              placeholder="+229…"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: '1px solid var(--c-rule2, #e5e7eb)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                color: 'var(--c-ink, #0a120a)',
                background: 'var(--c-bg, #f9fafb)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handleCancelCreate}
              style={{
                padding: '9px 14px',
                borderRadius: 10,
                border: '1px solid var(--c-rule2, #e5e7eb)',
                background: 'transparent',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 12,
                cursor: 'pointer',
                color: 'var(--c-muted, #6b7280)',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!form.nom.trim() || submitting}
              style={{
                padding: '9px 14px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--c-accent, #00c853)',
                color: '#fff',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 12,
                fontWeight: 700,
                cursor: !form.nom.trim() || submitting ? 'not-allowed' : 'pointer',
                opacity: !form.nom.trim() || submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div style={{ marginBottom: 14 }}>
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par nom ou téléphone…"
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid var(--c-rule2, #e5e7eb)',
            background: 'var(--c-bg, #f9fafb)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: 'var(--c-ink, #0a120a)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Client list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              background: 'var(--c-surface, #fff)',
              border: '1px solid var(--c-rule2, #e5e7eb)',
              borderRadius: 16,
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
              color: 'var(--c-muted, #6b7280)',
            }}
          >
            Aucun client trouvé.
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              style={{
                background: 'var(--c-surface, #fff)',
                border: '1px solid var(--c-rule2, #e5e7eb)',
                borderRadius: 14,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(0,200,83,.12)',
                  color: '#00a048',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {c.nom
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>

              <div style={{ flex: 1, minWidth: 120 }}>
                <p
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--c-ink, #0a120a)',
                    margin: 0,
                  }}
                >
                  {c.nom}
                </p>
                {c.telephone && (
                  <p
                    style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: 11,
                      color: 'var(--c-muted, #6b7280)',
                      margin: '2px 0 0',
                    }}
                  >
                    {c.telephone}
                  </p>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    fontFamily: 'Space Mono, monospace',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--c-ink, #0a120a)',
                    margin: 0,
                  }}
                >
                  {c.points} pts
                </p>
                <p
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 11,
                    color: 'var(--c-muted, #6b7280)',
                    margin: '2px 0 0',
                  }}
                >
                  {formatFCFA(c.total_achats)} · {c.nb_visites} visite{c.nb_visites !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
