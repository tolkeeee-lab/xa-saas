-- Migration: inscriptions_metadata
-- Stores per-user registration context (acquisition channel, IP, UA)

CREATE TABLE IF NOT EXISTS inscriptions_metadata (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_connu TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS : seul mafro_admin peut lire (pour analytics future)
ALTER TABLE inscriptions_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mafro_admin_read_inscriptions" ON inscriptions_metadata
  FOR SELECT USING (is_mafro_admin());

CREATE POLICY "service_role_insert_inscriptions" ON inscriptions_metadata
  FOR INSERT WITH CHECK (true); -- géré côté API
