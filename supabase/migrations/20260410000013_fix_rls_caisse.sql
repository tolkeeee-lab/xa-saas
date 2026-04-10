-- Migration 013 : Suppression des politiques RLS trop permissives sur boutiques et employes
-- pour l'accès public caisse.
-- Ces accès sont désormais gérés par des API routes sécurisées (service-role).

DROP POLICY IF EXISTS "boutiques_select_by_code" ON public.boutiques;
DROP POLICY IF EXISTS "employes_select_by_boutique_public" ON public.employes;
DROP POLICY IF EXISTS "produits_public_read" ON public.produits;
