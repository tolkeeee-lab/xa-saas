-- Create boutique_objectifs table for monthly CA objectives
CREATE TABLE IF NOT EXISTS boutique_objectifs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id     uuid NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  proprietaire_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mois            char(7) NOT NULL, -- format: YYYY-MM
  objectif_ca     numeric(14, 2) NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (boutique_id, mois)
);

CREATE INDEX IF NOT EXISTS idx_boutique_objectifs_boutique_id ON boutique_objectifs(boutique_id);
CREATE INDEX IF NOT EXISTS idx_boutique_objectifs_proprietaire_id ON boutique_objectifs(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_boutique_objectifs_mois ON boutique_objectifs(mois);

-- Enable RLS
ALTER TABLE boutique_objectifs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage objectives"
  ON boutique_objectifs
  FOR ALL
  USING (proprietaire_id = auth.uid())
  WITH CHECK (proprietaire_id = auth.uid());
