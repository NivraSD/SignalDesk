# Manual Migration Steps for Supabase Dashboard

## The Issue

You've been running migrations via `psql $DATABASE_URL`, but that connects to **local Postgres**, not **Supabase**.

You need to apply these SQL scripts in the **Supabase Dashboard** → **SQL Editor**.

## Step-by-Step Instructions

### 1. Open Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar

### 2. Create Tables

Copy and paste this SQL into a new query and run it:

```sql
-- Create campaign_presentations table
CREATE TABLE IF NOT EXISTS campaign_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  campaign_id TEXT,

  -- Gamma References
  gamma_id TEXT UNIQUE NOT NULL,
  gamma_url TEXT NOT NULL,
  gamma_edit_url TEXT,

  -- Content (searchable)
  title TEXT NOT NULL,
  topic TEXT,
  slide_count INTEGER NOT NULL DEFAULT 0,
  full_text TEXT,
  slides JSONB,

  -- Files
  pptx_url TEXT,
  pdf_url TEXT,

  -- Metadata
  format TEXT DEFAULT 'presentation' CHECK (format IN ('presentation', 'document', 'social')),
  generation_params JSONB,
  credits_used JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(topic, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(full_text, '')), 'B')
  ) STORED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_presentations_org ON campaign_presentations(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_presentations_campaign ON campaign_presentations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_presentations_gamma_id ON campaign_presentations(gamma_id);
CREATE INDEX IF NOT EXISTS idx_campaign_presentations_search ON campaign_presentations USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_campaign_presentations_created ON campaign_presentations(created_at DESC);

-- Update trigger
CREATE OR REPLACE FUNCTION update_campaign_presentations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_campaign_presentations ON campaign_presentations;
CREATE TRIGGER trigger_update_campaign_presentations
  BEFORE UPDATE ON campaign_presentations
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_presentations_updated_at();
```

### 3. Add Missing Columns to content_library

Run this SQL:

```sql
-- Add missing columns to content_library
ALTER TABLE content_library ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE content_library ADD COLUMN IF NOT EXISTS folder_path TEXT;
ALTER TABLE content_library ADD COLUMN IF NOT EXISTS file_url TEXT;

CREATE INDEX IF NOT EXISTS idx_content_library_session ON content_library(session_id);
CREATE INDEX IF NOT EXISTS idx_content_library_folder ON content_library(folder_path);
```

### 4. Create Storage Bucket

In the Supabase Dashboard:

1. Click **Storage** in the left sidebar
2. Click **New bucket**
3. Set:
   - **Name**: `presentations`
   - **Public bucket**: ✅ Yes
   - **File size limit**: 50 MB (50000000 bytes)
   - **Restrict file upload types**: ✅ Yes (check this first!)
   - Then add **Allowed MIME types**:
     - `application/vnd.openxmlformats-officedocument.presentationml.presentation` (for .pptx)
     - `application/pdf` (for .pdf)
     - `application/vnd.ms-powerpoint` (for legacy .ppt)

   **OR** simply leave "Restrict file upload types" unchecked to allow all types

4. After creating, go to **Policies** tab
5. Click **New Policy** → **For full customization**
6. Add these policies one by one:

**Policy 1 - Public View:**
```sql
CREATE POLICY "Public can view presentations"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'presentations');
```

**Policy 2 - Authenticated Manage:**
```sql
CREATE POLICY "Authenticated can manage presentations"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'presentations')
WITH CHECK (bucket_id = 'presentations');
```

**Policy 3 - Anon Manage:**
```sql
CREATE POLICY "Anon can manage presentations"
ON storage.objects FOR ALL
TO anon
USING (bucket_id = 'presentations')
WITH CHECK (bucket_id = 'presentations');
```

**Policy 4 - Service Role:**
```sql
CREATE POLICY "Service role full access to presentations"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'presentations')
WITH CHECK (bucket_id = 'presentations');
```

### 5. Fix RLS Policies for Tables

Run this SQL:

```sql
-- Enable RLS
ALTER TABLE campaign_presentations ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Authenticated users can view presentations" ON campaign_presentations;
DROP POLICY IF EXISTS "Authenticated users can insert presentations" ON campaign_presentations;
DROP POLICY IF EXISTS "Authenticated users can update presentations" ON campaign_presentations;
DROP POLICY IF EXISTS "Authenticated users can delete presentations" ON campaign_presentations;
DROP POLICY IF EXISTS "Public can view presentations" ON campaign_presentations;
DROP POLICY IF EXISTS "Authenticated can manage presentations" ON campaign_presentations;
DROP POLICY IF EXISTS "Anon can manage presentations" ON campaign_presentations;
DROP POLICY IF EXISTS "Service role full access to presentations" ON campaign_presentations;

-- Create new permissive policies
CREATE POLICY "Public can view presentations"
  ON campaign_presentations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated can manage presentations"
  ON campaign_presentations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can manage presentations"
  ON campaign_presentations FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to presentations"
  ON campaign_presentations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add anon policies to content_library
-- Drop existing policies first if they exist
DROP POLICY IF EXISTS "Anon can view content" ON content_library;
DROP POLICY IF EXISTS "Anon can insert content" ON content_library;
DROP POLICY IF EXISTS "Service role can manage content" ON content_library;

-- Create new policies
CREATE POLICY "Anon can view content"
  ON content_library FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert content"
  ON content_library FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Service role can manage content"
  ON content_library FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### 6. Deploy Edge Function

Back in your terminal:

```bash
supabase functions deploy gamma-presentation
```

### 7. Verify Everything

Run this in Supabase SQL Editor to verify:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
AND tablename IN ('campaign_presentations', 'content_library');

-- Check columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'content_library'
AND column_name IN ('session_id', 'folder_path', 'file_url');

-- Check storage bucket
SELECT id, name, public FROM storage.buckets WHERE name = 'presentations';

-- Check RLS policies
SELECT tablename, policyname, roles
FROM pg_policies
WHERE tablename IN ('campaign_presentations', 'content_library')
ORDER BY tablename, policyname;
```

### 8. Test Again

```bash
node test-gamma-complete.js
```

## Quick Checklist

- [ ] campaign_presentations table created
- [ ] content_library has session_id, folder_path, file_url columns
- [ ] presentations storage bucket created and public
- [ ] Storage bucket has 4 RLS policies
- [ ] campaign_presentations has 4 RLS policies
- [ ] content_library has anon + service_role policies
- [ ] gamma-presentation function deployed
- [ ] Test runs successfully

## If You Still Have Issues

Check your Supabase project URL and keys:

```bash
# In your .env file, verify:
REACT_APP_SUPABASE_URL=https://[your-project].supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ... (your anon key)
```

Make sure you're testing against the **correct Supabase project**!
