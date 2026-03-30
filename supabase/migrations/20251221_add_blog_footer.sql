-- Add footer column to blog_posts table
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS footer TEXT;
