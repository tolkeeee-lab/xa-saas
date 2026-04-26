import HubQuickLinks from '@/features/dashboard/HubQuickLinks';
import { Wallet, CreditCard, ArrowDownLeft, Lock } from 'lucide-react';

export const metadata = { title: 'Finances — xà' };

const FINANCES_LINKS = [
  { href: '/dashboard/charges',    icon: Wallet,       label: 'Charges',                description: 'Charges fixes & variables' },
  { href: '/dashboard/mes-dettes', icon: CreditCard,   label: 'Mes dettes fournisseurs', description: 'Règlements à effectuer' },
  { href: '/dashboard/retraits',   icon: ArrowDownLeft,label: 'Retraits',               description: 'Sorties de caisse' },
  { href: '/dashboard/cloture',    icon: Lock,         label: 'Clôture caisse',         description: 'Arrêté journalier' },
];

export default function FinancesHubPage() {
  return (
    <div>
      <div className="xa-hub-header">
        <h1>Finances</h1>
        <p>Choisis un module</p>
      </div>
      <HubQuickLinks items={FINANCES_LINKS} />
    </div>
  );
}
