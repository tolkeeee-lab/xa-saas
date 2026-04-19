-- Table d'événements d'activité pour la timeline live du dashboard
-- Adaptée au schéma xa-saas : proprietaire_id au lieu de tenant_id
create table if not exists public.activity_events (
  id               uuid        primary key default gen_random_uuid(),
  proprietaire_id  uuid        not null references auth.users(id) on delete cascade,
  boutique_id      uuid        references public.boutiques(id) on delete cascade,
  type             text        not null check (type in ('sale','alert','stock','staff','goal','system')),
  severity         text        not null default 'info'
                               check (severity in ('info','success','warning','danger')),
  title            text        not null,
  description      text,
  metadata         jsonb       default '{}'::jsonb,
  amount           numeric,
  created_at       timestamptz not null default now()
);

create index if not exists activity_events_proprietaire_created_idx
  on public.activity_events(proprietaire_id, created_at desc);
create index if not exists activity_events_boutique_created_idx
  on public.activity_events(boutique_id, created_at desc);
create index if not exists activity_events_type_idx
  on public.activity_events(type);

-- RLS
alter table public.activity_events enable row level security;

-- Policy : le propriétaire lit ses propres events
create policy "activity_events_select_own"
  on public.activity_events for select
  using (proprietaire_id = auth.uid());

-- Policy : le propriétaire insère ses propres events (caisse / triggers service role)
create policy "activity_events_insert_own"
  on public.activity_events for insert
  with check (proprietaire_id = auth.uid());

-- Realtime
alter publication supabase_realtime add table public.activity_events;
