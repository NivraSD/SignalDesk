-- Grounded: morning check-in. Present-only (how you're arriving now), plus whether today follows
-- last night's plan or a fresh one. One row per user per day.
create table if not exists grounded_morning_checkins (
  user_id        uuid        not null references auth.users(id) on delete cascade,
  checkin_date   date        not null,
  body           text,
  mind           text,
  word           text,
  plan_choice    text        not null default 'keep' check (plan_choice in ('keep','new')),
  today_schedule jsonb,
  intention      text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  primary key (user_id, checkin_date)
);

alter table grounded_morning_checkins enable row level security;

drop policy if exists grounded_morning_checkins_user on grounded_morning_checkins;
create policy grounded_morning_checkins_user on grounded_morning_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
