-- supabase/migrations/20260425_mafro_v4_audit_pertes_rls.sql
-- Migration 3/3 — MAFRO v4 : audit, pertes, clôture caisse, transferts stock, vues, RLS complet
-- PR: feat(db): MAFRO v4 schema — roles, B2B, retraits, audit, RLS
-- Dépendances : migrations 1 et 2 MAFRO v4 doivent être exécutées avant.
-- ⚠️  DO NOT run automatically. Execute manually in the Supabase SQL Editor after merging.

-- ─────────────────────────────────────────────────────────────
-- 1. Table pertes_declarations
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pertes_declarations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id                 UUID NOT NULL REFERENCES boutiques(id) ON DELETE RESTRICT,
  produit_id                  UUID REFERENCES produits(id) ON DELETE SET NULL,
  produit_nom                 TEXT NOT NULL,
  motif                       TEXT NOT NULL
                              CHECK (motif IN ('sac_perce','perime','vol','erreur_saisie','autre')),
  quantite                    INTEGER NOT NULL CHECK (quantite > 0),
  valeur_estimee              INTEGER NOT NULL,             -- FCFA
  note                        TEXT,
  declared_by_employe_id      UUID REFERENCES employes(id) ON DELETE SET NULL,
  declared_by_proprietaire_id UUID,
  photo_url                   TEXT,
  statut                      TEXT DEFAULT 'declaree'
                              CHECK (statut IN ('declaree','validee','contestee','comptabilisee')),
  valide_by                   UUID,
  valide_at                   TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE pertes_declarations IS 'Déclarations de pertes de stock (casse, vol, périmé, erreur saisie).';
COMMENT ON COLUMN pertes_declarations.motif          IS 'sac_perce | perime | vol | erreur_saisie | autre';
COMMENT ON COLUMN pertes_declarations.valeur_estimee IS 'Valeur FCFA estimée de la perte';
COMMENT ON COLUMN pertes_declarations.statut         IS 'declaree | validee | contestee | comptabilisee';

