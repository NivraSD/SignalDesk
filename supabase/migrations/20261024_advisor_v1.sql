-- NIV v2 ("second brain" advisor): one voice, background specialists, shared case files.
-- Everything is per organization; the API checks org_users membership before any read/write,
-- and the browser only gets read access (RLS) to its own org's rows for Realtime.

-- What NIV is focused on: one case file per subject (an opportunity now; briefs/research later).
-- Specialists write findings here; NIV reads it every turn, so it always "knows" what they found.
create table if not exists advisor_case_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  subject_type text not null,                 -- 'opportunity' (v1)
  subject_id uuid not null,
  summary text,                               -- NIV's running summary of where things stand
  findings jsonb not null default '[]',       -- [{at, by:'researcher', question, answer, sources:[{title,url}]}]
  open_questions jsonb not null default '[]', -- things worth checking next
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (organization_id, subject_type, subject_id)
);

-- The conversation (server-side, survives reloads). A thread belongs to a user + a subject.
create table if not exists advisor_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  case_file_id uuid references advisor_case_files(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists advisor_threads_user_case on advisor_threads(user_id, case_file_id);

create table if not exists advisor_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references advisor_threads(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  meta jsonb not null default '{}',           -- {proposal:{...}} / {job_id} / {from:'researcher'}
  created_at timestamptz not null default now()
);
create index if not exists advisor_messages_thread on advisor_messages(thread_id, created_at);

-- Background work by specialists (researcher in v1). NIV queues; a worker runs; results land in
-- the case file and as a NIV follow-up message.
create table if not exists advisor_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  thread_id uuid not null references advisor_threads(id) on delete cascade,
  case_file_id uuid not null references advisor_case_files(id) on delete cascade,
  kind text not null,                          -- 'research'
  input jsonb not null,                        -- {question}
  status text not null default 'queued' check (status in ('queued','running','done','failed')),
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create index if not exists advisor_jobs_status on advisor_jobs(status, created_at);

-- Taste: the person's own judgment, in their words. NIV reads it every turn and adds to it when
-- they state a preference ("never lead with fear", "shorter pitches"). Per user (it's *their*
-- second brain), optionally scoped to one org.
create table if not exists advisor_taste (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  note text not null,
  source text not null default 'stated',       -- 'stated' | 'from_edit'
  created_at timestamptz not null default now()
);
create index if not exists advisor_taste_user on advisor_taste(user_id, created_at desc);

-- RLS: service role does all writes via the API. Browsers may only SELECT their own org's
-- messages/jobs/case files (for Realtime) and their own taste notes.
alter table advisor_case_files enable row level security;
alter table advisor_threads enable row level security;
alter table advisor_messages enable row level security;
alter table advisor_jobs enable row level security;
alter table advisor_taste enable row level security;

create policy advisor_case_files_read on advisor_case_files for select to authenticated
  using (organization_id in (select organization_id from org_users where user_id = auth.uid()));
create policy advisor_threads_read on advisor_threads for select to authenticated
  using (user_id = auth.uid());
create policy advisor_messages_read on advisor_messages for select to authenticated
  using (thread_id in (select id from advisor_threads where user_id = auth.uid()));
create policy advisor_jobs_read on advisor_jobs for select to authenticated
  using (thread_id in (select id from advisor_threads where user_id = auth.uid()));
create policy advisor_taste_read on advisor_taste for select to authenticated
  using (user_id = auth.uid());

alter publication supabase_realtime add table advisor_messages;
alter publication supabase_realtime add table advisor_jobs;
