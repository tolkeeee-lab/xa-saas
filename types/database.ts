export type Profile = {
  id: string;
  role: 'super_admin' | 'proprio';
  nom_complet: string | null;
  telephone: string | null;
  created_at: string;
  updated_at: string;
};

export type Boutique = {
  id: string;
  proprietaire_id: string;
  nom: string;
  ville: string;
  quartier: string | null;
  code_unique: string;
  pin_caisse: string;
  couleur_theme: string;
  actif: boolean;
  // MAFRO v4 extensions (optional — DB columns added in migration, may be absent on older rows)
  slug?: string | null;
  telephone_whatsapp?: string | null;
  adresse?: string | null;
  zone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  horaires?: Record<string, string | null> | null;
  couleur?: string;
  est_actif?: boolean;
  catalogue_public?: boolean;
  created_at: string;
  updated_at: string;
};

export type Employe = {
  id: string;
  boutique_id: string;
  proprietaire_id: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  role: 'caissier' | 'gerant';
  pin: string;
  actif: boolean;
  invite_code: string | null;
  invite_created_at: string | null;
  last_login_at: string | null;
  last_login_ip: string | null;
  failed_pin_attempts: number;
  locked_until: string | null;
  // MAFRO v4 extensions (optional)
  mafro_role?: UserRole;
  pin_hash?: string | null;
  derniere_connexion?: string | null;
  bloque?: boolean;
  motif_blocage?: string | null;
  created_at: string;
  updated_at: string;
};

export type Produit = {
  id: string;
  boutique_id: string;
  nom: string;
  categorie: string;
  description: string | null;
  prix_achat: number;
  prix_vente: number;
  stock_actuel: number;
  seuil_alerte: number;
  unite: string;
  actif: boolean;
  date_peremption: string | null;
  created_at: string;
  updated_at: string;
};

export type Transfert = {
  id: string;
  produit_id: string | null;
  boutique_source_id: string | null;
  boutique_destination_id: string | null;
  quantite: number;
  note: string | null;
  statut: 'en_transit' | 'livre';
  created_at: string;
};

// ProduitPublic — sans prix_achat, pour la caisse
export type ProduitPublic = Omit<Produit, 'prix_achat'>;

export type Transaction = {
  id: string;
  local_id: string | null;
  boutique_id: string;
  employe_id: string | null;
  client_id?: string | null;
  montant_total: number;
  benefice_total: number;
  montant_recu: number;
  monnaie_rendue: number;
  mode_paiement: 'especes' | 'momo' | 'carte' | 'credit';
  client_nom: string | null;
  statut: 'validee' | 'annulee';
  sync_statut: 'local' | 'synced' | 'conflict';
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  proprietaire_id: string;
  nom: string;
  telephone: string | null;
  points: number;
  total_achats: number;
  nb_visites: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
};

export type TransactionLigne = {
  id: string;
  transaction_id: string;
  produit_id: string | null;
  nom_produit: string;
  quantite: number;
  prix_vente_unitaire: number;
  prix_achat_unitaire: number;
  sous_total: number;
  created_at: string;
};

export type Dette = {
  id: string;
  boutique_id: string;
  client_nom: string;
  client_telephone: string | null;
  montant: number;
  montant_rembourse: number;
  description: string | null;
  statut: 'en_attente' | 'paye' | 'en_retard';
  date_echeance: string | null;
  created_at: string;
};

export type Fournisseur = {
  id: string;
  proprietaire_id: string;
  nom: string;
  specialite: string | null;
  delai_livraison: string | null;
  note: number;
  telephone: string | null;
  created_at: string;
};

export type CommandeFournisseur = {
  id: string;
  fournisseur_id: string;
  boutique_id: string;
  montant: number;
  statut: 'en_attente' | 'en_cours' | 'recu';
  note: string | null;
  created_at: string;
};

