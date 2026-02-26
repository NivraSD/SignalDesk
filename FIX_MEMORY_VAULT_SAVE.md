# Memory Vault Save Fix - Complete

## Problem

When frameworks were generated with the new `contentStrategy` and `executionPlan` fields, they weren't being saved properly to Memory Vault:

1. ✅ Framework generated successfully with new fields
2. ✅ Framework sent to Memory Vault API
3. ❌ New fields NOT saved to database
4. ❌ Frontend received null content
5. ❌ "Orchestration triggers: undefined" in logs
6. ❌ 500 error on frontend

## Root Cause

**Three-part problem:**

### 1. niv-orchestrator-robust Payload Missing New Fields
**File**: `supabase/functions/niv-orchestrator-robust/index.ts:2827-2884`

The payload sent to Memory Vault included old individual fields but NOT the new structured fields:
```typescript
// BEFORE (missing fields)
const memoryVaultPayload = {
  strategy: {
    strategy_objective: structuredFramework.strategy?.objective,
    strategy_approach: structuredFramework.strategy?.rationale,
    // ... other old fields
    // ❌ Missing: content_strategy, execution_plan, full_framework
  }
}
```

### 2. niv-memory-vault Routing to Wrong Save Function
**File**: `supabase/functions/niv-memory-vault/index.ts:715-731`

When `action=save` was called, it routed to `saveContent()` which saves to `content_library` table, NOT `saveStrategy()` which saves to `niv_strategies` table with orchestration triggers.

```typescript
// BEFORE (wrong routing)
case 'save':
  result = await saveContent(contentData);  // ❌ Wrong! No orchestration triggers
```

### 3. saveStrategy Function Didn't Save New Fields
**File**: `supabase/functions/niv-memory-vault/index.ts:223-258`

The `saveStrategy` function didn't know about `content_strategy`, `execution_plan`, or `full_framework` fields, so even if they were sent, they'd be ignored.

## Solution

### Fix 1: Add New Fields to niv-orchestrator-robust Payload
**File**: `supabase/functions/niv-orchestrator-robust/index.ts:2850-2855`

```typescript
const memoryVaultPayload = {
  strategy: {
    // ... existing fields

    // NEW: Content-ready format for auto-execution
    content_strategy: structuredFramework.contentStrategy || null,
    execution_plan: structuredFramework.executionPlan || null,

    // Full framework JSON for complete lineage
    full_framework: structuredFramework,
  }
}
```

### Fix 2: Route Strategies to saveStrategy Function
**File**: `supabase/functions/niv-memory-vault/index.ts:715-731`

```typescript
case 'save':
  const contentData = body.content || body.strategy;
  if (!contentData) throw new Error('Content data required');

  // Route to appropriate save function
  if (body.strategy) {
    // NIV strategies go to niv_strategies table for orchestration triggers
    result = await saveStrategy(body.strategy);  // ✅ Correct!
  } else {
    // Other content goes to content_library
    result = await saveContent(contentData);
  }
  break;
```

### Fix 3: Save New Fields to framework_data Column
**File**: `supabase/functions/niv-memory-vault/index.ts:249-255`

```typescript
framework_data: {
  ...(strategy.framework_data || {}),
  // NEW: Store auto-execution fields
  contentStrategy: strategy.content_strategy || null,
  executionPlan: strategy.execution_plan || null,
  fullFramework: strategy.full_framework || null
}
```

### Fix 4: Add TypeScript Interface
**File**: `supabase/functions/niv-memory-vault/index.ts:99-103`

```typescript
interface NivStrategy extends ContentItem {
  // ... existing fields

  // NEW: Auto-execution fields
  content_strategy?: any;
  execution_plan?: any;
  full_framework?: any;
}
```

## Database Schema

The new fields are stored in the existing `framework_data` JSONB column in `niv_strategies` table:

```sql
-- Already exists from migration 20250121_add_framework_data_column.sql
ALTER TABLE niv_strategies
ADD COLUMN IF NOT EXISTS framework_data JSONB DEFAULT '{}';
```

**Framework Data Structure:**
```json
{
  "contentStrategy": {
    "subject": "AI Leadership Strategy",
    "narrative": "Position as AI safety leader...",
    "target_audiences": ["Investors", "Executives"],
    "key_messages": [...],
    "media_targets": [...],
    "timeline": "1 week prep, 2-3 weeks execution"
  },
  "executionPlan": {
    "autoExecutableContent": {
      "contentTypes": ["press-release", "media-pitch", ...],
      "estimatedPieces": 7
    },
    "strategicRecommendations": {
      "campaigns": [
        {
          "title": "Product Launch Event Series",
          "type": "event",
          "executionSteps": [...],
          "platform_support": {...}
        }
      ]
    }
  },
  "fullFramework": {
    // Complete framework with all fields
  }
}
```

## Flow After Fix

### Before (Broken):
```
1. Framework generated with contentStrategy + executionPlan
2. Sent to Memory Vault with only old fields
3. saveContent() called → saves to content_library
4. New fields discarded
5. Database has null content
6. No orchestration triggers
7. Frontend gets 500 error
```

### After (Working):
```
1. Framework generated with contentStrategy + executionPlan ✅
2. Sent to Memory Vault with ALL fields ✅
3. saveStrategy() called → saves to niv_strategies ✅
4. New fields saved to framework_data JSONB ✅
5. Database has complete framework ✅
6. Orchestration triggers generated ✅
7. Frontend gets success response ✅
```

## Orchestration Triggers

With the fix, `saveStrategy` now properly generates orchestration triggers based on workflow configurations:

```typescript
// Example orchestration triggers
{
  orchestration_triggers: [
    {
      component: 'content_generation',
      tasks: [...],
      priority: 'normal'
    },
    {
      component: 'campaign_intelligence',
      tasks: {...},
      priority: 'high'
    }
  ]
}
```

This is why you see in the logs:
- **Before**: `🎯 Orchestration triggers: undefined` ❌
- **After**: `🎯 Memory Vault: Strategy saved with 2 workflow triggers` ✅

## Testing

To verify the fix works:

1. Generate a new framework in NIV
2. Check logs for:
   ```
   ✅ Strategic framework saved to Memory Vault
   🎯 Memory Vault: Strategy saved with X workflow triggers
   ```
3. Query database:
   ```sql
   SELECT
     title,
     framework_data->'contentStrategy',
     framework_data->'executionPlan'
   FROM niv_strategies
   ORDER BY created_at DESC
   LIMIT 1;
   ```
4. Verify frontend doesn't get 500 error
5. Check framework appears in Memory Vault UI

## Deployments

All edge functions have been deployed:

✅ **niv-orchestrator-robust** - Sends new fields in payload
✅ **niv-memory-vault** - Routes to saveStrategy and saves new fields
✅ **niv-content-intelligent-v2** - Auto-execute mode (from previous fix)
✅ **framework-auto-execute** - Auto-execution orchestrator (from previous fix)

## Files Modified

1. `supabase/functions/niv-orchestrator-robust/index.ts` - Added new fields to Memory Vault payload
2. `supabase/functions/niv-memory-vault/index.ts` - Fixed routing and save logic

## Summary

The issue was a **three-part disconnection** in the data flow from framework generation → Memory Vault save:

1. **Payload** didn't include new fields
2. **Routing** went to wrong save function (no orchestration)
3. **Save function** didn't know about new fields

All three issues are now fixed, and frameworks save with complete data including:
- ✅ Content-ready format (`contentStrategy`)
- ✅ Execution plan (`executionPlan`)
- ✅ Full framework for lineage (`fullFramework`)
- ✅ Orchestration triggers for workflow activation
