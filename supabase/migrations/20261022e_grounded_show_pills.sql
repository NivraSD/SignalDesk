-- The pill tracker is optional: each person can turn it off in Settings.
alter table grounded_user_settings add column if not exists show_pills boolean not null default true;
