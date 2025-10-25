# Predictions UI Fix Summary

## Issues Found

1. **Environment Variable Mismatch**: The Supabase client was looking for `NEXT_PUBLIC_*` variables but the .env file had `REACT_APP_*` variables
2. **Prediction Dashboard Client Creation**: The StakeholderPredictionDashboard was creating its own Supabase client with hardcoded env var names instead of using the shared client
3. **Missing 'strategic' Category**: The predictions table had a check constraint that didn't include 'strategic' as a valid category
4. **Missing RLS Policy**: The predictions table lacked an RLS policy for anonymous users

## Fixes Applied

### 1. Fixed Supabase Client Configuration
**File**: `src/lib/supabase/client.ts`

Updated to support both `NEXT_PUBLIC_*` and `REACT_APP_*` environment variable prefixes:

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
```

### 2. Fixed Prediction Dashboard Component
**File**: `src/components/predictions/StakeholderPredictionDashboard.tsx`

Changed from creating a new client to using the shared client:

```typescript
// Before
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// After
const { supabase } = await import('@/lib/supabase/client')
```

### 3. Added 'strategic' Category Support
**Migration**: `supabase/migrations/20251025_add_strategic_to_predictions_category.sql`

Updated the check constraint to include 'strategic':

```sql
ALTER TABLE predictions DROP CONSTRAINT IF EXISTS predictions_category_check;
ALTER TABLE predictions ADD CONSTRAINT predictions_category_check
  CHECK (category IN ('competitive', 'regulatory', 'market', 'technology', 'partnership', 'crisis', 'strategic'));
```

### 4. Added Anonymous User RLS Policy
**Migration**: `supabase/migrations/20251025_add_anon_predictions_policy.sql`

```sql
CREATE POLICY "Anon users can view predictions" ON predictions
  FOR SELECT
  TO anon
  USING (true);
```

## Migrations to Apply Manually

You need to apply these migrations to your production database:

1. `supabase/migrations/20251025_add_strategic_to_predictions_category.sql`
2. `supabase/migrations/20251025_add_anon_predictions_policy.sql`

Or run this SQL directly in production:

```sql
-- Add 'strategic' category
ALTER TABLE predictions DROP CONSTRAINT IF EXISTS predictions_category_check;
ALTER TABLE predictions ADD CONSTRAINT predictions_category_check
  CHECK (category IN ('competitive', 'regulatory', 'market', 'technology', 'partnership', 'crisis', 'strategic'));

-- Add anon policy
CREATE POLICY "Anon users can view predictions" ON predictions
  FOR SELECT
  TO anon
  USING (true);
```

## How to View Predictions

1. Navigate to the InfiniteCanvas component
2. Switch to the 'predictions' module
3. The StakeholderPredictionDashboard will load predictions from the database
4. Click "Refresh" to manually reload predictions

## Testing

After applying the migrations and restarting your app, predictions should now appear in the UI. The backend logs show that 3 predictions were successfully saved with the 'strategic' category.

## Additional Notes

- The predictions are stored in the `predictions` table with fields: `title`, `description`, `category`, `confidence_score`, `time_horizon`, `impact_level`, `status`, `organization_id`
- The UI transforms these into a display format with stakeholder information extracted from the title
- Predictions auto-refresh every 5 minutes
- The dashboard supports filtering by category, confidence level, and timeframe
