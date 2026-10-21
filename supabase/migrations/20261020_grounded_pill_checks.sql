-- Grounded: pill tracker. One row per (user, day, slot) that was taken; missing row = not taken.
create table if not exists grounded_pill_checks (
  user_id   uuid        not null references auth.users(id) on delete cascade,
  day       date        not null,
  slot      text        not null check (slot in ('morning','afternoon','evening','night')),
  taken_at  timestamptz not null default now(),
  primary key (user_id, day, slot)
);

alter table grounded_pill_checks enable row level security;

drop policy if exists grounded_pill_checks_user on grounded_pill_checks;
create policy grounded_pill_checks_user on grounded_pill_checks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
