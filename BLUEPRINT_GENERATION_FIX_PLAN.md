# Blueprint Generation - Complete Fix Plan

**Date:** 2025-10-13
**Status:** ANALYSIS COMPLETE - READY FOR IMPLEMENTATION

---

## The Core Problem (You're 100% Right)

We have COMPREHENSIVE intelligence from:
1. **Research Synthesis** - Structured SPECIFICALLY for blueprint generation
2. **Positioning** - Strategic direction with clear messages and differentiators

But we've been:
- Passing duplicated data (blueprintBase contains reformatted stakeholder data from synthesis)
- Causing 500/504 errors due to massive prompt sizes
- Not systematically using the intelligence we collected

**Your fundamental question:** "HOW ARE WE USING THE DATA. HOW HOW HOW."

---

## Part 1: What Each Function Actually Needs

### Function 1: `niv-campaign-blueprint-base` ✅ CORRECT

**Generates:** Parts 1-2 (Overview + Stakeholder Mapping)

**Current Input:**
```typescript
{
  researchData: CampaignIntelligenceBrief, // ✅ Needs this
  campaignGoal: string,                     // ✅ Needs this
  selectedPositioning: PositioningOption,   // ✅ Needs this
  organizationContext: OrgData              // ✅ Needs this
}
```

**Uses from Research Synthesis:**
- stakeholders[] → Create stakeholder mapping
- keyInsights[] → Strategic insights for overview

**Uses from Positioning:**
- name, description, rationale → Campaign positioning
- keyMessages → Core messages
- differentiators → What makes us unique

**Status:** ✅ CORRECT - No changes needed

---

### Function 2: `niv-campaign-orchestration-phases-1-2` ❌ HAS DUPLICATION

**Generates:** Part 3A (Phases 1-2 Strategic Framework)

**Current Input (WRONG):**
```typescript
{
  blueprintBase: any,         // ❌ CONTAINS DUPLICATE STAKEHOLDER DATA
  researchData: any,          // ✅ Original stakeholder data
  campaignGoal: string,       // ✅ Needs this
  selectedPositioning: any    // ✅ Needs this
}
```

**What It Actually Needs:**
```typescript
{
  // ❌ REMOVE blueprintBase entirely
  researchData: {
    stakeholders: [...],           // Full psychology, fears, aspirations
    narrativeLandscape: {...},     // Narratives to counter/own
    channelIntelligence: {...},    // Where/when/how to reach stakeholders
    historicalInsights: {          // Patterns to follow
      patternRecommendations,
      riskFactors
    }
  },
  selectedPositioning: {
    keyMessages: [...],            // What to say
    differentiators: [...]         // How to differentiate
  },
  campaignGoal: string             // Context
}
```

**Why blueprintBase causes problems:**
- blueprintBase.part2_stakeholderMapping contains reformatted stakeholder data
- researchData.stakeholders contains the ORIGINAL stakeholder data
- Both passed to prompt = MASSIVE duplication
- Result: 500/504 errors

**Fix:** Remove blueprintBase from prompt entirely

---

### Function 3: `niv-campaign-orchestration-phases-3-4` ❌ SAME DUPLICATION

**Current Input (WRONG):**
```typescript
{
  blueprintBase: any,         // ❌ DUPLICATE
  researchData: any,          // ✅ Original data
  campaignGoal: string,       // ✅ Needs this
  selectedPositioning: any    // ✅ Needs this
}
```

**What It Actually Needs:**
- SAME as phases-1-2
- Remove blueprintBase duplication

**Fix:** Remove blueprintBase from prompt entirely

---

### Function 4: `niv-campaign-counter-narrative-generator` ⚠️ NEEDS VERIFICATION

**Generates:** Part 4 (Counter-Narrative Strategy)

