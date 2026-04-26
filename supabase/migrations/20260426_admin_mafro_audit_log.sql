-- supabase/migrations/20260426_admin_mafro_audit_log.sql
-- PR: feat(admin): Dashboard MAFRO Admin — audit_log table
-- Dépendances : mafro_admins table must exist (migration 20260425_mafro_v4_roles_and_extensions.sql)
-- ⚠️  DO NOT run automatically. Execute manually in the Supabase SQL Editor after merging.

-- ─────────────────────────────────────────────────────────────
-- 1. Table audit_log
--    Toutes les actions admin MAFRO sont tracées ici.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action       TEXT NOT NULL,
  target_table TEXT,
  target_id    UUID,
  actor_id     UUID NOT NULL,
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE audit_log IS 'Journal des actions admin MAFRO (validation commande, dispatch livraison, etc.)';
COMMENT ON COLUMN audit_log.action       IS 'Libellé de l''action (ex: validate_commande_b2b, dispatch_livraison)';
COMMENT ON COLUMN audit_log.target_table IS 'Table cible de l''action (ex: commandes_b2b, livraisons)';
COMMENT ON COLUMN audit_log.target_id    IS 'ID de la ressource ciblée';
COMMENT ON COLUMN audit_log.actor_id     IS 'UUID de l''utilisateur qui a effectué l''action';
COMMENT ON COLUMN audit_log.metadata     IS 'Données supplémentaires JSONB (ancien statut, nouveau statut, etc.)';

CREATE INDEX IF NOT EXISTS idx_audit_log_actor   ON audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target  ON audit_log(target_table, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 2. RLS policies
-- ─────────────────────────────────────────────────────────────
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only MAFRO admins can read the audit log
CREATE POLICY "audit_log_admin_read" ON audit_log
  FOR SELECT
  USING (is_mafro_admin());

-- Only MAFRO admins can insert into the audit log (via service role in API routes)
CREATE POLICY "audit_log_admin_insert" ON audit_log
  FOR INSERT
  WITH CHECK (is_mafro_admin());
