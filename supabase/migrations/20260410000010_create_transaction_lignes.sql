CREATE TABLE IF NOT EXISTS public.transaction_lignes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES public.produits(id) ON DELETE SET NULL,
  nom_produit TEXT NOT NULL,
  quantite INTEGER NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC(12,2) NOT NULL,
  sous_total NUMERIC(12,2) GENERATED ALWAYS AS (quantite * prix_unitaire) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.transaction_lignes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lignes_owner" ON public.transaction_lignes USING (
  transaction_id IN (
    SELECT id FROM public.transactions WHERE boutique_id IN (
      SELECT id FROM public.boutiques WHERE proprietaire_id = auth.uid()
    )
  )
);
