-- Triggers qui alimentent automatiquement activity_events depuis les events métier
-- Adaptés au schéma xa-saas (proprietaire_id, statut='validee', colonnes réelles)

-- ──────────────────────────────────────────────────────────
-- a) Trigger sur transactions → type 'sale'
-- ──────────────────────────────────────────────────────────
create or replace function public.log_transaction_activity()
returns trigger language plpgsql security definer as $$
declare
  v_proprietaire_id uuid;
begin
  if NEW.statut = 'validee' then
    select proprietaire_id into v_proprietaire_id
      from public.boutiques
     where id = NEW.boutique_id;

    if v_proprietaire_id is not null then
      insert into public.activity_events (
        proprietaire_id, boutique_id, type, severity,
        title, description, amount, metadata
      ) values (
        v_proprietaire_id,
        NEW.boutique_id,
        'sale',
        'success',
        'Vente #' || NEW.id::text,
        coalesce('Mode : ' || NEW.mode_paiement, 'Nouvelle vente validée'),
        NEW.montant_total,
        jsonb_build_object(
          'mode_paiement', NEW.mode_paiement,
          'transaction_id', NEW.id
        )
      );
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists transactions_activity_log on public.transactions;
create trigger transactions_activity_log
  after insert on public.transactions
  for each row execute function public.log_transaction_activity();


-- ──────────────────────────────────────────────────────────
-- b) Trigger sur produits → type 'stock' (stock bas / rupture)
-- ──────────────────────────────────────────────────────────
create or replace function public.log_stock_activity()
returns trigger language plpgsql security definer as $$
declare
  v_proprietaire_id uuid;
begin
  -- Ne déclenche que si le niveau de stock a changé
  if OLD.stock_actuel is distinct from NEW.stock_actuel then
    if NEW.seuil_alerte > 0 and NEW.stock_actuel <= NEW.seuil_alerte then
      select proprietaire_id into v_proprietaire_id
        from public.boutiques
       where id = NEW.boutique_id;

      if v_proprietaire_id is not null then
        insert into public.activity_events (
          proprietaire_id, boutique_id, type, severity,
          title, description, metadata
        ) values (
          v_proprietaire_id,
          NEW.boutique_id,
          'stock',
          case when NEW.stock_actuel = 0 then 'danger' else 'warning' end,
          case when NEW.stock_actuel = 0
               then 'Rupture de stock : ' || NEW.nom
               else 'Stock bas (' || NEW.stock_actuel::text || ') : ' || NEW.nom
          end,
          'Seuil d''alerte : ' || NEW.seuil_alerte::text,
          jsonb_build_object(
            'produit_id',    NEW.id,
            'stock_actuel',  NEW.stock_actuel,
            'seuil_alerte',  NEW.seuil_alerte
          )
        );
      end if;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists produits_stock_activity_log on public.produits;
create trigger produits_stock_activity_log
  after update on public.produits
  for each row execute function public.log_stock_activity();
