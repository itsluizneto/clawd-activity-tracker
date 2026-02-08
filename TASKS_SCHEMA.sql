-- Task board schema (run in Supabase SQL editor)

create table if not exists public.tasks (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  status text not null check (status in ('backlog','in_progress','blocked','done')),
  title text not null,
  summary text,
  last_update text,
  priority integer not null default 3,
  tags text[] not null default '{}'
);

create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_updated_at on public.tasks(updated_at);

-- Simple trigger to maintain updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();
