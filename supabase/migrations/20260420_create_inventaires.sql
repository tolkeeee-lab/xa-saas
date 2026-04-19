-- supabase/migrations/20260420_create_inventaires.sql
-- Tables pour l'inventaire physique (comptage stock réel vs théorique)

-- ─────────────────────────────────────────────────────────────
-- 1. Table inventaires (en-tête d'un inventaire)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventaires (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id      UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  proprietaire_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by       UUID REFERENCES auth.users(id),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  validated_at     TIMESTAMPTZ,
  statut           TEXT NOT NULL DEFAULT 'en_cours'
                   CHECK (statut IN ('en_cours', 'valide', 'annule')),
  perimetre        TEXT NOT NULL DEFAULT 'complet'
                   CHECK (perimetre IN ('complet', 'categorie', 'selection')),
  categorie        TEXT,
  nb_produits      INTEGER NOT NULL DEFAULT 0,
  nb_ecarts_negatifs  INTEGER NOT NULL DEFAULT 0,
  nb_ecarts_positifs  INTEGER NOT NULL DEFAULT 0,
  valeur_ecart_total  NUMERIC(14,2) NOT NULL DEFAULT 0,
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventaires_boutique  ON inventaires(boutique_id);
CREATE INDEX IF NOT EXISTS idx_inventaires_proprio   ON inventaires(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_inventaires_statut    ON inventaires(statut);
CREATE INDEX IF NOT EXISTS idx_inventaires_started   ON inventaires(started_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 2. Table inventaire_lignes (une ligne par produit)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventaire_lignes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventaire_id         UUID NOT NULL REFERENCES inventaires(id) ON DELETE CASCADE,
  produit_id            UUID NOT NULL REFERENCES produits(id) ON DELETE RESTRICT,
  stock_theorique       NUMERIC(12,3) NOT NULL,
  stock_compte          NUMERIC(12,3),
  ecart                 NUMERIC(12,3) GENERATED ALWAYS AS
                          (COALESCE(stock_compte, 0) - stock_theorique) STORED,
  prix_vente_snapshot   NUMERIC(12,2) NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(inventaire_id, produit_id)
);

CREATE INDEX IF NOT EXISTS idx_inv_lignes_inventaire ON inventaire_lignes(inventaire_id);
CREATE INDEX IF NOT EXISTS idx_inv_lignes_produit    ON inventaire_lignes(produit_id);

-- ─────────────────────────────────────────────────────────────
-- 3. Triggers updated_at
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_inventaires_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventaires_updated_at
  BEFORE UPDATE ON inventaires
  FOR EACH ROW EXECUTE FUNCTION update_inventaires_updated_at();

CREATE OR REPLACE FUNCTION update_inventaire_lignes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventaire_lignes_updated_at
  BEFORE UPDATE ON inventaire_lignes
  FOR EACH ROW EXECUTE FUNCTION update_inventaire_lignes_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 4. RLS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE inventaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventaires_select_own"
  ON inventaires FOR SELECT
  USING (proprietaire_id = auth.uid());

CREATE POLICY "inventaires_insert_own"
  ON inventaires FOR INSERT
  WITH CHECK (proprietaire_id = auth.uid());

CREATE POLICY "inventaires_update_own"
  ON inventaires FOR UPDATE
  USING (proprietaire_id = auth.uid());

CREATE POLICY "inventaires_delete_own"
  ON inventaires FOR DELETE
  USING (proprietaire_id = auth.uid());

ALTER TABLE inventaire_lignes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventaire_lignes_select_own"
  ON inventaire_lignes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inventaires i
      WHERE i.id = inventaire_lignes.inventaire_id
        AND i.proprietaire_id = auth.uid()
    )
  );

CREATE POLICY "inventaire_lignes_insert_own"
  ON inventaire_lignes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM inventaires i
      WHERE i.id = inventaire_lignes.inventaire_id
        AND i.proprietaire_id = auth.uid()
    )
  );

CREATE POLICY "inventaire_lignes_update_own"
  ON inventaire_lignes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM inventaires i
      WHERE i.id = inventaire_lignes.inventaire_id
        AND i.proprietaire_id = auth.uid()
    )
  );

