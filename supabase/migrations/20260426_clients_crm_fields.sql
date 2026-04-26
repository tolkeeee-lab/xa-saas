-- supabase/migrations/20260426_clients_crm_fields.sql
-- Migration : Ajout champs CRM sur la table clients existante
-- PR: feat(crm): module CRM Clients unifié — opt-in WhatsApp, crédit, historique
-- ⚠️  DO NOT run automatically. Execute manually in the Supabase SQL Editor after merging.

-- Ajout des colonnes CRM à la table clients (existante depuis les premières migrations)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS prenom            text,
  ADD COLUMN IF NOT EXISTS email             text,
  ADD COLUMN IF NOT EXISTS opt_in_whatsapp   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS credit_actuel     numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS derniere_visite_at timestamptz,
  ADD COLUMN IF NOT EXISTS note              text;

-- Contrainte unique téléphone par propriétaire (si pas déjà existante)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clients_telephone_proprietaire_unique'
  ) THEN
    ALTER TABLE clients
      ADD CONSTRAINT clients_telephone_proprietaire_unique
      UNIQUE (proprietaire_id, telephone);
  END IF;
END $$;

-- Index supplémentaires pour les filtres CRM
CREATE INDEX IF NOT EXISTS idx_clients_opt_in      ON clients(proprietaire_id, opt_in_whatsapp) WHERE opt_in_whatsapp = true;
CREATE INDEX IF NOT EXISTS idx_clients_credit      ON clients(proprietaire_id, credit_actuel)   WHERE credit_actuel > 0;
CREATE INDEX IF NOT EXISTS idx_clients_derniere_vis ON clients(proprietaire_id, derniere_visite_at);
