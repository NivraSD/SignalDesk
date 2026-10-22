-- Grounded for more than one person: each person's areas, name and story live in data, not code.

-- Areas: [{id, name, icon, color, description, enabled, isGrounding?, isWeekly?}], in display order.
-- Ids stay stable when an area is renamed, so past check-ins keep lining up.
alter table grounded_user_settings add column if not exists areas jsonb;
alter table grounded_user_settings add column if not exists onboarded_at timestamptz;

-- "Your story": optional, one row per section, in the person's own words.
create table if not exists grounded_user_story (
  user_id    uuid not null references auth.users(id) on delete cascade,
  section    text not null check (section in ('people','life','working_with','hard','events','helps')),
  content    text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, section)
);
alter table grounded_user_story enable row level security;
drop policy if exists grounded_user_story_user on grounded_user_story;
create policy grounded_user_story_user on grounded_user_story
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
