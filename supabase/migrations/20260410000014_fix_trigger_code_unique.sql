-- Migration 014 : Correction du trigger handle_new_user
-- Utilise NULLIF pour éviter qu'une chaîne vide soit stockée comme code_unique.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.boutiques (nom, proprietaire_id, actif, code_unique, pin_caisse)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'nom_boutique', 'Ma boutique'),
    NEW.id, TRUE,
    NULLIF(UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'code_unique', ''))), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'pin_caisse', '')), '')
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: could not create boutique for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
