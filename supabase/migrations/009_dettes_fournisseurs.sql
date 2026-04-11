-- 009_dettes_fournisseurs.sql
CREATE TABLE IF NOT EXISTS public.dettes_fournisseurs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id     UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  fournisseur_nom TEXT NOT NULL,
  montant         NUMERIC(12,2) NOT NULL DEFAULT 0,
  montant_paye    NUMERIC(12,2) NOT NULL DEFAULT 0,
  solde           NUMERIC(12,2) GENERATED ALWAYS AS (montant - montant_paye) STORED,
  description     TEXT,
  echeance        DATE,
  acquittee       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dettes_fournisseurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriétaire gère ses dettes fournisseurs"
  ON public.dettes_fournisseurs
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

CREATE TRIGGER set_dettes_fournisseurs_updated_at
  BEFORE UPDATE ON public.dettes_fournisseurs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
