-- 001_create_boutiques.sql
CREATE TABLE IF NOT EXISTS public.boutiques (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom              TEXT NOT NULL,
  adresse          TEXT,
  telephone        TEXT,
  ville            TEXT,
  proprietaire_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_unique      TEXT UNIQUE,
  pin_caisse       TEXT,
  actif            BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.boutiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriétaire gère sa boutique"
  ON public.boutiques
  FOR ALL
  USING (auth.uid() = proprietaire_id)
  WITH CHECK (auth.uid() = proprietaire_id);

CREATE POLICY "Caisse lecture publique par code"
  ON public.boutiques
  FOR SELECT
  USING (actif = true AND code_unique IS NOT NULL);
