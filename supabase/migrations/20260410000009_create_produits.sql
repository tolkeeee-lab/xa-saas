CREATE TABLE IF NOT EXISTS public.produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prix_unitaire NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_actuel INTEGER NOT NULL DEFAULT 0 CHECK (stock_actuel >= 0),
  stock_minimum INTEGER NOT NULL DEFAULT 0,
  unite TEXT DEFAULT 'unité',
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "produits_owner" ON public.produits USING (
  boutique_id IN (SELECT id FROM public.boutiques WHERE proprietaire_id = auth.uid())
);
CREATE POLICY "produits_public_read" ON public.produits FOR SELECT USING (actif = true);