**Current Input:**
```typescript
{
  blueprintBase: any,           // ❓ Need to check if this is duplication
  orchestrationStrategy: any,   // ✅ Needs phase structure
  researchData: any,            // ✅ Needs narrative landscape
  campaignGoal: string          // ✅ Needs context
}
```

**What It Actually Needs:**
```typescript
{
  researchData: {
    narrativeLandscape: {         // ✅ What to counter
      dominantNarratives,
      narrativeVacuums,
      competitivePositioning
    },
    stakeholders: [{              // ✅ Who believes narratives
      name,
      psychology.biases           // ✅ What biases to leverage
    }]
  },
  selectedPositioning: {
    keyMessages,                  // ✅ Alternative narrative
    differentiators               // ✅ Why we're different
  },
  orchestrationStrategy: {        // ✅ Phase structure for context
    phases: {...}
  },
  // ⚠️ Check: Does it NEED blueprintBase.overview and blueprintBase.messageArchitecture?
  //    Or can it get everything from researchData + positioning?
}
```

**Current Prompt Analysis:**
```typescript
// Lines 111-126: Uses blueprintBase
${JSON.stringify(blueprintBase.overview, null, 2)}
${JSON.stringify(blueprintBase.messageArchitecture, null, 2)}
${blueprintBase.part2_stakeholderMapping?.groups?.map((g: any) => g.name).join(', ')}
```

**Issue:** It's using:
- blueprintBase.overview → Can be replaced with campaignGoal
- blueprintBase.messageArchitecture → Can be replaced with selectedPositioning.keyMessages
- blueprintBase.part2_stakeholderMapping.groups → Can be replaced with researchData.stakeholders

**Fix:** Remove blueprintBase, use researchData + positioning instead

---

### Function 5: `niv-campaign-pattern-generator` ⚠️ NEEDS VERIFICATION

**Generates:** Part 6 (Pattern Guidance)

**Current Input:**
```typescript
{
  blueprintBase: any,           // ❓ Uses for pattern + overview
  orchestrationStrategy: any    // ✅ Needs phase structure
}
```

**What It Actually Needs:**
```typescript
{
  pattern: string,              // ✅ Campaign pattern (CASCADE, MIRROR, etc)
  patternRationale: string,     // ✅ Why this pattern
  orchestrationStrategy: {      // ✅ Phase structure
    phases: {...}
  },
  // ⚠️ Check: Does it NEED full blueprintBase or just pattern info?
}
```

**Current Prompt Analysis:**
```typescript
// Lines 67-79: Uses blueprintBase
const pattern = blueprintBase.overview?.pattern || 'NETWORK'
${blueprintBase.overview?.patternRationale || ''}
${JSON.stringify(blueprintBase.overview, null, 2)}
${blueprintBase.messageArchitecture?.coreMessage || 'N/A'}
${blueprintBase.part2_stakeholderMapping?.stakeholderRelationships || 'N/A'}
```

**Issue:** It's using:
- blueprintBase.overview.pattern → Can be passed directly as string
- blueprintBase.overview.patternRationale → Can be passed directly
- blueprintBase.messageArchitecture.coreMessage → Can use selectedPositioning.keyMessages[0]
- blueprintBase.part2_stakeholderMapping → Not really needed for pattern guidance

**Fix:** Pass only pattern + patternRationale + orchestrationStrategy, remove blueprintBase duplication

---

### Function 6: `niv-campaign-execution-generator` ✅ LEGITIMATELY NEEDS BLUEPRINT PARTS

**Generates:** Part 5 (Execution Timeline)

**Current Input:**
```typescript
{
  blueprintBase: any,           // ✅ LEGITIMATELY NEEDS THIS
  orchestrationStrategy: any,   // ✅ LEGITIMATELY NEEDS THIS
  organizationContext: any      // ✅ Needs this
}
```

