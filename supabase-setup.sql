-- FUDA アプリ Supabase セットアップ SQL
-- Supabase ダッシュボード > SQL Editor で実行してください

create table if not exists public.items (
  id text primary key,
  team text not null default 'fuda-team',
  data jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.config (
  team text primary key,
  data jsonb
);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.items  to anon, authenticated;
grant select, insert, update, delete on public.config to anon, authenticated;

alter table public.items  enable row level security;
alter table public.config enable row level security;

drop policy if exists "open_items"  on public.items;
drop policy if exists "open_config" on public.config;
create policy "open_items"  on public.items  for all to anon, authenticated using (true) with check (true);
create policy "open_config" on public.config for all to anon, authenticated using (true) with check (true);

do $$ begin
  begin alter publication supabase_realtime add table public.items;  exception when others then null; end;
  begin alter publication supabase_realtime add table public.config; exception when others then null; end;
end $$;
