'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AdminStats, AdminUser, AdminActivity } from '@/lib/supabase/getAdminStats';
import { formatFCFA } from '@/lib/format';

// ─── Demo data (shown when Supabase returns 0 users) ─────────────────────────

const DEMO_USERS: AdminUser[] = [
  {
    id: 'demo-1', nom_complet: 'Kofi Amedegnato', telephone: '+229 97 11 22 33',
    role: 'proprio', created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    boutiques_count: 2, boutiques: [
      { id: 'b1', nom: 'Boutique Kofi', ville: 'Cotonou', actif: true },
      { id: 'b2', nom: 'Épicerie Nord', ville: 'Cotonou', actif: true },
    ],
    ca_mois: 850000, employes_count: 4, status: 'active',
  },
  {
    id: 'demo-2', nom_complet: 'Adjoua Mensah', telephone: '+229 96 44 55 66',
    role: 'proprio', created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    boutiques_count: 1, boutiques: [{ id: 'b3', nom: 'Mode Adjoua', ville: 'Porto-Novo', actif: true }],
    ca_mois: 320000, employes_count: 2, status: 'active',
  },
  {
    id: 'demo-3', nom_complet: 'Sourou Dossou', telephone: '+229 95 77 88 99',
    role: 'proprio', created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    boutiques_count: 1, boutiques: [{ id: 'b4', nom: 'Alimentation Dossou', ville: 'Parakou', actif: true }],
    ca_mois: 0, employes_count: 1, status: 'trial',
  },
  {
    id: 'demo-4', nom_complet: 'Fatoumata Bello', telephone: '+229 94 00 11 22',
    role: 'proprio', created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
    boutiques_count: 3, boutiques: [
      { id: 'b5', nom: 'Supermarché Bello', ville: 'Cotonou', actif: true },
      { id: 'b6', nom: 'Bello Express', ville: 'Abomey-Calavi', actif: true },
      { id: 'b7', nom: 'Bello Sud', ville: 'Cotonou', actif: false },
    ],
    ca_mois: 1240000, employes_count: 8, status: 'active',
  },
  {
    id: 'demo-5', nom_complet: 'Yao Gbeto', telephone: '+229 93 33 44 55',
    role: 'proprio', created_at: new Date(Date.now() - 200 * 86400000).toISOString(),
    boutiques_count: 1, boutiques: [{ id: 'b8', nom: 'Gbeto Électro', ville: 'Bohicon', actif: false }],
    ca_mois: 0, employes_count: 0, status: 'suspended',
  },
  {
    id: 'demo-6', nom_complet: 'Aminatou Sow', telephone: '+229 92 55 66 77',
    role: 'proprio', created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    boutiques_count: 1, boutiques: [{ id: 'b9', nom: 'Couture Aminatou', ville: 'Lokossa', actif: true }],
    ca_mois: 195000, employes_count: 2, status: 'active',
  },
  {
    id: 'demo-7', nom_complet: 'Serge Ahounou', telephone: '+229 91 88 99 00',
    role: 'proprio', created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    boutiques_count: 1, boutiques: [{ id: 'b10', nom: 'Resto Ahounou', ville: 'Cotonou', actif: true }],
    ca_mois: 0, employes_count: 3, status: 'trial',
  },
  {
    id: 'demo-8', nom_complet: 'Blandine Hountondji', telephone: '+229 90 22 33 44',
    role: 'proprio', created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
    boutiques_count: 2, boutiques: [
      { id: 'b11', nom: 'Pharmacie Blandine', ville: 'Porto-Novo', actif: true },
      { id: 'b12', nom: 'Para Blandine', ville: 'Porto-Novo', actif: true },
    ],
    ca_mois: 560000, employes_count: 5, status: 'active',
  },
  {
    id: 'demo-9', nom_complet: 'Ismaël Kakpo', telephone: '+229 98 45 67 89',
    role: 'proprio', created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    boutiques_count: 1, boutiques: [{ id: 'b13', nom: 'Tech Kakpo', ville: 'Cotonou', actif: true }],
    ca_mois: 75000, employes_count: 1, status: 'active',
  },
  {
    id: 'demo-10', nom_complet: 'Cécile Toussou', telephone: '+229 97 34 56 78',
    role: 'proprio', created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    boutiques_count: 1, boutiques: [{ id: 'b14', nom: 'Quincaillerie Toussou', ville: 'Abomey', actif: true }],
    ca_mois: 0, employes_count: 2, status: 'trial',
  },
  {
    id: 'demo-11', nom_complet: 'Rémy Agossou', telephone: '+229 96 23 45 67',
    role: 'proprio', created_at: new Date(Date.now() - 250 * 86400000).toISOString(),
    boutiques_count: 4, boutiques: [
      { id: 'b15', nom: 'Agossou Import', ville: 'Cotonou', actif: true },
      { id: 'b16', nom: 'Agossou 2', ville: 'Cotonou', actif: true },
      { id: 'b17', nom: 'Agossou Parakou', ville: 'Parakou', actif: true },
      { id: 'b18', nom: 'Agossou Abomey', ville: 'Abomey', actif: false },
    ],
    ca_mois: 2100000, employes_count: 12, status: 'active',
  },
  {
    id: 'demo-12', nom_complet: 'Victoire Zinzou', telephone: '+229 95 12 34 56',
    role: 'proprio', created_at: new Date(Date.now() - 75 * 86400000).toISOString(),
    boutiques_count: 1, boutiques: [{ id: 'b19', nom: 'Zinzou Mode', ville: 'Natitingou', actif: true }],
    ca_mois: 145000, employes_count: 2, status: 'active',
  },
  {
    id: 'demo-13', nom_complet: 'Pascal Akakpo', telephone: '+229 94 98 76 54',
    role: 'proprio', created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    boutiques_count: 1, boutiques: [{ id: 'b20', nom: 'Akakpo Services', ville: 'Kandi', actif: true }],
    ca_mois: 0, employes_count: 1, status: 'trial',
  },
  {
    id: 'demo-14', nom_complet: 'Nadège Hounkpati', telephone: '+229 93 87 65 43',
    role: 'proprio', created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
    boutiques_count: 2, boutiques: [
      { id: 'b21', nom: 'Hounkpati Général', ville: 'Cotonou', actif: false },
      { id: 'b22', nom: 'Hounkpati Marché', ville: 'Cotonou', actif: false },
    ],
    ca_mois: 0, employes_count: 0, status: 'suspended',
  },
  {
    id: 'demo-15', nom_complet: 'Thierry Dansou', telephone: '+229 92 76 54 32',
    role: 'proprio', created_at: new Date(Date.now() - 55 * 86400000).toISOString(),
    boutiques_count: 1, boutiques: [{ id: 'b23', nom: 'Dansou Pharma', ville: 'Abomey-Calavi', actif: true }],
    ca_mois: 430000, employes_count: 3, status: 'active',
  },
];