CREATE INDEX IF NOT EXISTS idx_pertes_boutique ON pertes_declarations(boutique_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pertes_produit  ON pertes_declarations(produit_id);
CREATE INDEX IF NOT EXISTS idx_pertes_statut   ON pertes_declarations(statut);

-- ─────────────────────────────────────────────────────────────
-- 2. Table cloture_caisse_jour
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cloture_caisse_jour (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id             UUID NOT NULL REFERENCES boutiques(id) ON DELETE RESTRICT,
  date_cloture            DATE NOT NULL,
  ouverture_at            TIMESTAMPTZ,
  fermeture_at            TIMESTAMPTZ,
  nb_transactions         INTEGER DEFAULT 0,
  ca_calcule              INTEGER NOT NULL,                -- somme des ventes du jour
  credits_accordes        INTEGER DEFAULT 0,
  retraits_valides        INTEGER DEFAULT 0,
  cash_compte             INTEGER NOT NULL,                -- saisi manuellement
  ecart                   INTEGER NOT NULL,                -- cash_compte - ca_calcule
  statut                  TEXT DEFAULT 'a_valider'
                          CHECK (statut IN ('a_valider','equilibree','manque','excedent')),
  ferme_par_employe_id    UUID REFERENCES employes(id) ON DELETE SET NULL,
  valide_par              UUID,
  valide_at               TIMESTAMPTZ,
  note                    TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE(boutique_id, date_cloture)
);

COMMENT ON TABLE cloture_caisse_jour IS 'Clôture de caisse journalière par boutique. Unique par (boutique, date).';
COMMENT ON COLUMN cloture_caisse_jour.ca_calcule    IS 'CA calculé automatiquement depuis transactions du jour';
COMMENT ON COLUMN cloture_caisse_jour.cash_compte   IS 'Cash compté physiquement par le gérant';
COMMENT ON COLUMN cloture_caisse_jour.ecart         IS 'cash_compte - ca_calcule (négatif = manque)';

CREATE INDEX IF NOT EXISTS idx_cloture_boutique ON cloture_caisse_jour(boutique_id, date_cloture DESC);
CREATE INDEX IF NOT EXISTS idx_cloture_statut   ON cloture_caisse_jour(statut);

-- ─────────────────────────────────────────────────────────────
-- 3. Table transferts_stock
--    Transferts de produits entre boutiques d'un même proprietaire
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transferts_stock (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_source_id          UUID NOT NULL REFERENCES boutiques(id) ON DELETE RESTRICT,
  boutique_destination_id     UUID NOT NULL REFERENCES boutiques(id) ON DELETE RESTRICT,
  produit_id                  UUID NOT NULL REFERENCES produits(id) ON DELETE RESTRICT,
  quantite                    INTEGER NOT NULL CHECK (quantite > 0),
  statut                      TEXT DEFAULT 'en_attente'
                              CHECK (statut IN ('en_attente','recu','annule')),
  transfere_par_employe_id    UUID REFERENCES employes(id) ON DELETE SET NULL,
  recu_par_employe_id         UUID REFERENCES employes(id) ON DELETE SET NULL,
  created_at                  TIMESTAMPTZ DEFAULT now(),
  received_at                 TIMESTAMPTZ
);

COMMENT ON TABLE transferts_stock IS 'Transferts de stock entre boutiques d''un même propriétaire.';

CREATE INDEX IF NOT EXISTS idx_transferts_source      ON transferts_stock(boutique_source_id);
CREATE INDEX IF NOT EXISTS idx_transferts_destination ON transferts_stock(boutique_destination_id);
CREATE INDEX IF NOT EXISTS idx_transferts_produit     ON transferts_stock(produit_id);
CREATE INDEX IF NOT EXISTS idx_transferts_statut      ON transferts_stock(statut);

-- ─────────────────────────────────────────────────────────────
-- 4. RPCs
-- ─────────────────────────────────────────────────────────────

-- 4a. declare_perte — déclare une perte + décrémente le stock
CREATE OR REPLACE FUNCTION public.declare_perte(
  p_boutique_id UUID,
  p_produit_id  UUID,
  p_motif       TEXT,
  p_quantite    INTEGER,
  p_note        TEXT DEFAULT NULL
)
RETURNS pertes_declarations
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_produit   produits;
  v_perte     pertes_declarations;
  v_acteur_id UUID;
  v_is_proprio BOOLEAN;
BEGIN
  -- Vérifier droits d'accès : propriétaire ou employé de la boutique
  v_is_proprio := EXISTS(
    SELECT 1 FROM boutiques WHERE id = p_boutique_id AND proprietaire_id = auth.uid()
  );
  IF NOT v_is_proprio AND NOT is_assigned_to_boutique(p_boutique_id) AND NOT is_mafro_admin() THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  -- Récupérer le produit
  SELECT * INTO v_produit FROM produits WHERE id = p_produit_id AND boutique_id = p_boutique_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit introuvable dans cette boutique';
  END IF;

  -- Vérifier stock suffisant
  IF v_produit.stock_actuel < p_quantite THEN
    RAISE EXCEPTION 'Stock insuffisant (stock actuel: %, demandé: %)', v_produit.stock_actuel, p_quantite;
  END IF;

  -- Créer la déclaration de perte
  INSERT INTO pertes_declarations (
    boutique_id, produit_id, produit_nom, motif,
    quantite, valeur_estimee, note,
    declared_by_proprietaire_id
  ) VALUES (
    p_boutique_id, p_produit_id, v_produit.nom, p_motif,
    p_quantite, v_produit.prix_vente * p_quantite, p_note,
    CASE WHEN v_is_proprio THEN auth.uid() ELSE NULL END
  )
  RETURNING * INTO v_perte;

  -- Décrémenter le stock
  UPDATE produits
  SET stock_actuel = stock_actuel - p_quantite,
      updated_at   = now()
  WHERE id = p_produit_id;

  -- Logger dans activity_events
  INSERT INTO activity_events (
    proprietaire_id, boutique_id, type, severity, title, description, metadata
  )
  SELECT
    b.proprietaire_id,
    p_boutique_id,
    'stock',
    'warning',
    'Perte déclarée',
    p_quantite::TEXT || ' x ' || v_produit.nom || ' (' || p_motif || ')',
    jsonb_build_object(
      'perte_id',    v_perte.id,
      'produit_id',  p_produit_id,
      'quantite',    p_quantite,
      'motif',       p_motif,
      'valeur_fcfa', v_perte.valeur_estimee
    )
  FROM boutiques b WHERE b.id = p_boutique_id;

  RETURN v_perte;
END;
$$;

COMMENT ON FUNCTION public.declare_perte(UUID, UUID, TEXT, INTEGER, TEXT) IS
  'Déclare une perte de stock : crée pertes_declarations, décrémente stock, log activity_event.';

-- 4b. cloturer_caisse — calcule et enregistre la clôture journalière
CREATE OR REPLACE FUNCTION public.cloturer_caisse(
  p_boutique_id UUID,
  p_date        DATE,
  p_cash_compte INTEGER,
  p_note        TEXT DEFAULT NULL
)
RETURNS cloture_caisse_jour
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_boutique       boutiques;
  v_ca_calcule     INTEGER := 0;
  v_nb_tx          INTEGER := 0;
  v_credits        INTEGER := 0;
  v_retraits       INTEGER := 0;
  v_ecart          INTEGER;
  v_statut         TEXT;
  v_cloture        cloture_caisse_jour;
  v_employe_id     UUID;
BEGIN
  -- Vérifier droits
  SELECT * INTO v_boutique FROM boutiques WHERE id = p_boutique_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Boutique introuvable'; END IF;

  IF v_boutique.proprietaire_id IS DISTINCT FROM auth.uid()
    AND NOT is_assigned_to_boutique(p_boutique_id)
    AND NOT is_mafro_admin()
  THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  -- Chercher employé (pour ferme_par_employe_id)
  SELECT id INTO v_employe_id
  FROM employes
  WHERE boutique_id = p_boutique_id AND proprietaire_id = auth.uid() AND actif = true
  LIMIT 1;

  -- Calculer CA du jour depuis les transactions
  SELECT
    COALESCE(SUM(CASE WHEN mode_paiement <> 'credit' THEN montant_total ELSE 0 END), 0),
    COUNT(*),
    COALESCE(SUM(CASE WHEN mode_paiement = 'credit'  THEN montant_total ELSE 0 END), 0)
  INTO v_ca_calcule, v_nb_tx, v_credits
  FROM transactions
  WHERE boutique_id = p_boutique_id
    AND statut = 'validee'
    AND date_trunc('day', created_at AT TIME ZONE 'Africa/Porto-Novo')::DATE = p_date;

  -- Retraits validés du jour
  SELECT COALESCE(SUM(total), 0)
  INTO v_retraits
  FROM retraits_clients
  WHERE boutique_id = p_boutique_id
    AND statut = 'retire'
    AND date_trunc('day', retired_at AT TIME ZONE 'Africa/Porto-Novo')::DATE = p_date;

  v_ecart  := p_cash_compte - v_ca_calcule;
  v_statut := CASE
    WHEN v_ecart = 0 THEN 'equilibree'
    WHEN v_ecart < 0 THEN 'manque'
    ELSE                   'excedent'
  END;

  -- Upsert (idempotent par boutique + date)
  INSERT INTO cloture_caisse_jour (
    boutique_id, date_cloture,
    nb_transactions, ca_calcule, credits_accordes, retraits_valides,
    cash_compte, ecart, statut,
    ferme_par_employe_id, note
  ) VALUES (
    p_boutique_id, p_date,
    v_nb_tx, v_ca_calcule, v_credits, v_retraits,
    p_cash_compte, v_ecart, v_statut,
    v_employe_id, p_note
  )
  ON CONFLICT (boutique_id, date_cloture) DO UPDATE
  SET nb_transactions      = EXCLUDED.nb_transactions,
      ca_calcule           = EXCLUDED.ca_calcule,
      credits_accordes     = EXCLUDED.credits_accordes,
      retraits_valides     = EXCLUDED.retraits_valides,
      cash_compte          = EXCLUDED.cash_compte,
      ecart                = EXCLUDED.ecart,
      statut               = EXCLUDED.statut,
      ferme_par_employe_id = EXCLUDED.ferme_par_employe_id,
      note                 = COALESCE(EXCLUDED.note, cloture_caisse_jour.note),
      fermeture_at         = now()
  RETURNING * INTO v_cloture;

  RETURN v_cloture;
END;
$$;

COMMENT ON FUNCTION public.cloturer_caisse(UUID, DATE, INTEGER, TEXT) IS
  'Calcule et enregistre la clôture de caisse journalière. Idempotent par (boutique, date).';

-- 4c. transferer_stock — initie un transfert entre boutiques
CREATE OR REPLACE FUNCTION public.transferer_stock(
  p_source      UUID,
  p_dest        UUID,
  p_produit     UUID,
  p_qty         INTEGER
)
RETURNS transferts_stock
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_produit    produits;
  v_src_proprio UUID;
  v_dst_proprio UUID;
  v_transfert  transferts_stock;
  v_employe_id UUID;
BEGIN
  -- Vérifier que les deux boutiques appartiennent au même proprio
  SELECT proprietaire_id INTO v_src_proprio FROM boutiques WHERE id = p_source;
  SELECT proprietaire_id INTO v_dst_proprio FROM boutiques WHERE id = p_dest;

  IF v_src_proprio IS NULL OR v_dst_proprio IS NULL THEN
    RAISE EXCEPTION 'Boutique source ou destination introuvable';
  END IF;
  IF v_src_proprio <> v_dst_proprio THEN
    RAISE EXCEPTION 'Les deux boutiques doivent appartenir au même propriétaire';
  END IF;
  IF v_src_proprio IS DISTINCT FROM auth.uid() AND NOT is_mafro_admin() THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  -- Vérifier stock disponible
  SELECT * INTO v_produit FROM produits WHERE id = p_produit AND boutique_id = p_source;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produit introuvable dans la boutique source'; END IF;
  IF v_produit.stock_actuel < p_qty THEN
    RAISE EXCEPTION 'Stock insuffisant dans la source (stock: %, demandé: %)', v_produit.stock_actuel, p_qty;
  END IF;

  -- Employé courant si applicable
  SELECT id INTO v_employe_id
  FROM employes
  WHERE boutique_id = p_source AND proprietaire_id = auth.uid() AND actif = true
  LIMIT 1;

  -- Décrémenter stock source
  UPDATE produits SET stock_actuel = stock_actuel - p_qty, updated_at = now()
  WHERE id = p_produit AND boutique_id = p_source;

  -- Créer le transfert
  INSERT INTO transferts_stock (
    boutique_source_id, boutique_destination_id, produit_id,
    quantite, transfere_par_employe_id
  ) VALUES (
    p_source, p_dest, p_produit, p_qty, v_employe_id
  )
  RETURNING * INTO v_transfert;

  RETURN v_transfert;
END;
$$;

COMMENT ON FUNCTION public.transferer_stock(UUID, UUID, UUID, INTEGER) IS
  'Initie un transfert de stock entre deux boutiques du même propriétaire. Décrémente immédiatement la source.';

-- 4d. recevoir_transfert — réceptionne un transfert (incrémente stock destination)
CREATE OR REPLACE FUNCTION public.recevoir_transfert(
  p_transfert_id UUID,
  p_employe_id   UUID
)
RETURNS transferts_stock
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_t              transferts_stock;
  v_dst_prop       UUID;
  v_dst_produit_id UUID;
  v_src_produit    produits;
BEGIN
  SELECT * INTO v_t FROM transferts_stock WHERE id = p_transfert_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transfert introuvable'; END IF;
  IF v_t.statut <> 'en_attente' THEN
    RAISE EXCEPTION 'Transfert déjà traité (statut: %)', v_t.statut;
  END IF;

  -- Vérifier droits sur la boutique destination
  SELECT proprietaire_id INTO v_dst_prop FROM boutiques WHERE id = v_t.boutique_destination_id;
  IF v_dst_prop IS DISTINCT FROM auth.uid()
     AND NOT is_assigned_to_boutique(v_t.boutique_destination_id)
     AND NOT is_mafro_admin()
  THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  -- Récupérer le produit source
  SELECT * INTO v_src_produit FROM produits WHERE id = v_t.produit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit source introuvable (id: %)', v_t.produit_id;
  END IF;

  -- Chercher un produit du même nom ET unité dans la boutique destination.
  -- Note: le schéma actuel des produits n'a pas de clé cross-boutiques.
  -- On matche sur (nom, unite) qui est suffisant dans le contexte mono-proprio.
  -- Une future migration pourra ajouter une colonne sku_externe pour un matching plus robuste.
  SELECT id INTO v_dst_produit_id
  FROM produits
  WHERE boutique_id = v_t.boutique_destination_id
    AND nom   = v_src_produit.nom
    AND unite = v_src_produit.unite
  LIMIT 1;

  IF v_dst_produit_id IS NULL THEN
    -- Créer le produit dans la boutique destination avec le stock transféré comme stock initial
    INSERT INTO produits (
      boutique_id, nom, categorie, prix_achat, prix_vente,
      stock_actuel, seuil_alerte, unite, actif
    ) VALUES (
      v_t.boutique_destination_id,
      v_src_produit.nom, v_src_produit.categorie,
      v_src_produit.prix_achat, v_src_produit.prix_vente,
      v_t.quantite, v_src_produit.seuil_alerte, v_src_produit.unite, v_src_produit.actif
    )
    RETURNING id INTO v_dst_produit_id;
  ELSE
    -- Incrémenter le stock du produit existant (par id — robuste)
    UPDATE produits
    SET stock_actuel = stock_actuel + v_t.quantite, updated_at = now()
    WHERE id = v_dst_produit_id;
  END IF;

  -- Marquer le transfert comme reçu
  UPDATE transferts_stock
  SET statut              = 'recu',
      received_at         = now(),
      recu_par_employe_id = p_employe_id
  WHERE id = p_transfert_id
  RETURNING * INTO v_t;

  RETURN v_t;
END;
$$;

COMMENT ON FUNCTION public.recevoir_transfert(UUID, UUID) IS
  'Réceptionne un transfert de stock : incrémente le stock destination, met à jour le statut.';

-- ─────────────────────────────────────────────────────────────
-- 5. Vues matérialisées
-- ─────────────────────────────────────────────────────────────

-- 5a. mv_kpi_reseau — KPIs globaux réseau (admin uniquement)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_kpi_reseau AS
SELECT
  date_trunc('day', t.created_at)::DATE          AS jour,
  COUNT(DISTINCT t.boutique_id)                  AS nb_boutiques_actives,
  COUNT(t.id)                                    AS nb_transactions,
  COALESCE(SUM(t.montant_total), 0)              AS ca_total,
  COALESCE(SUM(t.benefice_total), 0)             AS benefice_total,
  COALESCE(SUM(CASE WHEN p.stock_actuel < 10
    THEN 1 ELSE 0 END), 0)                        AS nb_alertes_stock,
  now()                                          AS refreshed_at
FROM transactions t
LEFT JOIN produits p ON p.boutique_id = t.boutique_id AND p.actif = true
WHERE t.statut = 'validee'
GROUP BY 1;

COMMENT ON MATERIALIZED VIEW mv_kpi_reseau IS 'KPIs réseau MAFRO agrégés par jour (admin). Rafraîchir via refresh_mafro_views().';

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_kpi_reseau_jour ON mv_kpi_reseau(jour);

-- 5b. mv_top_vendeurs_semaine — top 10 employés par nb_ventes (7 jours glissants)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_vendeurs_semaine AS
SELECT
  e.id                  AS employe_id,
  e.nom                 AS employe_nom,
  e.prenom              AS employe_prenom,
  e.boutique_id,
  b.nom                 AS boutique_nom,
  COUNT(t.id)           AS nb_ventes,
  COALESCE(SUM(t.montant_total), 0) AS ca_semaine,
  now()                 AS refreshed_at
FROM employes e
JOIN boutiques b   ON b.id = e.boutique_id
LEFT JOIN transactions t ON t.employe_id = e.id
  AND t.statut = 'validee'
  AND t.created_at >= now() - INTERVAL '7 days'
GROUP BY e.id, e.nom, e.prenom, e.boutique_id, b.nom
ORDER BY nb_ventes DESC
LIMIT 10;

COMMENT ON MATERIALIZED VIEW mv_top_vendeurs_semaine IS 'Top 10 employés par nb ventes sur 7 jours glissants. Rafraîchir via refresh_mafro_views().';

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_top_vendeurs_employe ON mv_top_vendeurs_semaine(employe_id);

-- 5c. mv_heatmap_zones — ventes agrégées par zone géographique
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_heatmap_zones AS
SELECT
  COALESCE(b.zone, b.ville, 'Non défini')  AS zone,
  b.latitude,
  b.longitude,
  COUNT(DISTINCT b.id)                      AS nb_boutiques,
  COUNT(t.id)                               AS nb_transactions,
  COALESCE(SUM(t.montant_total), 0)         AS ca_zone,
  now()                                     AS refreshed_at
FROM boutiques b
LEFT JOIN transactions t ON t.boutique_id = b.id AND t.statut = 'validee'
GROUP BY 1, 2, 3;

COMMENT ON MATERIALIZED VIEW mv_heatmap_zones IS 'Heatmap géographique des ventes par zone. Utilise boutiques.zone et boutiques.latitude/longitude.';

-- 5d. refresh_mafro_views — fonction de rafraîchissement (cron Supabase)
CREATE OR REPLACE FUNCTION public.refresh_mafro_views()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kpi_reseau;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_vendeurs_semaine;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_heatmap_zones;
END;
$$;

COMMENT ON FUNCTION public.refresh_mafro_views() IS 'Rafraîchit toutes les vues matérialisées MAFRO v4. À appeler via pg_cron ou edge function cron.';

-- ─────────────────────────────────────────────────────────────
-- 6. RLS — nouvelles tables
-- ─────────────────────────────────────────────────────────────

-- pertes_declarations
ALTER TABLE pertes_declarations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pertes_select" ON pertes_declarations;
CREATE POLICY "pertes_select"
  ON pertes_declarations FOR SELECT
  USING (
    is_mafro_admin()
    OR is_owner_of_boutique(boutique_id)
    OR is_assigned_to_boutique(boutique_id)
  );

-- owner + manager : INSERT + UPDATE sur leurs boutiques
DROP POLICY IF EXISTS "pertes_insert" ON pertes_declarations;
CREATE POLICY "pertes_insert"
  ON pertes_declarations FOR INSERT
  WITH CHECK (
    is_mafro_admin()
    OR is_owner_of_boutique(boutique_id)
    OR is_assigned_to_boutique(boutique_id)
  );

DROP POLICY IF EXISTS "pertes_update" ON pertes_declarations;
CREATE POLICY "pertes_update"
  ON pertes_declarations FOR UPDATE
  USING (
    is_mafro_admin()
    OR is_owner_of_boutique(boutique_id)
    OR EXISTS (
      SELECT 1 FROM employes e
      WHERE e.boutique_id = pertes_declarations.boutique_id
        AND e.proprietaire_id = auth.uid()
        AND e.actif = true
        AND e.mafro_role IN ('manager')
    )
  );

-- cloture_caisse_jour
ALTER TABLE cloture_caisse_jour ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cloture_select" ON cloture_caisse_jour;
CREATE POLICY "cloture_select"
  ON cloture_caisse_jour FOR SELECT
  USING (
    is_mafro_admin()
    OR is_owner_of_boutique(boutique_id)
    OR is_assigned_to_boutique(boutique_id)
  );

DROP POLICY IF EXISTS "cloture_insert" ON cloture_caisse_jour;
CREATE POLICY "cloture_insert"
  ON cloture_caisse_jour FOR INSERT
  WITH CHECK (
    is_mafro_admin()
    OR is_owner_of_boutique(boutique_id)
    OR is_assigned_to_boutique(boutique_id)
  );

DROP POLICY IF EXISTS "cloture_update" ON cloture_caisse_jour;
CREATE POLICY "cloture_update"
  ON cloture_caisse_jour FOR UPDATE
  USING (
    is_mafro_admin()
    OR is_owner_of_boutique(boutique_id)
    OR EXISTS (
      SELECT 1 FROM employes e
      WHERE e.boutique_id = cloture_caisse_jour.boutique_id
        AND e.proprietaire_id = auth.uid()
        AND e.actif = true
        AND e.mafro_role IN ('manager')
    )
  );

-- transferts_stock
ALTER TABLE transferts_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transferts_select" ON transferts_stock;
CREATE POLICY "transferts_select"
  ON transferts_stock FOR SELECT
  USING (
    is_mafro_admin()
    OR is_owner_of_boutique(boutique_source_id)
    OR is_owner_of_boutique(boutique_destination_id)
    OR is_assigned_to_boutique(boutique_source_id)
    OR is_assigned_to_boutique(boutique_destination_id)
  );

DROP POLICY IF EXISTS "transferts_insert" ON transferts_stock;
CREATE POLICY "transferts_insert"
  ON transferts_stock FOR INSERT
  WITH CHECK (
    is_mafro_admin()
    OR is_owner_of_boutique(boutique_source_id)
    OR is_assigned_to_boutique(boutique_source_id)
  );

DROP POLICY IF EXISTS "transferts_update" ON transferts_stock;
CREATE POLICY "transferts_update"
  ON transferts_stock FOR UPDATE
  USING (
    is_mafro_admin()
    OR is_owner_of_boutique(boutique_destination_id)
    OR is_assigned_to_boutique(boutique_destination_id)
  );

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
