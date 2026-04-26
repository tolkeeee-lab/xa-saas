import type { Metadata } from 'next';
import InscriptionSuccess from '@/features/inscription/InscriptionSuccess';

export const metadata: Metadata = {
  title: 'Bienvenue chez MAFRO 🎉',
  description: 'Ton compte partenaire MAFRO a été créé avec succès.',
};

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function InscriptionSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  return <InscriptionSuccess email={params.email ?? ''} />;
}