**What It Actually Needs:**
```typescript
{
  blueprintBase: {
    overview: {
      duration,                   // ✅ Total campaign duration
      pattern                     // ✅ For execution approach
    },
    part1_goalFramework: {        // ✅ Success metrics
      primaryObjective,
      behavioralGoals
    }
  },
  orchestrationStrategy: {        // ✅ Phase structure to sequence
    phases: {...}
  },
  organizationContext: {...}      // ✅ Context
}
```

**Why This Is Different:**
- Execution generator SEQUENCES the blueprint parts
- It needs to know what was generated in Parts 1-3 to create timeline
- This is NOT duplication - it's using output from previous functions

**Status:** ✅ CORRECT - No changes needed (legitimate dependency)

---

## Part 2: The Fixes Required

### Fix 1: `niv-campaign-orchestration-phases-1-2` ✅ ALREADY FIXED

**Current State:** Already removed blueprintBase from prompt

**Verification Needed:** Redeploy and test

---

### Fix 2: `niv-campaign-orchestration-phases-3-4` ✅ ALREADY FIXED

**Current State:** Already removed blueprintBase from prompt

**Verification Needed:** Redeploy and test

---

### Fix 3: `niv-campaign-counter-narrative-generator` 🔄 NEEDS FIX

**Change Required:**

```typescript
// REMOVE from prompt:
${JSON.stringify(blueprintBase.overview, null, 2)}
${JSON.stringify(blueprintBase.messageArchitecture, null, 2)}
${blueprintBase.part2_stakeholderMapping?.groups?.map((g: any) => g.name).join(', ')}

// REPLACE WITH:
# Campaign Goal
${campaignGoal}

# Core Messages
${JSON.stringify(selectedPositioning.keyMessages, null, 2)}

# Stakeholder Groups
${researchData.stakeholders.map((s: any) => s.name).join(', ')}
```

**Add to function parameters:**
```typescript
interface CounterNarrativeRequest {
  // ❌ REMOVE: blueprintBase: any
  orchestrationStrategy: any
  researchData: any
  campaignGoal: string
  selectedPositioning: any  // ✅ ADD THIS
}
```

---

### Fix 4: `niv-campaign-pattern-generator` 🔄 NEEDS FIX

**Change Required:**

```typescript
// CHANGE interface:
interface PatternRequest {
  // ❌ REMOVE: blueprintBase: any
  pattern: string              // ✅ ADD: Just the pattern name
  patternRationale: string     // ✅ ADD: Why this pattern
  orchestrationStrategy: any   // ✅ KEEP
  selectedPositioning: any     // ✅ ADD: For core messages
}

// CHANGE prompt:
# Campaign Pattern
**${pattern}**

${patternRationale}

# Core Message
${selectedPositioning.keyMessages[0]}

# Phases
${Object.keys(orchestrationStrategy.phases || {}).map((phase) => {
  const phaseData = orchestrationStrategy.phases[phase]
  return `**${phase}**: ${phaseData.messageTheme || phaseData.objective || 'N/A'}`
}).join('\n')}
```

---

## Part 3: Frontend Changes Needed

### Current Frontend Call (in `CampaignBuilderWizard.tsx`):

**Problem:** Frontend is passing blueprintBase to functions that don't need it

**Need to verify what frontend is passing to each function:**

1. **For orchestration-phases-1-2 and phases-3-4:**
   ```typescript
   // Should be:
   {
     researchData,        // ✅ Full synthesis
     selectedPositioning, // ✅ Selected option
     campaignGoal        // ✅ Goal string
   }
   ```

2. **For counter-narrative-generator:**
   ```typescript
   // Should be:
   {
     researchData,              // ✅ Full synthesis
     selectedPositioning,       // ✅ Selected option
     campaignGoal,             // ✅ Goal string
     orchestrationStrategy     // ✅ Merged phases-1-2 + phases-3-4
   }
   ```

