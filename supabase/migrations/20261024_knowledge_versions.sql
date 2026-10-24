-- Versions and dates for the knowledge base.
-- Binding documents (policies) never decay: they are correct until a newer version replaces them.
-- A "series" groups versions of the same document; within a series the newest effective date
-- (then highest version) is current, whatever order the files were uploaded in. When a document
-- is superseded we record when, and by what.
alter table knowledge_documents
  add column if not exists series_key text,                 -- normalized title, e.g. "travel expense policy"
  add column if not exists version_number numeric,          -- parsed from version text ("v2.0", "Rev 4", "Version 1.3")
  add column if not exists date_precision text,             -- day | month | quarter | half | year
  add column if not exists date_source text,                -- e.g. 'Effective July 1, 2026'
  add column if not exists dates_mentioned jsonb not null default '[]',  -- [{text, date, precision}]
  add column if not exists superseded_at timestamptz,
  add column if not exists superseded_by uuid references knowledge_documents(id) on delete set null,
  add column if not exists salience_score double precision not null default 1.0,
  add column if not exists last_accessed_at timestamptz not null default now(),
  add column if not exists access_count int not null default 0;
create index if not exists knowledge_documents_series on knowledge_documents(organization_id, series_key);

-- Decay: binding documents are exempt; guidance decays slowly; reference/context faster.
-- Floor at 0.1 so old material is demoted, never lost. Run daily.
create or replace function knowledge_apply_decay() returns int language plpgsql security definer set search_path to public as $$
declare n int;
begin
  update knowledge_documents d
  set salience_score = greatest(0.1, d.salience_score * power(1 - case d.authority when 'guidance' then 0.005 else 0.015 end,
        extract(epoch from (now() - d.last_accessed_at)) / 86400.0))
  where d.authority <> 'binding' and d.salience_score > 0.1;
  get diagnostics n = row_count;
  return n;
end $$;

-- Using a document (NIV cites it) refreshes its salience.
create or replace function knowledge_touch(p_ids uuid[]) returns void language sql security definer set search_path to public as $$
  update knowledge_documents set last_accessed_at = now(), access_count = access_count + 1,
    salience_score = least(1.0, salience_score + 0.2) where id = any(p_ids)
$$;
revoke execute on function knowledge_apply_decay() from public, anon, authenticated;
revoke execute on function knowledge_touch(uuid[]) from public, anon, authenticated;
grant execute on function knowledge_apply_decay() to service_role;
grant execute on function knowledge_touch(uuid[]) to service_role;

-- Search ranks: similarity, then current over superseded, then (for non-binding docs only) salience.
create or replace function match_knowledge(
  p_org uuid, p_user uuid, query_embedding vector(1024), match_count int default 12, include_superseded boolean default true
) returns table (
  chunk_id uuid, document_id uuid, title text, doc_type text, authority text, status text, version text,
  owner text, effective_date date, date_precision text, superseded_at timestamptz, section text, page int,
  content text, similarity double precision
) language sql stable security definer set search_path to public, extensions as $$
  select c.id, d.id, d.title, d.doc_type, d.authority, d.status, d.version, d.owner, d.effective_date, d.date_precision,
         d.superseded_at, c.section, c.page, c.content, 1 - (c.embedding <=> query_embedding) as similarity
  from knowledge_chunks c
  join knowledge_documents d on d.id = c.document_id
  where c.organization_id = p_org
    and d.ingest_status = 'ready'
    and (include_superseded or d.status <> 'superseded')
    and knowledge_can_see(p_org, p_user, d.visibility)
    and c.embedding is not null
  order by (c.embedding <=> query_embedding)
           + case when d.status = 'superseded' then 0.08 else 0 end
           + case when d.authority = 'binding' then 0 else (1 - d.salience_score) * 0.05 end
  limit match_count
$$;
revoke execute on function match_knowledge(uuid, uuid, vector, int, boolean) from public, anon, authenticated;
grant execute on function match_knowledge(uuid, uuid, vector, int, boolean) to service_role;

-- Daily decay at 2:15 AM UTC (the Memory Vault decay job is also scheduled here; it wasn't running).
select cron.unschedule(jobname) from cron.job where jobname in ('knowledge-decay', 'memory-vault-salience-decay');
select cron.schedule('knowledge-decay', '15 2 * * *', $$select knowledge_apply_decay()$$);
select cron.schedule('memory-vault-salience-decay', '10 2 * * *', $$select apply_salience_decay()$$);
