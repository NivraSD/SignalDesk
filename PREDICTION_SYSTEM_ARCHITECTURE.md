# Prediction System Architecture: Event Detection & Time-Based Tracking

## Overview

This system enables:
1. **Single Event Detection** - Generate predictions from individual intelligence signals
2. **Time-Based Tracking** - Validate predictions, track accuracy, and learn from outcomes

---

## Part 1: Single Event Detection & Prediction

### How It Works

```
┌─────────────────────┐
│  Intelligence Event │  (New article, tweet, filing, etc.)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Event Analysis    │  Extract entities, sentiment, signals
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Target Matching    │  Which targets does this relate to?
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Pattern Recognition │  What patterns does this match?
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Prediction Generator│  Generate forward-looking prediction
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Store & Alert      │  Save prediction, notify user
└─────────────────────┘
```

### Database Schema Enhancement

We need to track the relationship between events and predictions:

```sql
-- Add event tracking to predictions
ALTER TABLE predictions
ADD COLUMN IF NOT EXISTS trigger_event_id UUID REFERENCES content_library(id),
ADD COLUMN IF NOT EXISTS trigger_event_summary TEXT,
ADD COLUMN IF NOT EXISTS pattern_confidence INTEGER, -- How well does event match pattern
ADD COLUMN IF NOT EXISTS similar_historical_events JSONB; -- Past events that led to similar outcomes

-- Track prediction triggers
CREATE TABLE IF NOT EXISTS prediction_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
  event_id UUID REFERENCES content_library(id) ON DELETE SET NULL,
  event_type VARCHAR(50), -- 'news', 'social', 'filing', 'earnings'
  trigger_strength INTEGER, -- 0-100, how strong is this trigger
  matched_patterns JSONB, -- Which patterns did this trigger match
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prediction_triggers_prediction ON prediction_triggers(prediction_id);
CREATE INDEX idx_prediction_triggers_event ON prediction_triggers(event_id);

-- Track historical patterns
CREATE TABLE IF NOT EXISTS prediction_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  target_id UUID REFERENCES intelligence_targets(id) ON DELETE CASCADE,
  pattern_name VARCHAR(255) NOT NULL,
  pattern_description TEXT,
  trigger_signals JSONB, -- What signals indicate this pattern
  typical_outcome TEXT, -- What usually happens
  typical_timeframe VARCHAR(50), -- How long until outcome
  confidence_threshold INTEGER, -- Min confidence to generate prediction
  historical_accuracy DECIMAL(5,2), -- % of past predictions that came true
  sample_size INTEGER DEFAULT 0, -- How many times we've seen this
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prediction_patterns_org ON prediction_patterns(organization_id);
CREATE INDEX idx_prediction_patterns_target ON prediction_patterns(target_id);
```

### Implementation: Event-to-Prediction Pipeline