function buildDemoStats(): AdminStats {
  const users = DEMO_USERS;
  const total_users = users.length;
  const active_users = users.filter((u) => u.status === 'active').length;
  const trial_users = users.filter((u) => u.status === 'trial').length;
  const boutiques_total = users.flatMap((u) => u.boutiques).filter((b) => b.actif).length;
  const ca_reseau = users.reduce((s, u) => s + u.ca_mois, 0);
  const mrr = users.reduce((s, u) => {
    if (u.status === 'suspended') return s;
    if (u.ca_mois > 500000) return s + 15000;
    if (u.ca_mois > 0) return s + 5000;
    return s;
  }, 0);
  const villeCount: Record<string, number> = {};
  for (const b of users.flatMap((u) => u.boutiques).filter((b) => b.actif)) {
    villeCount[b.ville] = (villeCount[b.ville] ?? 0) + 1;
  }
  const villes = Object.entries(villeCount)
    .map(([ville, count]) => ({ ville, count }))
    .sort((a, b) => b.count - a.count);
  return { users, total_users, active_users, trial_users, boutiques_total, ca_reseau, mrr, villes };
}

// ─── Helper utilities ─────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function getPlan(u: AdminUser): 'Starter' | 'Pro' | 'Business' {
  if (u.ca_mois > 500000) return 'Business';
  if (u.ca_mois > 0 && u.status !== 'suspended') return 'Pro';
  return 'Starter';
}

const PLAN_COLOR: Record<string, string> = {
  Starter: '#00d68f',
  Pro: '#4d9fff',
  Business: '#9b72ff',
};

const STATUS_COLOR: Record<string, string> = {
  active: '#00d68f',
  trial: '#ffb020',
  suspended: '#ff4d4d',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Actif',
  trial: 'Essai',
  suspended: 'Suspendu',
};

function formatDate(d: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(d));
}

