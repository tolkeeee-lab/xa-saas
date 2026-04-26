-- supabase/migrations/20260425_mafro_v4_b2b_retraits_crm.sql
-- Migration 2/3 — MAFRO v4 : B2B, retraits clients, CRM, livraisons + RPCs
-- PR: feat(db): MAFRO v4 schema — roles, B2B, retraits, audit, RLS
-- Dépendance : 20260425_mafro_v4_roles_and_extensions.sql doit être exécutée avant.
-- ⚠️  DO NOT run automatically. Execute manually in the Supabase SQL Editor after merging.

-- ─────────────────────────────────────────────────────────────
-- 1. Table produits_catalogue_admin
--    Catalogue maître MAFRO : prix B2B fournisseur → boutique
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produits_catalogue_admin (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom                 TEXT NOT NULL,
  emoji               TEXT DEFAULT '📦',
  categorie           TEXT,
  unite               TEXT,                         -- "sac 50kg", "bidon 20L", "carton 24u"
  prix_b2b            INTEGER NOT NULL,              -- FCFA HT, prix MAFRO → boutique
  prix_conseille      INTEGER,                       -- prix de revente conseillé
  delai_livraison_h   INTEGER DEFAULT 24,
  stock_central       INTEGER DEFAULT 0,
  est_actif           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE produits_catalogue_admin IS 'Catalogue maître MAFRO : produits avec prix B2B gérés par les admins MAFRO.';
COMMENT ON COLUMN produits_catalogue_admin.prix_b2b       IS 'Prix FCFA HT facturé par MAFRO à la boutique';
COMMENT ON COLUMN produits_catalogue_admin.prix_conseille IS 'Prix de revente conseillé à l''acheteur final';
COMMENT ON COLUMN produits_catalogue_admin.stock_central  IS 'Stock disponible côté entrepôt MAFRO';

CREATE INDEX IF NOT EXISTS idx_catalogue_admin_actif    ON produits_catalogue_admin(est_actif);
CREATE INDEX IF NOT EXISTS idx_catalogue_admin_categorie ON produits_catalogue_admin(categorie);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_catalogue_admin_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS catalogue_admin_updated_at ON produits_catalogue_admin;
CREATE TRIGGER catalogue_admin_updated_at
  BEFORE UPDATE ON produits_catalogue_admin
  FOR EACH ROW EXECUTE FUNCTION update_catalogue_admin_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 2. Table commandes_b2b
--    Commandes boutique → MAFRO admin
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commandes_b2b (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero                  TEXT UNIQUE NOT NULL,          -- "B2B-2026-0142"
  boutique_id             UUID NOT NULL REFERENCES boutiques(id) ON DELETE RESTRICT,
  proprietaire_id         UUID NOT NULL,
  statut                  TEXT NOT NULL DEFAULT 'soumise'
                          CHECK (statut IN ('soumise','confirmee','preparee','en_route','livree','annulee')),
  sous_total              INTEGER NOT NULL,
  frais_livraison         INTEGER DEFAULT 0,
  total                   INTEGER NOT NULL,
  mode_paiement           TEXT DEFAULT 'a_la_livraison'
                          CHECK (mode_paiement IN ('a_la_livraison','momo','virement')),
  paiement_status         TEXT DEFAULT 'en_attente'
                          CHECK (paiement_status IN ('en_attente','paye')),
  note                    TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  confirmed_at            TIMESTAMPTZ,
  livraison_prevue_at     TIMESTAMPTZ,
  livree_at               TIMESTAMPTZ
);

COMMENT ON TABLE commandes_b2b IS 'Commandes passées par les boutiques auprès de MAFRO (approvisionnement B2B).';
COMMENT ON COLUMN commandes_b2b.numero IS 'Numéro de commande auto-généré (B2B-YYYY-NNNN)';

CREATE INDEX IF NOT EXISTS idx_commandes_b2b_boutique ON commandes_b2b(boutique_id, statut);
CREATE INDEX IF NOT EXISTS idx_commandes_b2b_statut   ON commandes_b2b(statut, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commandes_b2b_proprio  ON commandes_b2b(proprietaire_id);

-- ─────────────────────────────────────────────────────────────
-- 3. Table commandes_b2b_lignes
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commandes_b2b_lignes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id         UUID NOT NULL REFERENCES commandes_b2b(id) ON DELETE CASCADE,
  produit_admin_id    UUID REFERENCES produits_catalogue_admin(id) ON DELETE SET NULL,
  produit_nom         TEXT NOT NULL,
  produit_emoji       TEXT,
  unite               TEXT,
  quantite            INTEGER NOT NULL CHECK (quantite > 0),
  prix_unitaire       INTEGER NOT NULL,
  total_ligne         INTEGER NOT NULL
);

COMMENT ON TABLE commandes_b2b_lignes IS 'Lignes de commandes B2B. ON DELETE CASCADE depuis commandes_b2b.';
CREATE INDEX IF NOT EXISTS idx_b2b_lignes_commande ON commandes_b2b_lignes(commande_id);

-- ─────────────────────────────────────────────────────────────
-- 4. Table livraisons
--    Suivi camion / livreur
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS livraisons (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_b2b_id         UUID REFERENCES commandes_b2b(id) ON DELETE CASCADE,
  numero                  TEXT UNIQUE NOT NULL,         -- "LIV-2026-0042"
  chauffeur               TEXT,
  vehicule                TEXT,
  statut                  TEXT NOT NULL DEFAULT 'preparation'
                          CHECK (statut IN ('preparation','en_route','livree','retournee')),
  parti_at                TIMESTAMPTZ,
  livre_at                TIMESTAMPTZ,
  destination_lat         NUMERIC(10,7),
  destination_lng         NUMERIC(10,7),
  position_actuelle_lat   NUMERIC(10,7),
  position_actuelle_lng   NUMERIC(10,7),
  last_ping               TIMESTAMPTZ,
  note                    TEXT,
  created_at              TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE livraisons IS 'Suivi des livraisons B2B (camion/livreur) avec position GPS.';
CREATE INDEX IF NOT EXISTS idx_livraisons_commande ON livraisons(commande_b2b_id);
CREATE INDEX IF NOT EXISTS idx_livraisons_statut   ON livraisons(statut);

-- ─────────────────────────────────────────────────────────────
-- 5. Table retraits_clients
--    Commande payée en ligne → retrait en boutique (code 4 chiffres)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS retraits_clients (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero                  TEXT UNIQUE NOT NULL,          -- "2026-04-001"
  boutique_id             UUID NOT NULL REFERENCES boutiques(id) ON DELETE RESTRICT,
  code_retrait            TEXT NOT NULL,                  -- 4 chiffres
  code_hash               TEXT NOT NULL,                  -- SHA-256 du code
  client_nom              TEXT NOT NULL,
  client_telephone        TEXT NOT NULL,
  lignes                  JSONB NOT NULL,                  -- [{produit, qty, prix}]
  total                   INTEGER NOT NULL,
  statut                  TEXT NOT NULL DEFAULT 'en_attente'
                          CHECK (statut IN ('en_attente','retire','expire','annule')),
  payment_provider        TEXT,                           -- 'fedapay'|'kkiapay'|null
  provider_transaction_id TEXT,
  paid_at                 TIMESTAMPTZ,
  retired_at              TIMESTAMPTZ,
  retired_by_employe_id   UUID REFERENCES employes(id) ON DELETE SET NULL,
  expires_at              TIMESTAMPTZ NOT NULL,           -- généralement now() + 2h
  created_at              TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE retraits_clients IS 'Retraits clients : commande payée en ligne, à retirer en boutique avec un code 4 chiffres.';
COMMENT ON COLUMN retraits_clients.code_retrait IS '4 chiffres affichés au client';
COMMENT ON COLUMN retraits_clients.code_hash    IS 'SHA-256 du code_retrait — ne jamais exposer le code brut';
COMMENT ON COLUMN retraits_clients.expires_at   IS 'Date d''expiration du retrait (généralement +2h après création)';

CREATE INDEX IF NOT EXISTS idx_retraits_boutique ON retraits_clients(boutique_id, statut);
CREATE INDEX IF NOT EXISTS idx_retraits_code     ON retraits_clients(code_retrait);
CREATE INDEX IF NOT EXISTS idx_retraits_expires  ON retraits_clients(expires_at) WHERE statut = 'en_attente';

-- ─────────────────────────────────────────────────────────────
-- 6. Table clients_crm
--    Contacts WhatsApp agrégés au niveau réseau
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients_crm (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telephone               TEXT UNIQUE NOT NULL,           -- format E164 +229...
  nom                     TEXT,
  opt_in_whatsapp         BOOLEAN DEFAULT false,
  opt_in_at               TIMESTAMPTZ,
  nb_achats               INTEGER DEFAULT 0,
  ca_total                INTEGER DEFAULT 0,              -- FCFA cumulés
  dernier_achat_at        TIMESTAMPTZ,
  premiere_boutique_id    UUID REFERENCES boutiques(id) ON DELETE SET NULL,
  boutiques_visitees      UUID[] DEFAULT '{}',
  tags                    TEXT[] DEFAULT '{}',
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE clients_crm IS 'CRM réseau MAFRO : contacts clients WhatsApp avec historique d''achats multi-boutiques.';
COMMENT ON COLUMN clients_crm.telephone          IS 'Numéro unique format E164 (+229...)';
COMMENT ON COLUMN clients_crm.opt_in_whatsapp    IS 'Client a consenti à recevoir des messages WhatsApp';
COMMENT ON COLUMN clients_crm.boutiques_visitees IS 'Array d''UUIDs des boutiques où ce client a acheté';

CREATE INDEX IF NOT EXISTS idx_crm_telephone         ON clients_crm(telephone);
CREATE INDEX IF NOT EXISTS idx_crm_opt_in            ON clients_crm(opt_in_whatsapp) WHERE opt_in_whatsapp = true;
CREATE INDEX IF NOT EXISTS idx_crm_premiere_boutique ON clients_crm(premiere_boutique_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_clients_crm_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS clients_crm_updated_at ON clients_crm;
CREATE TRIGGER clients_crm_updated_at
  BEFORE UPDATE ON clients_crm
  FOR EACH ROW EXECUTE FUNCTION update_clients_crm_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 7. Séquence pour numéros auto (commandes B2B)
-- ─────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS seq_commandes_b2b_num START 1;
CREATE SEQUENCE IF NOT EXISTS seq_livraisons_num    START 1;
CREATE SEQUENCE IF NOT EXISTS seq_retraits_num      START 1;

-- ─────────────────────────────────────────────────────────────
-- 8. RPCs
-- ─────────────────────────────────────────────────────────────

-- 8a. validate_retrait_code — vérifie code + boutique + expiration
CREATE OR REPLACE FUNCTION public.validate_retrait_code(
  p_code       TEXT,
  p_boutique_id UUID
)
RETURNS SETOF retraits_clients
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_row     retraits_clients;
  v_any_row retraits_clients;
BEGIN
  -- Chercher un retrait actif, non expiré, avec ce code dans cette boutique
  SELECT * INTO v_row
  FROM retraits_clients
  WHERE boutique_id  = p_boutique_id
    AND code_retrait = p_code
    AND statut       = 'en_attente'
    AND expires_at   > now();

  IF NOT FOUND THEN
    -- Fetch the existing row (any statut) to give a precise error message — single DB read
    SELECT * INTO v_any_row
    FROM retraits_clients
    WHERE boutique_id  = p_boutique_id
      AND code_retrait = p_code
    ORDER BY created_at DESC
    LIMIT 1;

    -- Auto-expire si en_attente mais délai dépassé
    IF FOUND AND v_any_row.statut = 'en_attente' THEN
      UPDATE retraits_clients SET statut = 'expire' WHERE id = v_any_row.id;
      RAISE EXCEPTION 'Code expiré — le délai de retrait est dépassé';
    ELSIF FOUND THEN
      CASE v_any_row.statut
        WHEN 'retire'  THEN RAISE EXCEPTION 'Code déjà utilisé — ce retrait a déjà été validé';
        WHEN 'expire'  THEN RAISE EXCEPTION 'Code expiré — le délai de retrait est dépassé';
        WHEN 'annule'  THEN RAISE EXCEPTION 'Code annulé — ce retrait a été annulé';
        ELSE                RAISE EXCEPTION 'Code invalide (statut: %)', v_any_row.statut;
      END CASE;
    ELSE
      RAISE EXCEPTION 'Code invalide — aucun retrait trouvé pour ce code dans cette boutique';
    END IF;
  END IF;

  RETURN NEXT v_row;
END;
$$;

COMMENT ON FUNCTION public.validate_retrait_code(TEXT, UUID) IS
  'Valide un code retrait 4 chiffres pour une boutique. Lève une exception si invalide/expiré/déjà retiré.';

-- 8b. mark_retrait_retired — valide le retrait et crée une transaction
CREATE OR REPLACE FUNCTION public.mark_retrait_retired(
  p_retrait_id  UUID,
  p_employe_id  UUID
)
RETURNS retraits_clients
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_row    retraits_clients;
  v_employe employes;
BEGIN
  -- Récupérer le retrait
  SELECT * INTO v_row FROM retraits_clients WHERE id = p_retrait_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Retrait introuvable';
  END IF;
  IF v_row.statut <> 'en_attente' THEN
    RAISE EXCEPTION 'Retrait déjà traité (statut: %)', v_row.statut;
  END IF;
  IF v_row.expires_at <= now() THEN
    UPDATE retraits_clients SET statut = 'expire' WHERE id = p_retrait_id;
    RAISE EXCEPTION 'Retrait expiré';
  END IF;

  -- Récupérer l'employé
  SELECT * INTO v_employe FROM employes WHERE id = p_employe_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employé introuvable';
  END IF;

  -- Marquer comme retiré
  UPDATE retraits_clients
  SET statut                = 'retire',
      retired_at            = now(),
      retired_by_employe_id = p_employe_id
  WHERE id = p_retrait_id
  RETURNING * INTO v_row;

  -- Créer une transaction correspondante (mode_paiement = momo car payé en ligne)
  INSERT INTO transactions (
    boutique_id, employe_id,
    montant_total, benefice_total, montant_recu, monnaie_rendue,
    mode_paiement, client_nom, statut, sync_statut
  ) VALUES (
    v_row.boutique_id, p_employe_id,
    v_row.total, 0, v_row.total, 0,
    'momo', v_row.client_nom, 'validee', 'synced'
  );

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.mark_retrait_retired(UUID, UUID) IS
  'Valide un retrait client : met à jour le statut + crée une transaction dans la caisse.';

-- 8c. submit_b2b_order — crée une commande B2B complète
CREATE OR REPLACE FUNCTION public.submit_b2b_order(
  p_boutique_id UUID,
  p_lignes      JSONB,
  p_note        TEXT DEFAULT NULL
)
RETURNS commandes_b2b
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_boutique      boutiques;
  v_commande      commandes_b2b;
  v_ligne         JSONB;
  v_num_seq       BIGINT;
  v_numero        TEXT;
  v_sous_total    INTEGER := 0;
  v_total_ligne   INTEGER;
  v_qty           INTEGER;
  v_prix          INTEGER;
BEGIN
  -- Vérifier la boutique
  SELECT * INTO v_boutique FROM boutiques WHERE id = p_boutique_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Boutique introuvable';
  END IF;

  -- Vérifier que la boutique appartient à l'utilisateur courant
  IF v_boutique.proprietaire_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  -- Calculer le sous-total
  FOR v_ligne IN SELECT * FROM jsonb_array_elements(p_lignes)
  LOOP
    v_qty   := (v_ligne->>'quantite')::INTEGER;
    v_prix  := (v_ligne->>'prix_unitaire')::INTEGER;
    v_sous_total := v_sous_total + (v_qty * v_prix);
  END LOOP;

  -- Générer le numéro
  SELECT nextval('seq_commandes_b2b_num') INTO v_num_seq;
  v_numero := 'B2B-' || to_char(now(), 'YYYY') || '-' || lpad(v_num_seq::TEXT, 4, '0');

  -- Créer l'entête de commande
  INSERT INTO commandes_b2b (
    numero, boutique_id, proprietaire_id,
    sous_total, total, note
  ) VALUES (
    v_numero, p_boutique_id, v_boutique.proprietaire_id,
    v_sous_total, v_sous_total, p_note
  )
  RETURNING * INTO v_commande;

  -- Insérer les lignes
  FOR v_ligne IN SELECT * FROM jsonb_array_elements(p_lignes)
  LOOP
    v_qty         := (v_ligne->>'quantite')::INTEGER;
    v_prix        := (v_ligne->>'prix_unitaire')::INTEGER;
    v_total_ligne := v_qty * v_prix;

    INSERT INTO commandes_b2b_lignes (
      commande_id, produit_admin_id,
      produit_nom, produit_emoji, unite,
      quantite, prix_unitaire, total_ligne
    ) VALUES (
      v_commande.id,
      (v_ligne->>'produit_admin_id')::UUID,
      v_ligne->>'produit_nom',
      v_ligne->>'produit_emoji',
      v_ligne->>'unite',
      v_qty, v_prix, v_total_ligne
    );
  END LOOP;

  RETURN v_commande;
END;
$$;

COMMENT ON FUNCTION public.submit_b2b_order(UUID, JSONB, TEXT) IS
  'Crée une commande B2B complète (entête + lignes) pour la boutique spécifiée. Retourne la commande créée.';

-- 8d. crm_upsert_from_sale — upsert CRM depuis une vente
CREATE OR REPLACE FUNCTION public.crm_upsert_from_sale(
  p_telephone   TEXT,
  p_nom         TEXT,
  p_boutique_id UUID,
  p_montant     INTEGER,
  p_opt_in      BOOLEAN DEFAULT false
)
RETURNS clients_crm
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_row clients_crm;
BEGIN
  INSERT INTO clients_crm (
    telephone, nom,
    opt_in_whatsapp, opt_in_at,
    nb_achats, ca_total, dernier_achat_at,
    premiere_boutique_id, boutiques_visitees
  ) VALUES (
    p_telephone, p_nom,
    p_opt_in, CASE WHEN p_opt_in THEN now() ELSE NULL END,
    1, p_montant, now(),
    p_boutique_id, ARRAY[p_boutique_id]
  )
  ON CONFLICT (telephone) DO UPDATE
  SET nom                  = COALESCE(EXCLUDED.nom, clients_crm.nom),
      nb_achats            = clients_crm.nb_achats + 1,
      ca_total             = clients_crm.ca_total + p_montant,
      dernier_achat_at     = now(),
      opt_in_whatsapp      = CASE WHEN p_opt_in THEN true ELSE clients_crm.opt_in_whatsapp END,
      opt_in_at            = CASE WHEN p_opt_in AND clients_crm.opt_in_at IS NULL THEN now()
                                  ELSE clients_crm.opt_in_at END,
      boutiques_visitees   = CASE
                               WHEN p_boutique_id = ANY(clients_crm.boutiques_visitees)
                                 THEN clients_crm.boutiques_visitees
                               ELSE clients_crm.boutiques_visitees || ARRAY[p_boutique_id]
                             END
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.crm_upsert_from_sale(TEXT, TEXT, UUID, INTEGER, BOOLEAN) IS
  'Insère ou met à jour un contact CRM suite à une vente. Incrémente nb_achats et ca_total.';

-- ─────────────────────────────────────────────────────────────
-- 9. RLS
-- ─────────────────────────────────────────────────────────────

-- produits_catalogue_admin : admin RW, tous R (catalogue public pour commandes)
ALTER TABLE produits_catalogue_admin ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "catalogue_admin_select_all" ON produits_catalogue_admin;
CREATE POLICY "catalogue_admin_select_all"
  ON produits_catalogue_admin FOR SELECT
  USING (est_actif = true OR is_mafro_admin());

DROP POLICY IF EXISTS "catalogue_admin_insert_admin" ON produits_catalogue_admin;
CREATE POLICY "catalogue_admin_insert_admin"
  ON produits_catalogue_admin FOR INSERT
  WITH CHECK (is_mafro_admin());

DROP POLICY IF EXISTS "catalogue_admin_update_admin" ON produits_catalogue_admin;
CREATE POLICY "catalogue_admin_update_admin"
  ON produits_catalogue_admin FOR UPDATE
  USING (is_mafro_admin());

DROP POLICY IF EXISTS "catalogue_admin_delete_admin" ON produits_catalogue_admin;
CREATE POLICY "catalogue_admin_delete_admin"
  ON produits_catalogue_admin FOR DELETE
  USING (is_mafro_admin());

-- commandes_b2b
ALTER TABLE commandes_b2b ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "commandes_b2b_select" ON commandes_b2b;
CREATE POLICY "commandes_b2b_select"
  ON commandes_b2b FOR SELECT
  USING (
    is_mafro_admin()
    OR proprietaire_id = auth.uid()
    OR is_assigned_to_boutique(boutique_id)
  );

DROP POLICY IF EXISTS "commandes_b2b_insert" ON commandes_b2b;
CREATE POLICY "commandes_b2b_insert"
  ON commandes_b2b FOR INSERT
  WITH CHECK (
    is_mafro_admin()
    OR proprietaire_id = auth.uid()
    OR is_assigned_to_boutique(boutique_id)
  );

DROP POLICY IF EXISTS "commandes_b2b_update" ON commandes_b2b;
CREATE POLICY "commandes_b2b_update"
  ON commandes_b2b FOR UPDATE
  USING (
    is_mafro_admin()
    OR proprietaire_id = auth.uid()
    OR is_assigned_to_boutique(boutique_id)
  );

-- commandes_b2b_lignes (via commande)
ALTER TABLE commandes_b2b_lignes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "b2b_lignes_select" ON commandes_b2b_lignes;
CREATE POLICY "b2b_lignes_select"
  ON commandes_b2b_lignes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM commandes_b2b c
      WHERE c.id = commandes_b2b_lignes.commande_id
        AND (
          is_mafro_admin()
          OR c.proprietaire_id = auth.uid()
          OR is_assigned_to_boutique(c.boutique_id)
        )
    )
  );

DROP POLICY IF EXISTS "b2b_lignes_insert" ON commandes_b2b_lignes;
CREATE POLICY "b2b_lignes_insert"
  ON commandes_b2b_lignes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM commandes_b2b c
      WHERE c.id = commandes_b2b_lignes.commande_id
        AND (
          is_mafro_admin()
          OR c.proprietaire_id = auth.uid()
          OR is_assigned_to_boutique(c.boutique_id)
        )
    )
  );

-- livraisons : admin RW, owner/manager R
ALTER TABLE livraisons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "livraisons_select" ON livraisons;
CREATE POLICY "livraisons_select"
  ON livraisons FOR SELECT
  USING (
    is_mafro_admin()
    OR EXISTS (
      SELECT 1 FROM commandes_b2b c
      WHERE c.id = livraisons.commande_b2b_id
        AND (c.proprietaire_id = auth.uid() OR is_assigned_to_boutique(c.boutique_id))
    )
  );

DROP POLICY IF EXISTS "livraisons_insert_admin" ON livraisons;
CREATE POLICY "livraisons_insert_admin"
  ON livraisons FOR INSERT
  WITH CHECK (is_mafro_admin());

DROP POLICY IF EXISTS "livraisons_update_admin" ON livraisons;
CREATE POLICY "livraisons_update_admin"
  ON livraisons FOR UPDATE
  USING (is_mafro_admin());

-- retraits_clients : admin R global, owner R ses boutiques, manager/staff RW sa boutique
ALTER TABLE retraits_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "retraits_select" ON retraits_clients;
CREATE POLICY "retraits_select"
  ON retraits_clients FOR SELECT
  USING (
    is_mafro_admin()
    OR is_owner_of_boutique(boutique_id)
    OR is_assigned_to_boutique(boutique_id)
  );

DROP POLICY IF EXISTS "retraits_insert" ON retraits_clients;
CREATE POLICY "retraits_insert"
  ON retraits_clients FOR INSERT
  WITH CHECK (
    is_mafro_admin()
    OR is_assigned_to_boutique(boutique_id)
  );

DROP POLICY IF EXISTS "retraits_update" ON retraits_clients;
CREATE POLICY "retraits_update"
  ON retraits_clients FOR UPDATE
  USING (
    is_mafro_admin()
    OR is_assigned_to_boutique(boutique_id)
  );

-- clients_crm : admin RW, owner/manager R (clients passés dans leurs boutiques)
ALTER TABLE clients_crm ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_select" ON clients_crm;
CREATE POLICY "crm_select"
  ON clients_crm FOR SELECT
  USING (
    is_mafro_admin()
    OR EXISTS (
      SELECT 1 FROM boutiques b
      WHERE b.proprietaire_id = auth.uid()
        AND (b.id = clients_crm.premiere_boutique_id
             OR b.id = ANY(clients_crm.boutiques_visitees))
    )
  );

DROP POLICY IF EXISTS "crm_insert_admin" ON clients_crm;
CREATE POLICY "crm_insert_admin"
  ON clients_crm FOR INSERT
  WITH CHECK (is_mafro_admin());

DROP POLICY IF EXISTS "crm_update_admin" ON clients_crm;
CREATE POLICY "crm_update_admin"
  ON clients_crm FOR UPDATE
  USING (is_mafro_admin());

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
