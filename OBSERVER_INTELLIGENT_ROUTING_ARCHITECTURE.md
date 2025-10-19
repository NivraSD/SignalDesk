# Firecrawl Observer Intelligent Routing Architecture
*AI-powered alert triage system to prevent opportunity/crisis overload*

**Created:** January 2025
**Problem:** Observer alerts need intelligent routing to Crisis vs Opportunities vs Ignore
**Solution:** AI Triage Layer similar to Monitor Stage 2 Relevance

---

## The Problem You Identified

### Without Intelligent Routing:
```
Observer Alert
  ↓
Every change creates opportunity
  ↓
Opportunity Engine generates 100s of opportunities per day
  ↓
User overwhelmed, ignores everything
  ↓
System becomes useless
```

### Crisis Detection Without Severity Levels:
```
Observer Alert → Crisis
  ↓
Every negative mention triggers full crisis protocol
  ↓
False alarms exhaust team
  ↓
Real crisis gets ignored (boy who cried wolf)
```

---

## Proposed Solution: AI Triage Layer

### Architecture Overview

```
Firecrawl Observer (hourly checks)
  ↓
observer-webhook receives change
  ↓
OBSERVER TRIAGE AGENT (NEW)
  ├── Analyze significance (0-100 score)
  ├── Classify type (crisis/opportunity/routine/noise)
  ├── Determine severity (critical/high/medium/low/ignore)
  └── Route to appropriate system
      ↓
  ┌───┴───┬────────┬─────────┐
  ↓       ↓        ↓         ↓
Crisis  Opportunity Info   Ignore
(NIV)   (Detector) (Log)   (Discard)
```

---

## Component 1: Observer Triage Agent

### File: `supabase/functions/observer-triage/index.ts`

**Purpose**: Intelligent classification and routing of Observer alerts

### Triage Decision Matrix

```typescript
interface TriageDecision {
  action: 'crisis' | 'opportunity' | 'info' | 'ignore'
  severity: 'critical' | 'high' | 'medium' | 'low' | 'ignore'
  confidence: number // 0-100
  reasoning: string
  route_to: string[] // ['niv-crisis', 'opportunity-detector', etc.]
}
```

### Triage Logic Flow

```typescript
async function triageObserverAlert(change: ObserverChange) {
  // Step 1: Quick filters (before AI)
  if (isObviousNoise(change)) {
    return { action: 'ignore', severity: 'ignore' }
  }

  // Step 2: AI Analysis
  const analysis = await analyzeChange(change)

  // Step 3: Classification
  const decision = classifyChange(analysis, change)

  // Step 4: Route
  await routeChange(decision, change)

  return decision
}
```

### AI Triage Prompt

```typescript
const TRIAGE_SYSTEM_PROMPT = `
You are an expert triage agent for a PR intelligence system.
Your job: Analyze website changes and classify them for routing.

CLASSIFICATION TYPES:
1. CRISIS - Immediate threat requiring crisis protocols
   Examples: Legal actions, safety incidents, exec scandals, regulatory investigations
   Severity: critical (full protocol), high (monitor + prepare), medium (watch)

2. OPPORTUNITY - PR/marketing opportunity
   Examples: Competitor weakness, market gap, positive trend, partnership opening
   Severity: high (urgent, 24-48h), medium (important, 1 week), low (nice to have)

3. INFO - Worth knowing but no immediate action
   Examples: Minor updates, routine changes, industry news
   Severity: low

4. IGNORE - Noise/irrelevant
   Examples: Typo fixes, formatting changes, footer updates
   Severity: ignore

ORGANIZATION CONTEXT:
Name: {org_name}
Industry: {industry}
Competitors: {competitors}
Current Crisis Status: {crisis_status}

CHANGE DETECTED:
URL: {change_url}
Type: {change_type}
Summary: {change_summary}
Diff: {change_diff}

