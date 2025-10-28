# Organization Onboarding & Management - Implementation Summary

**Status:** Phase 2 Complete - All components support org-switching ✅✅
**Date:** 2025-10-27
**Phase 1:** Core infrastructure ✅
**Phase 2:** Component org-switching updates ✅

---

## What Was Built

### 1. **API Routes** (`src/app/api/organizations/`)

#### `/api/organizations` (route.ts)
- **GET** - List all organizations from database
- **POST** - Create new organization
- **DELETE** - Delete organization (cascade deletes related data)

#### `/api/organizations/discover` (route.ts)
- **POST** - Run MCP discovery for an organization
- Returns: competitors, topics, stakeholders, industry analysis
- Customizable before saving

#### `/api/organizations/targets` (route.ts)
- **GET** - Fetch intelligence targets for an organization
- **POST** - Batch save targets (competitors, topics, keywords)
- **PUT** - Update single target
- **DELETE** - Soft delete target (set active=false)

---

### 2. **Organization Onboarding Modal** (`src/components/onboarding/OrganizationOnboarding.tsx`)

**Multi-Step Wizard:**

**Step 1: Basic Info**
- Organization name (required)
- Website URL (required)
- Industry hint (optional - auto-detects if not provided)

**Step 2: Discovered Competitors**
- Shows competitors found by MCP discovery
- Checkboxes to select which to monitor
- Add custom competitors with input field
- Remove custom competitors

**Step 3: Trending Topics**
- Shows topics discovered by MCP
- Checkboxes to select which to monitor
- Add custom topics
- Summary of selections

**Step 4: Memory Vault Assets (Optional)**
- File upload interface for brand guidelines, templates
- Supported formats: PDF, DOCX, TXT, MD
- Can skip this step and add later

**Features:**
- Progress bar showing step completion
- Loading states during MCP discovery
- Error handling with user-friendly messages
- Form validation
- Animated transitions between steps

---

### 3. **Enhanced Org-Switching** (`src/stores/useAppStore.ts`)

**Improved `setOrganization` function:**

```typescript
setOrganization: (organization: Organization | null) => {
  const currentOrg = get().organization

  // Prevent unnecessary reloads if same org
  if (currentOrg?.id === organization?.id) {
    return
  }

  // Clear all org-specific state
  set({
    organization,
    intelligenceData: null,
    opportunities: [],
    activeCampaigns: [],
    error: null
  })

  // Emit org-change event for components to listen to
  window.dispatchEvent(new CustomEvent('organization-changed', {
    detail: { from: currentOrg, to: organization }
  }))
}
```

**Key Features:**
- Prevents duplicate reloads
- Clears stale org data
- Emits event for component listeners
- Logs org switches for debugging

---

### 4. **Dynamic Organization Loading** (`src/app/page.tsx`)

**Changes:**
- Removed hard-coded organizations array
- Added `loadOrganizations()` function to fetch from database
- Updated org dropdown to show dynamic list
- "+ New Organization" button now opens onboarding modal
- Org dropdown shows industry under name

**Behavior:**
- Loads orgs on app mount
- Auto-selects first org if none selected
- Reloads list after creating new org
- Switches to new org automatically after creation

---

## Database Schema (Existing)

The implementation uses these existing tables:

### `organizations`
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  industry VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
)
```

### `intelligence_targets`
```sql
CREATE TABLE intelligence_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'competitor', 'topic', 'keyword', 'influencer'
  priority VARCHAR(20) DEFAULT 'medium',
  threat_level INTEGER DEFAULT 50,
  keywords TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### `organization_profiles`
- Stores full MCP discovery profiles
- Created by `mcp-discovery` function
- Contains competitors, stakeholders, monitoring config

---

## How It Works

### Onboarding Flow

```
User clicks "+ New Organization"
  ↓
Step 1: Enter name, website, industry
  ↓
Click "Run Discovery"
  → Calls /api/organizations/discover
  → Calls supabase/functions/mcp-discovery
  → Returns: competitors, topics, stakeholders
  ↓
Step 2: Select/add competitors
  ↓
Step 3: Select/add topics
  ↓
Step 4: (Optional) Upload brand assets
  ↓
Click "Create Organization"
  → POST /api/organizations (create org)
  → POST /api/organizations/targets (save targets)
  → Upload files to Memory Vault (TODO)
  → Set new org as active
  → Reload orgs list
  ↓
User now sees new organization in dropdown
```

### Org Switching Flow

