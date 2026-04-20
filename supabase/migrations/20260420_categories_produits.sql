-- ⚠️  DO NOT run this migration automatically from code.
-- Execute it manually in the Supabase SQL Editor after merging this PR.

CREATE TABLE IF NOT EXISTS categories_produits (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom              TEXT NOT NULL,
  couleur          TEXT NOT NULL DEFAULT '#999999',
  icone            TEXT NOT NULL DEFAULT '📦',
  ordre            INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (proprietaire_id, nom)
);

CREATE INDEX IF NOT EXISTS idx_categories_produits_proprio
  ON categories_produits(proprietaire_id);

ALTER TABLE categories_produits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proprio_own_categories" ON categories_produits
  FOR ALL USING (proprietaire_id = auth.uid())
  WITH CHECK (proprietaire_id = auth.uid());

-- Seed default categories for existing proprios
INSERT INTO categories_produits (proprietaire_id, nom, icone, ordre)
SELECT p.id, defaults.nom, defaults.icone, defaults.ordre
FROM profiles p
CROSS JOIN (VALUES
  ('Épicerie',    '🍚', 1),
  ('Boissons',    '🥤', 2),
  ('Hygiène',     '🧼', 3),
  ('Frais',       '🥗', 4),
  ('Boulangerie', '🥖', 5),
  ('Général',     '📦', 6),
  ('Autre',       '📌', 7)
) AS defaults(nom, icone, ordre)
WHERE p.role = 'proprio'
ON CONFLICT (proprietaire_id, nom) DO NOTHING;

-- Trigger: seed default categories for new proprios on signup
CREATE OR REPLACE FUNCTION seed_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'proprio' THEN
    INSERT INTO categories_produits (proprietaire_id, nom, icone, ordre)
    VALUES
      (NEW.id, 'Épicerie',    '🍚', 1),
      (NEW.id, 'Boissons',    '🥤', 2),
      (NEW.id, 'Hygiène',     '🧼', 3),
      (NEW.id, 'Frais',       '🥗', 4),
      (NEW.id, 'Boulangerie', '🥖', 5),
      (NEW.id, 'Général',     '📦', 6),
      (NEW.id, 'Autre',       '📌', 7)
    ON CONFLICT (proprietaire_id, nom) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS seed_categories_on_profile_insert ON profiles;
CREATE TRIGGER seed_categories_on_profile_insert
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION seed_default_categories();

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
