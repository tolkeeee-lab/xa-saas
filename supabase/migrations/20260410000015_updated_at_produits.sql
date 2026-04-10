-- Migration 015 : Ajout du trigger updated_at sur la table produits.

CREATE TRIGGER trg_produits_updated_at
  BEFORE UPDATE ON public.produits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
