-- Grounded wallpaper rotation: every Shortcut run gets a different piece from the whole library.
-- Unseen pieces first (random order), then least-recently shown, so nothing repeats until the
-- library has been cycled. Calls within p_window_seconds of a pick return the same piece, so the
-- Shortcut's separate title and image requests stay paired.

alter table grounded_art_pieces add column if not exists last_served_at timestamptz;
create index if not exists grounded_art_pieces_rotation_idx
  on grounded_art_pieces (user_id, last_served_at nulls first);

create or replace function grounded_pick_wallpaper(p_user uuid, p_window_seconds int default 30)
returns table (id uuid, title text, image_url text)
language plpgsql
security definer
set search_path = public
as $$
declare
  cur record;
begin
  select a.id, a.title, a.image_url, a.last_served_at into cur
  from grounded_art_pieces a
  where a.user_id = p_user and a.last_served_at is not null
  order by a.last_served_at desc
  limit 1;

  if cur.id is not null and cur.last_served_at > now() - make_interval(secs => p_window_seconds) then
    return query select cur.id, cur.title, cur.image_url;
    return;
  end if;

  return query
  update grounded_art_pieces p
  set last_served_at = now()
  where p.id = (
    select a.id from grounded_art_pieces a
    where a.user_id = p_user and a.image_url is not null
    order by a.last_served_at asc nulls first, random()
    limit 1
    for update skip locked
  )
  returning p.id, p.title, p.image_url;
end;
$$;

-- Server-only: the wallpaper route calls this with the service role.
revoke all on function grounded_pick_wallpaper(uuid, int) from public, anon, authenticated;
grant execute on function grounded_pick_wallpaper(uuid, int) to service_role;

-- 17 new pieces a day: hourly 06:00–22:00 US Eastern (EDT = UTC-4; shifts an hour earlier under EST).
select cron.alter_job(
  (select jobid from cron.job where jobname = 'grounded-art-generate'),
  schedule := '0 0-2,10-23 * * *'
);
