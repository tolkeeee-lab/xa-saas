-- Trigger: auto-create boutique on new user signup
-- Uses SECURITY DEFINER to bypass RLS (runs as postgres, not as the user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.boutiques (nom, proprietaire_id, actif)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'nom_boutique', 'Ma boutique'),
    NEW.id,
    TRUE
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Boutique already exists for this user (e.g. duplicate trigger call), ignore
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: could not create boutique for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
