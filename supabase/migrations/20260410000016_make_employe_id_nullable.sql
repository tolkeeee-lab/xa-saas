-- Migration 016 : Rendre employe_id nullable dans transactions.
-- Nécessaire pour les transactions effectuées directement par le propriétaire
-- (qui n'a pas d'enregistrement dans la table employes).

ALTER TABLE public.transactions
  ALTER COLUMN employe_id DROP NOT NULL;
