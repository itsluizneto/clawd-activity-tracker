-- Create table + indexes for Activity Tracker
-- Run this in Supabase SQL Editor

create table if not exists public.activities (
  id bigserial primary key,
  ts bigint not null,
  type text not null,
  title text not null,
  details text,
  tags text[] not null default '{}'
);

create index if not exists idx_activities_ts on public.activities(ts);
create index if not exists idx_activities_type on public.activities(type);

-- Optional: enable RLS if you later add auth. For now we rely on server-side Service Role key.
-- alter table public.activities enable row level security;
