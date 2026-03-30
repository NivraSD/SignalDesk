-- Clear opportunities older than 7 days that are still 'new'
DELETE FROM opportunities 
WHERE status = 'new' 
  AND created_at < NOW() - INTERVAL '7 days';

-- Mark expired opportunities
UPDATE opportunities 
SET status = 'expired'
WHERE expires_at < NOW() 
  AND status IN ('new', 'reviewed');

-- Get count of remaining opportunities
SELECT 
  organization_name,
  status,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM opportunities
GROUP BY organization_name, status
ORDER BY organization_name, status;
