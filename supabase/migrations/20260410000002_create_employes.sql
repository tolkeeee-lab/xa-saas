-- Migration: Création de la table employes
-- Un employé appartient à une boutique et peut effectuer des transactions

CREATE TABLE IF NOT EXISTS employes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boutique_id UUID NOT NULL REFERENCES boutiques (id) ON DELETE CASCADE,
    nom         TEXT NOT NULL,
    prenom      TEXT,
    telephone   TEXT,
    pin         TEXT,                            -- code PIN local (haché côté app) pour accès rapide
    role        TEXT NOT NULL DEFAULT 'caissier' CHECK (role IN ('caissier', 'gerant', 'admin')),
    actif       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour filtrer les employés par boutique
CREATE INDEX idx_employes_boutique ON employes (boutique_id);

CREATE TRIGGER trg_employes_updated_at
    BEFORE UPDATE ON employes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Row Level Security : via appartenance à la boutique du propriétaire
ALTER TABLE employes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employes_select_own" ON employes FOR SELECT
    USING (boutique_id IN (
        SELECT id FROM boutiques WHERE proprietaire_id = auth.uid()
    ));

CREATE POLICY "employes_insert_own" ON employes FOR INSERT
    WITH CHECK (boutique_id IN (
        SELECT id FROM boutiques WHERE proprietaire_id = auth.uid()
    ));

CREATE POLICY "employes_update_own" ON employes FOR UPDATE
    USING (boutique_id IN (
        SELECT id FROM boutiques WHERE proprietaire_id = auth.uid()
    ));

CREATE POLICY "employes_delete_own" ON employes FOR DELETE
    USING (boutique_id IN (
        SELECT id FROM boutiques WHERE proprietaire_id = auth.uid()
    ));
