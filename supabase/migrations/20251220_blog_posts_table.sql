-- Blog Posts table for Nivria.ai "Thoughts" section
-- Allows publishing blog posts from the admin dashboard

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_name TEXT DEFAULT 'Nivria Team',
  featured_image_url TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Public can read published posts"
  ON blog_posts FOR SELECT
  USING (published = true);

-- Service role can do everything (for admin)
CREATE POLICY "Service role full access"
  ON blog_posts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();
