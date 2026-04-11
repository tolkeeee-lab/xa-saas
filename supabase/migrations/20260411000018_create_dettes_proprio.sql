CREATE TABLE IF NOT EXISTS dettes_proprio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proprietaire_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  libelle TEXT NOT NULL,
  creancier TEXT NOT NULL,
  montant NUMERIC NOT NULL DEFAULT 0,
  montant_rembourse NUMERIC NOT NULL DEFAULT 0,
  date_echeance TIMESTAMPTZ,
  statut TEXT NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'rembourse', 'en_retard')),
  notes TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE dettes_proprio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proprio_dettes_proprio" ON dettes_proprio
  FOR ALL USING (proprietaire_id = auth.uid());
