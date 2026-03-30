# SignalDesk Recovery Roadmap

## Current State Assessment (Aug 27, 2025)

### ✅ What's Working:
1. **Supabase Edge Functions** - ALL deployed and functional:
   - organization-discovery
   - intelligence-collection-v1
   - intelligence-stage-1-competitors
   - intelligence-stage-2-media  
   - intelligence-stage-3-regulatory
   - intelligence-stage-4-trends
   - intelligence-stage-5-synthesis
   - intelligence-persistence
   - opportunity-enhancer

2. **Core Services**:
   - intelligenceOrchestratorV4.js (coordinates pipeline)
   - Multiple backup versions of components

### ❌ What's Broken:
1. **Data Flow**: Onboarding → Railway connection broken
   - OnboardingV3 saves to Supabase only
   - RailwayV2 can't load from Supabase (getting null)
   - Organization data not flowing through

2. **Component Mismatch**:
   - Mixed old and new components
   - localStorage removed but some parts still need it

## Recovery Strategy

### Phase 1: Fix Critical Data Flow (IMMEDIATE)
**Goal**: Get organization data flowing from Onboarding to Railway

Option A: Hybrid Approach (Recommended for now)
```javascript
// OnboardingV3: Save to BOTH localStorage and Supabase
localStorage.setItem('organization', JSON.stringify(orgData));
// Also save to Supabase

// RailwayV2: Try localStorage first, then Supabase
const org = localStorage.getItem('organization') || await fetchFromSupabase();
```

Option B: Fix Supabase-only flow
- Debug why intelligence-persistence getLatestProfile returns null
- Ensure saveProfile actually saves to organization_profiles table
- Fix the retrieval query

### Phase 2: Align Components with Pipeline
**Goal**: Use the right components that match your Edge Functions

Correct Component Stack:
```
OnboardingV3 → RailwayV2 → IntelligenceHubV8 → intelligenceOrchestratorV4
                                                        ↓
                                            intelligence-collection-v1
                                                        ↓
                                            5 Stage Edge Functions
```

### Phase 3: Clean Up and Optimize
1. Remove unused component versions
2. Consolidate services
3. Add proper error handling
4. Add loading states

## Immediate Actions

### 1. Quick Fix (5 minutes)
Add localStorage fallback to get app working:
```javascript
// In OnboardingV3 - add after Supabase save:
localStorage.setItem('organization', JSON.stringify(completeOrg));

// In RailwayV2 - modify loadOrganizationFromSupabase:
const savedOrg = localStorage.getItem('organization');
if (savedOrg) {
  setOrganizationData(JSON.parse(savedOrg));
  return;
}
// Then try Supabase...
```

### 2. Test Pipeline (10 minutes)
1. Run onboarding with a test organization
2. Verify it loads in Railway
3. Check if intelligence pipeline runs
4. Verify all 6 tabs populate

### 3. Debug Supabase (15 minutes)
Check why getLatestProfile isn't working:
- Query organization_profiles table directly
- Check if data is being saved
- Fix the retrieval logic

## Component Version Map

### Use These:
- **Onboarding**: OnboardingV3.js
- **Main App**: RailwayV2.js
- **Intelligence**: IntelligenceHubV8.js
- **Orchestrator**: intelligenceOrchestratorV4.js

### Deprecate These:
- MultiStageIntelligence.js (old pipeline)
- SupabaseIntelligence.js (incomplete)
- IntelligenceHubV5/V6/V7 (older versions)

## Success Criteria
1. ✅ Organization loads from onboarding
2. ✅ Intelligence pipeline runs completely
3. ✅ All 6 tabs show data
4. ✅ No console errors
5. ✅ Can switch organizations

## Notes
- Your pipeline in Supabase is GOOD - don't change it
- The frontend just needs to be aligned with it
- localStorage can be used temporarily while fixing Supabase
- All your work is preserved in git history