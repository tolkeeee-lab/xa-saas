import { requireEmployeSession } from '@/lib/employe-session';
import { getProduitsForEmploye } from '@/lib/supabase/getProduitsForEmploye';
import { createAdminClient } from '@/lib/supabase-admin';
import CaisseV3 from '@/features/caisse/v3/CaisseV3';
import type { Boutique } from '@/types/database';

export const metadata = { title: 'Caisse — xà' };

export default async function EmployeCaissePage() {
  const session = await requireEmployeSession();

  // Fetch the boutique info using admin client (employee has no Supabase Auth)
  const admin = createAdminClient();
  const { data: boutique } = await admin
    .from('boutiques')
    .select('id, proprietaire_id, nom, ville, quartier, code_unique, pin_caisse, couleur_theme, actif, created_at, updated_at')
    .eq('id', session.boutique_id)
    .single();

  if (!boutique) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: 'center',
          fontFamily: 'DM Sans, sans-serif',
          color: 'var(--c-muted, #6b7280)',
        }}
      >
        Boutique introuvable.
      </div>
    );
  }

  const produits = await getProduitsForEmploye(session);

  return (
    <CaisseV3
      boutiques={[boutique as Boutique]}
      produits={produits}
      userId={session.employe_id}
      lockedBoutiqueId={session.boutique_id}
      disableLock={true}
    />
  );
}
