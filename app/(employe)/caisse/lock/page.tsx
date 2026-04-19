import type { Metadata } from 'next';
import EmployeLockScreenClient from '@/features/employe/EmployeLockScreenClient';

export const metadata: Metadata = { title: 'Accès employé — xà' };

export default function CaisseLockPage() {
  return <EmployeLockScreenClient />;
}
