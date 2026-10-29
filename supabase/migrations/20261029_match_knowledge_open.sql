-- Company knowledge for content written AS the organization (published pieces): only current
-- documents visible to everyone, so restricted material never ends up in public copy. Accidental
-- repeats of restricted content (knowledge_exposures, open and not intentional) are excluded too.
create or replace function match_knowledge_open(p_org uuid, query_embedding vector(1024), match_count int default 6)
returns table (chunk_id uuid, document_id uuid, title text, doc_type text, authority text, version text, section text, content text, similarity double precision)
language sql stable
set search_path = public, extensions
as $$
  select c.id, d.id, d.title, d.doc_type, d.authority, d.version, c.section, c.content, 1 - (c.embedding <=> query_embedding)
  from knowledge_chunks c
  join knowledge_documents d on d.id = c.document_id
  where c.organization_id = p_org
    and 'all' = any(d.visibility)
    and d.status = 'current'
    and d.ingest_status = 'ready'
    and not exists (select 1 from knowledge_exposures e where e.open_chunk_id = c.id and e.status = 'open' and not e.likely_intentional)
  order by c.embedding <=> query_embedding
  limit match_count
$$;
revoke all on function match_knowledge_open(uuid, vector, int) from public, anon, authenticated;
grant execute on function match_knowledge_open(uuid, vector, int) to service_role;
