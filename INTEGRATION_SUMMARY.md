# Predictions ↔ Targets Integration Summary

## ✅ What's Been Created

### 1. Database Migration
**File:** `supabase/migrations/20251027_link_predictions_to_targets.sql`

Adds to `predictions` table:
- `target_id` - Links to intelligence_targets
- `target_name` - Denormalized for performance
- `target_type` - competitor/topic/keyword/influencer
- Indexes for efficient queries
- `predictions_with_targets` view for enriched data

### 2. TypeScript Types
**File:** `src/types/predictions.ts`

Complete type definitions:
```typescript
interface Prediction {
  // ... existing fields
  target_id?: string | null
  target_name?: string | null
  target_type?: 'competitor' | 'topic' | 'keyword' | 'influencer' | null
}

interface PredictionWithTarget extends Prediction {
  target?: IntelligenceTarget
  // ... enriched target fields
}

interface PredictionFilters {
  target_id?: string
  target_type?: string
  // ... other filters
}
```

### 3. Service Layer
**File:** `src/lib/services/predictionTargetService.ts`

Helper functions for:
- `getPredictionsByTarget()` - Get all predictions for a target
- `getPredictionsByTargetType()` - Filter by competitor/topic/etc
- `getFilteredPredictions()` - Advanced filtering
- `createPrediction()` - Create target-linked predictions
- `updatePredictionTarget()` - Change prediction's target
- `getTargetsWithPredictionCounts()` - Targets with counts
- `getPredictionStatsByTarget()` - Analytics per target

### 4. Documentation
**Files:**
- `PREDICTIONS_TARGETS_INTEGRATION.md` - Full integration guide
- `INTEGRATION_SUMMARY.md` - This file

## 🎯 How It Works

### Before
```typescript
// Predictions were orphaned
const prediction = {
  title: "Microsoft will cut Azure prices",
  confidence: 85
  // ❌ No way to know this is about Microsoft
}
```

### After
```typescript
// Predictions are organized by target
const prediction = {
  title: "Microsoft will cut Azure prices",
  confidence: 85,
  target_id: "microsoft-uuid",
  target_name: "Microsoft",
  target_type: "competitor" // ✅ Now we know!
}
```

## 📊 Use Cases Enabled

### 1. Competitor Intelligence Dashboard
```typescript
// Show all predictions about Microsoft
const predictions = await PredictionTargetService.getPredictionsByTarget(
  orgId,
  microsoftTargetId
)

// Result:
// - "Azure price cuts expected" (85% confidence)
// - "Teams update coming" (72% confidence)
// - "M&A activity predicted" (68% confidence)
```

### 2. Topic Monitoring
```typescript
// Track AI Regulation predictions
const predictions = await PredictionTargetService.getPredictionsByTargetType(
  orgId,
  'topic'
)

// Filter to specific topic
const aiRegPredictions = predictions.filter(p =>
  p.target_name === 'AI Regulation'
)
```

### 3. Target Overview
```typescript
// Get target with prediction count
const target = await PredictionTargetService.getTargetWithPredictionCount(
  orgId,
  targetId
)

// Result:
// {
//   name: "Microsoft",
//   type: "competitor",
//   priority: "high",
//   prediction_count: 5  // ✅ Shows # of active predictions
// }
```

### 4. Smart Filtering
```typescript
// Find high-confidence competitor predictions
const predictions = await PredictionTargetService.getFilteredPredictions(orgId, {
  target_type: 'competitor',
  confidence_min: 80,
  impact_level: 'high',
  status: 'active'
})
```

## 🚀 Next Steps

### Step 1: Apply Migration
```bash
# Run in Supabase SQL Editor
npx supabase db push

# Or copy-paste from:
# supabase/migrations/20251027_link_predictions_to_targets.sql
```

### Step 2: Update Existing Components

#### A. Update StakeholderPredictionDashboard
```typescript
// Add target filtering
import { PredictionTargetService } from '@/lib/services/predictionTargetService'

// Add filter state
const [selectedTargetType, setSelectedTargetType] = useState<string | null>(null)

// Load predictions with filter
const loadPredictions = async () => {
  if (selectedTargetType) {
    const data = await PredictionTargetService.getPredictionsByTargetType(
      organizationId,
      selectedTargetType
    )
    setPredictions(data)
  } else {
    // Load all predictions
  }
}
```

#### B. Add Target Detail View
Create `src/components/targets/TargetDetailView.tsx`:
```typescript
export default function TargetDetailView({ target, organizationId }) {
  const [predictions, setPredictions] = useState([])

  useEffect(() => {
    const loadPredictions = async () => {
      const data = await PredictionTargetService.getPredictionsByTarget(
        organizationId,
        target.id
      )
      setPredictions(data)
    }
    loadPredictions()
  }, [target.id])

  return (
    <div>
      <h2>{target.name}</h2>
      <p>Type: {target.type}</p>
      <p>Predictions: {predictions.length}</p>

      <div>
        {predictions.map(pred => (
          <PredictionCard key={pred.id} prediction={pred} />
        ))}
      </div>
    </div>
  )
}
```

