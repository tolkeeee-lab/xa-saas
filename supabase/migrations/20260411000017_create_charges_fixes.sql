-- supabase/migrations/20260411000017_create_charges_fixes.sql
CREATE TABLE IF NOT EXISTS charges_fixes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proprietaire_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  boutique_id UUID REFERENCES boutiques(id) ON DELETE CASCADE NULL, -- NULL = charge globale
  libelle TEXT NOT NULL,
  categorie TEXT NOT NULL CHECK (categorie IN ('loyer', 'salaire', 'fournisseur', 'autre')),
  montant NUMERIC NOT NULL DEFAULT 0,
  periodicite TEXT NOT NULL DEFAULT 'mensuel' CHECK (periodicite IN ('mensuel', 'hebdo', 'annuel')),
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE charges_fixes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proprio_charges" ON charges_fixes
  FOR ALL USING (proprietaire_id = auth.uid());
