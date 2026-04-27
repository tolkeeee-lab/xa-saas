-- supabase/migrations/20260427_produits_demandes.sql
-- Table produits_demandes : produits que les clients demandent mais que la boutique ne vend pas encore
-- ⚠️ Execute manually in Supabase SQL Editor after merging this PR.

-- ─────────────────────────────────────────────────────────────
-- 1. Helper function tg_set_updated_at (idempotent)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Table produits_demandes
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.produits_demandes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id      UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,

  -- Nom du produit demandé (texte libre, pas de FK)
  nom_produit      TEXT NOT NULL,

  -- Compteur de demandes (incrémenté si même nom redemandé)
  nb_demandes      INTEGER NOT NULL DEFAULT 1,

  -- Champs optionnels
  categorie        TEXT,
  prix_indicatif   NUMERIC(10, 2),
  client_nom       TEXT,
  note             TEXT,

  -- Statut
  statut           TEXT NOT NULL DEFAULT 'en_attente'
                   CHECK (statut IN ('en_attente', 'resolu', 'rejete')),

  -- Timestamps
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at      TIMESTAMPTZ,
  resolved_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- 3. Indexes
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_produits_demandes_boutique
  ON public.produits_demandes(boutique_id);

CREATE INDEX IF NOT EXISTS idx_produits_demandes_statut
  ON public.produits_demandes(statut);

CREATE INDEX IF NOT EXISTS idx_produits_demandes_nom
  ON public.produits_demandes(boutique_id, lower(nom_produit));

-- ─────────────────────────────────────────────────────────────
-- 4. Row Level Security
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.produits_demandes ENABLE ROW LEVEL SECURITY;

-- Policy : un user voit/edit les demandes des boutiques qu'il possède
-- Note : boutiques uses proprietaire_id (not user_id)
DROP POLICY IF EXISTS "produits_demandes_owner_select" ON public.produits_demandes;
CREATE POLICY "produits_demandes_owner_select" ON public.produits_demandes
  FOR SELECT USING (
    boutique_id IN (SELECT id FROM public.boutiques WHERE proprietaire_id = auth.uid())
  );

DROP POLICY IF EXISTS "produits_demandes_owner_insert" ON public.produits_demandes;
CREATE POLICY "produits_demandes_owner_insert" ON public.produits_demandes
  FOR INSERT WITH CHECK (
    boutique_id IN (SELECT id FROM public.boutiques WHERE proprietaire_id = auth.uid())
  );

DROP POLICY IF EXISTS "produits_demandes_owner_update" ON public.produits_demandes;
CREATE POLICY "produits_demandes_owner_update" ON public.produits_demandes
  FOR UPDATE USING (
    boutique_id IN (SELECT id FROM public.boutiques WHERE proprietaire_id = auth.uid())
  );

DROP POLICY IF EXISTS "produits_demandes_owner_delete" ON public.produits_demandes;
CREATE POLICY "produits_demandes_owner_delete" ON public.produits_demandes
  FOR DELETE USING (
    boutique_id IN (SELECT id FROM public.boutiques WHERE proprietaire_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- 5. Trigger updated_at
-- ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_produits_demandes_updated ON public.produits_demandes;
CREATE TRIGGER trg_produits_demandes_updated
  BEFORE UPDATE ON public.produits_demandes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
