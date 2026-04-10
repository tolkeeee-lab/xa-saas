ALTER TABLE boutiques
  ADD COLUMN IF NOT EXISTS code_unique TEXT,
  ADD COLUMN IF NOT EXISTS pin_caisse  TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_boutiques_code_unique
  ON boutiques (code_unique)
  WHERE code_unique IS NOT NULL;
