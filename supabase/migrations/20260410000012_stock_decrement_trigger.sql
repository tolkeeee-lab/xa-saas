CREATE OR REPLACE FUNCTION public.decrement_stock_on_transaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.produits
  SET stock_actuel = stock_actuel - NEW.quantite,
      updated_at = NOW()
  WHERE id = NEW.produit_id AND NEW.produit_id IS NOT NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_stock ON public.transaction_lignes;
CREATE TRIGGER trg_decrement_stock
  AFTER INSERT ON public.transaction_lignes
  FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_transaction();
