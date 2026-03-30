# Signal-Based Prediction Architecture

## Overview
Predictions are now generated from **patterns detected across multiple articles** rather than single headlines.

## Data Flow

```
Monitoring Run
    ↓
Articles Collected
    ↓
target-intelligence-collector
    → Extracts mentions of all intelligence targets
    → Stores in target_intelligence table with:
      - Sentiment (positive/negative/neutral/mixed)
      - Category (partnership/crisis/regulatory/etc)
      - Key entities & topics
      - Relevance score
    ↓
pattern-detector (runs after collection)
    → Analyzes target_intelligence table
    → Detects 3 pattern types:
      1. MOMENTUM: Activity spike vs baseline (3x+)
      2. SENTIMENT SHIFT: Negative/positive trend change
      3. CATEGORY CLUSTERING: Same event type clustering (50%+)
    → Generates prediction_signals with:
      - Signal strength (0-100)
      - Supporting article IDs
      - Baseline comparison
      - Recommendation
    ↓
signal-based-predictor
    → Queries signals WHERE should_predict = true
    → Generates predictions with full context
    → Links to all supporting articles
    → Marks signals as 'predicted'
```

## Database Tables

### 1. target_intelligence
**Core repository**: Every mention of every target
- Indexed by: org, target, date, sentiment, category
- Enables: Pattern detection, trend analysis

### 2. prediction_signals  
**Detected patterns**: Momentum, shifts, clustering
- Indexed by: org, target, strength, status
- Enables: Signal-based predictions

### 3. target_activity_metrics
**Baseline metrics**: For comparison & anomaly detection
- Rolling windows: 7d, 30d, 90d
- Tracks: Avg mentions, sentiment distribution

## Prediction Triggers

Predictions are ONLY generated when:
- **Minimum signals**: 3+ related articles/mentions
- **Time window**: Within 7 days
- **Signal strength**: ≥ 70 (0-100 scale)
- **Pattern detected**: Momentum OR sentiment shift OR clustering

## Example: Real Intelligence

**Day 1-5 monitoring:**
```
target_intelligence table:
├─ Day 1: Total Energies + Mozambique LNG (neutral)
├─ Day 2: Total Energies + environmental concerns (mixed)
├─ Day 3: Mozambique + activist groups + lawsuit (negative)
├─ Day 4: Total Energies + war crimes + legal experts (negative)
└─ Day 5: Multiple articles linking all above (negative)
```

**Pattern detected:**
```
prediction_signals table:
{
  "signal_type": "sentiment_shift",
  "signal_strength": 85,
  "pattern": "sentiment declining - 4/5 articles negative",
  "baseline_comparison": {
    "previous_avg": 1.2 mentions/week,
    "current_count": 5,
    "multiplier": 4.2
  },
  "category_distribution": {
    "legal": 3,
    "regulatory": 1,
    "crisis": 1
  },
  "should_predict": true,
  "prediction_type": "crisis_building"
}
```

**Prediction generated:**
```json
{
  "target": "Total Energies",
  "type": "crisis_building",
  "confidence": 85,
  "pattern": "Momentum + Sentiment Shift + Legal Clustering",
  "recommendation": "Monitor closely - crisis escalation likely",
  "supporting_evidence": [
    { "title": "Total Energies faces war crimes lawsuit...", "date": "Day 4" },
    { "title": "Mozambique activists file complaint...", "date": "Day 3" },
    { "title": "Environmental concerns raised...", "date": "Day 2" }
  ]
}
```

## Benefits

1. **No more single-article predictions**
2. **Pattern-based intelligence** (momentum, shifts, clustering)
3. **Confidence scores** based on signal strength
4. **Full evidence trail** linking to all supporting articles
5. **Baseline comparison** to detect anomalies
6. **Configurable thresholds** for prediction triggers

## Usage

### Run monitoring (auto-collects & detects patterns):
```typescript
await intelligenceService.runMonitoringPipeline(orgId, orgName)
```

### Check for active signals:
```sql
SELECT * FROM signals_needing_predictions;
```

### Generate predictions from signals:
```typescript
await supabase.functions.invoke('signal-based-predictor', {
  body: { organization_id: orgId }
})
```