```typescript
// src/lib/services/eventPredictionService.ts

import { supabase } from '@/lib/supabase/client'
import type { Prediction, IntelligenceTarget } from '@/types/predictions'

interface IntelligenceEvent {
  id: string
  title: string
  content: string
  source: string
  published_at: string
  entities?: string[]
  sentiment?: number
  themes?: string[]
}

interface PredictionPattern {
  id: string
  pattern_name: string
  trigger_signals: string[]
  typical_outcome: string
  typical_timeframe: string
  confidence_threshold: number
  historical_accuracy: number
}

export class EventPredictionService {
  /**
   * Main pipeline: Event → Prediction
   */
  static async processEvent(
    event: IntelligenceEvent,
    organizationId: string
  ): Promise<Prediction[]> {
    console.log(`🔍 Processing event: ${event.title}`)

    // Step 1: Find matching targets
    const targets = await this.matchTargets(event, organizationId)
    if (targets.length === 0) {
      console.log('No matching targets found')
      return []
    }

    console.log(`✅ Matched ${targets.length} targets:`, targets.map(t => t.name))

    // Step 2: For each target, find matching patterns
    const predictions: Prediction[] = []

    for (const target of targets) {
      const patterns = await this.matchPatterns(event, target)

      for (const pattern of patterns) {
        // Step 3: Generate prediction from pattern
        const prediction = await this.generatePrediction(
          event,
          target,
          pattern,
          organizationId
        )

        if (prediction) {
          predictions.push(prediction)
        }
      }
    }

    console.log(`🔮 Generated ${predictions.length} predictions`)
    return predictions
  }

  /**
   * Step 1: Match event to targets
   */
  private static async matchTargets(
    event: IntelligenceEvent,
    organizationId: string
  ): Promise<IntelligenceTarget[]> {
    const { data: targets } = await supabase
      .from('intelligence_targets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true)

    if (!targets) return []

    // Match by name or keywords
    const matchedTargets = targets.filter(target => {
      // Check if target name appears in title or content
      const nameMatch =
        event.title.toLowerCase().includes(target.name.toLowerCase()) ||
        event.content.toLowerCase().includes(target.name.toLowerCase())

      // Check if any keywords match
      const keywordMatch = target.keywords?.some(keyword =>
        event.title.toLowerCase().includes(keyword.toLowerCase()) ||
        event.content.toLowerCase().includes(keyword.toLowerCase()) ||
        event.entities?.some(e => e.toLowerCase() === keyword.toLowerCase())
      )

      return nameMatch || keywordMatch
    })

    return matchedTargets
  }

  /**
   * Step 2: Match event to known patterns
   */
  private static async matchPatterns(
    event: IntelligenceEvent,
    target: IntelligenceTarget
  ): Promise<PredictionPattern[]> {
    const { data: patterns } = await supabase
      .from('prediction_patterns')
      .select('*')
      .eq('target_id', target.id)

    if (!patterns) return []

    // Score each pattern based on how well the event matches
    const scoredPatterns = patterns.map(pattern => {
      const signals = pattern.trigger_signals || []
      const matchCount = signals.filter(signal =>
        event.title.toLowerCase().includes(signal.toLowerCase()) ||
        event.content.toLowerCase().includes(signal.toLowerCase())
      ).length

      const matchScore = (matchCount / Math.max(signals.length, 1)) * 100

      return {
        ...pattern,
        matchScore
      }
    })

    // Return patterns that exceed confidence threshold
    return scoredPatterns
      .filter(p => p.matchScore >= (p.confidence_threshold || 60))
      .sort((a, b) => b.matchScore - a.matchScore)
  }

  /**
   * Step 3: Generate prediction from pattern match
   */
  private static async generatePrediction(
    event: IntelligenceEvent,
    target: IntelligenceTarget,
    pattern: PredictionPattern & { matchScore: number },
    organizationId: string
  ): Promise<Prediction | null> {
    // Use AI to generate specific prediction based on event + pattern
    const prediction = await this.aiGeneratePrediction(event, target, pattern)

    if (!prediction) return null

    // Save to database
    const { data, error } = await supabase
      .from('predictions')
      .insert({
        organization_id: organizationId,
        target_id: target.id,
        target_name: target.name,
        target_type: target.type,
        title: prediction.title,
        description: prediction.description,
        category: this.mapCategory(pattern.pattern_name),
        confidence_score: Math.min(
          Math.round(pattern.matchScore * (pattern.historical_accuracy || 70) / 100),
          100
        ),
        time_horizon: pattern.typical_timeframe,
        impact_level: target.priority === 'high' || target.priority === 'critical' ? 'high' : 'medium',
        trigger_event_id: event.id,
        trigger_event_summary: event.title,
        pattern_confidence: pattern.matchScore,
        data: {
          evidence: [event.title],
          implications: prediction.implications,
          recommended_actions: prediction.actions,
          pattern_matched: pattern.pattern_name
        },
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to save prediction:', error)
      return null
    }

    // Track the trigger
    await supabase.from('prediction_triggers').insert({
      prediction_id: data.id,
      event_id: event.id,
      event_type: 'intelligence',
      trigger_strength: pattern.matchScore,
      matched_patterns: [pattern.pattern_name]
    })

    return data
  }

  /**
   * AI-powered prediction generation
   */
  private static async aiGeneratePrediction(
    event: IntelligenceEvent,
    target: IntelligenceTarget,
    pattern: PredictionPattern
  ): Promise<{
    title: string
    description: string
    implications: string[]
    actions: string[]
  } | null> {
    // This would call your AI service (OpenAI, Claude, etc.)
    // For now, template-based generation:

    return {
      title: `${target.name} likely to ${pattern.typical_outcome}`,
      description: `Based on ${event.title} and historical pattern "${pattern.pattern_name}", we predict ${target.name} will ${pattern.typical_outcome} within ${pattern.typical_timeframe}.`,
      implications: [
        `${target.name}'s strategy may shift in response to ${event.title.substring(0, 50)}...`,
        `Market positioning could change within ${pattern.typical_timeframe}`,
        `Competitive landscape may be affected`
      ],
      actions: [
        `Monitor ${target.name} announcements closely over next ${pattern.typical_timeframe}`,
        `Prepare counter-strategy in case prediction materializes`,
        `Brief stakeholders on potential market shifts`
      ]
    }
  }

  private static mapCategory(patternName: string): string {
    const lowerPattern = patternName.toLowerCase()
    if (lowerPattern.includes('competitor') || lowerPattern.includes('competitive')) return 'competitive'
    if (lowerPattern.includes('regulation') || lowerPattern.includes('regulatory')) return 'regulatory'
    if (lowerPattern.includes('market')) return 'market'
    if (lowerPattern.includes('technology') || lowerPattern.includes('tech')) return 'technology'
    if (lowerPattern.includes('partnership') || lowerPattern.includes('alliance')) return 'partnership'
    if (lowerPattern.includes('crisis') || lowerPattern.includes('risk')) return 'crisis'
    return 'market'
  }
}