CREATE POLICY "inventaire_lignes_delete_own"
  ON inventaire_lignes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM inventaires i
      WHERE i.id = inventaire_lignes.inventaire_id
        AND i.proprietaire_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 5. RPC validate_inventaire — atomique
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.validate_inventaire(inv_id uuid)
RETURNS SETOF inventaires
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inv          inventaires;
  v_proprietaire uuid;
  v_nb_neg       integer := 0;
  v_nb_pos       integer := 0;
  v_valeur_ecart numeric(14,2) := 0;
  v_nb_produits  integer := 0;
  v_description  text;
BEGIN
  -- 1. Vérifier existence + ownership
  SELECT * INTO v_inv FROM inventaires WHERE id = inv_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventaire introuvable';
  END IF;

  v_proprietaire := v_inv.proprietaire_id;

  IF v_proprietaire IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  IF v_inv.statut <> 'en_cours' THEN
    RAISE EXCEPTION 'L''inventaire n''est pas en cours (statut: %)', v_inv.statut;
  END IF;

  -- 2. Vérifier qu'aucune ligne n'a stock_compte = null
  IF EXISTS (
    SELECT 1 FROM inventaire_lignes
    WHERE inventaire_id = inv_id AND stock_compte IS NULL
  ) THEN
    RAISE EXCEPTION 'Toutes les lignes doivent être comptées avant validation';
  END IF;

  -- 3. Mettre à jour produits.stock_actuel
  UPDATE produits p
  SET stock_actuel = l.stock_compte,
      updated_at   = now()
  FROM inventaire_lignes l
  WHERE l.inventaire_id = inv_id
    AND l.produit_id = p.id
    AND l.stock_compte IS NOT NULL;

  -- 4. Calculer agrégats
  SELECT
    COUNT(*)                                                             AS nb,
    COUNT(*) FILTER (WHERE ecart < 0)                                   AS neg,
    COUNT(*) FILTER (WHERE ecart > 0)                                   AS pos,
    COALESCE(SUM(ecart * prix_vente_snapshot), 0)                       AS valeur
  INTO v_nb_produits, v_nb_neg, v_nb_pos, v_valeur_ecart
  FROM inventaire_lignes
  WHERE inventaire_id = inv_id;

  -- 5. Description pour l'event
  v_description := 'Inventaire validé — '
    || v_nb_produits || ' produits · '
    || (v_nb_neg + v_nb_pos) || ' écarts · '
    || CASE WHEN v_valeur_ecart >= 0
            THEN '+' || ROUND(v_valeur_ecart)::text
            ELSE ROUND(v_valeur_ecart)::text
       END || ' F';

  -- 6. Mettre à jour l'inventaire
  UPDATE inventaires
  SET statut              = 'valide',
      validated_at        = now(),
      nb_ecarts_negatifs  = v_nb_neg,
      nb_ecarts_positifs  = v_nb_pos,
      valeur_ecart_total  = v_valeur_ecart,
      updated_at          = now()
  WHERE id = inv_id;

  -- 7. Logger l'event
  INSERT INTO activity_events (
    proprietaire_id, boutique_id, type, severity, title, description, metadata
  ) VALUES (
    v_proprietaire,
    v_inv.boutique_id,
    'stock',
    'success',
    'Inventaire validé',
    v_description,
    jsonb_build_object('inventaire_id', inv_id, 'nb_produits', v_nb_produits)
  );

  RETURN QUERY SELECT * FROM inventaires WHERE id = inv_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 6. Trigger : logger un event au démarrage d'un inventaire
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_inventaire_started()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO activity_events (
    proprietaire_id, boutique_id, type, severity, title, description, metadata
  ) VALUES (
    NEW.proprietaire_id,
    NEW.boutique_id,
    'stock',
    'info',
    'Inventaire démarré',
    'Inventaire démarré — ' || NEW.nb_produits || ' produits',
    jsonb_build_object('inventaire_id', NEW.id, 'perimetre', NEW.perimetre)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inventaire_started_log ON inventaires;
CREATE TRIGGER inventaire_started_log
  AFTER INSERT ON inventaires
  FOR EACH ROW EXECUTE FUNCTION public.log_inventaire_started();