ANALYSIS REQUIRED:
1. What changed and why it matters (or doesn't)
2. Classification: crisis/opportunity/info/ignore
3. Severity: critical/high/medium/low/ignore
4. Confidence: 0-100
5. Routing: Where should this go?
6. Reasoning: Brief explanation (1-2 sentences)

RESPONSE FORMAT (JSON):
{
  "classification": "crisis|opportunity|info|ignore",
  "severity": "critical|high|medium|low|ignore",
  "confidence": 85,
  "route_to": ["niv-crisis", "opportunity-detector"],
  "reasoning": "Competitor announced major product recall affecting safety. High crisis relevance for competitive positioning opportunity.",
  "recommended_actions": ["Monitor crisis development", "Prepare positioning statement"],
  "time_sensitivity": "24 hours"
}

IMPORTANT RULES:
- Only classify as CRISIS if it's a genuine threat (not minor issues)
- Crisis severity critical = Activate crisis protocols (use sparingly)
- Crisis severity high = Alert crisis team, prepare but don't activate
- Crisis severity medium = Monitor closely, have plan ready
- Opportunity severity based on time window (high = 24-48h, medium = 1 week)
- Default to INFO if uncertain (better safe than noise)
- IGNORE routine website maintenance, formatting changes, minor copy edits
`

serve(async (req) => {
  const change = await req.json()

  // Load organization context
  const org = await loadOrganization(change.organization_id)
  const profile = await loadProfile(change.organization_id)

  // Build analysis prompt
  const prompt = TRIAGE_SYSTEM_PROMPT
    .replace('{org_name}', org.name)
    .replace('{industry}', profile.industry)
    .replace('{competitors}', profile.competitors.join(', '))
    .replace('{crisis_status}', await getCurrentCrisisStatus(org.id))
    .replace('{change_url}', change.url)
    .replace('{change_type}', change.change_type)
    .replace('{change_summary}', change.summary)
    .replace('{change_diff}', change.diff.substring(0, 1000)) // Limit diff length

  // Call Claude for triage
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0.2, // Low temp for consistent triage
      system: prompt,
      messages: [{ role: 'user', content: 'Analyze this change and provide triage decision.' }]
    })
  })

  const aiResponse = await response.json()
  const triageDecision = JSON.parse(aiResponse.content[0].text)

  // Save triage decision
  await saveTriageDecision(change.id, triageDecision)

  // Route based on decision
  await routeChange(triageDecision, change)

  return new Response(JSON.stringify({
    success: true,
    triage: triageDecision
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## Component 2: Crisis NIV with Severity Awareness

### Enhancement to `niv-crisis-advisor`

**Problem:** NIV Crisis doesn't distinguish between:
- **Issue**: "Negative tweet with 50 likes" (worth addressing)
- **Crisis**: "Product recall affecting 100k units" (full protocol)

**Solution:** Add severity-aware response modes

```typescript
const CRISIS_NIV_SEVERITY_MODES = {
  critical: {
    mode: 'FULL_PROTOCOL',
    prompt: `
      CRITICAL CRISIS ACTIVE - FULL CRISIS PROTOCOL
      This is a genuine crisis requiring immediate crisis management.
      Reference the crisis plan and provide directive actions.
      Activate crisis team, implement protocols, manage stakeholders.
    `
  },

  high: {
    mode: 'PREPARE_AND_MONITOR',
    prompt: `
      HIGH SEVERITY ISSUE - PREPARE BUT DON'T ACTIVATE
      This is a serious issue that could escalate to crisis.
      Provide guidance on:
      1. What to monitor for escalation
      2. What to prepare in advance
      3. When to activate full crisis protocol
      DO NOT activate crisis team yet - focus on preparation.
    `
  },

  medium: {
    mode: 'MONITOR_AND_PLAN',
    prompt: `
      MEDIUM SEVERITY ISSUE - MONITOR CLOSELY
      This requires attention but not crisis protocols.
      Provide guidance on:
      1. How to monitor the situation
      2. What plan to have ready (just in case)
      3. Proactive communication to prevent escalation
      This is risk management, not crisis management.
    `
  },

  low: {
    mode: 'ISSUE_MANAGEMENT',
    prompt: `
      LOW SEVERITY ISSUE - ROUTINE HANDLING
      This is a minor issue requiring standard response.
      Provide guidance on:
      1. Quick resolution steps
      2. Standard communication approach
      3. How to prevent recurrence
      This is routine issue management.
    `
  }
}

// Updated Crisis NIV
serve(async (req) => {
  const { crisis_event_id, message, severity } = await req.json()

  // Load appropriate mode based on severity
  const severityMode = CRISIS_NIV_SEVERITY_MODES[severity || 'medium']

  const systemPrompt = `
    ${severityMode.prompt}

    CRISIS CONTEXT:
    - Type: {crisis_type}
    - Severity: {severity}
    - Status: {status}

    CRISIS PLAN:
    {crisis_plan}

    YOUR ROLE: Provide guidance appropriate for {severity} severity.
  `.replace('{severity}', severity)

  // Rest of NIV logic...
})
```

---

## Component 3: Opportunity Filter (Prevent Overload)

### Problem: Every Observer change creates opportunities

**Solution:** Significance scoring threshold (like Monitor Stage 2 Relevance)

```typescript
// In observer-triage or opportunity-detector

async function shouldCreateOpportunity(
  triageDecision: TriageDecision,
  change: ObserverChange
): Promise<boolean> {

  // Must be classified as opportunity
  if (triageDecision.classification !== 'opportunity') {
    return false
  }

  // Severity thresholds
  const SEVERITY_THRESHOLDS = {
    high: 70,    // Auto-create if confidence >= 70
    medium: 80,  // Auto-create if confidence >= 80
    low: 90      // Only create if very confident (>= 90)
  }

  const threshold = SEVERITY_THRESHOLDS[triageDecision.severity]

  if (triageDecision.confidence < threshold) {
    console.log(`⚠️ Opportunity below threshold: ${triageDecision.confidence} < ${threshold}`)
    return false
  }

  // Additional filters
  // 1. Not too similar to existing opportunities
  const existingOpps = await loadRecentOpportunities(change.organization_id, '24h')
  if (isTooSimilar(change, existingOpps)) {
    console.log('⚠️ Too similar to existing opportunity, skipping')
    return false
  }

  // 2. Not noise (routine updates)
  if (isRoutineUpdate(change)) {
    console.log('⚠️ Routine update, not creating opportunity')
    return false
  }

  // 3. Has clear actionability
  if (!hasActionableSteps(triageDecision)) {
    console.log('⚠️ No clear actions, skipping')
    return false
  }

  return true
}
```

---

## Component 4: Routing Logic

### File: `supabase/functions/observer-webhook/index.ts` (Updated)

```typescript
serve(async (req) => {
  const rawChange = await req.json()

  // Step 1: Save raw change
  const change = await saveObserverChange(rawChange)

  // Step 2: Quick filters (before AI)
  if (await isObviousNoise(change)) {
    await markAsIgnored(change.id, 'obvious_noise')
    return new Response('OK - Ignored as noise', { status: 200 })
  }

  // Step 3: AI Triage
  const triage = await callObserverTriage(change)

  // Step 4: Route based on triage
  await routeBasedOnTriage(triage, change)

  return new Response('OK', { status: 200 })
})

async function routeBasedOnTriage(triage: TriageDecision, change: ObserverChange) {
  switch (triage.classification) {
    case 'crisis':
      await handleCrisisRoute(triage, change)
      break

    case 'opportunity':
      await handleOpportunityRoute(triage, change)
      break

    case 'info':
      await handleInfoRoute(triage, change)
      break

    case 'ignore':
      await markAsIgnored(change.id, triage.reasoning)
      break
  }
}

async function handleCrisisRoute(triage: TriageDecision, change: ObserverChange) {
  if (triage.severity === 'critical' || triage.severity === 'high') {
    // Create crisis event or update existing
    const crisisEvent = await findOrCreateCrisisEvent({
      organization_id: change.organization_id,
      crisis_type: determineCrisisType(change, triage),
      severity: triage.severity,
      status: triage.severity === 'critical' ? 'active' : 'monitoring',
      title: `Observer Alert: ${change.summary}`,
      trigger_source: 'observer_alert',
      trigger_data: { change, triage }
    })

    // Send alert to UI
    await sendCrisisAlert({
      organization_id: change.organization_id,
      crisis_event_id: crisisEvent.id,
      severity: triage.severity,
      message: triage.reasoning,
      action: triage.severity === 'critical' ? 'Activate Crisis Center' : 'Review Alert'
    })

    // If critical, could auto-call NIV Crisis for initial guidance
    if (triage.severity === 'critical') {
      await callNivCrisis({
        crisis_event_id: crisisEvent.id,
        message: 'What should I do immediately?',
        severity: 'critical'
      })
    }
  } else {
    // Medium/low severity - just log to crisis monitoring
    await logToCrisisMonitoring(change, triage)
  }
}

async function handleOpportunityRoute(triage: TriageDecision, change: ObserverChange) {
  // Check if should create opportunity
  if (await shouldCreateOpportunity(triage, change)) {
    // Call opportunity detector with Observer context
    await fetch(`${SUPABASE_URL}/functions/v1/mcp-opportunity-detector`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        organization_id: change.organization_id,
        organization_name: change.target_name,
        enriched_data: {
          observer_change: change,
          triage_analysis: triage
        },
        source: 'observer',
        confidence_threshold: 70 // Higher than normal
      })
    })

    console.log(`✅ Created opportunity from Observer change: ${change.summary}`)
  } else {
    console.log(`ℹ️ Observer change noted but not creating opportunity: ${change.summary}`)
    await logToInfoFeed(change, triage)
  }
}

