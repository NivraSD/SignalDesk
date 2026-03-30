# Prediction System Enhancement Plan

## Current State Analysis

### ✅ What You Already Have

Your `real-time-prediction-generator` edge function is **excellent**! It has:

1. **Smart Pattern Analysis**
   - Uses Claude to find non-obvious connections
   - Analyzes current + historical articles (30 days)
   - Extracts trends and strategic insights
   - Generates 3-5 predictions per run

2. **Rich Prediction Data**
   - Stakeholder identification
   - Evidence links
   - Implications
   - Recommended actions
   - Confidence scores (70-85%)

3. **Database Integration**
   - Saves to `predictions` table
   - Stores metadata about generation method

### ❌ What's Missing (From Architecture Plan)

**1. Target Integration** (PRIORITY 1)
```typescript
// Current: Predictions have no link to targets
{
  title: "Microsoft will spin off Xbox",
  stakeholder: "Microsoft Gaming Division"
  // ❌ No target_id, target_name, target_type
}

// Enhanced: Predictions linked to targets
{
  title: "Microsoft will spin off Xbox",
  stakeholder: "Microsoft Gaming Division",
  target_id: "microsoft-uuid",  // ✅ Linked!
  target_name: "Microsoft",
  target_type: "competitor"
}
```

**2. Event/Trigger Tracking**
```typescript
// Current: No record of what triggered the prediction
// Enhanced: Track trigger events
{
  prediction_id: "...",
  trigger_event_id: "article-123",
  trigger_event_summary: "Microsoft announces 10,000 layoffs",
  trigger_strength: 85
}
```

**3. Monitoring & Validation** (PRIORITY 2)
```typescript
// Current: Predictions created, then forgotten
// Enhanced: Track outcomes over time
{
  prediction_id: "...",
  monitoring_status: "watching",
  supporting_signals_count: 2,
  outcome_occurred: true,  // Did it come true?
  accuracy: 88%
}
```

**4. Pattern Library** (OPTIONAL)
```typescript
// Current: Claude analyzes from scratch each time
// Enhanced: Store proven patterns
{
  pattern_name: "Layoffs → Restructuring",
  trigger_signals: ["layoffs", "cost cutting"],
  typical_outcome: "organizational restructuring",
  historical_accuracy: 85%
}
```

---

## Enhancement Roadmap

### Phase 1: Target Integration (This Week) ⭐

**Goal:** Link predictions to intelligence targets

**Changes Needed:**

1. **Update edge function to match targets**
```typescript
// In real-time-prediction-generator/index.ts

// After generating predictions, before saving:
const enhancedPredictions = await Promise.all(
  predictions.map(async (pred) => {
    // Find matching target
    const target = await matchPredictionToTarget(
      pred,
      organization_id,
      supabase
    )

    return {
      ...pred,
      target_id: target?.id || null,
      target_name: target?.name || null,
      target_type: target?.type || null
    }
  })
)
```

2. **Create target matching function**
```typescript
async function matchPredictionToTarget(
  prediction: Prediction,
  organizationId: string,
  supabase: any
) {
  // Get organization's targets
  const { data: targets } = await supabase
    .from('intelligence_targets')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('active', true)

  if (!targets || targets.length === 0) return null

  // Match by stakeholder name or keywords
  const stakeholder = prediction.stakeholder?.toLowerCase() || ''
  const title = prediction.title.toLowerCase()

  const match = targets.find(target => {
    // Direct name match
    if (stakeholder.includes(target.name.toLowerCase())) {
      return true
    }

    // Keyword match
    if (target.keywords?.some(kw =>
      stakeholder.includes(kw.toLowerCase()) ||
      title.includes(kw.toLowerCase())
    )) {
      return true
    }

    return false
  })

  return match
}
```

**Result:** Predictions now show target badges in UI! 🎯

---

### Phase 2: Trigger Tracking (Week 2) ⭐⭐

**Goal:** Track which intelligence events triggered predictions

**Database Schema:**
```sql
-- Already created in your migration!
ALTER TABLE predictions
ADD COLUMN IF NOT EXISTS trigger_event_id UUID,
ADD COLUMN IF NOT EXISTS trigger_event_summary TEXT;
```