#### C. Enhance TargetManagement
Add prediction counts to target list:
```typescript
const [targets, setTargets] = useState([])

useEffect(() => {
  const load = async () => {
    const data = await PredictionTargetService.getTargetsWithPredictionCounts(orgId)
    setTargets(data)
  }
  load()
}, [orgId])

// Display:
// Microsoft (5 predictions) ← Shows count
// Google (3 predictions)
// AWS (2 predictions)
```

### Step 3: Update Prediction Creation
When generating new predictions:
```typescript
// In intelligence service or prediction generator
const createPrediction = async (signal) => {
  // Find matching target
  const target = await findMatchingTarget(signal)

  // Create prediction with target link
  await PredictionTargetService.createPrediction(
    organizationId,
    target?.id || null,
    {
      title: signal.title,
      description: signal.description,
      category: 'competitive',
      confidence_score: 85,
      time_horizon: '1-month',
      impact_level: 'high'
    }
  )
}
```

## 💡 Advanced Features (Future)

### 1. Auto-Linking
```typescript
// Automatically link predictions to targets based on content
const autoLinkPrediction = async (prediction: Prediction) => {
  const targets = await getTargets(prediction.organization_id)

  // Match by keywords
  const match = targets.find(t =>
    prediction.title.toLowerCase().includes(t.name.toLowerCase()) ||
    t.keywords?.some(k => prediction.title.toLowerCase().includes(k))
  )

  if (match) {
    await PredictionTargetService.updatePredictionTarget(
      prediction.id,
      match.id
    )
  }
}
```

### 2. Target-Based Alerts
```typescript
// Alert when high-confidence prediction created for high-priority target
if (prediction.confidence_score > 80 && target.priority === 'high') {
  await sendAlert({
    title: `High-confidence prediction for ${target.name}`,
    message: prediction.title,
    priority: 'urgent'
  })
}
```

### 3. Analytics Dashboard
```typescript
// Show prediction accuracy by target
const stats = await PredictionTargetService.getPredictionStatsByTarget(orgId)

// Display:
// Microsoft: 5 predictions, 87% avg confidence, 3 high-impact
// Google: 3 predictions, 75% avg confidence, 1 high-impact
```

## 🎨 Example UI Flow

### User Journey:
1. **Setup Targets** → User adds "Microsoft" as competitor
2. **Intelligence Arrives** → System detects Microsoft news
3. **Prediction Generated** → "Microsoft likely to cut prices" (linked to Microsoft target)
4. **User Views** → Dashboard shows predictions grouped by target
5. **Deep Dive** → Click "Microsoft" to see all 5 predictions about them
6. **Filter** → Show only high-confidence competitor predictions
7. **Action** → User creates response campaign based on predictions

## 🔥 Quick Win Implementation

**Minimal viable integration (15 minutes):**

1. Run migration ✅
2. Update prediction display to show `target_name`:
```tsx
<div className="prediction-card">
  <h3>{prediction.title}</h3>
  {prediction.target_name && (
    <span className="badge">
      {prediction.target_name} · {prediction.target_type}
    </span>
  )}
</div>
```

That's it! Predictions now show which target they're about.

## 📝 Testing

```typescript
// Test the integration
const testIntegration = async () => {
  // 1. Create target
  const target = await createTarget({
    name: "Microsoft",
    type: "competitor",
    priority: "high"
  })

  // 2. Create prediction linked to target
  const prediction = await PredictionTargetService.createPrediction(
    orgId,
    target.id,
    {
      title: "Microsoft to announce Azure price cuts",
      description: "Based on competitive signals...",
      category: "competitive",
      confidence_score: 85,
      time_horizon: "1-month",
      impact_level: "high"
    }
  )

  // 3. Retrieve predictions for target
  const predictions = await PredictionTargetService.getPredictionsByTarget(
    orgId,
    target.id
  )

  console.log(`✅ Found ${predictions.length} predictions for ${target.name}`)
}
```

## 📚 Files Created

1. ✅ `supabase/migrations/20251027_link_predictions_to_targets.sql`
2. ✅ `src/types/predictions.ts`
3. ✅ `src/lib/services/predictionTargetService.ts`
4. ✅ `PREDICTIONS_TARGETS_INTEGRATION.md`
5. ✅ `INTEGRATION_SUMMARY.md`

## ❓ Questions?

- **Q: Do all predictions need a target?**
  A: No, `target_id` is nullable. Some predictions may not relate to a specific target.

- **Q: Can a prediction have multiple targets?**
  A: Currently one-to-one. For multiple targets, create separate predictions or use keywords.

- **Q: What if I delete a target?**
  A: `ON DELETE SET NULL` - predictions remain but target_id becomes null.

- **Q: How do I migrate existing predictions?**
  A: Run a script to match existing predictions to targets by keywords/content.

---

**Ready to implement? Start with Step 1: Apply the migration! 🚀**
