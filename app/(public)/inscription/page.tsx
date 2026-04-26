import type { Metadata } from 'next';
import InscriptionForm from '@/features/inscription/InscriptionForm';

export const metadata: Metadata = {
  title: 'Devenir partenaire MAFRO',
  description: 'Rejoins le réseau MAFRO et gère ta boutique gratuitement avec notre app.',
};

export default function InscriptionPage() {
  return <InscriptionForm />;
}
