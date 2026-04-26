-- supabase/migrations/20260425_mafro_v4_roles_and_extensions.sql
-- Migration 1/3 — MAFRO v4 : enum rôles, extensions boutiques/employes, table mafro_admins
-- PR: feat(db): MAFRO v4 schema — roles, B2B, retraits, audit, RLS
-- ⚠️  DO NOT run automatically. Execute manually in the Supabase SQL Editor after merging.

-- ─────────────────────────────────────────────────────────────
-- 1. Enum user_role
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'owner', 'manager', 'staff');
  END IF;
END$$;

COMMENT ON TYPE user_role IS 'Rôles MAFRO v4 : admin (fournisseur), owner (propriétaire), manager (gérant), staff (caissier)';

-- ─────────────────────────────────────────────────────────────
-- 2. Extensions de boutiques
-- ─────────────────────────────────────────────────────────────
-- slug unique (généré à partir du nom si NULL, via trigger ci-dessous)
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS slug TEXT;
-- contrainte unique ajoutée séparément pour idempotence
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'boutiques_slug_key' AND conrelid = 'boutiques'::regclass
  ) THEN
    ALTER TABLE boutiques ADD CONSTRAINT boutiques_slug_key UNIQUE (slug);
  END IF;
END$$;

ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS telephone_whatsapp  TEXT;
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS adresse             TEXT;
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS zone                TEXT;        -- zone géographique (heatmap)
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS latitude            NUMERIC(10,7);
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS longitude           NUMERIC(10,7);
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS horaires            JSONB;       -- {"lun":"7-20","sam":"7-18","dim":null}
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS couleur             TEXT    DEFAULT '#00C853';
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS est_actif           BOOLEAN DEFAULT true;
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS catalogue_public    BOOLEAN DEFAULT false;

COMMENT ON COLUMN boutiques.slug              IS 'Identifiant URL unique, généré depuis le nom';
COMMENT ON COLUMN boutiques.telephone_whatsapp IS 'Numéro WhatsApp de la boutique (format E164)';
COMMENT ON COLUMN boutiques.adresse           IS 'Adresse postale libre';
COMMENT ON COLUMN boutiques.zone              IS 'Zone géographique libre (ex: Cotonou Nord)';
COMMENT ON COLUMN boutiques.latitude          IS 'Latitude GPS';
COMMENT ON COLUMN boutiques.longitude         IS 'Longitude GPS';
COMMENT ON COLUMN boutiques.horaires          IS 'Horaires d''ouverture JSON : {"lun":"7-20", ...}';
COMMENT ON COLUMN boutiques.couleur           IS 'Couleur hex pour le dot du switcher de boutique';
COMMENT ON COLUMN boutiques.est_actif         IS 'Boutique active dans l''interface MAFRO v4';
COMMENT ON COLUMN boutiques.catalogue_public  IS 'Catalogue produits visible publiquement';

