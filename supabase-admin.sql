-- User suspensions and moderation audit log

create table if not exists public.user_suspensions (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('clerk','anonymous','ip')),
  subject_id text not null,
  action text not null check (action in ('ban','terminate')),
  reason text,
  created_at timestamptz not null default now(),
  created_by text, -- admin user id/email
  expires_at timestamptz, -- null for permanent bans
  active boolean not null default true
);

create index if not exists idx_user_suspensions_subject on public.user_suspensions(subject_type, subject_id, active);
create index if not exists idx_user_suspensions_expires on public.user_suspensions(expires_at);

alter table public.user_suspensions enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_suspensions' and policyname='user_suspensions_select'
  ) then
    create policy user_suspensions_select on public.user_suspensions for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_suspensions' and policyname='user_suspensions_insert'
  ) then
    create policy user_suspensions_insert on public.user_suspensions for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_suspensions' and policyname='user_suspensions_update'
  ) then
    create policy user_suspensions_update on public.user_suspensions for update using (true);
  end if;
end $$;

create table if not exists public.moderation_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id text,
  actor_email text,
  action text not null,
  subject_type text,
  subject_id text,
  meta jsonb,
  created_at timestamptz not null default now()
);

alter table public.moderation_audit_log enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='moderation_audit_log' and policyname='moderation_audit_log_select'
  ) then
    create policy moderation_audit_log_select on public.moderation_audit_log for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='moderation_audit_log' and policyname='moderation_audit_log_insert'
  ) then
    create policy moderation_audit_log_insert on public.moderation_audit_log for insert with check (true);
  end if;
end $$;