```
User clicks different org in dropdown
  ↓
setOrganization() called
  ↓
Check if same org (skip if yes)
  ↓
Clear all org-specific state:
  - intelligenceData → null
  - opportunities → []
  - activeCampaigns → []
  - error → null
  ↓
Emit 'organization-changed' event
  ↓
Components with [organization] dependency re-run:
  - OpportunitiesModule (already working ✅)
  - MemoryVaultModule (already working ✅)
  - Social Intelligence Monitor (already working ✅)
  - Real-time Monitor (manual trigger, org-aware ✅)
```

---

## Testing Instructions

### 1. Test Organization Creation

```bash
# Start the app
npm run dev

# In browser:
1. Click org dropdown in top right
2. Click "+ New Organization"
3. Enter:
   - Name: "Test Company"
   - Website: "https://test.com"
   - Industry: "Technology"
4. Click "Run Discovery"
5. Wait for MCP discovery (may take 30-60s)
6. Select competitors to monitor
7. Select topics to monitor
8. Skip Memory Vault step
9. Click "Create Organization"
10. Verify "Test Company" appears in org dropdown
```

### 2. Test Organization Switching

```bash
# In browser:
1. Create 2-3 test organizations
2. Switch between them using dropdown
3. Check browser console for:
   "🔄 Switching from [OrgA] to [OrgB]"
   "✅ Organization switched to [OrgB]"
4. Verify no errors in console
5. Check that opportunities/data clears when switching
```

### 3. Test Org-Specific Data

```bash
# In browser:
1. Select "Test Company" from dropdown
2. Run intelligence pipeline
3. View opportunities
4. Switch to different org
5. Verify opportunities list clears
6. Switch back to "Test Company"
7. Verify data loads for that org
```

### 4. Test API Endpoints

```bash
# Get all orgs
curl http://localhost:3000/api/organizations

# Create org
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{"name":"API Test","url":"https://apitest.com","industry":"Tech"}'

# Run discovery
curl -X POST http://localhost:3000/api/organizations/discover \
  -H "Content-Type: application/json" \
  -d '{"organization_name":"OpenAI","industry_hint":"AI"}'
```

---

## What Still Needs to be Done

### Phase 2: Component Org-Switching Updates

These components need to be updated to properly handle org changes:

| Component | Status | Action Needed |
|-----------|--------|---------------|
| **OpportunitiesModule** | ✅ Already working | Has [organization] dependency |
| **MemoryVaultModule** | ✅ Already working | Filters by organization_id |
| **Social Intelligence** | ✅ Already working | Auto-refreshes with org |
| **Real-time Monitor** | ✅ Org-aware | Manual trigger only |
| **IntelligenceModule** | ✅ Updated | Clears executive synthesis on org change |
| **NIVPanel** | ✅ Updated | Clears conversation when org changes |
| **CommandCenterV2** | ✅ Updated | Shows org context, passes org to children |
| **CrisisCommandCenter** | ✅ Updated | Clears all crisis state on org change |
| **StrategicPlanning** | ✅ Updated | Full state reset with null guards |
| **ExecuteTabProduction** | ✅ Updated | Clears content/queue on org change |
| **StakeholderPredictions** | ✅ Updated | Clears predictions on org change |

### Phase 3: Additional Features

**Target Management UI:**
- View/edit targets for current org
- Add/remove competitors after onboarding
- Change priorities
- Re-run discovery

**Org Settings Page:**
- Edit org details
- View statistics
- Manage targets
- Re-run MCP discovery
- Delete organization

**Memory Vault Integration:**
- Implement file upload in onboarding step 4
- Save files to Supabase Storage
- Call niv-memory-vault to index content
- Link files to organization_id

**Org Management Dashboard:**
- List all orgs with metrics
- Quick actions (edit, delete, view targets)
- Create new org button
- Search/filter orgs

---

## Component Update Pattern

For components that need org-switching:

```typescript
function MyComponent() {
  const { organization } = useAppStore()
  const [data, setData] = useState(null)

  // Re-run when org changes
  useEffect(() => {
    if (!organization) {
      setData(null)
      return
    }

    const loadData = async () => {
      const result = await fetch(`/api/data?organization_id=${organization.id}`)
      setData(result)
    }

    loadData()
  }, [organization?.id]) // ← Key: dependency on organization.id

  if (!organization) return <div>Select an organization</div>

  return <div>{/* render data */}</div>
}
```

---

## Files Modified

1. **New Files Created:**
   - `src/app/api/organizations/route.ts`
   - `src/app/api/organizations/discover/route.ts`
   - `src/app/api/organizations/targets/route.ts`
   - `src/components/onboarding/OrganizationOnboarding.tsx`

