-- 003_create_clients_debiteurs.sql
CREATE TABLE IF NOT EXISTS public.clients_debiteurs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id  UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  nom          TEXT NOT NULL,
  prenom       TEXT,
  telephone    TEXT,
  solde_du     NUMERIC(12,2) NOT NULL DEFAULT 0,
  actif        BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients_debiteurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriétaire gère ses clients débiteurs"
  ON public.clients_debiteurs
  FOR ALL
  USING (
    boutique_id IN (
      SELECT id FROM public.boutiques WHERE proprietaire_id = auth.uid()
    )
  );
