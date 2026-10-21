-- Journal tasks/events can be put on (or kept off) the Home schedule. Default true keeps today's behavior.
alter table grounded_journal_entries add column if not exists on_schedule boolean not null default true;