2. **Modified Files:**
   - `src/stores/useAppStore.ts` - Enhanced org-switching
   - `src/app/page.tsx` - Dynamic org loading, onboarding modal

---

## Known Issues & Limitations

1. **Memory Vault file upload** - Not implemented yet in onboarding step 4
2. **Org delete confirmation** - No confirmation dialog yet
3. **Org edit** - No edit functionality yet
4. **Target management UI** - Can't edit targets after creation
5. **Discovery refresh** - Can't re-run discovery after initial creation
6. **Org statistics** - No dashboard showing org metrics

---

## Next Steps

**✅ Phase 2 Complete - All components now support org-switching!**

**Priority 1 (Important):**
1. Implement Memory Vault file upload in onboarding
2. Build Target Management UI for editing after creation
3. Add org delete confirmation dialog

**Priority 2 (Nice to have):**
4. Build Org Management Dashboard
5. Add org edit functionality
6. Add "Refresh Discovery" button
7. Add org statistics/metrics

---

## Success Criteria

- [x] Users can create new organizations via UI
- [x] MCP discovery runs automatically during onboarding
- [x] Users can customize competitors and topics
- [x] Organizations load dynamically from database
- [x] Org switching clears stale data
- [x] Org switching emits events for components
- [x] All major components respond to org changes
- [ ] Memory Vault assets can be uploaded during onboarding
- [ ] Users can manage targets after creation
- [ ] Users can delete organizations

---

## Architecture Decisions

**Why persistent targets?**
- MCP discovery is expensive (30-60s per run)
- Users want to customize what they monitor
- Targets should persist between sessions
- Users should be able to add/remove targets without re-running discovery

**Why soft delete?**
- Maintains history for audit/analytics
- Can restore accidentally deleted targets
- Cascade delete still works for org deletion

**Why event-based org-switching?**
- Decouples components from store
- Components can respond independently
- Easy to add new components that need to listen
- No need to update central store for each new component

**Why multi-step onboarding?**
- Discovery takes time - show progress
- Let users review before committing
- Opportunity to customize (add/remove items)
- Better UX than single long form

---

## Phase 2 Updates - Org-Switching Complete (2025-10-27)

All major components have been updated to properly handle organization switching. When users switch organizations, each component now:

### Components Updated:

**1. NIVPanel** (`src/components/niv/NIVPanel.tsx`)
- Added useEffect with [organization?.id] dependency
- Clears conversation messages when org changes
- Resets input, processing state, and current tool
- Shows org-specific welcome message

**2. CommandCenterV2** (`src/components/command-center/CommandCenterV2.tsx`)
- Already had organization from store
- Displays org name and industry in header
- Passes organizationId to LiveActivityFeed and SuggestedActions
- NIVPanel child now responds to org changes

**3. IntelligenceModule** (`src/components/modules/IntelligenceModule.tsx`)
- Added org-switching useEffect
- Clears executive synthesis when org changes
- Resets all pipeline state (stages, signals, alerts, errors)

**4. StrategicPlanningModuleV3Complete** (`src/components/modules/StrategicPlanningModuleV3Complete.tsx`)
- Comprehensive state reset when org changes
- Clears blueprint, sessionId, contentItems, campaigns
- Added null guards in parseBlueprint, initializeItemsFromBlueprint
- Fixed loading state and null blueprint rendering

**5. CrisisCommandCenter** (`src/components/modules/CrisisCommandCenter.tsx`)
- Added dedicated org-switching useEffect
- Clears active crisis, view state, modals, alerts
- Reloads crisis data for new organization

**6. ExecuteTabProduction** (`src/components/execute/ExecuteTabProduction.tsx`)
- Clears all content generation state
- Resets selected content type, workspace, queue
- Clears currentContent and its ref
- Resets all visibility flags

**7. StakeholderPredictionDashboard** (`src/components/predictions/StakeholderPredictionDashboard.tsx`)
- Already had organizationId prop
- Added explicit state clearing
- Resets predictions, stakeholders, filters
- Reloads predictions for new org

### Pattern Used:

All components follow this pattern:

```typescript
useEffect(() => {
  if (organization) {
    console.log(`🔄 ComponentName: Organization changed to ${organization.name}, clearing state`)
    // Clear all state variables
    setState1(initialValue)
    setState2(initialValue)
    // ...
  }
}, [organization?.id])
```

### Result:

✅ All major components now properly respond to organization changes
✅ No stale data persists when switching organizations
✅ Each component shows correct org-specific data
✅ Console logs help debug org-switching behavior

---

This implementation provides a complete foundation for organization management. Both the core infrastructure (Phase 1) and all component org-switching updates (Phase 2) are now complete and working.
