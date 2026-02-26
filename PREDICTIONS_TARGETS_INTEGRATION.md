# Predictions ↔ Intelligence Targets Integration

## Overview

This integration connects your **Predictions System** with **Intelligence Targets** to provide context-aware, organized competitive intelligence.

## Architecture

```
┌─────────────────────────────┐
│  Intelligence Targets       │
│  ────────────────────       │
│  • Competitors              │
│  • Topics                   │
│  • Keywords                 │
│  • Influencers              │
└──────────┬──────────────────┘
           │
           │ target_id (FK)
           │
           ▼
┌─────────────────────────────┐
│  Predictions                │
│  ────────────────────       │
│  • What will happen         │
│  • When (time horizon)      │
│  • Confidence score         │
│  • Impact level             │
│  • Linked to target         │
└─────────────────────────────┘
```

## Benefits

### 1. **Organized Intelligence**
- Filter predictions by competitor: "Show me all predictions about Microsoft"
- View predictions by topic: "What's predicted for AI regulation?"
- Track keyword-based predictions: "Predictions mentioning 'cloud security'"

### 2. **Target-Specific Dashboards**
```typescript
// View all predictions for a specific target
GET /api/predictions?target_id={uuid}

// Example: "Microsoft" target shows:
// - "Microsoft likely to acquire AI startup within 3 months" (85% confidence)
// - "Azure pricing changes expected in Q2" (70% confidence)
// - "Teams integration announcement imminent" (92% confidence)
```

### 3. **Smart Generation**
When new intelligence arrives about a target:
```typescript
// Intelligence service detects signal about "Microsoft"
1. Find target_id for "Microsoft" in intelligence_targets
2. Generate prediction based on signal
3. Link prediction to target via target_id
4. Display in target-specific view
```

### 4. **Threat Level Integration**
```typescript
// High-priority competitors get more predictions
if (target.priority === 'high' && target.threat_level > 70) {
  // Generate predictions more frequently
  // Show alerts for new predictions
}
```

## Database Schema

### Before Integration
```sql
predictions:
  - id
  - organization_id
  - title
  - category
  - confidence_score
  - time_horizon
  ❌ No way to know WHICH competitor or topic
```

### After Integration
```sql
predictions:
  - id
  - organization_id
  - title
  - category
  - confidence_score
  - time_horizon
  ✅ target_id          -- Links to intelligence_targets
  ✅ target_name        -- Denormalized for performance
  ✅ target_type        -- competitor, topic, keyword, influencer
```

## Usage Examples

### Example 1: Competitor Monitoring
```typescript
// User sets up targets
const targets = [
  { name: 'Microsoft', type: 'competitor', priority: 'high' },
  { name: 'Google', type: 'competitor', priority: 'high' },
  { name: 'AWS', type: 'competitor', priority: 'medium' }
]

// System generates predictions linked to targets
const predictions = [
  {
    title: 'Microsoft likely to announce Azure price cuts',
    target_id: 'microsoft-uuid',
    target_name: 'Microsoft',
    target_type: 'competitor',
    confidence_score: 85,
    time_horizon: '1-month'
  },
  {
    title: 'Google expected to launch new Workspace feature',
    target_id: 'google-uuid',
    target_name: 'Google',
    target_type: 'competitor',
    confidence_score: 72,
    time_horizon: '3-months'
  }
]

// User can filter
const microsoftPredictions = predictions.filter(p => p.target_id === 'microsoft-uuid')
```

### Example 2: Topic Tracking
```typescript
// User tracks regulatory topics
const topics = [
  { name: 'AI Regulation', type: 'topic', priority: 'high' },
  { name: 'Data Privacy Laws', type: 'topic', priority: 'medium' }
]

// Predictions show what's expected
const predictions = [
  {
    title: 'EU AI Act expected to pass within 6 months',
    target_id: 'ai-regulation-uuid',
    target_name: 'AI Regulation',
    target_type: 'topic',
    confidence_score: 90,
    impact_level: 'high'
  }
]
```

### Example 3: Influencer Monitoring
```typescript
// Track key industry influencers
const influencers = [
  { name: 'Sam Altman', type: 'influencer', keywords: ['OpenAI', 'AGI', 'ChatGPT'] },
  { name: 'Satya Nadella', type: 'influencer', keywords: ['Microsoft', 'Azure', 'AI'] }
]

// Predict their next moves
const predictions = [
  {
    title: 'Sam Altman likely to announce GPT-5 at next event',
    target_id: 'sam-altman-uuid',
    target_type: 'influencer',
    confidence_score: 68,
    time_horizon: '3-months'
  }
]
```

## API Endpoints to Implement

### 1. Get Predictions by Target
```typescript
GET /api/predictions?target_id={uuid}
GET /api/predictions?target_type=competitor
GET /api/predictions?target_name=Microsoft
```

### 2. Create Target-Linked Prediction
```typescript
POST /api/predictions
{
  "organization_id": "...",
  "target_id": "microsoft-uuid",
  "title": "Microsoft expected to...",
  "category": "competitive",
  "confidence_score": 85,
  "time_horizon": "1-month"
}
```

### 3. Target Dashboard with Predictions
```typescript
GET /api/targets/{target_id}/predictions
// Returns target info + all related predictions
```

## UI Components to Build

### 1. Target Detail View
```
┌─────────────────────────────────────┐
│ Microsoft (Competitor)              │
│ Priority: High | Threat: 85         │
├─────────────────────────────────────┤
│ 🔮 Active Predictions (5)           │
│                                     │
│ ⚡ Azure price cuts coming (85%)    │
│    Within 1 month                   │
│                                     │
│ 📢 Teams update expected (72%)      │
│    Within 3 months                  │
│                                     │
│ 💼 M&A activity predicted (68%)     │
│    Within 6 months                  │
└─────────────────────────────────────┘
```

### 2. Predictions Dashboard with Target Filters
```
┌─────────────────────────────────────┐
│ Predictions Dashboard               │
├─────────────────────────────────────┤
│ Filters:                            │
│ ☐ All Targets                       │
│ ☑ Competitors (12 predictions)      │
│ ☐ Topics (8 predictions)            │
│ ☐ Keywords (3 predictions)          │
│                                     │
│ Selected: Competitors               │
│ ├─ Microsoft (5)                    │
│ ├─ Google (4)                       │
│ └─ AWS (3)                          │
└─────────────────────────────────────┘
```

### 3. Intelligence Module Integration
```typescript
// In IntelligenceModule.tsx
<div>
  <TargetList targets={targets} />

  {selectedTarget && (
    <TargetPredictions
      targetId={selectedTarget.id}
      predictions={predictions.filter(p => p.target_id === selectedTarget.id)}
    />
  )}
</div>
```

## Next Steps

1. ✅ Run migration: `20251027_link_predictions_to_targets.sql`
2. ⏳ Update TypeScript types for predictions
3. ⏳ Add target filtering to StakeholderPredictionDashboard
4. ⏳ Create TargetDetailView component
5. ⏳ Update prediction generation to include target_id
6. ⏳ Add target-based analytics

## Migration Instructions

Run in Supabase SQL Editor:
```bash
-- Apply the migration
npx supabase db push

-- Or manually in SQL Editor:
-- Copy contents of supabase/migrations/20251027_link_predictions_to_targets.sql
```

Verify:
```sql
-- Check new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'predictions'
AND column_name IN ('target_id', 'target_name', 'target_type');

-- Test the view
SELECT * FROM predictions_with_targets LIMIT 5;
```
