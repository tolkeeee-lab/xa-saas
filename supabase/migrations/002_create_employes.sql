-- 002_create_employes.sql
CREATE TYPE IF NOT EXISTS public.employe_role AS ENUM ('caissier', 'gerant', 'admin');

CREATE TABLE IF NOT EXISTS public.employes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id  UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  nom          TEXT NOT NULL,
  prenom       TEXT,
  telephone    TEXT,
  pin          TEXT,
  role         public.employe_role NOT NULL DEFAULT 'caissier',
  actif        BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriétaire gère ses employés"
  ON public.employes
  FOR ALL
  USING (
    boutique_id IN (
      SELECT id FROM public.boutiques WHERE proprietaire_id = auth.uid()
    )
  )
  WITH CHECK (
    boutique_id IN (
      SELECT id FROM public.boutiques WHERE proprietaire_id = auth.uid()
    )
  );

CREATE POLICY "Caisse lecture employés actifs"
  ON public.employes
  FOR SELECT
  USING (actif = true);
