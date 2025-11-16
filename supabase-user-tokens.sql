-- Table to track tokens for both Clerk and anonymous users
create table if not exists user_tokens (
  user_id text not null,
  user_type text not null check (user_type in ('clerk','anonymous')),
  balance integer not null default 0,
  last_awarded_at timestamptz,
  primary key (user_id, user_type)
);

alter table user_tokens enable row level security;

-- Allow read access
create policy if not exists "Allow read tokens" on user_tokens
for select using (true);

-- Allow insert/update (we rely on service client in API route for writes)
create policy if not exists "Allow upsert tokens" on user_tokens
for all using (true) with check (true);


