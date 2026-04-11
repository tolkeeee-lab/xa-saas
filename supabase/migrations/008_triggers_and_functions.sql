-- 008_triggers_and_functions.sql

-- Fonction updated_at générique
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers updated_at
CREATE TRIGGER set_boutiques_updated_at
  BEFORE UPDATE ON public.boutiques
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_employes_updated_at
  BEFORE UPDATE ON public.employes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_produits_updated_at
  BEFORE UPDATE ON public.produits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_clients_debiteurs_updated_at
  BEFORE UPDATE ON public.clients_debiteurs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Décrémentation automatique du stock après insertion d'une ligne de transaction
CREATE OR REPLACE FUNCTION public.decrement_stock_on_sale()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.produit_id IS NOT NULL THEN
    UPDATE public.produits
    SET stock_actuel = GREATEST(0, stock_actuel - NEW.quantite)
    WHERE id = NEW.produit_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER decrement_stock_after_ligne_insert
  AFTER INSERT ON public.transaction_lignes
  FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_sale();

-- Création automatique d'une boutique lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _nom_boutique TEXT;
  _ville        TEXT;
  _pin          TEXT;
  _code         TEXT;
BEGIN
  _nom_boutique := COALESCE(NULLIF(NEW.raw_user_meta_data->>'nom_boutique', ''), 'Ma boutique');
  _ville        := NULLIF(NEW.raw_user_meta_data->>'ville', '');
  _pin          := NULLIF(NEW.raw_user_meta_data->>'pin_caisse', '');
  _code         := NULLIF(NEW.raw_user_meta_data->>'code_unique', '');

  IF _code IS NULL THEN
    _code := upper(substring(encode(gen_random_bytes(4), 'hex') FROM 1 FOR 6));
  END IF;

  INSERT INTO public.boutiques (nom, ville, proprietaire_id, code_unique, pin_caisse, actif)
  VALUES (_nom_boutique, _ville, NEW.id, _code, _pin, true);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
