-- supabase/migrations/20260428_run_pending_migrations.sql
-- Script consolidé idempotent — à exécuter manuellement dans l'éditeur SQL Supabase.
-- Regroupe toutes les migrations en attente (non encore exécutées en production).
--
-- ⚠️  Exécuter ce fichier ENTIÈREMENT dans l'éditeur SQL Supabase (pas en migration auto).
-- Toutes les opérations sont idempotentes (IF NOT EXISTS / CREATE OR REPLACE).

-- ═════════════════════════════════════════════════════════════════════════════
-- Migration 1 : produits_conditionnement (20260427)
-- Ajoute les colonnes de conditionnement / lot sur la table produits
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.produits
  ADD COLUMN IF NOT EXISTS mode_achat   TEXT NOT NULL DEFAULT 'unite'
    CHECK (mode_achat IN ('unite', 'lot')),
  ADD COLUMN IF NOT EXISTS qty_par_lot  INTEGER,
  ADD COLUMN IF NOT EXISTS prix_lot_achat NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS lot_label    TEXT,
  ADD COLUMN IF NOT EXISTS unite_label  TEXT;

COMMENT ON COLUMN public.produits.mode_achat    IS 'unite | lot — comment le commerçant achète ce produit';
COMMENT ON COLUMN public.produits.qty_par_lot   IS 'Nb d''unités dans 1 lot/carton (si mode_achat=lot)';
COMMENT ON COLUMN public.produits.prix_lot_achat IS 'Prix d''achat d''un lot complet (si mode_achat=lot)';
COMMENT ON COLUMN public.produits.lot_label     IS 'Nom du conditionnement: carton, sachet, bidon, palette...';
COMMENT ON COLUMN public.produits.unite_label   IS 'Nom de l''unité: bouteille, kg, paquet, pièce...';

-- ═════════════════════════════════════════════════════════════════════════════
-- Migration 2 : produits_demandes (20260427)
-- Table pour les produits que les clients demandent mais que la boutique ne vend pas
-- ═════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.produits_demandes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id      UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  nom_produit      TEXT NOT NULL,
  nb_demandes      INTEGER NOT NULL DEFAULT 1,
  categorie        TEXT,
  prix_indicatif   NUMERIC(12, 2),
  client_nom       TEXT,
  note             TEXT,
  statut           TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente', 'commande', 'disponible', 'ignore')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour recherche par boutique + nom
CREATE INDEX IF NOT EXISTS idx_produits_demandes_boutique
  ON public.produits_demandes (boutique_id, nom_produit);

-- Trigger updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at_produits_demandes'
      AND tgrelid = 'public.produits_demandes'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at_produits_demandes
      BEFORE UPDATE ON public.produits_demandes
      FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END
$$;

-- RLS
ALTER TABLE public.produits_demandes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proprio_produits_demandes" ON public.produits_demandes;
CREATE POLICY "proprio_produits_demandes"
  ON public.produits_demandes
  FOR ALL
  USING (
    boutique_id IN (
      SELECT id FROM public.boutiques WHERE proprietaire_id = auth.uid()
    )
  );
