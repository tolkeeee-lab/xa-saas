-- 004_create_produits.sql
CREATE TABLE IF NOT EXISTS public.produits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id    UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  nom            TEXT NOT NULL,
  prix_achat     NUMERIC(12,2) NOT NULL DEFAULT 0,
  prix_vente     NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_actuel   INTEGER NOT NULL DEFAULT 0,
  stock_minimum  INTEGER NOT NULL DEFAULT 5,
  unite          TEXT NOT NULL DEFAULT 'unité',
  actif          BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriétaire gère ses produits"
  ON public.produits
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

-- La caisse peut lire uniquement les colonnes publiques (sans prix_achat)
-- Géré au niveau API : /api/caisse/produits ne retourne pas prix_achat
CREATE POLICY "Caisse lecture produits actifs"
  ON public.produits
  FOR SELECT
  USING (actif = true);