3. **For pattern-generator:**
   ```typescript
   // Should be:
   {
     pattern: blueprintBase.overview.pattern,           // ✅ Just the string
     patternRationale: blueprintBase.overview.patternRationale, // ✅ Just the string
     selectedPositioning,                               // ✅ Selected option
     orchestrationStrategy                              // ✅ Merged phases
   }
   ```

4. **For execution-generator:**
   ```typescript
   // Can keep as-is:
   {
     blueprintBase,           // ✅ Needs Parts 1-2 for sequencing
     orchestrationStrategy,   // ✅ Needs Parts 3A+3B for sequencing
     organizationContext      // ✅ Context
   }
   ```

---

## Part 4: Implementation Checklist

### Phase 1: Edge Function Fixes

- [x] Fix `niv-campaign-orchestration-phases-1-2` - Remove blueprintBase
- [x] Fix `niv-campaign-orchestration-phases-3-4` - Remove blueprintBase
- [ ] Fix `niv-campaign-counter-narrative-generator` - Remove blueprintBase, add selectedPositioning
- [ ] Fix `niv-campaign-pattern-generator` - Remove blueprintBase, pass pattern/rationale directly

### Phase 2: Deployment

- [ ] Deploy `niv-campaign-orchestration-phases-1-2`
- [ ] Deploy `niv-campaign-orchestration-phases-3-4`
- [ ] Deploy `niv-campaign-counter-narrative-generator`
- [ ] Deploy `niv-campaign-pattern-generator`

### Phase 3: Frontend Verification

- [ ] Verify frontend passes correct data to phases-1-2
- [ ] Verify frontend passes correct data to phases-3-4
- [ ] Update frontend call to counter-narrative (add selectedPositioning)
- [ ] Update frontend call to pattern-generator (pass pattern/rationale directly)

### Phase 4: Testing

- [ ] Test complete blueprint generation end-to-end
- [ ] Verify no 500/504 errors
- [ ] Verify all 6 blueprint parts generate successfully
- [ ] Verify total time < 120 seconds

---

## Part 5: Expected Performance After Fixes

### Prompt Size Reduction:

**Before (with blueprintBase):**
- blueprintBase Parts 1-2: ~5000-8000 tokens
- researchData (duplicated stakeholders): ~3000-5000 tokens
- Total: ~8000-13000 tokens per function

**After (without blueprintBase):**
- researchData (original): ~3000-5000 tokens
- positioning: ~500-1000 tokens
- campaignGoal: ~50-100 tokens
- Total: ~3500-6100 tokens per function

**Result:** 50-70% smaller prompts

### Generation Time:

**Before:**
- Phases 1-2: 60-120s (timing out)
- Phases 3-4: 60-120s (timing out)
- Counter-narrative: 30-50s
- Pattern: 20-30s
- Execution: 30-40s
- **Total: 140-360s** (timing out)

**After:**
- Phases 1-2: 20-30s
- Phases 3-4: 20-30s
- Counter-narrative: 20-30s
- Pattern: 15-20s
- Execution: 30-40s
- **Total: 105-150s** (under 2 minutes!)

---

## Part 6: Data Flow Architecture (CORRECT)

