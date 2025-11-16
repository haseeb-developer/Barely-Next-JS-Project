-- Add is_admin flag to posts so all users can see the verified badge without extra lookups
alter table confessions_posts
add column if not exists is_admin boolean not null default false;


