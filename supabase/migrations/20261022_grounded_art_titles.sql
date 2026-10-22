-- Grounded art titles: a curated two-word bank, then automatic remixes of its words.
-- The art generator asks grounded_next_art_title() for each piece instead of inventing a title.
create table if not exists grounded_art_titles (
  id         text primary key,                 -- slug of the title
  title      text not null unique,
  register   text not null,
  form       text not null default '',         -- nv | vn | va | av ('' for hand-added)
  source     text not null default 'bank' check (source in ('bank','remix')),
  active     boolean not null default true,    -- false = cut in the Title Bank
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
alter table grounded_art_titles enable row level security;  -- server-only (service role bypasses RLS)

-- Next title: an unused bank title at random; once the bank is used up, a remix of bank words
-- in one of four shapes (noun+verb, verb+noun, verb+adverb, adverb+verb) that hasn't been used.
-- Only -ing verbs are remixed, so "rising river" works and "settles river" can't happen.
create or replace function grounded_next_art_title()
returns table (title text, register text, source text)
language plpgsql
security definer
set search_path = public
as $$
declare
  picked record;
  w1 text; w2 text; shape text; reg text; candidate text;
  tries int := 0;
begin
  update grounded_art_titles t set used_at = now()
  where t.id = (
    select b.id from grounded_art_titles b
    where b.source = 'bank' and b.active and b.used_at is null
    order by random() limit 1
    for update skip locked
  )
  returning t.title, t.register, t.source into picked;
  if picked.title is not null then
    return query select picked.title, picked.register, picked.source;
    return;
  end if;

  loop
    tries := tries + 1;
    exit when tries > 40;
    shape := (array['nv','vn','va','av'])[1 + floor(random() * 4)::int];

    if shape in ('nv','vn') then
      select x.noun, x.register into w1, reg from (
        select split_part(b.title,' ',1) noun, b.register from grounded_art_titles b where b.source='bank' and b.active and b.form='nv'
        union all
        select split_part(b.title,' ',2), b.register from grounded_art_titles b where b.source='bank' and b.active and b.form='vn'
      ) x order by random() limit 1;
    end if;

    select x.verb into w2 from (
      select split_part(b.title,' ',2) verb from grounded_art_titles b where b.source='bank' and b.active and b.form in ('nv','av')
      union all
      select split_part(b.title,' ',1) from grounded_art_titles b where b.source='bank' and b.active and b.form in ('vn','va')
    ) x where x.verb like '%ing' order by random() limit 1;

    if shape in ('va','av') then
      select x.adv, x.register into w1, reg from (
        select split_part(b.title,' ',2) adv, b.register from grounded_art_titles b where b.source='bank' and b.active and b.form='va'
        union all
        select split_part(b.title,' ',1), b.register from grounded_art_titles b where b.source='bank' and b.active and b.form='av'
      ) x order by random() limit 1;
    end if;

    continue when w1 is null or w2 is null or w1 = w2;
    candidate := case shape
      when 'nv' then w1 || ' ' || w2
      when 'vn' then w2 || ' ' || w1
      when 'va' then w2 || ' ' || w1
      else w1 || ' ' || w2 end;
    continue when exists (select 1 from grounded_art_titles t where t.title = candidate);

    insert into grounded_art_titles (id, title, register, form, source, used_at)
    values (regexp_replace(candidate, '[^a-z0-9]+', '-', 'g'), candidate, coalesce(reg, 'existential'), shape, 'remix', now());
    return query select candidate, coalesce(reg, 'existential'), 'remix'::text;
    return;
  end loop;

  raise exception 'grounded_next_art_title: no unused title could be made';
end;
$$;

revoke all on function grounded_next_art_title() from public, anon, authenticated;
grant execute on function grounded_next_art_title() to service_role;
