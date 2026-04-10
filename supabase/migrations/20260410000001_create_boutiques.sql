-- Migration: Création de la table boutiques
-- Boutique = point de vente physique géré par un propriétaire

CREATE TABLE IF NOT EXISTS boutiques (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom         TEXT NOT NULL,
    adresse     TEXT,
    telephone   TEXT,
    ville       TEXT,
    proprietaire_id UUID,                        -- lié à auth.users
    actif       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour filtrer par propriétaire
CREATE INDEX idx_boutiques_proprietaire ON boutiques (proprietaire_id);

-- Trigger de mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_boutiques_updated_at
    BEFORE UPDATE ON boutiques
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Row Level Security : chaque utilisateur ne voit que ses boutiques
ALTER TABLE boutiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boutiques_select_own"  ON boutiques FOR SELECT  USING (proprietaire_id = auth.uid());
CREATE POLICY "boutiques_insert_own"  ON boutiques FOR INSERT  WITH CHECK (proprietaire_id = auth.uid());
CREATE POLICY "boutiques_update_own"  ON boutiques FOR UPDATE  USING (proprietaire_id = auth.uid());
CREATE POLICY "boutiques_delete_own"  ON boutiques FOR DELETE  USING (proprietaire_id = auth.uid());
