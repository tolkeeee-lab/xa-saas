CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.boutiques (nom, proprietaire_id, actif, code_unique, pin_caisse)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'nom_boutique', 'Ma boutique'),
    NEW.id, TRUE,
    UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'code_unique', ''))),
    NEW.raw_user_meta_data->>'pin_caisse'
  );
  RETURN NEW;
END;
$$;
