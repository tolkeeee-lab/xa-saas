-- Migration: Création de la table clients_debiteurs
-- Un client débiteur est un acheteur à crédit enregistré dans la boutique

CREATE TABLE IF NOT EXISTS clients_debiteurs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boutique_id     UUID NOT NULL REFERENCES boutiques (id) ON DELETE CASCADE,
    nom             TEXT NOT NULL,
    prenom          TEXT,
    telephone       TEXT,
    adresse         TEXT,
    -- Solde débiteur courant (positif = il doit de l'argent)
    solde_du        NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    -- Plafond de crédit autorisé (NULL = pas de limite)
    plafond_credit  NUMERIC(15, 2),
    actif           BOOLEAN NOT NULL DEFAULT TRUE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour rechercher un client par boutique et par nom/téléphone
CREATE INDEX idx_clients_debiteurs_boutique  ON clients_debiteurs (boutique_id);
CREATE INDEX idx_clients_debiteurs_telephone ON clients_debiteurs (boutique_id, telephone);

CREATE TRIGGER trg_clients_debiteurs_updated_at
    BEFORE UPDATE ON clients_debiteurs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Row Level Security
ALTER TABLE clients_debiteurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_debiteurs_select_own" ON clients_debiteurs FOR SELECT
    USING (boutique_id IN (
        SELECT id FROM boutiques WHERE proprietaire_id = auth.uid()
    ));

CREATE POLICY "clients_debiteurs_insert_own" ON clients_debiteurs FOR INSERT
    WITH CHECK (boutique_id IN (
        SELECT id FROM boutiques WHERE proprietaire_id = auth.uid()
    ));

CREATE POLICY "clients_debiteurs_update_own" ON clients_debiteurs FOR UPDATE
    USING (boutique_id IN (
        SELECT id FROM boutiques WHERE proprietaire_id = auth.uid()
    ));

CREATE POLICY "clients_debiteurs_delete_own" ON clients_debiteurs FOR DELETE
    USING (boutique_id IN (
        SELECT id FROM boutiques WHERE proprietaire_id = auth.uid()
    ));