async function handleInfoRoute(triage: TriageDecision, change: ObserverChange) {
  // Just log to intelligence feed
  await logToIntelligenceFeed({
    organization_id: change.organization_id,
    type: 'observer_info',
    title: change.summary,
    content: {
      change,
      triage,
      url: change.url
    },
    severity: 'info'
  })

  console.log(`ℹ️ Info logged: ${change.summary}`)
}
```

---

## Noise Filtering Strategy

### Pre-AI Quick Filters

```typescript
function isObviousNoise(change: ObserverChange): boolean {
  // 1. Very small changes (< 50 characters)
  if (change.diff.length < 50) {
    return true
  }

  // 2. Common noise patterns
  const noisePatterns = [
    /copyright.*\d{4}/i,           // Copyright year updates
    /last updated.*\d{4}/i,        // Last updated timestamps
    /^\s*$/,                        // Whitespace only
    /footer|header|navigation/i,   // Common layout changes
    /cookie|privacy policy/i,      // Legal boilerplate
    /all rights reserved/i
  ]

  if (noisePatterns.some(pattern => pattern.test(change.diff))) {
    return true
  }

  // 3. Tiny structural changes
  if (change.change_type === 'structure_change' && change.diff.length < 100) {
    return true
  }

  return false
}

function isRoutineUpdate(change: ObserverChange): boolean {
  const routineIndicators = [
    /updated.*\d{1,2}\/\d{1,2}\/\d{4}/i,  // Date stamps
    /version \d+\.\d+/i,                    // Version numbers
    /copyright/i,
    /terms of service/i,
    /privacy policy/i
  ]

  return routineIndicators.some(pattern => pattern.test(change.summary))
}
```

---

## Opportunity Deduplication

### Prevent Similar Opportunities

```typescript
async function isTooSimilar(
  change: ObserverChange,
  existingOpps: Opportunity[]
): Promise<boolean> {

  for (const opp of existingOpps) {
    // Check title similarity
    const titleSimilarity = calculateSimilarity(change.summary, opp.title)
    if (titleSimilarity > 0.8) {
      return true
    }

    // Check if same target
    if (opp.context?.observer_change?.url === change.url) {
      // Same page changed recently
      const hoursSinceLastOpp = (Date.now() - new Date(opp.created_at).getTime()) / (1000 * 60 * 60)
      if (hoursSinceLastOpp < 24) {
        return true
      }
    }
  }

  return false
}
```

---

## Cost Management

### Observer Check Frequency

```typescript
const OBSERVER_CHECK_INTERVALS = {
  critical_targets: '15min',   // CEO page, regulatory sites
  high_value: '1hour',         // Competitor product pages
  standard: '6hours',          // General monitoring
  low_priority: '24hours'      // Industry news sites
}

