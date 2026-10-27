-- Content exposure flags: a passage in a document everyone can see that repeats specific facts from
-- a restricted document (e.g. a pitch deck's speaker notes quoting the exec/sales-only discount
-- authority). Found by knowledge-exposure-scan: embedding neighbours as candidates, Gemini decides.
-- NIV withholds flagged passages that look accidental from people who can't see the restricted
-- source, and tells owners/admins about every flag so they can fix the document or mark it fine.

create table if not exists knowledge_exposures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  open_document_id uuid not null references knowledge_documents(id) on delete cascade,
  open_chunk_id uuid references knowledge_chunks(id) on delete set null,   -- null once re-ingested
  content_hash text not null,                 -- sha-256 of the open passage; dismissals survive re-ingest
  open_excerpt text not null,
  restricted_document_id uuid not null references knowledge_documents(id) on delete cascade,
  restricted_chunk_id uuid references knowledge_chunks(id) on delete set null,
  similarity double precision,
  facts text[] not null default '{}',         -- what it repeats, in a few words each
  likely_intentional boolean not null default false,  -- reads like a deliberate all-staff share (all-hands, CEO memo): flag only, don't withhold
  status text not null default 'open' check (status in ('open', 'dismissed', 'resolved')),
  detected_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  unique (open_document_id, content_hash, restricted_document_id)
);
create index if not exists knowledge_exposures_open on knowledge_exposures(organization_id, status);
create index if not exists knowledge_exposures_chunk on knowledge_exposures(open_chunk_id) where status = 'open';
alter table knowledge_exposures enable row level security;
revoke all on knowledge_exposures from anon, authenticated;

-- Candidate pairs: for each passage in a non-superseded document visible to everyone, its nearest
-- passages in restricted documents (up to 3, above p_min_sim). p_doc limits the scan to pairs that
-- involve that document (on either side). Short boilerplate passages are skipped.
create or replace function knowledge_exposure_candidates(p_org uuid, p_doc uuid default null, p_min_sim double precision default 0.8)
returns table (
  open_chunk_id uuid, open_document_id uuid, open_title text, open_section text, open_content text,
  restricted_chunk_id uuid, restricted_document_id uuid, restricted_title text, restricted_visibility text[], restricted_content text,
  similarity double precision
)
language sql stable
set search_path = public, extensions
as $$
  select o.id, o.document_id, od.title, o.section, o.content,
         r.id, r.document_id, r.title, r.visibility, r.content, r.sim
  from knowledge_chunks o
  join knowledge_documents od on od.id = o.document_id
  cross join lateral (
    select rc.id, rc.document_id, rd.title, rd.visibility, rc.content, 1 - (rc.embedding <=> o.embedding) as sim
    from knowledge_chunks rc
    join knowledge_documents rd on rd.id = rc.document_id
    where rd.organization_id = p_org
      and not ('all' = any(rd.visibility))
      and rd.status <> 'superseded'
      and rc.embedding is not null
      and length(rc.content) >= 80
      and (p_doc is null or od.id = p_doc or rd.id = p_doc)
    order by rc.embedding <=> o.embedding
    limit 3
  ) r
  where od.organization_id = p_org
    and 'all' = any(od.visibility)
    and od.status <> 'superseded'
    and o.embedding is not null
    and length(o.content) >= 80
    and r.sim >= p_min_sim
$$;
revoke all on function knowledge_exposure_candidates(uuid, uuid, double precision) from public, anon, authenticated;
grant execute on function knowledge_exposure_candidates(uuid, uuid, double precision) to service_role;

alter table knowledge_exposures add column if not exists likely_intentional boolean not null default false;
