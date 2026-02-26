-- Grounded Art: AI-generated lock screen art pieces
-- Each piece is unique per user, never repeated

create table if not exists grounded_art_pieces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  image_url text not null,
  prompt_seed jsonb,
  created_at timestamptz default now()
);

-- Fast user lookups ordered by recency
create index if not exists idx_grounded_art_user
  on grounded_art_pieces(user_id, created_at desc);

-- RLS
alter table grounded_art_pieces enable row level security;

-- Users can read their own art
create policy "Users see own art"
  on grounded_art_pieces for select
  using (auth.uid() = user_id);

-- Service role has full access (for edge function inserts)
create policy "Service role full access"
  on grounded_art_pieces for all
  using (auth.role() = 'service_role');

-- Storage bucket for art images (public read, service role upload)
-- Run this in SQL editor since storage.buckets requires direct SQL:
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'grounded-art',
  'grounded-art',
  true,
  5242880, -- 5MB limit
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- Storage policy: anyone can read (public bucket)
create policy "Public read grounded-art"
  on storage.objects for select
  using (bucket_id = 'grounded-art');

-- Storage policy: service role can upload
create policy "Service role upload grounded-art"
  on storage.objects for insert
  with check (bucket_id = 'grounded-art');
