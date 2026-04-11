export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
export type TransactionType = 'vente' | 'credit' | 'remboursement' | 'avoir' | 'depense';
export type ModePaiement = 'especes' | 'mobile_money' | 'virement' | 'carte' | 'credit';
export type SyncStatut = 'local' | 'synced' | 'conflict';
export type TransactionStatut = 'en_attente' | 'validee' | 'annulee';
export type EmployeRole = 'caissier' | 'gerant' | 'admin';

export type Boutique = {
  id: string; nom: string; adresse: string | null; telephone: string | null; ville: string | null;
  proprietaire_id: string; code_unique: string | null; pin_caisse: string | null;
  actif: boolean; created_at: string; updated_at: string;
};
export type BoutiqueInsert = Omit<Boutique, 'id' | 'created_at' | 'updated_at'>;
export type BoutiqueUpdate = Partial<BoutiqueInsert>;

export type Employe = {
  id: string; boutique_id: string; nom: string; prenom: string | null; telephone: string | null;
  pin: string | null; role: EmployeRole; actif: boolean; created_at: string; updated_at: string;
};
export type EmployeInsert = Omit<Employe, 'id' | 'created_at' | 'updated_at'>;
export type EmployeUpdate = Partial<EmployeInsert>;

export type Produit = {
  id: string; boutique_id: string; nom: string;
  prix_achat: number; prix_vente: number;
  stock_actuel: number; stock_minimum: number; unite: string;
  actif: boolean; created_at: string; updated_at: string;
};
export type ProduitInsert = Omit<Produit, 'id' | 'created_at' | 'updated_at'>;
export type ProduitUpdate = Partial<ProduitInsert>;

export type ProduitPublic = {
  id: string; boutique_id: string; nom: string; prix_vente: number; stock_actuel: number; unite: string;
};

export type ClientDebiteur = {
  id: string; boutique_id: string; nom: string; prenom: string | null; telephone: string | null;
  solde_du: number; actif: boolean; created_at: string; updated_at: string;
};
export type ClientDebiteurInsert = Omit<ClientDebiteur, 'id' | 'created_at' | 'updated_at'>;

export type Transaction = {
  id: string; local_id: string | null; boutique_id: string; employe_id: string | null;
  client_debiteur_id: string | null; type: TransactionType; statut: TransactionStatut;
  mode_paiement: ModePaiement; montant_total: number; montant_recu: number;
  monnaie_rendue: number; montant_credit: number; reference: string | null; notes: string | null;
  sync_statut: SyncStatut; synced_at: string | null; created_at: string; updated_at: string;
};
export type TransactionInsert = Omit<Transaction, 'id' | 'updated_at'>;
export type TransactionUpdate = Partial<Pick<Transaction, 'statut' | 'sync_statut' | 'synced_at' | 'notes'>>;

export type TransactionLigne = {
  id: string; transaction_id: string; produit_id: string | null; nom_produit: string;
  quantite: number; prix_unitaire: number; sous_total: number; created_at: string;
};
export type TransactionLigneInsert = Omit<TransactionLigne, 'id' | 'sous_total' | 'created_at'>;

export type PushSubscriptionRecord = {
  id: string; user_id: string; endpoint: string; p256dh: string; auth: string; created_at: string;
};
export type PushSubscriptionInsert = Omit<PushSubscriptionRecord, 'id' | 'created_at'>;

export type DetteFournisseur = {
  id: string; boutique_id: string; fournisseur_nom: string; montant: number; montant_paye: number;
  solde: number; description: string | null; echeance: string | null; acquittee: boolean;
  created_at: string; updated_at: string;
};
export type DetteFournisseurInsert = Omit<DetteFournisseur, 'id' | 'solde' | 'created_at' | 'updated_at'>;

export type Database = {
  public: {
    Tables: {
      boutiques: { Row: Boutique; Insert: BoutiqueInsert; Update: BoutiqueUpdate; Relationships: [] };
      employes: { Row: Employe; Insert: EmployeInsert; Update: EmployeUpdate; Relationships: [] };
      produits: { Row: Produit; Insert: ProduitInsert; Update: ProduitUpdate; Relationships: [] };
      clients_debiteurs: { Row: ClientDebiteur; Insert: ClientDebiteurInsert; Update: Partial<ClientDebiteurInsert>; Relationships: [] };
      transactions: { Row: Transaction; Insert: TransactionInsert; Update: TransactionUpdate; Relationships: [] };
      transaction_lignes: { Row: TransactionLigne; Insert: TransactionLigneInsert; Update: Partial<TransactionLigneInsert>; Relationships: [] };
      push_subscriptions: { Row: PushSubscriptionRecord; Insert: PushSubscriptionInsert; Update: Partial<PushSubscriptionInsert>; Relationships: [] };
      dettes_fournisseurs: { Row: DetteFournisseur; Insert: DetteFournisseurInsert; Update: Partial<DetteFournisseurInsert>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
