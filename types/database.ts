clients: {
  Row: Client;
  Insert: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'points' | 'total_achats' | 'nb_visites' | 'actif'> &
    Partial<Pick<Client, 'id' | 'created_at' | 'updated_at' | 'points' | 'total_achats' | 'nb_visites' | 'actif'>>;
  Update: Partial<Omit<Client, 'id'>>;
  Relationships: [];
};