// Example usage:
// const event = {
//   id: 'event-123',
//   title: 'Microsoft announces 10,000 layoffs',
//   content: 'Microsoft Corp announced today...',
//   source: 'Reuters',
//   published_at: '2025-10-27',
//   entities: ['Microsoft', 'Satya Nadella'],
//   sentiment: -0.6
// }
//
// const predictions = await EventPredictionService.processEvent(event, orgId)
// // Returns: [
// //   { title: "Microsoft likely to restructure cloud division", confidence: 75, ... }
// // ]
```

### Integration with Intelligence Module

```typescript
// src/lib/services/intelligenceService.ts

// When new intelligence arrives:
async function processNewIntelligence(item: any, organizationId: string) {
  // 1. Save to content_library
  const { data: savedItem } = await supabase
    .from('content_library')
    .insert(item)
    .select()
    .single()

  // 2. Generate predictions from this event
  const predictions = await EventPredictionService.processEvent(
    savedItem,
    organizationId
  )

  // 3. Alert user if high-confidence predictions
  const highConfidence = predictions.filter(p => p.confidence_score >= 80)
  if (highConfidence.length > 0) {
    await sendAlert({
      title: `${highConfidence.length} high-confidence predictions generated`,
      predictions: highConfidence
    })
  }

  return { savedItem, predictions }
}
```

---

## Part 2: Time-Based Tracking & Validation

### How It Works

```
Timeline:
T0: Event detected → Prediction created
T1: User reviews prediction
T2: Outcome deadline approaches (monitoring phase)
T3: Outcome occurs or deadline passes
T4: Validation & learning

┌─────────────────────────────────────────────────┐
│ Prediction Lifecycle                            │
├─────────────────────────────────────────────────┤
│                                                 │
│  active → monitoring → validated/invalidated   │
│            ↓                                    │
│          expired (deadline passed, no outcome)  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Database Schema for Tracking

