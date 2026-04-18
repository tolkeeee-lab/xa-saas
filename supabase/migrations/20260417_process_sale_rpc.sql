-- Migration: Atomic process_sale RPC (C9 Option B — Sprint 3)
-- This function wraps the entire sale insertion + stock decrements in a single
-- Postgres transaction so that either ALL changes commit or NONE do.
--
-- Usage from API:
--   await supabase.rpc('process_sale', { p_boutique_id, p_lignes, ... })
--
-- Run once in Supabase SQL editor or via supabase db push when ready.

CREATE OR REPLACE FUNCTION process_sale(
  p_boutique_id       uuid,
  p_lignes            jsonb,   -- [{produit_id, quantite, prix_unitaire, nom_produit, prix_achat}]
  p_montant_total     numeric,
  p_benefice_total    numeric,
  p_mode_paiement     text,
  p_client_id         uuid     DEFAULT NULL,
  p_client_nom        text     DEFAULT NULL,
  p_local_id          uuid     DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_transaction_id uuid;
  v_ligne          jsonb;
  v_produit_id     uuid;
  v_stock          integer;
  v_quantite       integer;
BEGIN
  -- Check stock for all lines before touching any row
  FOR v_ligne IN SELECT * FROM jsonb_array_elements(p_lignes)
  LOOP
    v_produit_id := (v_ligne->>'produit_id')::uuid;
    v_quantite   := (v_ligne->>'quantite')::integer;

    SELECT stock_actuel INTO v_stock
      FROM produits
     WHERE id = v_produit_id
       FOR UPDATE;  -- row-level lock for the duration of this transaction

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produit introuvable: %', v_produit_id;
    END IF;

    IF v_stock < v_quantite THEN
      RAISE EXCEPTION 'Stock insuffisant pour le produit %: disponible=%, demandé=%',
        v_produit_id, v_stock, v_quantite;
    END IF;
  END LOOP;

  -- Idempotency: return existing transaction if local_id already processed
  IF p_local_id IS NOT NULL THEN
    SELECT id INTO v_transaction_id
      FROM transactions
     WHERE local_id = p_local_id
     LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object('transaction_id', v_transaction_id, 'duplicate', true);
    END IF;
  END IF;

  -- Insert transaction
  INSERT INTO transactions (
    boutique_id, montant_total, benefice_total, montant_recu, monnaie_rendue,
    mode_paiement, client_id, client_nom, statut, sync_statut, local_id
  ) VALUES (
    p_boutique_id, p_montant_total, p_benefice_total, p_montant_total, 0,
    p_mode_paiement, p_client_id, p_client_nom, 'validee', 'synced', p_local_id
  )
  RETURNING id INTO v_transaction_id;

  -- Insert lines + update stock atomically
  FOR v_ligne IN SELECT * FROM jsonb_array_elements(p_lignes)
  LOOP
    v_produit_id := (v_ligne->>'produit_id')::uuid;
    v_quantite   := (v_ligne->>'quantite')::integer;

    INSERT INTO transaction_lignes (
      transaction_id, produit_id, nom_produit, quantite,
      prix_vente_unitaire, prix_achat_unitaire, sous_total
    ) VALUES (
      v_transaction_id,
      v_produit_id,
      v_ligne->>'nom_produit',
      v_quantite,
      (v_ligne->>'prix_unitaire')::numeric,
      (v_ligne->>'prix_achat')::numeric,
      (v_ligne->>'prix_unitaire')::numeric * v_quantite
    );

    UPDATE produits
       SET stock_actuel = stock_actuel - v_quantite
     WHERE id = v_produit_id;
  END LOOP;

  RETURN jsonb_build_object('transaction_id', v_transaction_id, 'duplicate', false);
END;
$$;

-- Restrict execution to authenticated users (anon cannot call this)
REVOKE ALL ON FUNCTION process_sale FROM anon;
GRANT EXECUTE ON FUNCTION process_sale TO authenticated;
