'use client';

import type { EffectiveRole } from '@/lib/auth/getEffectiveRole';
import ProfilSection from './sections/ProfilSection';
import SecuriteSection from './sections/SecuriteSection';
import BoutiquesSection from './sections/BoutiquesSection';
import CategoriesManager from '@/features/categories/CategoriesManager';
import PreferencesSection from './sections/PreferencesSection';
import AProposSection from './sections/AProposSection';

type SettingsScreenProps = {
  role: EffectiveRole;
};

export default function SettingsScreen({ role }: SettingsScreenProps) {
  const showBoutiques = role.role === 'owner' || role.role === 'admin';

  return (
    <div className="xa-settings max-w-xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-xa-text">Paramètres</h1>
      <ProfilSection role={role} />
      <SecuriteSection role={role} />
      {showBoutiques && <BoutiquesSection role={role} />}
      {showBoutiques && <CategoriesManager />}
      <PreferencesSection />
      <AProposSection />
    </div>
  );
}
