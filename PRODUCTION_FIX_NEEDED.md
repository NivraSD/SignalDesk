# CRITICAL PRODUCTION ISSUE

## The Problem
The V4 Intelligence Pipeline is deployed but **won't work in production** because:
1. Organization data is saved to localStorage during onboarding
2. localStorage is browser-specific and not shared between sessions
3. MultiStageIntelligence component looks for organization in localStorage
4. In production, after onboarding, the organization data exists only in the user's browser

## Current Data Flow (BROKEN in production)
```
User completes onboarding
    ↓
Organization saved to localStorage (browser only)
    ↓
User navigates to Intelligence tab
    ↓
MultiStageIntelligence looks for organization in localStorage
    ↓
❌ No organization found (if new session or different browser)
```

## Required Fix

### Option 1: Use Supabase Auth User Metadata (RECOMMENDED)
Store organization data in Supabase user's metadata so it persists across sessions:

```javascript
// In UnifiedOnboarding.js saveProfile()
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  await supabase.auth.updateUser({
    data: { 
      organization: profile.organization,
      competitors: profile.competitors,
      monitoring_topics: profile.monitoring_topics
    }
  });
}

// In MultiStageIntelligence.js
const [organization] = useState(() => {
  // Check Supabase user metadata first
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.user_metadata?.organization) {
    return user.user_metadata.organization;
  }
  // Then check localStorage as fallback
  // ... existing localStorage checks
});
```

### Option 2: Use Organization Profiles Table
Store and retrieve from `organization_profiles` table:

```javascript
// Save during onboarding
await supabase
  .from('organization_profiles')
  .upsert({
    user_id: user.id,
    organization_name: profile.organization.name,
    profile_data: profile
  });

// Load in MultiStageIntelligence
const { data } = await supabase
  .from('organization_profiles')
  .select('*')
  .eq('user_id', user.id)
  .single();
```

### Option 3: Quick Workaround (TEMPORARY)
Add a "Configure Organization" button if no org found:

```javascript
if (!organization) {
  return (
    <div className="no-org-message">
      <h2>No Organization Configured</h2>
      <p>Please complete setup to use intelligence features</p>
      <button onClick={() => navigate('/onboarding')}>
        Complete Setup
      </button>
    </div>
  );
}
```

## Immediate Action Needed

1. **For Testing**: Users must complete onboarding in the same browser session
2. **For Production**: Implement Option 1 (Supabase user metadata)
3. **Database Check**: Ensure `organization_profiles` table exists with proper RLS

## Files to Modify

1. `/frontend/src/components/UnifiedOnboarding.js` - Save to Supabase
2. `/frontend/src/components/MultiStageIntelligence.js` - Load from Supabase
3. `/frontend/src/components/RailwayV2Enhanced.js` - Load from Supabase

## Testing After Fix

1. Complete onboarding
2. Log out and log back in
3. Organization should persist
4. Intelligence pipeline should run

## Current Workaround for Demo

1. User must complete onboarding
2. Don't refresh the page
3. Don't log out
4. Stay in same browser session
5. Intelligence will work until browser data is cleared