// Configure per target
async function configureObserverTarget(target: ObserverTarget) {
  const interval = determineCheckInterval(target)

  await createFirecrawlObserver({
    url: target.url,
    interval,
    ai_enabled: target.ai_enabled,
    webhook_url: OBSERVER_WEBHOOK_URL
  })
}
```

### Triage Cost Control

```typescript
// Cache triage results for similar changes
const triageCache = new Map<string, TriageDecision>()

async function callObserverTriage(change: ObserverChange): Promise<TriageDecision> {
  // Generate cache key
  const cacheKey = `${change.url}-${hashContent(change.diff)}`

  // Check cache first
  if (triageCache.has(cacheKey)) {
    console.log('✅ Using cached triage decision')
    return triageCache.get(cacheKey)!
  }

  // Call AI triage
  const triage = await callTriageAgent(change)

  // Cache for 1 hour
  triageCache.set(cacheKey, triage)
  setTimeout(() => triageCache.delete(cacheKey), 60 * 60 * 1000)

  return triage
}
```

---

## Database Schema Updates

### Add Triage Data to observer_changes

```sql
ALTER TABLE observer_changes ADD COLUMN
  triage_decision JSONB,
  triage_classification TEXT, -- crisis, opportunity, info, ignore
  triage_severity TEXT, -- critical, high, medium, low, ignore
  triage_confidence INTEGER, -- 0-100
  routed_to TEXT[], -- Which systems received this
  routed_at TIMESTAMPTZ;

