-- Expand Content Types for Opportunity Engine V2
-- Add new content types to support full opportunity execution

-- 1. Drop existing constraint
ALTER TABLE campaign_execution_items
DROP CONSTRAINT IF EXISTS campaign_execution_items_content_type_check;

-- 2. Add expanded constraint with all content types
ALTER TABLE campaign_execution_items
ADD CONSTRAINT campaign_execution_items_content_type_check
CHECK (content_type IN (
  -- Core content types (existing)
  'media_pitch',
  'social_post',
  'thought_leadership',
  'user_action',

  -- Extended content types (new)
  'press_release',
  'blog_post',
  'image',
  'video',
  'presentation',
  'email_campaign',
  'webinar',
  'event',
  'partnership_outreach'
));

-- 3. Add platform field for social posts
ALTER TABLE campaign_execution_items
ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('linkedin', 'twitter', 'instagram', 'facebook', 'tiktok'));

-- 4. Add content_brief field for detailed generation instructions
ALTER TABLE campaign_execution_items
ADD COLUMN IF NOT EXISTS content_brief JSONB;

-- 5. Add urgency field for prioritization
ALTER TABLE campaign_execution_items
ADD COLUMN IF NOT EXISTS urgency TEXT CHECK (urgency IN ('immediate', 'this_week', 'this_month', 'ongoing'));

-- 6. Update existing records to have default urgency
UPDATE campaign_execution_items
SET urgency = 'this_week'
WHERE urgency IS NULL;

-- 7. Add index on content_type for filtering
CREATE INDEX IF NOT EXISTS idx_execution_items_content_type ON campaign_execution_items(content_type);

-- 8. Add index on urgency for prioritization
CREATE INDEX IF NOT EXISTS idx_execution_items_urgency ON campaign_execution_items(urgency);

COMMENT ON COLUMN campaign_execution_items.platform IS 'Social media platform for social_post content type';
COMMENT ON COLUMN campaign_execution_items.content_brief IS 'Detailed brief with angle, key_points, tone, length, cta for content generation';
COMMENT ON COLUMN campaign_execution_items.urgency IS 'Execution urgency: immediate (today), this_week, this_month, or ongoing';
