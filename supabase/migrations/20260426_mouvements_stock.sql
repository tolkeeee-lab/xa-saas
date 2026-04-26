-- supabase/migrations/20260426_mouvements_stock.sql
-- Table des mouvements de stock + trigger auto-update produits.stock_actuel
-- ⚠️ Execute manually in Supabase SQL Editor after merging this PR.

-- ─────────────────────────────────────────────────────────────
-- 1. ENUMs
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE mouvement_stock_type AS ENUM (
    'reception', 'sortie', 'transfert_out', 'transfert_in', 'ajustement', 'inventaire'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE mouvement_stock_motif AS ENUM (
    'livraison_fournisseur', 'livraison_mafro', 'vendu_caisse', 'vendu_hors_caisse',
    'casse', 'perte', 'vol', 'peremption', 'transfert', 'inventaire', 'autre'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. Table mouvements_stock
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mouvements_stock (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produit_id       UUID NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
  boutique_id      UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  type             mouvement_stock_type NOT NULL,
  motif            mouvement_stock_motif,
  quantite         NUMERIC NOT NULL CHECK (quantite > 0),
  stock_avant      NUMERIC NOT NULL,
  stock_apres      NUMERIC NOT NULL,
  note             TEXT,
  reference_id     UUID,
  reference_type   TEXT,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mouvements_stock_boutique_at
  ON mouvements_stock(boutique_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mouvements_stock_produit_at
  ON mouvements_stock(produit_id, created_at DESC);

ALTER TABLE mouvements_stock ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 3. RLS policies
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "mouvements_stock_select" ON mouvements_stock;
CREATE POLICY "mouvements_stock_select" ON mouvements_stock
  FOR SELECT USING (
    is_mafro_admin() OR is_owner_of_boutique(boutique_id) OR is_assigned_to_boutique(boutique_id)
  );

DROP POLICY IF EXISTS "mouvements_stock_insert" ON mouvements_stock;
CREATE POLICY "mouvements_stock_insert" ON mouvements_stock
  FOR INSERT WITH CHECK (
    is_mafro_admin() OR is_owner_of_boutique(boutique_id) OR is_assigned_to_boutique(boutique_id)
  );

DROP POLICY IF EXISTS "mouvements_stock_update" ON mouvements_stock;
CREATE POLICY "mouvements_stock_update" ON mouvements_stock
  FOR UPDATE USING (is_mafro_admin() OR is_owner_of_boutique(boutique_id));

DROP POLICY IF EXISTS "mouvements_stock_delete" ON mouvements_stock;
CREATE POLICY "mouvements_stock_delete" ON mouvements_stock
  FOR DELETE USING (is_mafro_admin() OR is_owner_of_boutique(boutique_id));

-- ─────────────────────────────────────────────────────────────
-- 4. Trigger : auto-update produits.stock_actuel
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_produit_stock_after_mouvement()
RETURNS TRIGGER AS $$
DECLARE v_delta NUMERIC;
BEGIN
  v_delta := CASE NEW.type
    WHEN 'reception'     THEN  NEW.quantite
    WHEN 'sortie'        THEN -NEW.quantite
    WHEN 'transfert_out' THEN -NEW.quantite
    WHEN 'transfert_in'  THEN  NEW.quantite
    ELSE 0
  END;

  IF NEW.type IN ('ajustement', 'inventaire') THEN
    UPDATE produits
      SET stock_actuel = NEW.stock_apres,
          updated_at   = now()
    WHERE id = NEW.produit_id;
  ELSE
    UPDATE produits
      SET stock_actuel = stock_actuel + v_delta,
          updated_at   = now()
    WHERE id = NEW.produit_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_produit_stock_after_mouvement ON mouvements_stock;
CREATE TRIGGER trg_sync_produit_stock_after_mouvement
  AFTER INSERT ON mouvements_stock
  FOR EACH ROW EXECUTE FUNCTION sync_produit_stock_after_mouvement();

-- ─────────────────────────────────────────────────────────────
-- 5. Rétro-compat : trigger sur transactions (caisse)
--    Crée un mouvement sortie/vendu_caisse à chaque transaction validée
--    uniquement si aucun trigger similaire n'existe déjà.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_mouvements_from_transaction()
RETURNS TRIGGER AS $$
DECLARE
  ligne RECORD;
  v_stock_avant NUMERIC;
BEGIN
  -- Only process on INSERT (new validated transaction)
  IF NEW.statut = 'validee' THEN
    FOR ligne IN
      SELECT tl.produit_id, tl.quantite, tl.nom_produit
      FROM transaction_lignes tl
      WHERE tl.transaction_id = NEW.id
        AND tl.produit_id IS NOT NULL
    LOOP
      SELECT stock_actuel INTO v_stock_avant
      FROM produits
      WHERE id = ligne.produit_id
      FOR UPDATE;

      IF FOUND THEN
        INSERT INTO mouvements_stock (
          produit_id, boutique_id, type, motif,
          quantite, stock_avant, stock_apres,
          reference_id, reference_type, created_by
        ) VALUES (
          ligne.produit_id, NEW.boutique_id,
          'sortie', 'vendu_caisse',
          ligne.quantite,
          v_stock_avant,
          v_stock_avant - ligne.quantite,
          NEW.id, 'vente',
          NEW.employe_id
        );
        -- Note: mouvements_stock trigger will update produits.stock_actuel
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create this trigger if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_mouvements_from_transaction'
      AND tgrelid = 'transactions'::regclass
  ) THEN
    CREATE TRIGGER trg_mouvements_from_transaction
      AFTER INSERT ON transactions
      FOR EACH ROW EXECUTE FUNCTION create_mouvements_from_transaction();
  END IF;
END $$;
