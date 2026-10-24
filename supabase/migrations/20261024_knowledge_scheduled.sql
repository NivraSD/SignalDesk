-- Policies announced ahead of time: a version whose effective date is in the future is 'scheduled'
-- and doesn't replace the current one until that date. A daily job promotes it and retires the
-- version it replaces (timestamped), the same way an upload does.
alter table knowledge_documents drop constraint if exists knowledge_documents_status_check;
alter table knowledge_documents add constraint knowledge_documents_status_check
  check (status in ('current','superseded','draft','scheduled'));

create or replace function knowledge_promote_scheduled() returns int language plpgsql security definer set search_path to public as $$
declare d record; n int := 0;
begin
  for d in
    select * from knowledge_documents
    where status = 'scheduled' and effective_date is not null
      and effective_date <= (now() at time zone 'America/New_York')::date
    order by effective_date
  loop
    update knowledge_documents
      set status = 'superseded', superseded_at = now(), superseded_by = d.id
      where organization_id = d.organization_id and series_key = d.series_key and id <> d.id and status = 'current';
    update knowledge_documents set status = 'current' where id = d.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function knowledge_promote_scheduled() from public, anon, authenticated;
grant execute on function knowledge_promote_scheduled() to service_role;
select cron.unschedule(jobname) from cron.job where jobname = 'knowledge-promote-scheduled';
select cron.schedule('knowledge-promote-scheduled', '5 5 * * *', $$select knowledge_promote_scheduled()$$);  -- ~1 AM Eastern
