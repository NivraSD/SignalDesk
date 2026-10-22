-- Laugh: what each person has already been served, so poems and jokes never repeat for them.
create table if not exists grounded_laugh_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('poem','joke')),
  content     text not null,
  classic_id  text,            -- set when the joke came from the credited classics list
  created_at  timestamptz not null default now()
);
create index if not exists grounded_laugh_history_user_idx on grounded_laugh_history (user_id, kind, created_at desc);
alter table grounded_laugh_history enable row level security;
drop policy if exists grounded_laugh_history_own on grounded_laugh_history;
create policy grounded_laugh_history_own on grounded_laugh_history for select using (auth.uid() = user_id);
