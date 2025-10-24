-- Cleanup script to remove duplicate campaign_execution_items
-- This keeps the first occurrence of each duplicate based on topic, stakeholder, lever, and content type

-- First, let's see what duplicates exist
SELECT
  session_id,
  stakeholder_name,
  lever_name,
  lever_priority,
  content_type,
  topic,
  COUNT(*) as count
FROM campaign_execution_items
GROUP BY session_id, stakeholder_name, lever_name, lever_priority, content_type, topic
HAVING COUNT(*) > 1
ORDER BY count DESC, session_id, lever_priority;

-- Now remove duplicates, keeping only the first (oldest) record for each unique combination
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY session_id, stakeholder_name, lever_name, lever_priority, content_type, topic
      ORDER BY created_at ASC
    ) as rn
  FROM campaign_execution_items
)
DELETE FROM campaign_execution_items
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Verify cleanup
SELECT 'Remaining items per session:' as status;
SELECT
  session_id,
  COUNT(*) as total_items,
  COUNT(DISTINCT (stakeholder_name, lever_name, content_type, topic)) as unique_items
FROM campaign_execution_items
GROUP BY session_id
ORDER BY session_id;
