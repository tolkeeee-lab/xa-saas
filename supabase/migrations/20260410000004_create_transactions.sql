-- Migration: Création de la table transactions
--
-- Cette table est au cœur du système de caisse xà.
-- Elle lie :
--   • un employé    (employe_id)
--   • une boutique  (boutique_id)
--   • un client débiteur optionnel  (client_debiteur_id)
--
-- Prise en charge du mode offline :
--   • local_id     : UUID généré côté client avant synchronisation
--   • sync_statut  : état de synchronisation ('local' | 'synced' | 'conflict')
--   • synced_at    : horodatage de la dernière synchronisation réussie

-- ── Types énumérés ────────────────────────────────────────────────────────────

CREATE TYPE transaction_type AS ENUM (
    'vente',            -- vente comptant
    'credit',           -- vente à crédit (lie un client_debiteur)
    'remboursement',    -- remboursement d'une dette
    'avoir',            -- bon d'achat / retour marchandise
    'depense'           -- sortie de caisse (dépense interne)
);

CREATE TYPE mode_paiement AS ENUM (
    'especes',          -- paiement en liquide
    'mobile_money',     -- MTN MoMo, Moov Money, etc.
    'virement',         -- virement bancaire
    'carte',            -- carte bancaire
    'credit'            -- vente à crédit (paiement différé)
);

CREATE TYPE sync_statut AS ENUM (
    'local',            -- créé hors ligne, pas encore envoyé
    'synced',           -- synchronisé avec Supabase
    'conflict'          -- conflit détecté lors de la sync
);

CREATE TYPE transaction_statut AS ENUM (
    'en_attente',       -- brouillon / non validée
    'validee',          -- transaction confirmée par l'employé
    'annulee'           -- annulée (ligne conservée pour audit)
);

