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
    <div>
      <div className="xa-hub-header">
        <h1>Ventes</h1>
        <p>Choisis un module</p>
      </div>
      <HubQuickLinks items={VENTES_LINKS} />
    </div>
  );
}
