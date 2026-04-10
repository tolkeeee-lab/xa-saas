/**
 * types/database.ts
 *
 * Définitions TypeScript générées à partir du schéma Supabase xà.
 * Ces types peuvent être régénérés automatiquement avec :
 *   npx supabase gen types typescript --project-id <project-id> > types/database.ts
 */

// ── Enums ─────────────────────────────────────────────────────────────────────

export type TransactionType =
  | 'vente'
  | 'credit'
  | 'remboursement'
  | 'avoir'
  | 'depense';

export type ModePaiement =
  | 'especes'
  | 'mobile_money'
  | 'virement'
  | 'carte'
  | 'credit';

export type SyncStatut = 'local' | 'synced' | 'conflict';

export type TransactionStatut = 'en_attente' | 'validee' | 'annulee';

// ── Boutique ──────────────────────────────────────────────────────────────────

export type Boutique = {
  id: string;
  nom: string;
  adresse: string | null;
  telephone: string | null;
  ville: string | null;
  proprietaire_id: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export type BoutiqueInsert = Omit<Boutique, 'id' | 'created_at' | 'updated_at'>;
export type BoutiqueUpdate = Partial<BoutiqueInsert>;

// ── Employe ───────────────────────────────────────────────────────────────────

export type EmployeRole = 'caissier' | 'gerant' | 'admin';

export type Employe = {
  id: string;
  boutique_id: string;
  nom: string;
  prenom: string | null;
  telephone: string | null;
  /** Code PIN haché côté application (ne jamais stocker en clair) */
  pin: string | null;
  role: EmployeRole;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export type EmployeInsert = Omit<Employe, 'id' | 'created_at' | 'updated_at'>;
export type EmployeUpdate = Partial<EmployeInsert>;

// ── ClientDebiteur ────────────────────────────────────────────────────────────

export type ClientDebiteur = {
  id: string;
  boutique_id: string;
  nom: string;
  prenom: string | null;
  telephone: string | null;
  adresse: string | null;
  /** Montant total dû (en XOF). Positif = le client doit de l'argent. */
  solde_du: number;
  plafond_credit: number | null;
  actif: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientDebiteurInsert = Omit<
  ClientDebiteur,
  'id' | 'created_at' | 'updated_at'
>;
export type ClientDebiteurUpdate = Partial<ClientDebiteurInsert>;

// ── Transaction ───────────────────────────────────────────────────────────────

export type Transaction = {
  id: string;
  /** UUID généré côté client avant synchronisation (mode offline) */
  local_id: string | null;

  boutique_id: string;
  employe_id: string;
  /** Null pour les ventes comptant ; obligatoire pour type 'credit' ou 'remboursement' */
  client_debiteur_id: string | null;

  type: TransactionType;
  statut: TransactionStatut;
  mode_paiement: ModePaiement;

  /** Montant total de la transaction (XOF) */
  montant_total: number;
  /** Montant effectivement remis par le client */
  montant_recu: number;
  /** Monnaie rendue au client */
  monnaie_rendue: number;
  /** Montant imputé sur la dette (pour 'credit' et 'remboursement') */
  montant_credit: number;

  reference: string | null;
  notes: string | null;

  sync_statut: SyncStatut;
  synced_at: string | null;

  created_at: string;
  updated_at: string;
}

export type TransactionInsert = Omit<
  Transaction,
  'id' | 'updated_at'
> & {
  /** Généré automatiquement par la base si absent */
  id?: string;
  /** Par défaut NOW() si absent */
  created_at?: string;
};

export type TransactionUpdate = Partial<
  Pick<
    Transaction,
    | 'id'
    | 'statut'
    | 'notes'
    | 'reference'
    | 'sync_statut'
    | 'synced_at'
  >
>;

// ── Relations (pour les jointures courantes) ──────────────────────────────────

export type TransactionAvecRelations = Transaction & {
  boutique: Pick<Boutique, 'id' | 'nom'>;
  employe: Pick<Employe, 'id' | 'nom' | 'prenom' | 'role'>;
  client_debiteur: Pick<
    ClientDebiteur,
    'id' | 'nom' | 'prenom' | 'telephone' | 'solde_du'
  > | null;
}

// ── Database (compatible avec le client Supabase généré) ──────────────────────

export type Database = {
  public: {
    Tables: {
      boutiques: {
        Row: Boutique;
        Insert: BoutiqueInsert;
        Update: BoutiqueUpdate;
        Relationships: [];
      };
      employes: {
        Row: Employe;
        Insert: EmployeInsert;
        Update: EmployeUpdate;
        Relationships: [];
      };
      clients_debiteurs: {
        Row: ClientDebiteur;
        Insert: ClientDebiteurInsert;
        Update: ClientDebiteurUpdate;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: TransactionInsert;
        Update: TransactionUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      transaction_type: TransactionType;
      mode_paiement: ModePaiement;
      sync_statut: SyncStatut;
      transaction_statut: TransactionStatut;
    };
    CompositeTypes: Record<string, never>;
  };
}
