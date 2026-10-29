-- One row per org per day for the scheduled morning pipeline (/api/cron/morning-synthesis).
-- Each cron tick runs the next stage and checkpoints its output here, so a stage that fails is
-- retried on the next tick instead of the whole run being lost. Service role only.
create table if not exists scheduled_pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  run_date date not null,
  next_stage text not null default 'select',
  status text not null default 'running' check (status in ('running', 'done', 'failed')),
  attempts int not null default 0,
  state jsonb not null default '{}'::jsonb,
  log jsonb not null default '[]'::jsonb,
  lock_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, run_date)
);

alter table scheduled_pipeline_runs enable row level security;