```sql
-- Track prediction outcomes
CREATE TABLE IF NOT EXISTS prediction_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,

  -- Validation
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id), -- Who validated
  outcome_occurred BOOLEAN, -- Did the prediction come true?
  actual_outcome TEXT, -- What actually happened
  actual_date TIMESTAMPTZ, -- When did it happen

  -- Accuracy metrics
  timing_accuracy INTEGER, -- 0-100, how close was the timing
  description_accuracy INTEGER, -- 0-100, how accurate was the description
  overall_accuracy INTEGER, -- 0-100, overall accuracy score

  -- Learning data
  variance_explanation TEXT, -- Why did we get it right/wrong?
  lessons_learned TEXT,
  pattern_adjustment_needed BOOLEAN,

  -- Evidence
  evidence_links TEXT[], -- URLs proving outcome
  evidence_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prediction_outcomes_prediction ON prediction_outcomes(prediction_id);
CREATE INDEX idx_prediction_outcomes_validated ON prediction_outcomes(validated_at);

-- Prediction monitoring (tracks progress toward validation)
CREATE TABLE IF NOT EXISTS prediction_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,

  -- Monitoring status
  monitoring_status VARCHAR(50), -- 'watching', 'signals_detected', 'outcome_imminent'
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  next_check_at TIMESTAMPTZ, -- When to check again

  -- Progress indicators
  supporting_signals_count INTEGER DEFAULT 0, -- How many signals support this
  contradicting_signals_count INTEGER DEFAULT 0, -- How many signals contradict
  confidence_trend VARCHAR(20), -- 'increasing', 'stable', 'decreasing'

  -- Related events
  related_events JSONB, -- Events that relate to this prediction

  -- Alerts
  alert_threshold_met BOOLEAN DEFAULT FALSE,
  last_alert_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prediction_monitoring_prediction ON prediction_monitoring(prediction_id);
CREATE INDEX idx_prediction_monitoring_status ON prediction_monitoring(monitoring_status);
CREATE INDEX idx_prediction_monitoring_next_check ON prediction_monitoring(next_check_at);

-- Aggregate accuracy metrics by target
CREATE TABLE IF NOT EXISTS target_prediction_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  target_id UUID REFERENCES intelligence_targets(id) ON DELETE CASCADE,

  -- Counts
  total_predictions INTEGER DEFAULT 0,
  validated_predictions INTEGER DEFAULT 0,
  successful_predictions INTEGER DEFAULT 0, -- Came true
  failed_predictions INTEGER DEFAULT 0, -- Didn't come true
  expired_predictions INTEGER DEFAULT 0, -- Timed out

  -- Accuracy
  overall_accuracy DECIMAL(5,2), -- % that came true
  avg_timing_accuracy DECIMAL(5,2), -- How close was timing on average

  -- By timeframe
  accuracy_1week DECIMAL(5,2),
  accuracy_1month DECIMAL(5,2),
  accuracy_3months DECIMAL(5,2),
  accuracy_6months DECIMAL(5,2),

  -- Confidence calibration
  avg_confidence_when_right DECIMAL(5,2),
  avg_confidence_when_wrong DECIMAL(5,2),

  -- Learning
  most_accurate_pattern VARCHAR(255),
  least_accurate_pattern VARCHAR(255),

  last_updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, target_id)
);

CREATE INDEX idx_target_metrics_org ON target_prediction_metrics(organization_id);
CREATE INDEX idx_target_metrics_target ON target_prediction_metrics(target_id);
```

### Implementation: Prediction Monitoring Service

