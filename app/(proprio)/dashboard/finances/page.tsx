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
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--xa-ink)' }}>Finances</h1>
        <p style={{ color: 'var(--xa-muted)', fontSize: '14px', marginTop: '4px' }}>
          Choisis un module
        </p>
      </div>
      <HubQuickLinks items={FINANCES_LINKS} />
    </div>
  );
}
