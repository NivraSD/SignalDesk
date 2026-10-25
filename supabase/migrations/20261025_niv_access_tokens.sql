-- Personal access tokens for NIV's MCP server (Claude Desktop, Claude Code, Cursor, Copilot…).
-- A token acts as one person in one org, with exactly their permissions. Only a SHA-256 hash is
-- stored; the token is shown once at creation. Membership is re-checked on every request.
create table if not exists niv_access_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  token_prefix text not null,          -- first characters, for recognizing a token in the list
  token_hash text not null unique,
  scopes text[] not null default '{read,ask}',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
create index if not exists niv_access_tokens_user on niv_access_tokens(user_id, organization_id);
alter table niv_access_tokens enable row level security;
revoke all on niv_access_tokens from anon, authenticated;
