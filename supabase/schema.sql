-- Run in the Supabase SQL editor for a NEW project.
create table if not exists public.user_anime (
  user_id uuid not null references auth.users(id) on delete cascade,
  anime_id integer not null check (anime_id > 0),
  favorite boolean not null default false,
  status text not null default 'planned' check (status in ('planned', 'watching', 'completed', 'onhold', 'dropped')),
  current_episode integer not null default 0 check (current_episode >= 0),
  episode_notes jsonb not null default '{}'::jsonb,
  primary key (user_id, anime_id)
);
alter table public.user_anime enable row level security;
create policy "Users read their library" on public.user_anime for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add to their library" on public.user_anime for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update their library" on public.user_anime for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete from their library" on public.user_anime for delete to authenticated using ((select auth.uid()) = user_id);