**Edge Function Changes:**
```typescript
// Add to the function parameters
const {
  organization_id,
  organization_name,
  articles = [],
  profile = {},
  trigger_event_id = null,  // NEW: Optional event that triggered this
  trigger_event_summary = null
} = await req.json()

// When saving predictions:
const predictionRecords = predictions.map(pred => ({
  organization_id,
  title: pred.title,
  // ... existing fields ...
  trigger_event_id: trigger_event_id,  // NEW
  trigger_event_summary: trigger_event_summary,  // NEW
  data: {
    stakeholder: pred.stakeholder,
    evidence: pred.evidence,
    // ... existing data ...
  }
}))
```

**How to use:**
```typescript
// When new intelligence arrives:
const event = await saveToContentLibrary(article)

// Generate predictions from this event:
await supabase.functions.invoke('real-time-prediction-generator', {
  body: {
    organization_id: orgId,
    articles: [article],
    trigger_event_id: event.id,  // Track what triggered it
    trigger_event_summary: article.title
  }
})
```

**Result:** Can trace back predictions to the intelligence that triggered them!

---

### Phase 3: Prediction Monitoring (Week 3-4) ⭐⭐⭐

**Goal:** Track predictions over time, validate outcomes

**Implementation:**

1. **Create monitoring service (based on architecture doc)**
```typescript
// supabase/functions/prediction-monitor/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get active predictions that need checking
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('status', 'active')
    .lte('created_at', calculateCheckThreshold())

  for (const prediction of predictions || []) {
    await checkPrediction(prediction, supabase)
  }

  return new Response(JSON.stringify({
    success: true,
    checked: predictions?.length || 0
  }))
})

async function checkPrediction(prediction: any, supabase: any) {
  // Search for evidence that prediction came true
  const deadline = calculateDeadline(prediction)
  const now = new Date()

  if (now > deadline) {
    // Expired - mark as such
    await supabase
      .from('predictions')
      .update({ status: 'expired' })
      .eq('id', prediction.id)
    return
  }

  // Search recent intelligence for outcome
  const { data: recentEvents } = await supabase
    .from('content_library')
    .select('*')
    .eq('organization_id', prediction.organization_id)
    .gte('published_at', prediction.created_at)
    .ilike('title', `%${extractKeyTerms(prediction.title)}%`)
    .limit(5)

  // Use AI to determine if prediction came true
  const validated = await validateWithAI(prediction, recentEvents)

  if (validated.came_true) {
    await supabase
      .from('predictions')
      .update({ status: 'validated' })
      .eq('id', prediction.id)

    await supabase
      .from('prediction_outcomes')
      .insert({
        prediction_id: prediction.id,
        outcome_occurred: true,
        actual_outcome: validated.summary,
        overall_accuracy: validated.accuracy
      })
  }
}
```

2. **Set up cron job**
```typescript
// Deploy as edge function, then in Supabase:
// Database > Cron Jobs > New job
// Schedule: "0 8 * * *" (daily at 8am)
// Function: prediction-monitor
```

**Result:** Predictions automatically tracked, validated, metrics updated!

---

### Phase 4: Pattern Library (Optional - Week 5+)

**Goal:** Store and reuse proven patterns for faster predictions

**Why it helps:**
- Don't need to run AI every time
- Can generate instant predictions from simple pattern matching
- Learn which patterns work best

**Implementation:**
```sql
CREATE TABLE prediction_patterns (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  target_id UUID REFERENCES intelligence_targets(id),
  pattern_name VARCHAR(255),
  trigger_signals JSONB,
  typical_outcome TEXT,
  typical_timeframe VARCHAR(50),
  historical_accuracy DECIMAL(5,2),
  sample_size INTEGER,
  last_used_at TIMESTAMPTZ
);
```

**How it works:**
```typescript
// When event arrives:
const event = { title: "Microsoft announces layoffs" }

// Quick pattern match (no AI needed)
const pattern = findMatchingPattern(event, targets)
if (pattern && pattern.historical_accuracy > 75) {
  // Generate instant prediction from pattern
  const prediction = {
    title: `${target.name} likely to ${pattern.typical_outcome}`,
    confidence: pattern.historical_accuracy,
    time_horizon: pattern.typical_timeframe
  }
  // Save immediately
}

// Still run full AI analysis in background for deeper insights
```

---

## Quick Wins (Do These First!)

### Quick Win 1: Add Target Matching (1 hour)

