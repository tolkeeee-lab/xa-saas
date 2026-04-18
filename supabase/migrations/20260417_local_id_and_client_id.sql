-- Migration: Add local_id to transactions for offline idempotency (C8)
-- Run once in Supabase SQL editor or via supabase db push.

-- Add local_id column to transactions table (nullable UUID)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS local_id uuid;

-- Unique index ensures no two transactions share the same local_id
-- (prevents duplicate offline sale insertions on network retry).
-- Partial index excludes NULL values so it only applies to offline sales.
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_local_id
  ON transactions (local_id)
  WHERE local_id IS NOT NULL;

-- Also index client_id for the loyalty points query in /api/transactions (C10)
CREATE INDEX IF NOT EXISTS idx_transactions_client_id
  ON transactions (client_id)
  WHERE client_id IS NOT NULL;
