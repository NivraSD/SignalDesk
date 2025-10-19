-- Fix content_library table
ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS folder TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS content_type TEXT;

-- Fix memory_vault table if needed
ALTER TABLE memory_vault
ADD COLUMN IF NOT EXISTS content TEXT;