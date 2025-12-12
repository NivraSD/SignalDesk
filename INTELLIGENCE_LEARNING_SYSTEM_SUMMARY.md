# Intelligence Learning System - Implementation Summary

**Deployed:** December 12, 2025
**Status:** Live (Beta)

---

## Overview

The Intelligence Learning System enables SignalDesk to learn from its predictions over time. It creates verifiable predictions from signals, automatically validates them against news evidence, and detects cross-organization patterns.

**Core Insight:** Most intelligence platforms see one company's slice. SignalDesk sees the whole graph across multiple organizations and industries.

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `signal_outcomes` | Tracks predictions and their validation results |
| `entity_signal_amplification` | Detects entities appearing across multiple orgs |
| `cascade_patterns` | Stores learned temporal sequences (seeded with 5 patterns) |
| `signal_accuracy_metrics` | Per-target accuracy tracking |
| `cross_org_patterns` | Industry correlation patterns |

**Migration:** `20251212_intelligence_learning_system.sql`

---

## Edge Functions

### 1. `generate-outcome-predictions`
Creates specific, measurable predictions from signals.

**Input:** Recent signals without predictions
**Output:** Stored predictions with:
- Specific outcome statement
- Timeframe (7-90 days)
- Confidence score
- Verification/refutation criteria

**Example:**
```
Signal: "OpenAI showing increased regulatory engagement"
Prediction: "OpenAI will announce formal regulatory partnership or compliance initiative within 30 days"
Confidence: 0.65
```

### 2. `validate-outcome-predictions`
Searches for evidence that predictions came true.

**Process:**
1. Find predictions due for validation (3+ days old or expired)
2. Search articles using semantic similarity
3. Use Claude to evaluate if evidence matches prediction
4. Mark as accurate/inaccurate/inconclusive
5. Update accuracy metrics

### 3. `compute-entity-amplification`
Finds entities appearing across multiple organizations' signals.

**Calculates:**
- Signal count per entity
- Organization count (cross-org visibility)
- Velocity (signals per day)
- Amplification score (0-100)

**High amplification = multiple orgs seeing same thing = significant**

### 4. `detect-cascade-patterns`
Matches signals against known temporal patterns.

**Seeded Patterns:**
1. Regulatory Investigation Cascade
2. Executive Departure Ripple
3. M&A Announcement Sequence
4. Product Launch Media Cycle
5. Crisis Escalation Pattern

**Creates alerts for expected follow-on events.**

---

## Cron Schedule

| Job | Schedule | Purpose |
|-----|----------|---------|
| `generate-predictions` | 4x daily (5:45, 11:45, 17:45, 23:45 UTC) | Create predictions from new signals |
| `validate-predictions` | Daily (10:00 UTC) | Check if predictions came true |
| `compute-amplification` | Every 6 hours (2, 8, 14, 20 UTC) | Find cross-org entities |
| `detect-cascades` | 2x daily (6:50, 18:50 UTC) | Match signals to patterns |

**Migration:** `20251212_learning_system_cron.sql`

---

## Data Flow

```
Signals Created (existing pipeline)
        │
        ▼
┌───────────────────────────┐
│ generate-outcome-predictions │
│ Creates verifiable predictions │
└───────────────────────────┘
        │
        ▼
┌───────────────────────────┐
│ validate-outcome-predictions │
│ (after 3+ days)              │
│ Searches for evidence         │
│ Marks accurate/inaccurate    │
└───────────────────────────┘
        │
        ▼
┌───────────────────────────┐
│ signal_accuracy_metrics    │
│ Per-target accuracy rates  │
│ Confidence calibration     │
└───────────────────────────┘
```

---

## Key Metrics to Track

| Metric | Target | How Measured |
|--------|--------|--------------|
| Prediction accuracy | >60% | Validated accurate / Total predictions |
| Lead time | >7 days | Days between signal and outcome |
| Confidence calibration | <10% error | Predicted confidence vs actual accuracy |
| Cross-org detection | 5+ weekly | High-amplification entities found |

---

## UI Changes

- Added **Beta** badge to Signals module header
- Updated description: "AI-detected patterns and predictions. Learning system active - accuracy improves over time."

---

## Files Created

```
supabase/migrations/
├── 20251212_intelligence_learning_system.sql   # Tables
└── 20251212_learning_system_cron.sql           # Cron jobs

supabase/functions/
├── generate-outcome-predictions/index.ts
├── validate-outcome-predictions/index.ts
├── compute-entity-amplification/index.ts
└── detect-cascade-patterns/index.ts

src/components/modules/
└── SignalsModule.tsx                           # Beta badge added

docs/
├── INTELLIGENCE_LEARNING_SYSTEM_DESIGN.md      # Full design doc
└── INTELLIGENCE_LEARNING_SYSTEM_SUMMARY.md     # This file
```

---

## What Happens Now

1. **Immediate:** Predictions start being generated from new signals
2. **3+ days:** First validations begin running
3. **30 days:** Enough data to see accuracy trends
4. **90 days:** Cascade patterns start learning from validated outcomes

---

## Limitations (Beta)

- Auto-validation only works if outcomes appear in scraped news
- Some predictions may be too vague to verify
- Cascade patterns are seeded, not yet learned from data
- Cross-org patterns require more organizations to be meaningful

---

## Future Enhancements

1. User feedback buttons ("This happened" / "Didn't happen")
2. Accuracy dashboard in admin
3. Amplification alerts
4. Learned cascade patterns from validated outcomes
5. Confidence-weighted signal scoring
