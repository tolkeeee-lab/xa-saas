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
    <div>
      <div className="xa-hub-header">
        <h1>Plus</h1>
        <p>Configuration & annuaires</p>
      </div>
      <HubQuickLinks items={PLUS_LINKS} />
    </div>
  );
}
