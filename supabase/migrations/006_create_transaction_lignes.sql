-- 006_create_transaction_lignes.sql
CREATE TABLE IF NOT EXISTS public.transaction_lignes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  produit_id      UUID REFERENCES public.produits(id) ON DELETE SET NULL,
  nom_produit     TEXT NOT NULL,
  quantite        INTEGER NOT NULL DEFAULT 1,
  prix_unitaire   NUMERIC(12,2) NOT NULL DEFAULT 0,
  sous_total      NUMERIC(12,2) GENERATED ALWAYS AS (quantite * prix_unitaire) STORED,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transaction_lignes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriétaire lit ses lignes"
  ON public.transaction_lignes
  FOR SELECT
  USING (
    transaction_id IN (
      SELECT t.id FROM public.transactions t
      JOIN public.boutiques b ON t.boutique_id = b.id
      WHERE b.proprietaire_id = auth.uid()
    )
  );

CREATE POLICY "Service role insère des lignes"
  ON public.transaction_lignes
  FOR INSERT
  WITH CHECK (true);