```typescript
// src/lib/services/predictionMonitoringService.ts

export class PredictionMonitoringService {
  /**
   * Monitor active predictions for outcomes
   * Run this periodically (e.g., daily cron job)
   */
  static async monitorActivePredictions(organizationId: string) {
    console.log('🔍 Monitoring active predictions...')

    // Get predictions that need checking
    const { data: predictions } = await supabase
      .from('predictions')
      .select(`
        *,
        prediction_monitoring (*)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (!predictions) return

    for (const prediction of predictions) {
      await this.checkPrediction(prediction)
    }
  }

  /**
   * Check a single prediction for outcomes
   */
  private static async checkPrediction(prediction: any) {
    // 1. Check if deadline has passed
    const deadline = this.calculateDeadline(prediction)
    const now = new Date()

    if (now > deadline) {
      // Mark as expired if no outcome detected
      await this.expirePrediction(prediction)
      return
    }

    // 2. Search for evidence of outcome
    const evidence = await this.searchForOutcome(prediction)

    if (evidence.found) {
      // Outcome detected! Update prediction
      await this.recordOutcome(prediction, evidence)
    } else {
      // No outcome yet, update monitoring status
      await this.updateMonitoring(prediction, evidence)
    }
  }

  /**
   * Search for evidence that prediction came true
   */
  private static async searchForOutcome(prediction: any) {
    // Search recent intelligence for evidence
    const searchTerms = this.extractSearchTerms(prediction)

    const { data: recentEvents } = await supabase
      .from('content_library')
      .select('*')
      .eq('organization_id', prediction.organization_id)
      .gte('published_at', prediction.created_at) // After prediction was made
      .or(searchTerms.map(term => `content.ilike.%${term}%`).join(','))
      .order('published_at', { ascending: false })
      .limit(10)

    // Analyze events for outcome match
    const matchScore = this.calculateOutcomeMatch(prediction, recentEvents || [])

    return {
      found: matchScore > 70,
      confidence: matchScore,
      evidence: recentEvents,
      summary: this.summarizeEvidence(recentEvents)
    }
  }

  /**
   * Record that prediction came true
   */
  private static async recordOutcome(prediction: any, evidence: any) {
    // Update prediction status
    await supabase
      .from('predictions')
      .update({ status: 'validated' })
      .eq('id', prediction.id)

    // Record outcome
    await supabase
      .from('prediction_outcomes')
      .insert({
        prediction_id: prediction.id,
        validated_at: new Date().toISOString(),
        outcome_occurred: true,
        actual_outcome: evidence.summary,
        actual_date: evidence.evidence[0]?.published_at,
        overall_accuracy: evidence.confidence,
        evidence_links: evidence.evidence.map((e: any) => e.url)
      })

    // Update target metrics
    await this.updateTargetMetrics(prediction, true)

    // Alert user
    await this.sendValidationAlert(prediction, evidence)
  }

  /**
   * Mark prediction as expired (deadline passed, no outcome)
   */
  private static async expirePrediction(prediction: any) {
    await supabase
      .from('predictions')
      .update({ status: 'expired' })
      .eq('id', prediction.id)

    await supabase
      .from('prediction_outcomes')
      .insert({
        prediction_id: prediction.id,
        validated_at: new Date().toISOString(),
        outcome_occurred: false,
        actual_outcome: 'Prediction deadline passed with no outcome detected',
        overall_accuracy: 0
      })

    await this.updateTargetMetrics(prediction, false)
  }

  /**
   * Update monitoring status (outcome not yet detected)
   */
  private static async updateMonitoring(prediction: any, evidence: any) {
    const supportingSignals = evidence.evidence?.filter((e: any) =>
      this.isSupporting(e, prediction)
    ).length || 0

    await supabase
      .from('prediction_monitoring')
      .upsert({
        prediction_id: prediction.id,
        monitoring_status: supportingSignals > 2 ? 'signals_detected' : 'watching',
        last_checked_at: new Date().toISOString(),
        next_check_at: this.calculateNextCheck(prediction),
        supporting_signals_count: supportingSignals,
        related_events: evidence.evidence
      })
  }

  /**
   * Update aggregate accuracy metrics for target
   */
  private static async updateTargetMetrics(prediction: any, successful: boolean) {
    const { data: metrics } = await supabase
      .from('target_prediction_metrics')
      .select('*')
      .eq('target_id', prediction.target_id)
      .single()

    const total = (metrics?.total_predictions || 0) + 1
    const validated = (metrics?.validated_predictions || 0) + 1
    const successCount = (metrics?.successful_predictions || 0) + (successful ? 1 : 0)
    const accuracy = (successCount / validated) * 100

    await supabase
      .from('target_prediction_metrics')
      .upsert({
        organization_id: prediction.organization_id,
        target_id: prediction.target_id,
        total_predictions: total,
        validated_predictions: validated,
        successful_predictions: successCount,
        failed_predictions: validated - successCount,
        overall_accuracy: accuracy,
        last_updated_at: new Date().toISOString()
      })
  }

  // Helper functions...
  private static calculateDeadline(prediction: any): Date {
    const created = new Date(prediction.created_at)
    const horizon = prediction.time_horizon

    const daysToAdd = {
      '1-week': 14,
      '1-month': 45,
      '3-months': 120,
      '6-months': 210,
      '1-year': 425
    }[horizon] || 60

    return new Date(created.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
  }

  private static extractSearchTerms(prediction: any): string[] {
    return [
      prediction.target_name,
      ...prediction.title.split(' ').filter((w: string) => w.length > 4)
    ]
  }

  private static calculateOutcomeMatch(prediction: any, events: any[]): number {
    // Simple scoring based on keyword matches
    // In production, use AI to determine if events match prediction
    let score = 0
    const keywords = prediction.title.toLowerCase().split(' ')

    events.forEach(event => {
      const content = (event.title + ' ' + event.content).toLowerCase()
      const matches = keywords.filter(k => content.includes(k)).length
      score += (matches / keywords.length) * 20
    })

    return Math.min(score, 100)
  }

  private static isSupporting(event: any, prediction: any): boolean {
    // Determine if event supports or contradicts prediction
    // In production, use AI analysis
    const keywords = prediction.title.toLowerCase().split(' ')
    const content = (event.title + ' ' + event.content).toLowerCase()
    return keywords.some(k => content.includes(k))
  }

  private static calculateNextCheck(prediction: any): string {
    // Check more frequently as deadline approaches
    const deadline = this.calculateDeadline(prediction)
    const now = new Date()
    const daysUntil = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil < 7) return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() // Daily
    if (daysUntil < 30) return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() // Every 3 days
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // Weekly
  }

  private static summarizeEvidence(events: any[]): string {
    if (!events || events.length === 0) return 'No evidence found'
    return events[0].title // In production, use AI to summarize
  }

  private static async sendValidationAlert(prediction: any, evidence: any) {
    console.log(`✅ Prediction validated: ${prediction.title}`)
    // Send notification to user
  }
}
```

---

## Part 3: Example User Flows

### Flow 1: Instant Prediction from Single Event

```
1. User adds "Microsoft" as competitor target with keywords: ["Azure", "cloud", "AI"]