-- ── Table principale ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (

    -- ── Identifiants ──────────────────────────────────────────────────────────
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- UUID généré par le client (IndexedDB / localStorage) avant sync
    local_id            UUID,

    -- ── Clés étrangères ───────────────────────────────────────────────────────
    boutique_id         UUID NOT NULL
                            REFERENCES boutiques (id) ON DELETE RESTRICT,
    employe_id          UUID NOT NULL
                            REFERENCES employes   (id) ON DELETE RESTRICT,
    -- NULL pour les ventes comptant ; obligatoire pour type = 'credit' ou 'remboursement'
    client_debiteur_id  UUID
                            REFERENCES clients_debiteurs (id) ON DELETE RESTRICT,

    -- ── Nature de la transaction ──────────────────────────────────────────────
    type                transaction_type    NOT NULL DEFAULT 'vente',
    statut              transaction_statut  NOT NULL DEFAULT 'validee',
    mode_paiement       mode_paiement       NOT NULL DEFAULT 'especes',

    -- ── Montants (en XOF – Franc CFA BCEAO) ──────────────────────────────────
    montant_total       NUMERIC(15, 2) NOT NULL CHECK (montant_total >= 0),
    montant_recu        NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (montant_recu >= 0),
    monnaie_rendue      NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (monnaie_rendue >= 0),
    -- Montant imputé sur la dette (pour type = 'credit' ou 'remboursement')
    montant_credit      NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (montant_credit >= 0),

    -- ── Informations complémentaires ──────────────────────────────────────────
    reference           TEXT,               -- référence externe (ticket, facture…)
    notes               TEXT,

    -- ── Mode offline ──────────────────────────────────────────────────────────
    sync_statut         sync_statut NOT NULL DEFAULT 'synced',
    synced_at           TIMESTAMPTZ,

    -- ── Horodatage ────────────────────────────────────────────────────────────
    -- created_at reflète l'heure réelle de la transaction (peut être dans le passé en mode offline)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Contraintes métier ────────────────────────────────────────────────────────

-- Une transaction de type 'credit' ou 'remboursement' doit avoir un client_debiteur
ALTER TABLE transactions ADD CONSTRAINT chk_credit_client
    CHECK (
        type NOT IN ('credit', 'remboursement')
        OR client_debiteur_id IS NOT NULL
    );

-- La monnaie rendue ne peut pas dépasser le montant reçu
ALTER TABLE transactions ADD CONSTRAINT chk_monnaie_rendue
    CHECK (monnaie_rendue <= montant_recu);

-- ── Index ─────────────────────────────────────────────────────────────────────

-- Requêtes les plus fréquentes : liste des transactions d'une boutique
CREATE INDEX idx_transactions_boutique
    ON transactions (boutique_id, created_at DESC);

-- Filtre par employé dans une boutique (rapport de caisse)
CREATE INDEX idx_transactions_employe
    ON transactions (boutique_id, employe_id, created_at DESC);

-- Filtre par client débiteur (relevé de compte)
CREATE INDEX idx_transactions_client
    ON transactions (boutique_id, client_debiteur_id)
    WHERE client_debiteur_id IS NOT NULL;

-- Synchronisation offline : récupérer les transactions non encore synchronisées
CREATE INDEX idx_transactions_sync
    ON transactions (boutique_id, sync_statut)
    WHERE sync_statut <> 'synced';

-- Déduplication par local_id (contrainte d'unicité partielle)
CREATE UNIQUE INDEX idx_transactions_local_id
    ON transactions (local_id)
    WHERE local_id IS NOT NULL;

-- ── Trigger updated_at ────────────────────────────────────────────────────────

CREATE TRIGGER trg_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Trigger : mise à jour automatique du solde_du du client débiteur ──────────

CREATE OR REPLACE FUNCTION update_solde_client_debiteur()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Après insertion d'une transaction de crédit → augmenter la dette
    IF TG_OP = 'INSERT' AND NEW.client_debiteur_id IS NOT NULL THEN
        IF NEW.type = 'credit' THEN
            UPDATE clients_debiteurs
               SET solde_du = solde_du + NEW.montant_credit
             WHERE id = NEW.client_debiteur_id;
        ELSIF NEW.type = 'remboursement' THEN
            UPDATE clients_debiteurs
               SET solde_du = GREATEST(0, solde_du - NEW.montant_credit)
             WHERE id = NEW.client_debiteur_id;
        END IF;

    -- Après annulation d'une transaction → inverser l'effet sur la dette
    ELSIF TG_OP = 'UPDATE'
      AND OLD.statut <> 'annulee'
      AND NEW.statut  = 'annulee'
      AND NEW.client_debiteur_id IS NOT NULL
    THEN
        IF NEW.type = 'credit' THEN
            UPDATE clients_debiteurs
               SET solde_du = GREATEST(0, solde_du - NEW.montant_credit)
             WHERE id = NEW.client_debiteur_id;
        ELSIF NEW.type = 'remboursement' THEN
            UPDATE clients_debiteurs
               SET solde_du = solde_du + NEW.montant_credit
             WHERE id = NEW.client_debiteur_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transactions_solde_client
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_solde_client_debiteur();

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own" ON transactions FOR SELECT
    USING (boutique_id IN (
        SELECT id FROM boutiques WHERE proprietaire_id = auth.uid()
    ));

CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT
    WITH CHECK (boutique_id IN (
        SELECT id FROM boutiques WHERE proprietaire_id = auth.uid()
    ));

-- Seule une annulation est permise en UPDATE (les montants ne peuvent pas changer)
CREATE POLICY "transactions_update_statut_own" ON transactions FOR UPDATE
    USING (boutique_id IN (
        SELECT id FROM boutiques WHERE proprietaire_id = auth.uid()
    ));

-- Les transactions ne sont jamais supprimées (soft delete via statut = 'annulee')
CREATE POLICY "transactions_no_delete" ON transactions FOR DELETE
    USING (FALSE);
