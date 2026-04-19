-- Migration: process_sale_v2 — Additive RPC for xà Caisse v3
-- Extends process_sale with: manual discount %, montant_recu, monnaie_rendue,
-- client_telephone, and returns a formatted numero_facture.
--
-- This is ADDITIVE — process_sale (v1) is not modified or dropped.
--
-- Usage from API:
--   await supabase.rpc('process_sale_v2', { ... })

CREATE OR REPLACE FUNCTION process_sale_v2(
  p_boutique_id       uuid,
  p_lignes            jsonb,       -- [{produit_id, quantite, prix_unitaire, nom_produit, prix_achat}]
  p_montant_total     numeric,     -- pre-computed total after discount (client-verified)
  p_benefice_total    numeric,
  p_mode_paiement     text,
  p_remise_pct        numeric  DEFAULT 0,
  p_montant_recu      numeric  DEFAULT NULL,
  p_monnaie_rendue    numeric  DEFAULT NULL,
  p_client_id         uuid     DEFAULT NULL,
  p_client_nom        text     DEFAULT NULL,
  p_client_telephone  text     DEFAULT NULL,
  p_local_id          uuid     DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_transaction_id  uuid;
  v_ligne           jsonb;
  v_produit_id      uuid;
  v_stock           integer;
  v_quantite        integer;
  v_proprio_id      uuid;
  v_today_count     integer;
  v_facture_date    text;
  v_numero_facture  text;
  v_montant_recu    numeric;
  v_monnaie_rendue  numeric;
BEGIN
  -- Lookup boutique owner for invoice numbering
  SELECT proprietaire_id INTO v_proprio_id
    FROM boutiques
   WHERE id = p_boutique_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Boutique introuvable: %', p_boutique_id;
  END IF;

  -- Check stock for all lines before touching any row
  FOR v_ligne IN SELECT * FROM jsonb_array_elements(p_lignes)
  LOOP
    v_produit_id := (v_ligne->>'produit_id')::uuid;
    v_quantite   := (v_ligne->>'quantite')::integer;

    SELECT stock_actuel INTO v_stock
      FROM produits
     WHERE id = v_produit_id
       FOR UPDATE;  -- row-level lock

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
    SELECT t.id INTO v_transaction_id
      FROM transactions t
     WHERE t.local_id = p_local_id
     LIMIT 1;

    IF FOUND THEN
      -- Still compute the facture number for the existing transaction
      SELECT to_char(t.created_at AT TIME ZONE 'Africa/Porto-Novo', 'YYYYMMDD') INTO v_facture_date
        FROM transactions t WHERE t.id = v_transaction_id;

      SELECT COUNT(*) INTO v_today_count
        FROM transactions t
        JOIN boutiques b ON b.id = t.boutique_id
       WHERE b.proprietaire_id = v_proprio_id
         AND t.created_at::date = CURRENT_DATE
         AND t.id <= v_transaction_id;

      v_numero_facture := 'FAC-' || v_facture_date || '-' || LPAD(v_today_count::text, 4, '0');

      RETURN jsonb_build_object(
        'transaction_id',  v_transaction_id,
        'duplicate',       true,
        'numero_facture',  v_numero_facture
      );
    END IF;
  END IF;

  -- Resolve montant_recu / monnaie_rendue
  v_montant_recu   := COALESCE(p_montant_recu,   p_montant_total);
  v_monnaie_rendue := COALESCE(p_monnaie_rendue, 0);

  -- Insert transaction
  INSERT INTO transactions (
    boutique_id, montant_total, benefice_total,
    montant_recu, monnaie_rendue,
    mode_paiement, client_id, client_nom,
    statut, sync_statut, local_id
  ) VALUES (
    p_boutique_id, p_montant_total, p_benefice_total,
    v_montant_recu, v_monnaie_rendue,
    p_mode_paiement, p_client_id, p_client_nom,
    'validee', 'synced', p_local_id
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

  -- Handle credit: create debt entry
  IF p_mode_paiement = 'credit' THEN
    INSERT INTO dettes (
      boutique_id, client_nom, client_telephone,
      montant, montant_rembourse, description, statut, date_echeance
    ) VALUES (
      p_boutique_id,
      COALESCE(p_client_nom, 'Client anonyme'),
      p_client_telephone,
      p_montant_total,
      0,
      'Vente crédit — ' || jsonb_array_length(p_lignes) || ' article(s)',
      'en_attente',
      (CURRENT_DATE + INTERVAL '30 days')::date
    );
  END IF;

  -- Generate invoice number: FAC-YYYYMMDD-NNNN
  v_facture_date := to_char(NOW() AT TIME ZONE 'Africa/Porto-Novo', 'YYYYMMDD');

  SELECT COUNT(*) INTO v_today_count
    FROM transactions t
    JOIN boutiques b ON b.id = t.boutique_id
   WHERE b.proprietaire_id = v_proprio_id
     AND t.created_at::date = CURRENT_DATE;

  v_numero_facture := 'FAC-' || v_facture_date || '-' || LPAD(v_today_count::text, 4, '0');

  RETURN jsonb_build_object(
    'transaction_id',  v_transaction_id,
    'duplicate',       false,
    'numero_facture',  v_numero_facture
  );
END;
$$;

-- Restrict execution to authenticated users (anon cannot call this)
REVOKE ALL ON FUNCTION process_sale_v2 FROM anon;
GRANT EXECUTE ON FUNCTION process_sale_v2 TO authenticated;
