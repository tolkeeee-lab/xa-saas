import { redirect } from 'next/navigation';
import { getEffectiveRole } from '@/lib/auth/getEffectiveRole';
import SettingsScreen from '@/features/settings/SettingsScreen';

export const metadata = { title: 'Paramètres — xà' };

export default async function SettingsPage() {
  const role = await getEffectiveRole();
  if (!role) redirect('/login');
  return <SettingsScreen role={role} />;
}
