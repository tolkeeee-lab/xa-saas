-- Migration: employe_invite_code + audit login
-- Adds per-employee invite code (format: XAAK-7F3Q) and login audit fields.

ALTER TABLE employes
  ADD COLUMN IF NOT EXISTS invite_code        TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_created_at  TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_login_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_ip      TEXT,
  ADD COLUMN IF NOT EXISTS failed_pin_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until       TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_employes_invite_code ON employes(invite_code);
CREATE INDEX IF NOT EXISTS idx_employes_locked      ON employes(locked_until) WHERE locked_until IS NOT NULL;

-- Backfill: existing employees will receive an invite_code on first access
-- (the application generates one when invite_code IS NULL).