function timeAgo(d: string): string {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

// ─── Toast notification ───────────────────────────────────────────────────────

type ToastItem = { id: number; message: string; type: 'success' | 'error' };

function Toast({ items, onRemove }: { items: ToastItem[]; onRemove: (id: number) => void }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((t) => (
        <div
          key={t.id}
          onClick={() => onRemove(t.id)}
          style={{
            background: t.type === 'success' ? '#00d68f' : '#ff4d4d',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            minWidth: 240,
          }}
        >
          {t.type === 'success' ? '✓ ' : '✕ '}{t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

type Section = 'overview' | 'users' | 'boutiques' | 'subscriptions' | 'revenue' | 'activity' | 'alerts' | 'settings';

const NAV_ITEMS: { id: Section; label: string; icon: string }[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: '◼' },
  { id: 'users', label: 'Utilisateurs', icon: '👥' },
  { id: 'boutiques', label: 'Boutiques', icon: '🏪' },
  { id: 'subscriptions', label: 'Abonnements', icon: '💳' },
  { id: 'revenue', label: 'Revenus SaaS', icon: '💰' },
  { id: 'activity', label: 'Activité', icon: '⚡' },
  { id: 'alerts', label: 'Alertes', icon: '🔔' },
  { id: 'settings', label: 'Paramètres', icon: '⚙' },
];

function Sidebar({
  active, onNav, stats, sidebarOpen, onClose,
}: {
  active: Section;
  onNav: (s: Section) => void;
  stats: AdminStats;
  sidebarOpen: boolean;
  onClose: () => void;
}) {
  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => setClock(new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const alerts = stats.total_users > 0
    ? stats.users.filter((u) => u.status === 'suspended').length
    : 2;

  return (
    <>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
        />
      )}
      <aside className="admin-sidebar" style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', width: 240,
        background: '#0e1420', borderRight: '1px solid #1a2340',
        display: 'flex', flexDirection: 'column',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        zIndex: 50,
      }}>
        {/* Brand */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1a2340' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #9b72ff, #4d9fff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: '#fff',
            }}>S</div>
            <div>
              <div style={{ color: '#eef0f8', fontWeight: 700, fontSize: 16 }}>xà</div>
              <div style={{
                fontSize: 9, background: 'linear-gradient(90deg, #9b72ff, #4d9fff)',
                color: '#fff', padding: '2px 6px', borderRadius: 20, fontWeight: 700,
              }}>⚡ SUPER ADMIN</div>
            </div>
          </div>
          {/* Admin avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #9b72ff, #4d9fff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff',
              }}>SA</div>
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 9, height: 9, borderRadius: '50%',
                background: '#00d68f', border: '2px solid #0e1420',
              }} />
            </div>
            <div>
              <div style={{ color: '#eef0f8', fontSize: 12, fontWeight: 600 }}>Super Admin</div>
              <div style={{ color: '#7a85a0', fontSize: 10 }}>En ligne</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            const badge =
              item.id === 'users' ? stats.total_users :
              item.id === 'boutiques' ? stats.boutiques_total :
              item.id === 'alerts' ? alerts :
              null;
            const isLive = item.id === 'activity';
            return (
              <button
                key={item.id}
                onClick={() => { onNav(item.id); onClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  background: isActive ? '#1a2340' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  color: isActive ? '#eef0f8' : '#7a85a0',
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  marginBottom: 2, textAlign: 'left',
                  borderLeft: isActive ? '3px solid #9b72ff' : '3px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {badge !== null && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
                    background: item.id === 'alerts' ? '#ff4d4d' : '#1f2a4a',
                    color: item.id === 'alerts' ? '#fff' : '#eef0f8',
                  }}>{badge}</span>
                )}
                {isLive && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: '#00d68f', color: '#fff' }}>Live</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #1a2340' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d68f' }} />
            <span style={{ color: '#00d68f', fontSize: 11, fontWeight: 600 }}>Système opérationnel</span>
          </div>
          <div style={{ color: '#7a85a0', fontSize: 11, fontFamily: 'monospace' }}>{clock}</div>
        </div>
      </aside>
    </>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, sub, icon }: { label: string; value: string; color: string; sub?: string; icon?: string }) {
  return (
    <div style={{
      background: '#0e1420', border: '1px solid #1a2340', borderRadius: 12,
      padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <span style={{ color: '#7a85a0', fontSize: 12 }}>{label}</span>
      </div>
      <div style={{ color, fontSize: 26, fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ color: '#7a85a0', fontSize: 11 }}>{sub}</div>}
    </div>
  );
}

// ─── Bar chart (CSS) ──────────────────────────────────────────────────────────

function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 9, color: '#7a85a0' }}>{d.value}</div>
          <div style={{
            width: '100%', background: color,
            height: `${(d.value / max) * 60}px`,
            borderRadius: 3, minHeight: 2,
            opacity: 0.85,
          }} />
          <div style={{ fontSize: 9, color: '#404a60', whiteSpace: 'nowrap' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function HBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 80, color: '#7a85a0', fontSize: 12, textAlign: 'right' }}>{d.label}</div>
          <div style={{ flex: 1, background: '#141c2e', borderRadius: 4, height: 20 }}>
            <div style={{
              width: `${(d.value / max) * 100}%`,
              background: d.color, height: '100%',
              borderRadius: 4, minWidth: d.value ? 4 : 0,
              display: 'flex', alignItems: 'center', paddingLeft: 6,
            }}>
              {d.value > 0 && <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>{d.value}</span>}
            </div>
          </div>
          <div style={{ width: 40, color: '#7a85a0', fontSize: 11, textAlign: 'right' }}>
            {Math.round((d.value / Math.max(data.reduce((s, x) => s + x.value, 0), 1)) * 100)}%
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Overview section ─────────────────────────────────────────────────────────

function OverviewSection({ stats }: { stats: AdminStats }) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      label: d.toLocaleDateString('fr-FR', { month: 'short' }),
      value: stats.users.filter((u) => {
        const c = new Date(u.created_at);
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
      }).length,
    };
  });

  const planCount = {
    Starter: stats.users.filter((u) => getPlan(u) === 'Starter').length,
    Pro: stats.users.filter((u) => getPlan(u) === 'Pro').length,
    Business: stats.users.filter((u) => getPlan(u) === 'Business').length,
  };

  const recent = [...stats.users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        <StatCard label="Utilisateurs total" value={String(stats.total_users)} color="#4d9fff" icon="👥" sub="propriétaires inscrits" />
        <StatCard label="Comptes actifs" value={String(stats.active_users)} color="#00d68f" icon="✓" sub={`${stats.total_users ? Math.round(stats.active_users / stats.total_users * 100) : 0}% du total`} />
        <StatCard label="Essais en cours" value={String(stats.trial_users)} color="#ffb020" icon="⏱" sub="< 30 jours" />
        <StatCard label="MRR estimé" value={formatFCFA(stats.mrr)} color="#9b72ff" icon="💎" sub="mensuel récurrent" />
        <StatCard label="CA réseau" value={formatFCFA(stats.ca_reseau)} color="#00d4ff" icon="📈" sub="ce mois" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Bar chart: inscriptions */}
        <div style={{ background: '#0e1420', border: '1px solid #1a2340', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#eef0f8', fontWeight: 600, marginBottom: 16, fontSize: 13 }}>Nouvelles inscriptions (6 mois)</div>
          <BarChart data={months} color="#4d9fff" />
        </div>

        {/* HBar chart: plans */}
        <div style={{ background: '#0e1420', border: '1px solid #1a2340', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#eef0f8', fontWeight: 600, marginBottom: 16, fontSize: 13 }}>Répartition par plan</div>
          <HBarChart data={[
            { label: 'Starter', value: planCount.Starter, color: '#00d68f' },
            { label: 'Pro', value: planCount.Pro, color: '#4d9fff' },
            { label: 'Business', value: planCount.Business, color: '#9b72ff' },
          ]} />
        </div>

        {/* Recent users */}
        <div style={{ background: '#0e1420', border: '1px solid #1a2340', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#eef0f8', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Nouveaux utilisateurs récents</div>
          {recent.map((u) => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #141c2e' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: `linear-gradient(135deg, ${PLAN_COLOR[getPlan(u)]}, #1a2340)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>{getInitials(u.nom_complet)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#eef0f8', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nom_complet ?? 'Inconnu'}</div>
                <div style={{ color: '#7a85a0', fontSize: 10 }}>{formatDate(u.created_at)}</div>
              </div>
              <span style={{
                fontSize: 10, padding: '2px 6px', borderRadius: 6,
                background: STATUS_COLOR[u.status] + '22', color: STATUS_COLOR[u.status], fontWeight: 700,
              }}>{STATUS_LABEL[u.status]}</span>
            </div>
          ))}
        </div>

        {/* Boutiques by city */}
        <div style={{ background: '#0e1420', border: '1px solid #1a2340', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#eef0f8', fontWeight: 600, marginBottom: 16, fontSize: 13 }}>Boutiques par ville</div>
          <HBarChart data={stats.villes.slice(0, 6).map((v) => ({ label: v.ville, value: v.count, color: '#9b72ff' }))} />
        </div>
      </div>
    </div>
  );
}

// ─── Users section ────────────────────────────────────────────────────────────

function UserRow({ u, onView }: { u: AdminUser; onView: (u: AdminUser) => void }) {
  const plan = getPlan(u);
  return (
    <tr style={{ borderBottom: '1px solid #141c2e' }}>
      <td style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${PLAN_COLOR[plan]}, #1a2340)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff',
          }}>{getInitials(u.nom_complet)}</div>
          <div>
            <div style={{ color: '#eef0f8', fontSize: 13, fontWeight: 600 }}>{u.nom_complet ?? '—'}</div>
            <div style={{ color: '#7a85a0', fontSize: 11 }}>{u.telephone ?? '—'}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '10px 12px', color: '#7a85a0', fontSize: 12 }}>
        {u.boutiques_count} boutique{u.boutiques_count > 1 ? 's' : ''}
      </td>
      <td style={{ padding: '10px 12px', color: '#7a85a0', fontSize: 12 }}>
        {u.boutiques[0]?.ville ?? '—'}
      </td>
      <td style={{ padding: '10px 12px' }}>
        <span style={{
          fontSize: 11, padding: '3px 8px', borderRadius: 6,
          background: PLAN_COLOR[plan] + '22', color: PLAN_COLOR[plan], fontWeight: 700,
        }}>{plan}</span>
      </td>
      <td style={{ padding: '10px 12px', color: '#7a85a0', fontSize: 12 }}>{formatDate(u.created_at)}</td>
      <td style={{ padding: '10px 12px', color: '#eef0f8', fontSize: 12, fontWeight: 600 }}>{formatFCFA(u.ca_mois)}</td>
      <td style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[u.status], flexShrink: 0 }} />
          <span style={{ color: STATUS_COLOR[u.status], fontSize: 12, fontWeight: 600 }}>{STATUS_LABEL[u.status]}</span>
        </div>
      </td>
      <td style={{ padding: '10px 12px' }}>
        <button
          onClick={() => onView(u)}
          style={{
            padding: '5px 10px', borderRadius: 6, border: '1px solid #1a2340',
            background: 'transparent', color: '#4d9fff', fontSize: 11, cursor: 'pointer', fontWeight: 600,
          }}
        >Voir</button>
      </td>
    </tr>
  );
}

function UsersSection({
  stats, onView, showAddUser,
}: {
  stats: AdminStats;
  onView: (u: AdminUser) => void;
  showAddUser: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'suspended'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PER_PAGE = 8;

  const filtered = stats.users.filter((u) => {
    if (filter !== 'all' && u.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.nom_complet?.toLowerCase().includes(q) ||
        u.telephone?.toLowerCase().includes(q) ||
        u.boutiques.some((b) => b.nom.toLowerCase().includes(q) || b.ville.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const tabStyle = (t: typeof filter) => ({
    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
    background: filter === t ? '#1a2340' : 'transparent',
    color: filter === t ? '#eef0f8' : '#7a85a0',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'active', 'trial', 'suspended'] as const).map((t) => (
            <button key={t} style={tabStyle(t)} onClick={() => { setFilter(t); setPage(0); }}>
              {t === 'all' ? 'Tous' : STATUS_LABEL[t]} {t !== 'all' && `(${stats.users.filter((u) => u.status === t).length})`}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Rechercher..."
            style={{
              background: '#141c2e', border: '1px solid #1a2340', borderRadius: 8,
              color: '#eef0f8', padding: '6px 12px', fontSize: 12, outline: 'none', width: 180,
            }}
          />
          <button
            onClick={showAddUser}
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(90deg, #9b72ff, #4d9fff)', color: '#fff', fontSize: 12, fontWeight: 700,
            }}
          >+ Ajouter</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#0e1420', border: '1px solid #1a2340', borderRadius: 12, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a2340' }}>
              {['Utilisateur', 'Boutique(s)', 'Ville', 'Plan', 'Inscrit', 'CA mois', 'Statut', ''].map((h) => (
                <th key={h} style={{ padding: '10px 12px', color: '#404a60', fontSize: 11, fontWeight: 600, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#404a60' }}>Aucun utilisateur</td></tr>
            ) : paged.map((u) => (
              <UserRow key={u.id} u={u} onView={onView} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{
                width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
                background: page === i ? '#9b72ff' : '#141c2e', color: '#eef0f8',
              }}
            >{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Boutiques section ────────────────────────────────────────────────────────

function BoutiquesSection({ stats }: { stats: AdminStats }) {
  const allBoutiques = stats.users.flatMap((u) =>
    u.boutiques.map((b) => ({ ...b, user: u, plan: getPlan(u) }))
  );

  const totalCA = stats.ca_reseau;
  const totalEmployes = stats.users.reduce((s, u) => s + u.employes_count, 0);
  const villes = new Set(allBoutiques.map((b) => b.ville)).size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        <StatCard label="Boutiques total" value={String(allBoutiques.length)} color="#4d9fff" icon="🏪" />
        <StatCard label="Villes couvertes" value={String(villes)} color="#9b72ff" icon="📍" />
        <StatCard label="CA total réseau" value={formatFCFA(totalCA)} color="#00d4ff" icon="📈" />
        <StatCard label="Employés total" value={String(totalEmployes)} color="#00d68f" icon="👤" />
      </div>

      <div style={{ background: '#0e1420', border: '1px solid #1a2340', borderRadius: 12, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a2340' }}>
              {['Boutique', 'Propriétaire', 'Ville', 'Employés', 'Plan', 'CA mois', 'Statut'].map((h) => (
                <th key={h} style={{ padding: '10px 12px', color: '#404a60', fontSize: 11, fontWeight: 600, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allBoutiques.map((b) => (
              <tr key={b.id} style={{ borderBottom: '1px solid #141c2e' }}>
                <td style={{ padding: '10px 12px', color: '#eef0f8', fontSize: 13, fontWeight: 600 }}>{b.nom}</td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, ${PLAN_COLOR[b.plan]}, #1a2340)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, color: '#fff',
                    }}>{getInitials(b.user.nom_complet)}</div>
                    <span style={{ color: '#eef0f8', fontSize: 12 }}>{b.user.nom_complet ?? '—'}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 12px', color: '#7a85a0', fontSize: 12 }}>{b.ville}</td>
                <td style={{ padding: '10px 12px', color: '#7a85a0', fontSize: 12 }}>{b.user.employes_count}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, background: PLAN_COLOR[b.plan] + '22', color: PLAN_COLOR[b.plan], fontWeight: 700 }}>{b.plan}</span>
                </td>
                <td style={{ padding: '10px 12px', color: '#eef0f8', fontSize: 12, fontWeight: 600 }}>{formatFCFA(b.user.ca_mois)}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 11, color: b.actif ? '#00d68f' : '#ff4d4d', fontWeight: 700 }}>
                    {b.actif ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Subscriptions section ────────────────────────────────────────────────────

const PLANS = [
  { id: 'Starter', price: 0, color: '#00d68f', desc: 'Idéal pour démarrer. 1 boutique, 1 caisse, jusqu\'à 100 produits.' },
  { id: 'Pro', price: 5000, color: '#4d9fff', desc: 'Pour les PME. 3 boutiques, 5 caisses, produits illimités + rapports.' },
  { id: 'Business', price: 15000, color: '#9b72ff', desc: 'Multi-boutiques illimité, priorité support, API + intégrations.' },
];

function SubscriptionsSection({ stats, onNotif }: { stats: AdminStats; onNotif: (m: string, t: 'success' | 'error') => void }) {
  const planCount = {
    Starter: stats.users.filter((u) => getPlan(u) === 'Starter').length,
    Pro: stats.users.filter((u) => getPlan(u) === 'Pro').length,
    Business: stats.users.filter((u) => getPlan(u) === 'Business').length,
  };

  // Simulated payments history
  const payments = stats.users.slice(0, 8).map((u, i) => ({
    id: u.id,
    date: new Date(Date.now() - i * 7 * 86400000).toLocaleDateString('fr-FR'),
    user: u.nom_complet ?? 'Inconnu',
    plan: getPlan(u),
    montant: getPlan(u) === 'Business' ? 15000 : getPlan(u) === 'Pro' ? 5000 : 0,
    mode: i % 2 === 0 ? 'Mobile Money' : 'Carte',
    statut: i % 5 === 0 ? 'Échoué' : 'Payé',
  })).filter((p) => p.montant > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {PLANS.map((p) => (
          <div key={p.id} style={{
            background: '#0e1420', border: `1px solid ${p.color}44`, borderRadius: 12,
            padding: '20px', display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: p.color, fontWeight: 800, fontSize: 15 }}>{p.id}</span>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 10,
                background: p.color + '22', color: p.color, fontWeight: 700,
              }}>{planCount[p.id as keyof typeof planCount]} clients</span>
            </div>
            <div style={{ color: '#eef0f8', fontSize: 22, fontWeight: 800 }}>
              {p.price === 0 ? 'Gratuit' : formatFCFA(p.price)}<span style={{ fontSize: 11, color: '#7a85a0' }}>{p.price > 0 ? '/mois' : ''}</span>
            </div>
            <div style={{ color: '#7a85a0', fontSize: 12, lineHeight: 1.5 }}>{p.desc}</div>
            <button
              onClick={() => onNotif(`Plan ${p.id} modifié (démo)`, 'success')}
              style={{
                marginTop: 8, padding: '7px 0', borderRadius: 8, border: `1px solid ${p.color}66`,
                background: 'transparent', color: p.color, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
            >Modifier</button>
          </div>
        ))}
      </div>

      <div style={{ background: '#0e1420', border: '1px solid #1a2340', borderRadius: 12 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a2340', color: '#eef0f8', fontWeight: 600, fontSize: 13 }}>
          Historique des paiements
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2340' }}>
                {['Date', 'Utilisateur', 'Plan', 'Montant', 'Mode', 'Statut', 'Facture'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', color: '#404a60', fontSize: 11, fontWeight: 600, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#404a60' }}>Aucun paiement enregistré</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #141c2e' }}>
                  <td style={{ padding: '8px 12px', color: '#7a85a0', fontSize: 12 }}>{p.date}</td>
                  <td style={{ padding: '8px 12px', color: '#eef0f8', fontSize: 12 }}>{p.user}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, background: PLAN_COLOR[p.plan] + '22', color: PLAN_COLOR[p.plan], fontWeight: 700 }}>{p.plan}</span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#eef0f8', fontSize: 12, fontWeight: 600 }}>{formatFCFA(p.montant)}</td>
                  <td style={{ padding: '8px 12px', color: '#7a85a0', fontSize: 12 }}>{p.mode}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: p.statut === 'Payé' ? '#00d68f' : '#ff4d4d' }}>{p.statut}</span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <button
                      onClick={() => onNotif('Téléchargement facture (démo)', 'success')}
                      style={{ fontSize: 11, color: '#4d9fff', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Revenue section ──────────────────────────────────────────────────────────

function RevenueSection({ stats }: { stats: AdminStats }) {
  const arr = stats.mrr * 12;
  const arpu = stats.active_users > 0 ? Math.round(stats.mrr / stats.active_users) : 0;
  const conversion = stats.total_users > 0 ? Math.round(stats.active_users / stats.total_users * 100) : 0;

  // Simulated MRR last 12 months
  const mrrMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - 11 + i);
    const isCurrent = i === 11;
    return {
      label: d.toLocaleDateString('fr-FR', { month: 'short' }),
      value: isCurrent ? stats.mrr : Math.round(stats.mrr * (0.4 + i * 0.05) * (0.85 + Math.random() * 0.3)),
    };
  });

  const planCountPro = stats.users.filter((u) => getPlan(u) === 'Pro').length;
  const planCountBusiness = stats.users.filter((u) => getPlan(u) === 'Business').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        <StatCard label="MRR" value={formatFCFA(stats.mrr)} color="#9b72ff" icon="💎" sub="mensuel récurrent" />
        <StatCard label="ARR" value={formatFCFA(arr)} color="#00d4ff" icon="📅" sub="annuel projeté" />
        <StatCard label="ARPU" value={formatFCFA(arpu)} color="#4d9fff" icon="👤" sub="revenu/utilisateur" />
        <StatCard label="Taux de conversion" value={`${conversion}%`} color="#00d68f" icon="🎯" sub="essai → actif" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div style={{ background: '#0e1420', border: '1px solid #1a2340', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#eef0f8', fontWeight: 600, marginBottom: 16, fontSize: 13 }}>MRR — 12 derniers mois</div>
          <BarChart data={mrrMonths} color="#9b72ff" />
        </div>
        <div style={{ background: '#0e1420', border: '1px solid #1a2340', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: '#eef0f8', fontWeight: 600, marginBottom: 16, fontSize: 13 }}>Revenus par plan</div>
          <HBarChart data={[
            { label: 'Pro', value: planCountPro * 5000, color: '#4d9fff' },
            { label: 'Business', value: planCountBusiness * 15000, color: '#9b72ff' },
          ]} />
          <div style={{ marginTop: 12 }}>
            <div style={{ color: '#7a85a0', fontSize: 11 }}>{planCountPro} comptes Pro × {formatFCFA(5000)}</div>
            <div style={{ color: '#7a85a0', fontSize: 11 }}>{planCountBusiness} comptes Business × {formatFCFA(15000)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Activity section ─────────────────────────────────────────────────────────

function ActivitySection({ stats, activity }: { stats: AdminStats; activity: AdminActivity[] }) {
  const activeUsers = stats.users.filter((u) => u.status === 'active').slice(0, 8);

  // If no real activity, generate from stats
  const displayActivity: AdminActivity[] = activity.length > 0 ? activity : stats.users.flatMap((u) =>
    u.boutiques.slice(0, 1).map((b) => ({
      id: b.id,
      boutique_nom: b.nom,
      proprietaire_nom: u.nom_complet,
      montant_total: Math.round(Math.random() * 50000 + 5000),
      created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    }))
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Active users */}
      <div style={{ background: '#0e1420', border: '1px solid #1a2340', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ color: '#eef0f8', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Utilisateurs actifs</div>
        {activeUsers.length === 0 ? (
          <div style={{ color: '#404a60', fontSize: 12 }}>Aucun utilisateur actif</div>
        ) : activeUsers.map((u) => {
          const plan = getPlan(u);
          return (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #141c2e' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${PLAN_COLOR[plan]}, #1a2340)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#fff',
                }}>{getInitials(u.nom_complet)}</div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: '#00d68f', border: '2px solid #0e1420' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#eef0f8', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nom_complet ?? '—'}</div>
                <div style={{ color: '#7a85a0', fontSize: 11 }}>{u.boutiques[0]?.ville ?? '—'}</div>
              </div>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: PLAN_COLOR[plan] + '22', color: PLAN_COLOR[plan], fontWeight: 700 }}>{plan}</span>
            </div>
          );
        })}
      </div>

      {/* Activity journal */}
      <div style={{ background: '#0e1420', border: '1px solid #1a2340', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ color: '#eef0f8', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Journal d&apos;activité</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {displayActivity.slice(0, 10).map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid #141c2e' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00d68f', flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#eef0f8', fontSize: 12 }}>
                  <span style={{ fontWeight: 600 }}>Vente enregistrée</span>
                  <span style={{ color: '#7a85a0' }}> — {a.boutique_nom}</span>
                </div>
                <div style={{ color: '#7a85a0', fontSize: 11 }}>
                  {a.proprietaire_nom ?? 'Inconnu'} · {formatFCFA(a.montant_total)}
                </div>
              </div>
              <div style={{ color: '#404a60', fontSize: 11, flexShrink: 0 }}>{timeAgo(a.created_at)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Alerts section ───────────────────────────────────────────────────────────

type AlertItem = { id: string; type: 'danger' | 'warning' | 'info' | 'upgrade'; title: string; desc: string };

const BORDER_COLORS: Record<AlertItem['type'], string> = {
  danger: '#ff4d4d',
  warning: '#ffb020',
  info: '#4d9fff',
  upgrade: '#9b72ff',
};

function AlertsSection({ stats, onNotif }: { stats: AdminStats; onNotif: (m: string, t: 'success' | 'error') => void }) {
  const baseAlerts: AlertItem[] = [
    { id: 'pay-1', type: 'danger', title: 'Paiement échoué', desc: '3 paiements n\'ont pas abouti ce mois (simulation).' },
    { id: 'up-1', type: 'upgrade', title: 'Demande de mise à niveau', desc: '2 utilisateurs Starter demandent à passer Pro.' },
    { id: 'info-1', type: 'info', title: 'Nouvelle inscription', desc: `${stats.trial_users} essai(s) en cours depuis moins de 30 jours.` },
  ];

  const expiredTrials = stats.users.filter(
    (u) =>
      u.status !== 'suspended' &&
      Date.now() - new Date(u.created_at).getTime() > 30 * 86400000 &&
      u.ca_mois === 0,
  );

  if (expiredTrials.length > 0) {
    baseAlerts.push({
      id: 'trial-exp',
      type: 'warning',
      title: 'Essais expirés sans CA',
      desc: `${expiredTrials.length} compte(s) inscrit(s) depuis plus de 30 jours sans aucune vente.`,
    });
  }

  const [alerts, setAlerts] = useState<AlertItem[]>(baseAlerts);

  const remove = (id: string, action: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    onNotif(`Alerte "${action}"`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {alerts.length === 0 ? (
        <div style={{
          background: '#0e1420', border: '1px solid #1a2340', borderRadius: 12,
          padding: 32, textAlign: 'center', color: '#404a60',
        }}>
          ✓ Aucune alerte active
        </div>
      ) : alerts.map((a) => (
        <div key={a.id} style={{
          background: '#0e1420', border: '1px solid #1a2340',
          borderLeft: `4px solid ${BORDER_COLORS[a.type]}`,
          borderRadius: 10, padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            <div style={{ color: BORDER_COLORS[a.type], fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{a.title}</div>
            <div style={{ color: '#7a85a0', fontSize: 12 }}>{a.desc}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => remove(a.id, 'Traité')}
              style={{
                padding: '5px 12px', borderRadius: 6, border: `1px solid ${BORDER_COLORS[a.type]}66`,
                background: BORDER_COLORS[a.type] + '22', color: BORDER_COLORS[a.type],
                cursor: 'pointer', fontSize: 11, fontWeight: 600,
              }}
            >Traiter</button>
            <button
              onClick={() => remove(a.id, 'Ignoré')}
              style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid #1a2340',
                background: 'transparent', color: '#7a85a0',
                cursor: 'pointer', fontSize: 11, fontWeight: 600,
              }}
            >Ignorer</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Settings section ─────────────────────────────────────────────────────────

function SettingsSection({ onNotif }: { onNotif: (m: string, t: 'success' | 'error') => void }) {
  const [config, setConfig] = useState({
    nom: 'xà — Solution de Gestion',
    version: '1.0.0',
    email: 'support@xa-saas.bj',
    telephone: '+229 97 00 00 00',
    devise: 'XOF (FCFA)',
    fuseau: 'Africa/Porto-Novo',
  });

  const LIMITS = [
    { plan: 'Starter', color: '#00d68f', boutiques: 1, caisses: 1, produits: 100, employes: 2 },
    { plan: 'Pro', color: '#4d9fff', boutiques: 3, caisses: 5, produits: 9999, employes: 10 },
    { plan: 'Business', color: '#9b72ff', boutiques: 999, caisses: 999, produits: 9999, employes: 999 },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Platform info */}
      <div style={{ background: '#0e1420', border: '1px solid #1a2340', borderRadius: 12, padding: '20px' }}>
        <div style={{ color: '#eef0f8', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Informations plateforme</div>
        {(Object.entries(config) as [keyof typeof config, string][]).map(([k, v]) => (
          <div key={k} style={{ marginBottom: 14 }}>
            <div style={{ color: '#7a85a0', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</div>
            <input
              value={v}
              onChange={(e) => setConfig((prev) => ({ ...prev, [k]: e.target.value }))}
              style={{
                width: '100%', background: '#141c2e', border: '1px solid #1a2340',
                borderRadius: 8, color: '#eef0f8', padding: '7px 10px', fontSize: 13, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
        <button
          onClick={() => onNotif('Configuration sauvegardée (démo)', 'success')}
          style={{
            width: '100%', padding: '9px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(90deg, #9b72ff, #4d9fff)', color: '#fff',
            cursor: 'pointer', fontSize: 13, fontWeight: 700, marginTop: 4,
          }}
        >Sauvegarder</button>
      </div>

      {/* Plan limits */}
      <div style={{ background: '#0e1420', border: '1px solid #1a2340', borderRadius: 12, padding: '20px' }}>
        <div style={{ color: '#eef0f8', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Limites par plan</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2340' }}>
                {['Plan', 'Boutiques', 'Caisses', 'Produits', 'Employés'].map((h) => (
                  <th key={h} style={{ padding: '7px 8px', color: '#404a60', fontSize: 11, fontWeight: 600, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LIMITS.map((l) => (
                <tr key={l.plan} style={{ borderBottom: '1px solid #141c2e' }}>
                  <td style={{ padding: '8px 8px' }}>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: l.color + '22', color: l.color, fontWeight: 700 }}>{l.plan}</span>
                  </td>
                  <td style={{ padding: '8px 8px', color: '#eef0f8', fontSize: 12 }}>{l.boutiques === 999 ? '∞' : l.boutiques}</td>
                  <td style={{ padding: '8px 8px', color: '#eef0f8', fontSize: 12 }}>{l.caisses === 999 ? '∞' : l.caisses}</td>
                  <td style={{ padding: '8px 8px', color: '#eef0f8', fontSize: 12 }}>{l.produits === 9999 ? '∞' : l.produits}</td>
                  <td style={{ padding: '8px 8px', color: '#eef0f8', fontSize: 12 }}>{l.employes === 999 ? '∞' : l.employes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── User detail modal ────────────────────────────────────────────────────────

function UserModal({
  user, onClose, onNotif,
}: {
  user: AdminUser;
  onClose: () => void;
  onNotif: (m: string, t: 'success' | 'error') => void;
}) {
  const [note, setNote] = useState('');
  const plan = getPlan(user);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div style={{
        background: '#0e1420', border: '1px solid #1a2340', borderRadius: 16,
        width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto',
        padding: 24,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${PLAN_COLOR[plan]}, #1a2340)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff',
          }}>{getInitials(user.nom_complet)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#eef0f8', fontSize: 18, fontWeight: 700 }}>{user.nom_complet ?? '—'}</div>
            <div style={{ color: '#7a85a0', fontSize: 13 }}>{user.telephone ?? '—'}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: PLAN_COLOR[plan] + '22', color: PLAN_COLOR[plan], fontWeight: 700 }}>{plan}</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: STATUS_COLOR[user.status] + '22', color: STATUS_COLOR[user.status], fontWeight: 700 }}>{STATUS_LABEL[user.status]}</span>
              {user.boutiques[0] && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#1a2340', color: '#7a85a0', fontWeight: 600 }}>📍 {user.boutiques[0].ville}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7a85a0', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        {/* Metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'CA mensuel', value: formatFCFA(user.ca_mois), color: '#00d4ff' },
            { label: 'Boutiques', value: String(user.boutiques_count), color: '#4d9fff' },
            { label: 'Employés', value: String(user.employes_count), color: '#9b72ff' },
            { label: 'Inscription', value: formatDate(user.created_at), color: '#7a85a0' },
            { label: 'Statut', value: STATUS_LABEL[user.status], color: STATUS_COLOR[user.status] },
            { label: 'Plan actuel', value: plan, color: PLAN_COLOR[plan] },
          ].map((m) => (
            <div key={m.label} style={{ background: '#141c2e', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ color: '#7a85a0', fontSize: 10, marginBottom: 4 }}>{m.label}</div>
              <div style={{ color: m.color, fontSize: 16, fontWeight: 700 }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Boutiques list */}
        {user.boutiques.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#7a85a0', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Boutiques</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {user.boutiques.map((b) => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#141c2e', borderRadius: 8, padding: '8px 12px' }}>
                  <span style={{ color: '#eef0f8', fontSize: 13 }}>{b.nom}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: '#7a85a0', fontSize: 12 }}>📍 {b.ville}</span>
                    <span style={{ fontSize: 11, color: b.actif ? '#00d68f' : '#ff4d4d', fontWeight: 700 }}>{b.actif ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: '#7a85a0', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Note interne</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ajouter une note sur ce compte..."
            rows={3}
            style={{
              width: '100%', background: '#141c2e', border: '1px solid #1a2340',
              borderRadius: 8, color: '#eef0f8', padding: '8px 12px', fontSize: 13, outline: 'none',
              resize: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #1a2340', background: 'transparent', color: '#7a85a0', cursor: 'pointer', fontSize: 12 }}>Fermer</button>
          <button
            onClick={() => { onNotif(`Compte ${user.status === 'suspended' ? 'réactivé' : 'suspendu'} (démo)`, 'success'); onClose(); }}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: user.status === 'suspended' ? '#00d68f' : '#ff4d4d', color: '#fff',
            }}
          >{user.status === 'suspended' ? 'Réactiver' : 'Suspendre'}</button>
          <button
            onClick={() => { onNotif('Modifications sauvegardées (démo)', 'success'); onClose(); }}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(90deg, #9b72ff, #4d9fff)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
          >Sauvegarder</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add user modal ───────────────────────────────────────────────────────────

function AddUserModal({ onClose, onNotif }: { onClose: () => void; onNotif: (m: string, t: 'success' | 'error') => void }) {
  const [form, setForm] = useState({ prenom: '', nom: '', telephone: '', email: '', ville: '', plan: 'Starter', boutique: '', type_boutique: '' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const inputStyle = {
    width: '100%', background: '#141c2e', border: '1px solid #1a2340',
    borderRadius: 8, color: '#eef0f8', padding: '8px 12px', fontSize: 13, outline: 'none',
    boxSizing: 'border-box' as const,
  };
  const labelStyle = { color: '#7a85a0', fontSize: 11, fontWeight: 600 as const, marginBottom: 4, display: 'block' as const };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
    >
      <div style={{ background: '#0e1420', border: '1px solid #1a2340', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ color: '#eef0f8', fontSize: 16, fontWeight: 700 }}>Ajouter un utilisateur</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7a85a0', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([['prenom', 'Prénom'], ['nom', 'Nom'], ['telephone', 'Téléphone'], ['email', 'Email'], ['ville', 'Ville'], ['boutique', 'Nom boutique'], ['type_boutique', 'Type boutique']] as [keyof typeof form, string][]).map(([k, label]) => (
            <div key={k} style={{ gridColumn: k === 'email' || k === 'boutique' ? '1 / -1' : 'auto' }}>
              <label style={labelStyle}>{label}</label>
              <input value={form[k]} onChange={set(k)} style={inputStyle} />
            </div>
          ))}
          <div>
            <label style={labelStyle}>Plan</label>
            <select value={form.plan} onChange={set('plan')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option>Starter</option>
              <option>Pro</option>
              <option>Business</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #1a2340', background: 'transparent', color: '#7a85a0', cursor: 'pointer', fontSize: 12 }}>Annuler</button>
          <button
            onClick={() => {
              if (!form.prenom || !form.email) { onNotif('Prénom et email requis', 'error'); return; }
              onNotif(`Compte créé pour ${form.prenom} ${form.nom} (démo)`, 'success');
              onClose();
            }}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(90deg, #9b72ff, #4d9fff)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
          >Créer le compte</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminDashboard({
  stats: rawStats,
  activity,
}: {
  stats: AdminStats;
  activity: AdminActivity[];
}) {
  const stats = rawStats.total_users === 0 ? buildDemoStats() : rawStats;
  const isDemo = rawStats.total_users === 0;

  const [section, setSection] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [search, setSearch] = useState('');

  const showNotif = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2400);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handle global search → switch to users section
  const handleSearch = (q: string) => {
    setSearch(q);
    if (q) setSection('users');
  };

  const filteredStats = search
    ? {
        ...stats,
        users: stats.users.filter((u) => {
          const q = search.toLowerCase();
          return (
            u.nom_complet?.toLowerCase().includes(q) ||
            u.telephone?.toLowerCase().includes(q) ||
            u.boutiques.some((b) => b.nom.toLowerCase().includes(q) || b.ville.toLowerCase().includes(q))
          );
        }),
      }
    : stats;

  const SECTION_LABELS: Record<Section, string> = {
    overview: 'Vue d\'ensemble',
    users: 'Utilisateurs',
    boutiques: 'Boutiques',
    subscriptions: 'Abonnements',
    revenue: 'Revenus SaaS',
    activity: 'Activité',
    alerts: 'Alertes',
    settings: 'Paramètres',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080b11', color: '#eef0f8', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Toast items={toasts} onRemove={removeToast} />

      {/* Demo banner */}
      {isDemo && (
        <div style={{ background: '#ffb020', color: '#080b11', textAlign: 'center', padding: '8px 16px', fontSize: 12, fontWeight: 700, position: 'relative', zIndex: 100 }}>
          ⚠️ MODE DÉMO — Données fictives (aucun utilisateur trouvé dans Supabase)
        </div>
      )}

      <Sidebar
        active={section}
        onNav={setSection}
        stats={stats}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div style={{ marginLeft: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Desktop sidebar spacer */}
        <style>{`
          @media (min-width: 768px) {
            .admin-sidebar { transform: translateX(0) !important; }
            .admin-main { margin-left: 240px; }
          }
        `}</style>

        {/* Topbar */}
        <header
          className="admin-main"
          style={{
            background: '#0e1420', borderBottom: '1px solid #1a2340',
            padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}
        >
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: '#7a85a0', cursor: 'pointer', fontSize: 20, padding: 4 }}
            className="md:hidden"
          >☰</button>

          <div style={{ color: '#eef0f8', fontWeight: 700, fontSize: 16, marginRight: 8 }}>
            {SECTION_LABELS[section]}
          </div>

          <div style={{ flex: 1, maxWidth: 320 }}>
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="🔍 Recherche globale..."
              style={{
                width: '100%', background: '#141c2e', border: '1px solid #1a2340',
                borderRadius: 8, color: '#eef0f8', padding: '7px 12px', fontSize: 13, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button
              onClick={() => setSection('activity')}
              style={{
                padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: '#141c2e', color: '#00d68f', fontSize: 12, fontWeight: 700,
              }}
            >⚡ Live</button>
            <button
              onClick={() => setShowAddUser(true)}
              style={{
                padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(90deg, #9b72ff, #4d9fff)', color: '#fff', fontSize: 12, fontWeight: 700,
              }}
            >+ Ajouter utilisateur</button>
          </div>
        </header>

        {/* Content */}
        <main
          className="admin-main"
          style={{ flex: 1, padding: '24px 20px', minWidth: 0 }}
        >
          {section === 'overview' && <OverviewSection stats={filteredStats} />}
          {section === 'users' && (
            <UsersSection
              stats={filteredStats}
              onView={setSelectedUser}
              showAddUser={() => setShowAddUser(true)}
            />
          )}
          {section === 'boutiques' && <BoutiquesSection stats={filteredStats} />}
          {section === 'subscriptions' && <SubscriptionsSection stats={filteredStats} onNotif={showNotif} />}
          {section === 'revenue' && <RevenueSection stats={filteredStats} />}
          {section === 'activity' && <ActivitySection stats={filteredStats} activity={activity} />}
          {section === 'alerts' && <AlertsSection stats={filteredStats} onNotif={showNotif} />}
          {section === 'settings' && <SettingsSection onNotif={showNotif} />}
        </main>
      </div>

      {/* Modals */}
      {selectedUser && (
        <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} onNotif={showNotif} />
      )}
      {showAddUser && (
        <AddUserModal onClose={() => setShowAddUser(false)} onNotif={showNotif} />
      )}
    </div>
  );
}
