-- Comments schema for confessions posts
-- Tables: confessions_comments, confessions_comment_likes
-- Supports Clerk and anonymous users, with RLS

-- Comments table
create table if not exists public.confessions_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.confessions_posts(id) on delete cascade,
  user_id text not null,
  user_type text not null check (user_type in ('clerk','anonymous')),
  username text not null,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

-- Likes on comments
create table if not exists public.confessions_comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.confessions_comments(id) on delete cascade,
  user_id text not null,
  user_type text not null check (user_type in ('clerk','anonymous')),
  created_at timestamptz not null default now(),
  unique(comment_id, user_id, user_type)
);

-- Indexes
create index if not exists idx_conf_comments_post_id on public.confessions_comments(post_id);
create index if not exists idx_conf_comments_created_at on public.confessions_comments(created_at desc);
create index if not exists idx_conf_comment_likes_comment_id on public.confessions_comment_likes(comment_id);

-- Enable RLS
alter table public.confessions_comments enable row level security;
alter table public.confessions_comment_likes enable row level security;

-- Policies (read for all; write for authenticated via either path using service endpoints)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'confessions_comments' and policyname = 'comments_select_all'
  ) then
    create policy comments_select_all on public.confessions_comments for select using (true);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'confessions_comment_likes' and policyname = 'comment_likes_select_all'
  ) then
    create policy comment_likes_select_all on public.confessions_comment_likes for select using (true);
  end if;
end$$;

-- Insert/update/delete will be proxied via Next.js API (service role if needed)
-- Optional: allow anonymous insert via anon key if you rely on user_id in payload
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'confessions_comments' and policyname = 'comments_insert_all'
  ) then
    create policy comments_insert_all on public.confessions_comments for insert with check (true);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'confessions_comment_likes' and policyname = 'comment_likes_insert_all'
  ) then
    create policy comment_likes_insert_all on public.confessions_comment_likes for insert with check (true);
  end if;
end$$;

-- Allow deleting likes (needed to unlike)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'confessions_comment_likes' and policyname = 'comment_likes_delete_all'
  ) then
    create policy comment_likes_delete_all on public.confessions_comment_likes for delete using (true);
  end if;
end$$;


