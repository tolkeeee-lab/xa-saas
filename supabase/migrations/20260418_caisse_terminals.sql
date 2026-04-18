-- Migration: caisse_terminals
--
-- Introduces the `caisse_terminals` table to track POS devices that have
-- successfully authenticated against each boutique's caisse.
--
-- Each row represents a unique (boutique_id, terminal_id) pair.  The
-- terminal_id is a client-generated UUID stored in the browser's localStorage
-- (see lib/terminalId.ts).  On every successful PIN verification the server
-- upserts this record, keeping `last_seen_at` and `last_ip` current.
--
-- The `statut` column supports future revocation: setting it to 'revoque'
-- allows a boutique owner to block a lost or compromised device.  Enforcement
-- of the 'revoque' status is intentionally left for a subsequent iteration
-- (see README for details).

CREATE TABLE IF NOT EXISTS caisse_terminals (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boutique_id   UUID        NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  terminal_id   TEXT        NOT NULL,
  label         TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_ip       TEXT,
  statut        TEXT        NOT NULL DEFAULT 'actif'
                            CHECK (statut IN ('actif', 'revoque')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enforce uniqueness so upserts on (boutique_id, terminal_id) are atomic.
CREATE UNIQUE INDEX IF NOT EXISTS idx_caisse_terminals_boutique_terminal
  ON caisse_terminals(boutique_id, terminal_id);

-- Index to quickly fetch all terminals for a given boutique.
CREATE INDEX IF NOT EXISTS idx_caisse_terminals_boutique_id
  ON caisse_terminals(boutique_id);