2. Intelligence service detects news: "Microsoft announces major Azure price reduction"

3. System automatically:
   ├─ Matches to "Microsoft" target (name match)
   ├─ Matches to pattern "Price Cut → Market Share Push" (historical pattern)
   ├─ Generates prediction: "Microsoft likely to increase Azure marketing spend 200% within 1 month"
   └─ Saves with 85% confidence (pattern has 85% historical accuracy)

4. User sees in dashboard:
   "🔮 New Prediction: Microsoft (Competitor)
    Microsoft likely to increase Azure marketing spend 200% within 1 month
    Confidence: 85% | Triggered by: Microsoft announces major Azure price reduction"
```

### Flow 2: Tracking Prediction Over Time

```
Day 0: Prediction created
       "AWS will launch new AI service within 3 months" (75% confidence)

Day 7: Monitoring check
       Status: Watching
       Supporting signals: 0
       Contradicting signals: 0

Day 30: Monitoring check
        Status: Signals detected (2 supporting signals found)
        - "AWS job postings mention new AI product"
        - "AWS reserved conference venue for Q2 event"
        Confidence trend: Increasing → Update to 82%

Day 60: Monitoring check
        Status: Outcome imminent
        Supporting signals: 4
        Alert sent to user: "Prediction likely to materialize soon"