CREATE INDEX idx_observer_changes_classification ON observer_changes(triage_classification);
CREATE INDEX idx_observer_changes_severity ON observer_changes(triage_severity);
CREATE INDEX idx_observer_changes_routed ON observer_changes(routed_at DESC);
```

---

## UI Integration

### Observer Dashboard with Triage Visualization

```typescript
// Observer module showing triage results
const ObserverDashboard = () => {
  const [recentChanges, setRecentChanges] = useState([])

  return (
    <div>
      {/* Triage Summary */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Crises Detected"
          count={changes.filter(c => c.triage_classification === 'crisis').length}
          color="red"
        />
        <StatCard
          title="Opportunities Found"
          count={changes.filter(c => c.triage_classification === 'opportunity').length}
          color="green"
        />
        <StatCard
          title="Info Logged"
          count={changes.filter(c => c.triage_classification === 'info').length}
          color="blue"
        />
        <StatCard
          title="Noise Filtered"
          count={changes.filter(c => c.triage_classification === 'ignore').length}
          color="gray"
        />
      </div>

      {/* Recent Changes with Triage */}
      <div className="space-y-2">
        {recentChanges.map(change => (
          <ChangeCard
            key={change.id}
            change={change}
            triage={change.triage_decision}
            onReview={() => reviewChange(change)}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## Testing Strategy

### Triage Accuracy Testing

```typescript
// Test different change types
const TEST_CHANGES = [
  {
    summary: 'Competitor announces major product recall',
    expected_classification: 'crisis',
    expected_severity: 'high'
  },
  {
    summary: 'Competitor CEO resigns amid scandal',
    expected_classification: 'crisis',
    expected_severity: 'critical'
  },
  {
    summary: 'Competitor updates pricing page - 20% increase',
    expected_classification: 'opportunity',
    expected_severity: 'high'
  },
  {
    summary: 'Competitor adds new team member to About page',
    expected_classification: 'info',
    expected_severity: 'low'
  },
  {
    summary: 'Copyright year updated from 2024 to 2025',
    expected_classification: 'ignore',
    expected_severity: 'ignore'
  }
]

async function testTriageAccuracy() {
  let correct = 0

  for (const test of TEST_CHANGES) {
    const triage = await callObserverTriage(test)

    if (triage.classification === test.expected_classification &&
        triage.severity === test.expected_severity) {
      correct++
      console.log(`✅ Correct: ${test.summary}`)
    } else {
      console.log(`❌ Wrong: ${test.summary}`)
      console.log(`   Expected: ${test.expected_classification}/${test.expected_severity}`)
      console.log(`   Got: ${triage.classification}/${triage.severity}`)
    }
  }

  console.log(`\nAccuracy: ${(correct / TEST_CHANGES.length * 100).toFixed(0)}%`)
}
```

---

## Implementation Checklist

### Week 1: Triage Agent
- [ ] Create `observer-triage` edge function
- [ ] Implement triage AI prompt
- [ ] Add noise filtering logic
- [ ] Test triage accuracy with sample changes
- [ ] Deploy with `--no-verify-jwt`

### Week 2: Routing Integration
- [ ] Update `observer-webhook` to call triage
- [ ] Implement routing logic (crisis/opportunity/info/ignore)
- [ ] Add deduplication logic
- [ ] Test end-to-end flow
- [ ] Add database columns for triage data

### Week 3: Crisis NIV Enhancement
- [ ] Add severity-aware modes to `niv-crisis-advisor`
- [ ] Update crisis event creation to include severity
- [ ] Test different severity responses
- [ ] Update Crisis UI to show severity

### Week 4: Opportunity Filtering
- [ ] Add opportunity creation thresholds
- [ ] Implement similarity detection
- [ ] Add actionability checks
- [ ] Test opportunity volume management

---

## Success Metrics

### Triage Accuracy
- ✅ Target: >85% classification accuracy
- ✅ Target: >80% severity accuracy
- ✅ Target: <5% false crisis alerts

### Noise Reduction
- ✅ Target: >90% of noise filtered pre-AI
- ✅ Target: <10% of changes reach opportunity detector
- ✅ Target: <5% of changes trigger crisis alerts

### Cost Efficiency
- ✅ Target: <$500/month for 50 targets
- ✅ Target: Avg 1 AI call per 3 Observer alerts (rest filtered)
- ✅ Target: 70% cache hit rate on triage

### User Impact
- ✅ Target: <10 opportunities per day (down from 100+ without filtering)
- ✅ Target: <1 crisis alert per week (only genuine crises)
- ✅ Target: 90% of alerts are actionable

---

## Conclusion

The Observer Triage Agent solves three critical problems:

1. **Crisis Overload**: Not every negative mention is a crisis - use severity levels
2. **Opportunity Spam**: Filter low-value opportunities before they reach the detector
3. **Noise Management**: Pre-filter obvious noise before calling AI

This creates a sustainable Observer system that enhances intelligence without overwhelming users.

---

*Architecture Created: January 2025*
*Status: Ready for Implementation*
*Priority: Implement before activating Observer (ENABLE_OBSERVER=false until triage is ready)*
