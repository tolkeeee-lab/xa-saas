CREATE POLICY "boutiques_select_by_code" ON boutiques FOR SELECT USING (code_unique IS NOT NULL);
CREATE POLICY "employes_select_by_boutique_public" ON employes FOR SELECT USING (actif = true);
