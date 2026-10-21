-- Morning check-in mirrors the evening's six areas (present tense) instead of generic body/mind chips.
-- areas: { [areaId]: { score: 1-5, note?: text } }
alter table grounded_morning_checkins add column if not exists areas jsonb not null default '{}'::jsonb;
alter table grounded_morning_checkins drop column if exists body;
alter table grounded_morning_checkins drop column if exists mind;
alter table grounded_morning_checkins drop column if exists word;
