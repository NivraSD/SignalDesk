-- One row per executive synthesis emailed (synthesis-email edge function), so none is sent twice.
-- Recipients per org live in organizations.settings.synthesis_emails (array of addresses).
create table if not exists synthesis_email_log (
  synthesis_id uuid primary key references executive_synthesis(id) on delete cascade,
  organization_id text not null,
  recipients text[] not null,
  resend_id text,
  sent_at timestamptz not null default now()
);
alter table synthesis_email_log enable row level security;
revoke all on synthesis_email_log from anon, authenticated;
