-- NIV knowledge base: a company's own documents (handbooks, policies, precedent memos, research,
-- financials, decks), searchable passage by passage with citations, and permission-aware.
--
-- Authority drives how NIV uses a document:
--   binding   = policy; must follow, flag conflicts      (doc_type policy, brand rules, binding memos)
--   guidance  = how we've done it / strong default         (precedent, playbooks)
--   reference = evidence and context                       (research, financials, notes)
-- Visibility: 'all' (whole org) or a list of teams; a person's teams live on org_users.teams.
-- Owners/admins see everything.

alter table org_users add column if not exists teams text[] not null default '{}';

create table if not exists knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  slug text,
  doc_type text not null default 'reference' check (doc_type in ('policy','precedent','memo','playbook','research','financial','brand','reference')),
  authority text not null default 'reference' check (authority in ('binding','guidance','reference')),
  status text not null default 'current' check (status in ('current','superseded','draft')),
  version text,
  owner text,
  effective_date date,
  supersedes_id uuid references knowledge_documents(id) on delete set null,
  visibility text[] not null default '{all}',          -- {'all'} or team names, e.g. {'exec','sales'}
  summary text,
  tags text[] not null default '{}',
  file_path text,                                       -- in the private 'knowledge' storage bucket
  mime_type text,
  file_size bigint,
  page_count int,
  ingest_status text not null default 'pending' check (ingest_status in ('pending','processing','ready','failed')),
  ingest_error text,
  classified_by text not null default 'uploader',       -- uploader | model (needs human confirm) | confirmed
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);
create index if not exists knowledge_documents_org on knowledge_documents(organization_id, status);

create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references knowledge_documents(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  chunk_index int not null,
  section text,                 -- heading path, e.g. "3. Approval Authority > 3.2 Managers"
  page int,                     -- page (pdf) or slide (pptx) number when known
  content text not null,
  embedding vector(1024),
  created_at timestamptz not null default now()
);
create index if not exists knowledge_chunks_doc on knowledge_chunks(document_id, chunk_index);
create index if not exists knowledge_chunks_org on knowledge_chunks(organization_id);
create index if not exists knowledge_chunks_embedding on knowledge_chunks using hnsw (embedding vector_cosine_ops);

-- Can this person see this document? Owners/admins: everything. Others: 'all' or a shared team.
create or replace function knowledge_can_see(p_org uuid, p_user uuid, p_visibility text[])
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from org_users ou
    where ou.organization_id = p_org and ou.user_id = p_user
      and (ou.role in ('owner','admin') or 'all' = any(p_visibility) or ou.teams && p_visibility)
  )
$$;

-- Semantic search over passages the person is allowed to see. Current docs rank ahead of
-- superseded ones (which still return, flagged, so NIV can explain what changed).
create or replace function match_knowledge(
  p_org uuid, p_user uuid, query_embedding vector(1024), match_count int default 12, include_superseded boolean default true
) returns table (
  chunk_id uuid, document_id uuid, title text, doc_type text, authority text, status text, version text,
  owner text, effective_date date, section text, page int, content text, similarity double precision
) language sql stable security definer set search_path to public, extensions as $$
  select c.id, d.id, d.title, d.doc_type, d.authority, d.status, d.version, d.owner, d.effective_date,
         c.section, c.page, c.content, 1 - (c.embedding <=> query_embedding) as similarity
  from knowledge_chunks c
  join knowledge_documents d on d.id = c.document_id
  where c.organization_id = p_org
    and d.ingest_status = 'ready'
    and (include_superseded or d.status <> 'superseded')
    and knowledge_can_see(p_org, p_user, d.visibility)
    and c.embedding is not null
  order by (c.embedding <=> query_embedding) + case when d.status = 'superseded' then 0.08 else 0 end
  limit match_count
$$;
revoke execute on function match_knowledge(uuid, uuid, vector, int, boolean) from public, anon, authenticated;

-- RLS: browsers may read document metadata they can see; passages and writes go through the server.
alter table knowledge_documents enable row level security;
alter table knowledge_chunks enable row level security;
drop policy if exists knowledge_documents_read on knowledge_documents;
create policy knowledge_documents_read on knowledge_documents for select to authenticated
  using (knowledge_can_see(organization_id, auth.uid(), visibility));

-- Private bucket for the original files (never public URLs).
insert into storage.buckets (id, name, public) values ('knowledge', 'knowledge', false)
  on conflict (id) do update set public = false;

grant execute on function match_knowledge(uuid, uuid, vector, int, boolean) to service_role;
grant execute on function knowledge_can_see(uuid, uuid, text[]) to service_role, authenticated;
