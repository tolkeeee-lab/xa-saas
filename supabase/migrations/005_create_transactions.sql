-- 005_create_transactions.sql
CREATE TYPE IF NOT EXISTS public.transaction_type AS ENUM ('vente', 'credit', 'remboursement', 'avoir', 'depense');
CREATE TYPE IF NOT EXISTS public.mode_paiement AS ENUM ('especes', 'mobile_money', 'virement', 'carte', 'credit');
CREATE TYPE IF NOT EXISTS public.sync_statut AS ENUM ('local', 'synced', 'conflict');
CREATE TYPE IF NOT EXISTS public.transaction_statut AS ENUM ('en_attente', 'validee', 'annulee');

CREATE TABLE IF NOT EXISTS public.transactions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id             TEXT,
  boutique_id          UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  employe_id           UUID REFERENCES public.employes(id) ON DELETE SET NULL,
  client_debiteur_id   UUID REFERENCES public.clients_debiteurs(id) ON DELETE SET NULL,
  type                 public.transaction_type NOT NULL DEFAULT 'vente',
  statut               public.transaction_statut NOT NULL DEFAULT 'validee',
  mode_paiement        public.mode_paiement NOT NULL DEFAULT 'especes',
  montant_total        NUMERIC(12,2) NOT NULL DEFAULT 0,
  montant_recu         NUMERIC(12,2) NOT NULL DEFAULT 0,
  monnaie_rendue       NUMERIC(12,2) NOT NULL DEFAULT 0,
  montant_credit       NUMERIC(12,2) NOT NULL DEFAULT 0,
  reference            TEXT,
  notes                TEXT,
  sync_statut          public.sync_statut NOT NULL DEFAULT 'synced',
  synced_at            TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriétaire lit ses transactions"
  ON public.transactions
  FOR SELECT
  USING (
    boutique_id IN (
      SELECT id FROM public.boutiques WHERE proprietaire_id = auth.uid()
    )
  );

CREATE POLICY "Service role insère des transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (true);
