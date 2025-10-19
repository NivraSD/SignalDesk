# Manual Edge Function Deployment Instructions

Since Supabase CLI linking is broken, you need to manually deploy the Edge Functions through the Supabase Dashboard.

## Steps to Deploy:

1. Go to https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/functions

2. For each of these Edge Functions, click on them and update their code:
   - `pr-intelligence`
   - `claude-intelligence-synthesizer-v2`
   - `news-intelligence`
   - `media-intelligence`
   - `opportunities-intelligence`
   - `analytics-intelligence`
   - `relationships-intelligence`
   - `monitor-intelligence`

3. Copy the ENTIRE content of the corresponding file from:
   - `/supabase/functions/[function-name]/index.ts`

4. IMPORTANT: Also update the shared IntelligenceCore.ts:
   - Go to the function editor
   - Navigate to `_shared/IntelligenceCore.ts`
   - Replace with content from `/supabase/functions/_shared/IntelligenceCore.ts`

## Files Changed:

### Critical Fix in IntelligenceCore.ts:
- Fixed `identifyIndustry()` method to properly detect conglomerates
- Added explicit detection for Japanese trading companies
- Fixed industry mapping to preserve 'conglomerate' category

## Test After Deployment:

Test with this curl command:
```bash
curl -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/pr-intelligence \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8" \
  -d '{"method":"gather","params":{"organization":{"name":"Mitsui & Co.","industry":"conglomerate"},"timeframe":"24h"}}'
```

Expected: Should return competitors including Mitsubishi, Sumitomo, Itochu, etc.