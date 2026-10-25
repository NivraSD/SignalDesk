-- OAuth 2.1 for NIV's MCP server, so claude.ai, ChatGPT, Copilot and other MCP clients can connect
-- with "Sign in with Nivria" instead of a pasted token. Public clients with PKCE (S256) only.
-- Clients arrive by Dynamic Client Registration (niv_oauth_clients) or by Client ID Metadata
-- Document (client_id is an https URL; cached here too). Each approved connection is one row in
-- niv_access_tokens (so it shows in "Connect your AI tools" and can be revoked there): the access
-- token expires after an hour and the refresh token rotates on every use.

create table if not exists niv_oauth_clients (
  client_id text primary key,
  kind text not null check (kind in ('dcr', 'cimd')),
  client_name text not null,
  client_uri text,
  logo_uri text,
  redirect_uris text[] not null,
  created_at timestamptz not null default now(),
  fetched_at timestamptz             -- cimd: when the metadata document was last fetched
);

create table if not exists niv_oauth_codes (
  code_hash text primary key,
  client_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  redirect_uri text not null,
  code_challenge text not null,
  scopes text[] not null,
  resource text,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table niv_access_tokens
  add column if not exists oauth_client_id text,
  add column if not exists expires_at timestamptz,          -- null for personal tokens (no expiry)
  add column if not exists refresh_hash text unique,
  add column if not exists refresh_expires_at timestamptz;

alter table niv_oauth_clients enable row level security;
alter table niv_oauth_codes enable row level security;
revoke all on niv_oauth_clients, niv_oauth_codes from anon, authenticated;

-- Clean up expired codes daily.
select cron.unschedule('niv-oauth-cleanup') where exists (select 1 from cron.job where jobname = 'niv-oauth-cleanup');
select cron.schedule('niv-oauth-cleanup', '17 4 * * *', $$
  delete from niv_oauth_codes where expires_at < now() - interval '1 day';
  update niv_access_tokens set revoked_at = now()
    where oauth_client_id is not null and revoked_at is null and refresh_expires_at < now();
$$);