export type ChargeFixe = {
  id: string;
  proprietaire_id: string;
  boutique_id: string | null;
  libelle: string;
  categorie: 'loyer' | 'salaire' | 'fournisseur' | 'autre';
  montant: number;
  periodicite: 'mensuel' | 'hebdo' | 'annuel';
  actif: boolean;
  created_at: string;
  updated_at: string;
};

export type DetteProprio = {
  id: string;
  proprietaire_id: string;
  libelle: string;
  creancier: string;
  montant: number;
  montant_rembourse: number;
  date_echeance: string | null;
  statut: 'en_cours' | 'rembourse' | 'en_retard';
  notes: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
};

export type BoutiqueObjectif = {
  id: string;
  boutique_id: string;
  proprietaire_id: string;
  mois: string;
  objectif_ca: number;
  created_at: string;
  updated_at: string;
};

export type ActivityEventRow = {
  id: string;
  proprietaire_id: string;
  boutique_id: string | null;
  type: 'sale' | 'alert' | 'stock' | 'staff' | 'goal' | 'system';
  severity: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  amount: number | null;
  created_at: string;
};

export type Inventaire = {
  id: string;
  boutique_id: string;
  proprietaire_id: string;
  created_by: string | null;
  started_at: string;
  validated_at: string | null;
  statut: 'en_cours' | 'valide' | 'annule';
  perimetre: 'complet' | 'categorie' | 'selection';
  categorie: string | null;
  nb_produits: number;
  nb_ecarts_negatifs: number;
  nb_ecarts_positifs: number;
  valeur_ecart_total: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type InventaireLigne = {
  id: string;
  inventaire_id: string;
  produit_id: string;
  stock_theorique: number;
  stock_compte: number | null;
  ecart: number;
  prix_vente_snapshot: number;
  created_at: string;
  updated_at: string;
};

export type CategorieProduit = {
  id: string;
  proprietaire_id: string;
  nom: string;
  couleur: string;
  icone: string;
  ordre: number;
  created_at: string;
  updated_at: string;
};

export type ClotureCaisse = {
  id: string;
  boutique_id: string;
  proprietaire_id: string;
  date: string;
  ca_theorique: number;
  cash_theorique: number;
  cash_reel: number;
  ecart: number;
  nb_transactions: number;
  par_mode: Record<string, number>;
  note: string | null;
  created_at: string;
};

// ─── MAFRO v4 types ───────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'owner' | 'manager' | 'staff';

export type MafroAdmin = {
  id: string;
  user_id: string | null;
  nom: string;
  telephone_whatsapp: string | null;
  est_actif: boolean;
  created_at: string;
};

export type ProduitCatalogueAdmin = {
  id: string;
  nom: string;
  emoji: string;
  categorie: string | null;
  unite: string | null;
  prix_b2b: number;
  prix_conseille: number | null;
  delai_livraison_h: number;
  stock_central: number;
  est_actif: boolean;
  created_at: string;
  updated_at: string;
};

export type CommandeB2B = {
  id: string;
  numero: string;
  boutique_id: string;
  proprietaire_id: string;
  statut: 'soumise' | 'confirmee' | 'preparee' | 'en_route' | 'livree' | 'annulee';
  sous_total: number;
  frais_livraison: number;
  total: number;
  mode_paiement: 'a_la_livraison' | 'momo' | 'virement';
  paiement_status: 'en_attente' | 'paye';
  note: string | null;
  created_at: string;
  confirmed_at: string | null;
  livraison_prevue_at: string | null;
  livree_at: string | null;
};

export type CommandeB2BLigne = {
  id: string;
  commande_id: string;
  produit_admin_id: string | null;
  produit_nom: string;
  produit_emoji: string | null;
  unite: string | null;
  quantite: number;
  prix_unitaire: number;
  total_ligne: number;
};

export type Livraison = {
  id: string;
  commande_b2b_id: string | null;
  numero: string;
  chauffeur: string | null;
  vehicule: string | null;
  statut: 'preparation' | 'en_route' | 'livree' | 'retournee';
  parti_at: string | null;
  livre_at: string | null;
  destination_lat: number | null;
  destination_lng: number | null;
  position_actuelle_lat: number | null;
  position_actuelle_lng: number | null;
  last_ping: string | null;
  note: string | null;
  created_at: string;
};

export type RetraitClient = {
  id: string;
  numero: string;
  boutique_id: string;
  code_retrait: string;
  code_hash: string;
  client_nom: string;
  client_telephone: string;
  lignes: Array<{ produit: string; qty: number; prix: number }>;
  total: number;
  statut: 'en_attente' | 'retire' | 'expire' | 'annule';
  payment_provider: string | null;
  provider_transaction_id: string | null;
  paid_at: string | null;
  retired_at: string | null;
  retired_by_employe_id: string | null;
  expires_at: string;
  created_at: string;
};

export type ClientCRM = {
  id: string;
  telephone: string;
  nom: string | null;
  opt_in_whatsapp: boolean;
  opt_in_at: string | null;
  nb_achats: number;
  ca_total: number;
  dernier_achat_at: string | null;
  premiere_boutique_id: string | null;
  boutiques_visitees: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type PerteDeclaration = {
  id: string;
  boutique_id: string;
  produit_id: string | null;
  produit_nom: string;
  motif: 'sac_perce' | 'perime' | 'vol' | 'erreur_saisie' | 'autre';
  quantite: number;
  valeur_estimee: number;
  note: string | null;
  declared_by_employe_id: string | null;
  declared_by_proprietaire_id: string | null;
  photo_url: string | null;
  statut: 'declaree' | 'validee' | 'contestee' | 'comptabilisee';
  valide_by: string | null;
  valide_at: string | null;
  created_at: string;
};

export type ClotureCaisseJour = {
  id: string;
  boutique_id: string;
  date_cloture: string;
  ouverture_at: string | null;
  fermeture_at: string | null;
  nb_transactions: number;
  ca_calcule: number;
  credits_accordes: number;
  retraits_valides: number;
  cash_compte: number;
  ecart: number;
  statut: 'a_valider' | 'equilibree' | 'manque' | 'excedent';
  ferme_par_employe_id: string | null;
  valide_par: string | null;
  valide_at: string | null;
  note: string | null;
  created_at: string;
};

export type TransfertStock = {
  id: string;
  boutique_source_id: string;
  boutique_destination_id: string;
  produit_id: string;
  quantite: number;
  statut: 'en_attente' | 'recu' | 'annule';
  transfere_par_employe_id: string | null;
  recu_par_employe_id: string | null;
  created_at: string;
  received_at: string | null;
};

// All MAFRO v4 boutique columns are nullable / have DB defaults — keep them optional on Insert
type BoutiqueOptionalKeys =
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'slug'
  | 'est_actif'
  | 'catalogue_public'
  | 'couleur'
  | 'telephone_whatsapp'
  | 'adresse'
  | 'zone'
  | 'latitude'
  | 'longitude'
  | 'horaires';

type EmployeOptionalKeys =
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'failed_pin_attempts'
  | 'invite_code'
  | 'invite_created_at'
  | 'last_login_at'
  | 'last_login_ip'
  | 'locked_until'
  | 'mafro_role'
  | 'pin_hash'
  | 'derniere_connexion'
  | 'bloque'
  | 'motif_blocage';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> &
          Partial<Pick<Profile, 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Profile, 'id'>>;
        Relationships: [];
      };
      boutiques: {
        Row: Boutique;
        Insert: Omit<Boutique, BoutiqueOptionalKeys> &
          Partial<Pick<Boutique, BoutiqueOptionalKeys>>;
        Update: Partial<Omit<Boutique, 'id'>>;
        Relationships: [];
      };
      employes: {
        Row: Employe;
        Insert: Omit<Employe, EmployeOptionalKeys> &
          Partial<Pick<Employe, EmployeOptionalKeys>>;
        Update: Partial<Omit<Employe, 'id'>>;
        Relationships: [];
      };
      produits: {
        Row: Produit;
        Insert: Omit<Produit, 'id' | 'created_at' | 'updated_at' | 'categorie' | 'date_peremption'> &
          Partial<Pick<Produit, 'id' | 'created_at' | 'updated_at' | 'categorie' | 'date_peremption'>>;
        Update: Partial<Omit<Produit, 'id'>>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'local_id' | 'employe_id' | 'client_nom' | 'client_id'> &
          Partial<Pick<Transaction, 'id' | 'created_at' | 'updated_at' | 'local_id' | 'employe_id' | 'client_nom' | 'client_id'>>;
        Update: Partial<Omit<Transaction, 'id'>>;
        Relationships: [];
      };
      transaction_lignes: {
        Row: TransactionLigne;
        Insert: Omit<TransactionLigne, 'id' | 'created_at'> &
          Partial<Pick<TransactionLigne, 'id' | 'created_at'>>;
        Update: Partial<Omit<TransactionLigne, 'id'>>;
        Relationships: [];
      };
      dettes: {
        Row: Dette;
        Insert: Omit<Dette, 'id' | 'created_at'> &
          Partial<Pick<Dette, 'id' | 'created_at'>>;
        Update: Partial<Omit<Dette, 'id'>>;
        Relationships: [];
      };
      fournisseurs: {
        Row: Fournisseur;
        Insert: Omit<Fournisseur, 'id' | 'created_at'> &
          Partial<Pick<Fournisseur, 'id' | 'created_at'>>;
        Update: Partial<Omit<Fournisseur, 'id'>>;
        Relationships: [];
      };
      commandes_fournisseur: {
        Row: CommandeFournisseur;
        Insert: Omit<CommandeFournisseur, 'id' | 'created_at'> &
          Partial<Pick<CommandeFournisseur, 'id' | 'created_at'>>;
        Update: Partial<Omit<CommandeFournisseur, 'id'>>;
        Relationships: [];
      };
      transferts: {
        Row: Transfert;
        Insert: Omit<Transfert, 'id' | 'created_at'> &
          Partial<Pick<Transfert, 'id' | 'created_at'>>;
        Update: Partial<Omit<Transfert, 'id'>>;
        Relationships: [];
      };
      charges_fixes: {
        Row: ChargeFixe;
        Insert: Omit<ChargeFixe, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<ChargeFixe, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<ChargeFixe, 'id'>>;
        Relationships: [];
      };
      dettes_proprio: {
        Row: DetteProprio;
        Insert: Omit<DetteProprio, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<DetteProprio, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<DetteProprio, 'id'>>;
        Relationships: [];
      };
      clotures_caisse: {
        Row: ClotureCaisse;
        Insert: Omit<ClotureCaisse, 'id' | 'ecart' | 'created_at'> &
          Partial<Pick<ClotureCaisse, 'id' | 'created_at'>>;
        Update: Partial<Omit<ClotureCaisse, 'id' | 'ecart'>>;
        Relationships: [];
      };
      boutique_objectifs: {
        Row: BoutiqueObjectif;
        Insert: Omit<BoutiqueObjectif, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<BoutiqueObjectif, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<BoutiqueObjectif, 'id'>>;
        Relationships: [];
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'points' | 'total_achats' | 'nb_visites' | 'actif'> &
          Partial<Pick<Client, 'id' | 'created_at' | 'updated_at' | 'points' | 'total_achats' | 'nb_visites' | 'actif'>>;
        Update: Partial<Omit<Client, 'id'>>;
        Relationships: [];
      };
      activity_events: {
        Row: ActivityEventRow;
        Insert: Omit<ActivityEventRow, 'id' | 'created_at'> &
          Partial<Pick<ActivityEventRow, 'id' | 'created_at'>>;
        Update: Partial<Omit<ActivityEventRow, 'id'>>;
        Relationships: [];
      };
      inventaires: {
        Row: Inventaire;
        Insert: Omit<Inventaire, 'id' | 'created_at' | 'updated_at' | 'nb_produits' | 'nb_ecarts_negatifs' | 'nb_ecarts_positifs' | 'valeur_ecart_total' | 'validated_at' | 'started_at' | 'statut'> &
          Partial<Pick<Inventaire, 'id' | 'created_at' | 'updated_at' | 'nb_produits' | 'nb_ecarts_negatifs' | 'nb_ecarts_positifs' | 'valeur_ecart_total' | 'validated_at' | 'started_at' | 'statut'>>;
        Update: Partial<Omit<Inventaire, 'id'>>;
        Relationships: [];
      };
      inventaire_lignes: {
        Row: InventaireLigne;
        Insert: Omit<InventaireLigne, 'id' | 'created_at' | 'updated_at' | 'ecart' | 'stock_compte'> &
          Partial<Pick<InventaireLigne, 'id' | 'created_at' | 'updated_at' | 'stock_compte'>>;
        Update: Partial<Omit<InventaireLigne, 'id' | 'ecart'>>;
        Relationships: [];
      };
      categories_produits: {
        Row: CategorieProduit;
        Insert: Omit<CategorieProduit, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<CategorieProduit, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<CategorieProduit, 'id'>>;
        Relationships: [];
      };
      // MAFRO v4 tables
      mafro_admins: {
        Row: MafroAdmin;
        Insert: Omit<MafroAdmin, 'id' | 'created_at' | 'est_actif'> &
          Partial<Pick<MafroAdmin, 'id' | 'created_at' | 'est_actif'>>;
        Update: Partial<Omit<MafroAdmin, 'id'>>;
        Relationships: [];
      };
      produits_catalogue_admin: {
        Row: ProduitCatalogueAdmin;
        Insert: Omit<ProduitCatalogueAdmin, 'id' | 'created_at' | 'updated_at' | 'emoji' | 'delai_livraison_h' | 'stock_central' | 'est_actif'> &
          Partial<Pick<ProduitCatalogueAdmin, 'id' | 'created_at' | 'updated_at' | 'emoji' | 'delai_livraison_h' | 'stock_central' | 'est_actif'>>;
        Update: Partial<Omit<ProduitCatalogueAdmin, 'id'>>;
        Relationships: [];
      };
      commandes_b2b: {
        Row: CommandeB2B;
        Insert: Omit<CommandeB2B, 'id' | 'created_at' | 'statut' | 'mode_paiement' | 'paiement_status' | 'frais_livraison'> &
          Partial<Pick<CommandeB2B, 'id' | 'created_at' | 'statut' | 'mode_paiement' | 'paiement_status' | 'frais_livraison'>>;
        Update: Partial<Omit<CommandeB2B, 'id'>>;
        Relationships: [];
      };
      commandes_b2b_lignes: {
        Row: CommandeB2BLigne;
        Insert: Omit<CommandeB2BLigne, 'id'> & Partial<Pick<CommandeB2BLigne, 'id'>>;
        Update: Partial<Omit<CommandeB2BLigne, 'id'>>;
        Relationships: [];
      };
      livraisons: {
        Row: Livraison;
        Insert: Omit<Livraison, 'id' | 'created_at' | 'statut'> &
          Partial<Pick<Livraison, 'id' | 'created_at' | 'statut'>>;
        Update: Partial<Omit<Livraison, 'id'>>;
        Relationships: [];
      };
      retraits_clients: {
        Row: RetraitClient;
        Insert: Omit<RetraitClient, 'id' | 'created_at' | 'statut'> &
          Partial<Pick<RetraitClient, 'id' | 'created_at' | 'statut'>>;
        Update: Partial<Omit<RetraitClient, 'id'>>;
        Relationships: [];
      };
      clients_crm: {
        Row: ClientCRM;
        Insert: Omit<ClientCRM, 'id' | 'created_at' | 'updated_at' | 'nb_achats' | 'ca_total' | 'boutiques_visitees' | 'tags'> &
          Partial<Pick<ClientCRM, 'id' | 'created_at' | 'updated_at' | 'nb_achats' | 'ca_total' | 'boutiques_visitees' | 'tags'>>;
        Update: Partial<Omit<ClientCRM, 'id'>>;
        Relationships: [];
      };
      pertes_declarations: {
        Row: PerteDeclaration;
        Insert: Omit<PerteDeclaration, 'id' | 'created_at' | 'statut'> &
          Partial<Pick<PerteDeclaration, 'id' | 'created_at' | 'statut'>>;
        Update: Partial<Omit<PerteDeclaration, 'id'>>;
        Relationships: [];
      };
      cloture_caisse_jour: {
        Row: ClotureCaisseJour;
        Insert: Omit<ClotureCaisseJour, 'id' | 'created_at' | 'statut' | 'nb_transactions' | 'credits_accordes' | 'retraits_valides'> &
          Partial<Pick<ClotureCaisseJour, 'id' | 'created_at' | 'statut' | 'nb_transactions' | 'credits_accordes' | 'retraits_valides'>>;
        Update: Partial<Omit<ClotureCaisseJour, 'id'>>;
        Relationships: [];
      };
      transferts_stock: {
        Row: TransfertStock;
        Insert: Omit<TransfertStock, 'id' | 'created_at' | 'statut'> &
          Partial<Pick<TransfertStock, 'id' | 'created_at' | 'statut'>>;
        Update: Partial<Omit<TransfertStock, 'id'>>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      validate_inventaire: {
        Args: { inv_id: string };
        Returns: Inventaire[];
      };
      process_sale_v2: {
        Args: {
          p_boutique_id: string;
          p_lignes: unknown;
          p_montant_total: number;
          p_benefice_total: number;
          p_mode_paiement: string;
          p_remise_pct?: number;
          p_montant_recu?: number | null;
          p_monnaie_rendue?: number | null;
          p_client_id?: string | null;
          p_client_nom?: string | null;
          p_client_telephone?: string | null;
          p_local_id?: string | null;
          p_employe_id?: string | null;
        };
        Returns: { transaction_id: string; duplicate: boolean; numero_facture: string };
      };
      // MAFRO v4 RPCs
      validate_retrait_code: {
        Args: { p_code: string; p_boutique_id: string };
        Returns: RetraitClient[];
      };
      mark_retrait_retired: {
        Args: { p_retrait_id: string; p_employe_id: string };
        Returns: RetraitClient;
      };
      submit_b2b_order: {
        Args: { p_boutique_id: string; p_lignes: unknown; p_note?: string | null };
        Returns: CommandeB2B;
      };
      crm_upsert_from_sale: {
        Args: {
          p_telephone: string;
          p_nom: string;
          p_boutique_id: string;
          p_montant: number;
          p_opt_in?: boolean;
        };
        Returns: ClientCRM;
      };
      declare_perte: {
        Args: {
          p_boutique_id: string;
          p_produit_id: string;
          p_motif: string;
          p_quantite: number;
          p_note?: string | null;
        };
        Returns: PerteDeclaration;
      };
      cloturer_caisse: {
        Args: {
          p_boutique_id: string;
          p_date: string;
          p_cash_compte: number;
          p_note?: string | null;
        };
        Returns: ClotureCaisseJour;
      };
      transferer_stock: {
        Args: { p_source: string; p_dest: string; p_produit: string; p_qty: number };
        Returns: TransfertStock;
      };
      recevoir_transfert: {
        Args: { p_transfert_id: string; p_employe_id: string };
        Returns: TransfertStock;
      };
      refresh_mafro_views: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: {
      user_role: UserRole;
    };
  };
};
