-- Each person's own Google Calendar id (shared with the Grounded service account). Null = no calendar.
-- It was hardcoded to the founder's calendar, which every account would have read and written.
alter table grounded_user_settings add column if not exists calendar_id text;
update grounded_user_settings set calendar_id = 'jl@nivria.ai' where user_id = 'aa40db0f-ec2f-45cc-840f-e227c830e175';