-- Trigger : génère automatiquement le slug depuis le nom si non fourni
CREATE OR REPLACE FUNCTION generate_boutique_slug()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  counter   INTEGER := 0;
BEGIN
  -- Seulement si slug est NULL à l'insertion
  IF NEW.slug IS NULL THEN
    -- Translitération simple + kebab-case
    base_slug := lower(regexp_replace(
      translate(NEW.nom,
        'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÝýÑñÇç',
        'aaaaaaaaaaaaeeeeeeeeiiiiiiiioooooooooouuuuuuuuyyyynncc'),
      '[^a-z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);

    candidate := base_slug;
    LOOP
      EXIT WHEN NOT EXISTS (SELECT 1 FROM boutiques WHERE slug = candidate AND id <> NEW.id);
      counter   := counter + 1;
      candidate := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS boutiques_generate_slug ON boutiques;
CREATE TRIGGER boutiques_generate_slug
  BEFORE INSERT OR UPDATE OF nom ON boutiques
  FOR EACH ROW EXECUTE FUNCTION generate_boutique_slug();

-- Backfill slugs pour les boutiques existantes sans slug
UPDATE boutiques SET nom = nom WHERE slug IS NULL;  -- force le trigger sur UPDATE (nom inchangé, slug généré)

-- ─────────────────────────────────────────────────────────────
-- 3. Extensions de employes
-- ─────────────────────────────────────────────────────────────
-- La colonne "role" existante est TEXT ('caissier'|'gerant').
-- On ajoute une colonne mafro_role de type user_role pour MAFRO v4 sans toucher l'existante.
ALTER TABLE employes ADD COLUMN IF NOT EXISTS mafro_role        user_role   NOT NULL DEFAULT 'staff';
ALTER TABLE employes ADD COLUMN IF NOT EXISTS pin_hash          TEXT;
ALTER TABLE employes ADD COLUMN IF NOT EXISTS derniere_connexion TIMESTAMPTZ;
ALTER TABLE employes ADD COLUMN IF NOT EXISTS bloque            BOOLEAN     DEFAULT false;
ALTER TABLE employes ADD COLUMN IF NOT EXISTS motif_blocage     TEXT;

-- Backfill mafro_role depuis l'ancienne colonne "role" si possible
UPDATE employes
SET mafro_role = CASE
  WHEN role = 'gerant'   THEN 'manager'::user_role
  ELSE                         'staff'::user_role
END
WHERE mafro_role = 'staff'
  AND role IS NOT NULL;

COMMENT ON COLUMN employes.mafro_role         IS 'Rôle MAFRO v4 (admin/owner/manager/staff). Distinct de l''ancienne colonne role.';
COMMENT ON COLUMN employes.pin_hash           IS 'Hash SHA-256 du PIN MAFRO v4 (distinct du pin caisse)';
COMMENT ON COLUMN employes.derniere_connexion IS 'Timestamp de la dernière connexion MAFRO v4';
COMMENT ON COLUMN employes.bloque            IS 'Compte bloqué par l''admin / owner';
COMMENT ON COLUMN employes.motif_blocage     IS 'Raison du blocage du compte';

-- ─────────────────────────────────────────────────────────────
-- 4. Table mafro_admins
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mafro_admins (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nom                 TEXT NOT NULL,
  telephone_whatsapp  TEXT,
  est_actif           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE mafro_admins IS 'Administrateurs MAFRO (fournisseur + équipe interne). Distinct des proprietaires.';
COMMENT ON COLUMN mafro_admins.user_id            IS 'Référence auth.users';
COMMENT ON COLUMN mafro_admins.telephone_whatsapp IS 'WhatsApp admin (format E164)';
COMMENT ON COLUMN mafro_admins.est_actif          IS 'Admin actif — inactif = accès révoqué';

-- ─────────────────────────────────────────────────────────────
-- 5. Helper RLS is_mafro_admin()
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_mafro_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS(
    SELECT 1 FROM mafro_admins
    WHERE user_id = auth.uid() AND est_actif = true
  );
$$;

COMMENT ON FUNCTION is_mafro_admin() IS 'Retourne TRUE si l''utilisateur courant est dans mafro_admins et est actif.';

-- ─────────────────────────────────────────────────────────────
-- 6. Helpers RLS supplémentaires
-- ─────────────────────────────────────────────────────────────

-- is_owner_of_boutique : propriétaire d'une boutique spécifique
CREATE OR REPLACE FUNCTION is_owner_of_boutique(p_boutique_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS(
    SELECT 1 FROM boutiques
    WHERE id = p_boutique_id AND proprietaire_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION is_owner_of_boutique(UUID) IS 'Retourne TRUE si auth.uid() est proprietaire_id de la boutique.';

-- is_assigned_to_boutique : employé affecté à une boutique (actif)
CREATE OR REPLACE FUNCTION is_assigned_to_boutique(p_boutique_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS(
    SELECT 1 FROM employes
    WHERE boutique_id = p_boutique_id
      AND proprietaire_id = auth.uid()
      AND actif = true
  )
  OR EXISTS(
    SELECT 1 FROM boutiques
    WHERE id = p_boutique_id AND proprietaire_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION is_assigned_to_boutique(UUID) IS 'Retourne TRUE si auth.uid() est employé actif ou propriétaire de la boutique.';

-- current_employe_role : retourne le rôle MAFRO de l'employé courant pour une boutique
CREATE OR REPLACE FUNCTION current_employe_role(p_boutique_id UUID)
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT mafro_role
  FROM employes
  WHERE boutique_id = p_boutique_id
    AND proprietaire_id = auth.uid()
    AND actif = true
  LIMIT 1;
$$;

COMMENT ON FUNCTION current_employe_role(UUID) IS 'Retourne le mafro_role de l''employé actif courant pour la boutique donnée.';

-- ─────────────────────────────────────────────────────────────
-- 7. RLS sur mafro_admins
-- ─────────────────────────────────────────────────────────────
ALTER TABLE mafro_admins ENABLE ROW LEVEL SECURITY;

-- Un admin peut se lire lui-même
DROP POLICY IF EXISTS "mafro_admins_select_self" ON mafro_admins;
CREATE POLICY "mafro_admins_select_self"
  ON mafro_admins FOR SELECT
  USING (user_id = auth.uid() OR is_mafro_admin());

-- Seul un admin peut insérer / modifier / supprimer
DROP POLICY IF EXISTS "mafro_admins_insert_admin" ON mafro_admins;
CREATE POLICY "mafro_admins_insert_admin"
  ON mafro_admins FOR INSERT
  WITH CHECK (is_mafro_admin());

DROP POLICY IF EXISTS "mafro_admins_update_admin" ON mafro_admins;
CREATE POLICY "mafro_admins_update_admin"
  ON mafro_admins FOR UPDATE
  USING (is_mafro_admin());

DROP POLICY IF EXISTS "mafro_admins_delete_admin" ON mafro_admins;
CREATE POLICY "mafro_admins_delete_admin"
  ON mafro_admins FOR DELETE
  USING (is_mafro_admin());

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