Day 75: Outcome detected!
        Event: "AWS announces SageMaker Pro AI service"
        Timing: Within predicted window ✅
        Description match: 90% ✅
        Overall accuracy: 88%

        Metrics updated:
        - AWS target: 5/6 predictions successful (83% accuracy)
        - "Product Launch" pattern: 12/15 successful (80% accuracy)
```

### Flow 3: Failed Prediction - Learning

```
Day 0: Prediction created
       "Google will discontinue Stadia within 6 months" (70% confidence)

Day 180: Deadline passed
         No outcome detected
         Status: Expired

         Analysis:
         - Initial signals: Declining user base, negative press
         - What happened instead: Google pivoted Stadia to B2B offering
         - Why we got it wrong: Pattern assumed shutdown, not pivot

         Learning:
         ├─ Update pattern: "Failing Consumer Product" now includes "pivot to B2B" outcome
         ├─ Adjust Google target metrics: 4/6 successful (67% → 66%)
         └─ Note: "Google tends to pivot rather than shut down products"
```

---

## Part 4: UI Components Needed

### 1. Prediction Timeline View
```tsx
<PredictionTimeline prediction={prediction}>
  Day 0: Created (75% confidence)
  Day 7: Monitoring - no signals
  Day 30: Signals detected → 82% confidence
  Day 60: Outcome imminent - alert sent
  Day 75: ✅ Validated - 88% accurate
</PredictionTimeline>
```

### 2. Target Accuracy Dashboard
```tsx
<TargetAccuracyDashboard target="Microsoft">
  Total Predictions: 15
  Validated: 12
  Successful: 10 (83% accuracy)

  By Timeframe:
  - 1-week: 100% (3/3)
  - 1-month: 85% (6/7)
  - 3-months: 50% (1/2)

  Most Accurate Pattern: "Price Cut → Market Push" (90%)
  Needs Improvement: "M&A Activity" (40%)
</TargetAccuracyDashboard>
```

### 3. Active Predictions Monitor
```tsx
<ActivePredictionsMonitor>
  Monitoring 8 predictions:

  ⚡ Imminent (2):
  - "Microsoft Azure price cuts" (2 days until deadline)
  - "Google AI announcement" (5 days until deadline)

  👀 Watching (5):
  - "AWS new service launch" (45 days remaining)
  - "Meta layoffs" (60 days remaining)

  🟢 Signals Detected (1):
  - "Salesforce acquisition" (30 days, 3 supporting signals)
</ActivePredictionsMonitor>
```

---

## Part 5: Implementation Roadmap

### Phase 1: Single Event Detection (Week 1-2)
- [ ] Create prediction_patterns table
- [ ] Create prediction_triggers table
- [ ] Build EventPredictionService
- [ ] Integrate with intelligence pipeline
- [ ] Test with sample events

### Phase 2: Pattern Library (Week 3)
- [ ] Define initial patterns for common scenarios
- [ ] Create UI for managing patterns
- [ ] Seed patterns for each target type

### Phase 3: Monitoring & Tracking (Week 4-5)
- [ ] Create prediction_outcomes table
- [ ] Create prediction_monitoring table
- [ ] Build PredictionMonitoringService
- [ ] Set up cron job for daily checks
- [ ] Build validation UI

### Phase 4: Metrics & Learning (Week 6)
- [ ] Create target_prediction_metrics table
- [ ] Build analytics dashboard
- [ ] Implement accuracy tracking
- [ ] Build pattern refinement system

### Phase 5: Advanced Features (Week 7+)
- [ ] AI-powered outcome detection
- [ ] Automatic pattern learning
- [ ] Confidence calibration
- [ ] Multi-event predictions

---

Ready to implement? We can start with Phase 1 - setting up the event detection pipeline!
