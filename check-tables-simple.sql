-- Simple check of what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'memoryvault_items',
  'campaigns', 
  'campaign_tasks',
  'campaign_tracking',
  'journalists',
  'media_lists',
  'media_outreach',
  'media_assets',
  'profiles',
  'users',
  'organizations'
)
ORDER BY table_name;