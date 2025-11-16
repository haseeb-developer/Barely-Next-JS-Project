-- Emoji reactions schema

create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.confessions_posts(id) on delete cascade,
  emoji text not null,
  user_id text not null,
  user_type text not null check (user_type in ('clerk','anonymous')),
  created_at timestamptz not null default now(),
  unique (post_id, emoji, user_id, user_type)
);

create index if not exists idx_post_reactions_post_emoji on public.post_reactions(post_id, emoji);

alter table public.post_reactions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='post_reactions' and policyname='post_reactions_select') then
    create policy post_reactions_select on public.post_reactions for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='post_reactions' and policyname='post_reactions_insert') then
    create policy post_reactions_insert on public.post_reactions for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='post_reactions' and policyname='post_reactions_delete') then
    create policy post_reactions_delete on public.post_reactions for delete using (true);
  end if;
end $$;

create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.confessions_comments(id) on delete cascade,
  emoji text not null,
  user_id text not null,
  user_type text not null check (user_type in ('clerk','anonymous')),
  created_at timestamptz not null default now(),
  unique (comment_id, emoji, user_id, user_type)
);

create index if not exists idx_comment_reactions_comment_emoji on public.comment_reactions(comment_id, emoji);

alter table public.comment_reactions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='comment_reactions' and policyname='comment_reactions_select') then
    create policy comment_reactions_select on public.comment_reactions for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='comment_reactions' and policyname='comment_reactions_insert') then
    create policy comment_reactions_insert on public.comment_reactions for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='comment_reactions' and policyname='comment_reactions_delete') then
    create policy comment_reactions_delete on public.comment_reactions for delete using (true);
  end if;
end $$;