```
User Input (Goal + Org Context)
         ↓
    RESEARCH STAGE (20-40s)
         ├─ Stakeholder Analysis
         ├─ Narrative Landscape
         ├─ Channel Intelligence
         └─ Historical Patterns
         ↓
    Research Synthesis (8000 tokens)
    - stakeholders[] with full psychology
    - narrativeLandscape with vacuums/competitors
    - channelIntelligence with journalists
    - historicalInsights with patterns
         ↓
    POSITIONING STAGE (20-30s)
    - Generate 3 positioning options
    - User selects one
         ↓
    Selected Positioning (500-1000 tokens)
    - keyMessages[]
    - differentiators[]
    - targetAudiences[]
         ↓
    BLUEPRINT GENERATION
         ↓
    ┌─────────────────────────────────────┐
    │ Blueprint Base (30s)                │
    │ Uses: research + positioning        │
    │ Generates: Parts 1-2                │
    └─────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────┐
    │ PARALLEL GENERATION (30s max)       │
    │                                     │
    │ ┌─────────────────────────────────┐ │
    │ │ Phases 1-2 (25s)                │ │
    │ │ Uses: research + positioning    │ │
    │ │ NOT: blueprintBase              │ │
    │ └─────────────────────────────────┘ │
    │                                     │
    │ ┌─────────────────────────────────┐ │
    │ │ Phases 3-4 (25s)                │ │
    │ │ Uses: research + positioning    │ │
    │ │ NOT: blueprintBase              │ │
    │ └─────────────────────────────────┘ │
    │                                     │
    │ ┌─────────────────────────────────┐ │
    │ │ Counter-Narrative (25s)         │ │
    │ │ Uses: research.narrative +      │ │
    │ │       positioning +             │ │
    │ │       orchestration (merged)    │ │
    │ │ NOT: blueprintBase              │ │
    │ └─────────────────────────────────┘ │
    │                                     │
    │ ┌─────────────────────────────────┐ │
    │ │ Pattern Guidance (20s)          │ │
    │ │ Uses: pattern string +          │ │
    │ │       positioning +             │ │
    │ │       orchestration (merged)    │ │
    │ │ NOT: blueprintBase              │ │
    │ └─────────────────────────────────┘ │
    └─────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────┐
    │ Execution Timeline (35s)            │
    │ Uses: blueprintBase (Parts 1-2) +   │
    │       orchestration (Parts 3A+3B) + │
    │       org context                   │
    │ ✅ LEGITIMATE use of blueprintBase  │
    └─────────────────────────────────────┘
         ↓
    Complete Blueprint (6 parts)
    - Part 1: Overview & Goals
    - Part 2: Stakeholder Mapping
    - Part 3A: Orchestration Phases 1-2
    - Part 3B: Orchestration Phases 3-4
    - Part 4: Counter-Narrative Strategy
    - Part 5: Execution Requirements
    - Part 6: Pattern Guidance
```

---

## Part 7: Key Principles

### Data Passing Rules:

1. **Research Synthesis is the SOURCE**
   - It's formatted SPECIFICALLY for blueprint generation
   - Pass it to any function that needs intelligence
   - Never pass reformatted versions (like blueprintBase stakeholder mapping)

2. **Positioning is Strategic Direction**
   - Pass it to any function that needs to know WHAT to say
   - Don't duplicate its content in prompts

3. **blueprintBase is OUTPUT, not INPUT**
   - Only pass to functions that need to SEQUENCE blueprint parts (like execution generator)
   - Don't pass to functions GENERATING blueprint parts (circular dependency)

4. **campaignGoal provides context**
   - Small string, pass everywhere for context
   - Don't need to pass full blueprintBase.overview when goal suffices

---

## Part 8: Summary

**The Problem:**
We were passing blueprintBase (which contains reformatted stakeholder data from Part 2) PLUS researchData (which contains original stakeholder data) = MASSIVE duplication causing 500/504 errors

**The Solution:**
1. Remove blueprintBase from orchestration-phases-1-2
2. Remove blueprintBase from orchestration-phases-3-4
3. Remove blueprintBase from counter-narrative-generator, use research + positioning
4. Remove blueprintBase from pattern-generator, pass pattern/rationale directly
5. KEEP blueprintBase in execution-generator (legitimate sequencing need)

**The Result:**
- 50-70% smaller prompts
- No duplication
- 2-4x faster generation
- No timeouts
- Research Synthesis used as the SOURCE it was designed to be

**Status:**
- Phases 1-2 & 3-4: ✅ Fixed, needs deployment
- Counter-narrative: 🔄 Needs fix
- Pattern: 🔄 Needs fix
- Execution: ✅ Correct as-is

---

**Next Steps:** Fix counter-narrative and pattern generators, deploy all, test end-to-end
