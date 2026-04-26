import HubQuickLinks from '@/features/dashboard/HubQuickLinks';
import { Users, Store, UserSquare, Truck, Settings } from 'lucide-react';

export const metadata = { title: 'Plus — xà' };

const PLUS_LINKS = [
  {
    href: '/dashboard/equipe',
    icon: UserSquare,
    label: 'Équipe',
    description: 'Gérer vos employés & accès',
  },
  {
    href: '/dashboard/boutiques',
    icon: Store,
    label: 'Boutiques',
    description: 'Vos points de vente',
  },
  {
    href: '/dashboard/clients',
    icon: Users,
    label: 'Clients',
    description: 'Annuaire & fidélité',
  },
  {
    href: '/dashboard/fournisseurs',
    icon: Truck,
    label: 'Fournisseurs',
    description: 'Contacts & commandes',
  },
  {
    href: '/dashboard/settings',
    icon: Settings,
    label: 'Paramètres',
    description: 'Compte, boutiques & préférences',
  },
];

export default function PlusHubPage() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--xa-ink)' }}>Plus</h1>
        <p style={{ color: 'var(--xa-muted)', fontSize: '14px', marginTop: '4px' }}>
          Configuration & annuaires
        </p>
      </div>
      <HubQuickLinks items={PLUS_LINKS} />
    </div>
  );
}