```typescript
// In real-time-prediction-generator/index.ts
// After line 270 (after predictions are generated)

console.log('🎯 Matching predictions to targets...')

// Get targets for this org
const { data: targets } = await supabase
  .from('intelligence_targets')
  .select('*')
  .eq('organization_id', organization_id)
  .eq('active', true)

// Match each prediction to a target
const enhancedPredictions = predictions.map(pred => {
  const stakeholder = (pred.stakeholder || '').toLowerCase()
  const title = pred.title.toLowerCase()

  const matchedTarget = targets?.find(t => {
    return stakeholder.includes(t.name.toLowerCase()) ||
           title.includes(t.name.toLowerCase()) ||
           t.keywords?.some(kw =>
             stakeholder.includes(kw.toLowerCase()) ||
             title.includes(kw.toLowerCase())
           )
  })

  return {
    ...pred,
    target_id: matchedTarget?.id || null,
    target_name: matchedTarget?.name || pred.stakeholder,
    target_type: matchedTarget?.type || null
  }
})

// Then save enhancedPredictions instead of predictions
```

**Result:** Predictions immediately show target badges! No other changes needed.

---

### Quick Win 2: Show Trigger Events (30 minutes)

```typescript
// When calling the edge function:
await supabase.functions.invoke('real-time-prediction-generator', {
  body: {
    organization_id: orgId,
    articles: articles,
    trigger_event_id: latestArticle?.id,  // NEW
    trigger_event_summary: latestArticle?.title  // NEW
  }
})

// In edge function, add to prediction records (line 284):
const predictionRecords = predictions.map(pred => ({
  organization_id,
  // ... existing fields ...
  trigger_event_id: req.trigger_event_id,  // NEW
  trigger_event_summary: req.trigger_event_summary  // NEW
}))
```

**Result:** Can trace predictions back to source intelligence!

---

### Quick Win 3: Add "Validate" Button to UI (1 hour)

```tsx
// In StakeholderPredictionDashboard.tsx
// Add to PredictionCard:

{prediction.status === 'active' && (
  <button
    onClick={() => validatePrediction(prediction.id)}
    className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm"
  >
    ✅ Mark as Validated
  </button>
)}

async function validatePrediction(predictionId: string) {
  const outcome = prompt('What actually happened?')
  if (!outcome) return

  await supabase
    .from('predictions')
    .update({ status: 'validated' })
    .eq('id', predictionId)

  await supabase
    .from('prediction_outcomes')
    .insert({
      prediction_id: predictionId,
      outcome_occurred: true,
      actual_outcome: outcome,
      validated_at: new Date().toISOString()
    })

  // Reload predictions
}
```

**Result:** Start collecting validation data manually while automation is built!

---

## Recommended Implementation Order

### Week 1: Target Integration ⭐
- [x] Database migration (already done!)
- [ ] Add target matching to edge function (Quick Win 1)
- [ ] Test and verify targets show in UI

### Week 2: Event Tracking ⭐
- [ ] Add trigger_event_id to edge function (Quick Win 2)
- [ ] Update callers to pass trigger event
- [ ] Show trigger events in UI

### Week 3: Manual Validation ⭐
- [ ] Add validation UI (Quick Win 3)
- [ ] Validate 10-20 predictions manually
- [ ] Analyze which patterns work best

### Week 4: Automated Monitoring ⭐⭐
- [ ] Build prediction-monitor edge function
- [ ] Set up daily cron job
- [ ] Test outcome detection

### Week 5+: Advanced Features
- [ ] Pattern library (if needed)
- [ ] Confidence calibration
- [ ] Analytics dashboard

---

## Expected Results

### After Week 1:
```
Prediction Dashboard:
"🔮 Microsoft will spin off Xbox" 🏢 Competitor
"🔮 FTC likely to block merger" ⚖️ Regulator
"🔮 AI regulation increasing" 📌 Topic
```

### After Week 2:
```
Prediction Card:
Title: "Microsoft will spin off Xbox"
Target: Microsoft (Competitor)
Triggered by: "Microsoft announces 10,000 layoffs"  ← NEW!
Confidence: 75%
```

### After Week 3:
```
Target Accuracy:
Microsoft: 10 predictions, 8 validated, 7 successful (87% accurate)
Best Pattern: "Layoffs → Restructuring" (95%)
```

### After Week 4:
```
Monitoring Dashboard:
Active: 12 predictions
Watching: 8
Signals Detected: 3
Imminent: 1
Validated Today: 2 ✅
```

---

Want to start with Quick Win 1 (target matching)? I can add that code right now!
