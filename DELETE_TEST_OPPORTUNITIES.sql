-- Delete test opportunities to make room for real ones
DELETE FROM opportunities 
WHERE title IN (
  'Competitor Crisis: Rivian Stock Plunge',
  'Trending Topic: AGI Speculation', 
  'Regulatory Win: EU Approves FSD'
);

-- Verify deletion
SELECT COUNT(*) as remaining_opportunities FROM opportunities;