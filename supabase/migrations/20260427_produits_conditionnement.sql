-- ⚠️  DO NOT run this migration automatically from code.
-- Execute it manually in the Supabase SQL Editor after merging this PR.

-- Étendre la table produits avec les colonnes de conditionnement / lot
alter table public.produits
  add column if not exists mode_achat text not null default 'unite'
    check (mode_achat in ('unite', 'lot')),
  add column if not exists qty_par_lot integer,
  add column if not exists prix_lot_achat numeric(12, 2),
  add column if not exists lot_label text,
  add column if not exists unite_label text;

-- la colonne prix_achat (unitaire) existante est conservée comme "vérité" :
-- si mode_achat = 'lot', l'API calcule : prix_achat = round(prix_lot_achat / qty_par_lot, 2)

comment on column public.produits.mode_achat is 'unite | lot — comment le commerçant achète ce produit';
comment on column public.produits.qty_par_lot is 'Nb d''unités dans 1 lot/carton (si mode_achat=lot)';
comment on column public.produits.prix_lot_achat is 'Prix d''achat d''un lot complet (si mode_achat=lot)';
comment on column public.produits.lot_label is 'Nom du conditionnement: carton, sachet, bidon, palette...';
comment on column public.produits.unite_label is 'Nom de l''unité: bouteille, kg, paquet, pièce...';
