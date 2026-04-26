import HubQuickLinks from '@/features/dashboard/HubQuickLinks';
import { Activity, Building2, PackageCheck, Clock } from 'lucide-react';

export const metadata = { title: 'Ventes — xà' };

const VENTES_LINKS = [
  { href: '/dashboard/activite',   icon: Activity,     label: 'Activité',        description: 'Ventes du jour & historique' },
  { href: '/dashboard/b2b',        icon: Building2,    label: 'B2B',             description: 'Commandes professionnelles' },
  { href: '/dashboard/livraisons', icon: PackageCheck, label: 'Livraisons',      description: 'Suivi des livraisons' },
  { href: '/dashboard/dettes',     icon: Clock,        label: 'Dettes clients',  description: 'Créances à recouvrer' },
];

export default function VentesHubPage() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--xa-ink)' }}>Ventes</h1>
        <p style={{ color: 'var(--xa-muted)', fontSize: '14px', marginTop: '4px' }}>
          Choisis un module
        </p>
      </div>
      <HubQuickLinks items={VENTES_LINKS} />
    </div>
  );
}
