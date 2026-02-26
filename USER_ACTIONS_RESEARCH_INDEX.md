# Campaign Builder User Actions - Research Index

## Overview
Complete technical analysis of how Campaign Builder implements the "user actions" / "additional recommendations" feature, with implementation guidance for the Opportunity Engine.

## Documentation Files

### 1. Main Analysis Document
**File:** `CAMPAIGN_BUILDER_USER_ACTIONS_ANALYSIS.md` (17KB)

Comprehensive technical breakdown covering:
- **Section 1:** Where user actions are generated (generation pipeline)
- **Section 2:** How they're structured (TypeScript interfaces with examples)
- **Section 3:** Types of user actions recommended (5 major categories)
- **Section 4:** Complete recommended action types (20+ specific types)
- **Section 5:** How user actions fit in the blueprint workflow
- **Section 6:** Implementation recommendations for Opportunity Engine
- **Section 7:** Key insights for successful implementation
- **Section 8:** References and source files

**Best For:** Understanding the complete system and architecture

### 2. Quick Reference & Examples
**File:** `CAMPAIGN_BUILDER_USER_ACTIONS_EXAMPLES.md` (18KB)

Quick reference guide with practical examples:
- Generation pipeline overview
- Data structure reference
- Real-world examples (B2B SaaS, B2C Consumer)
- Complete JSON structures
- Frontend display code (copy-paste ready)
- Implementation checklist
- Code location quick reference table

**Best For:** Implementation work and copy-paste examples

---

## Key Findings Summary

### 1. Generation Pipeline
```
Campaign Builder Wizard
    ↓
/api/generate-blueprint
    ↓
niv-campaign-blueprint-orchestrator (Supabase Edge Function)
    ├─ niv-campaign-blueprint-base
    ├─ niv-campaign-orchestration-generator ← CREATES USER ACTIONS HERE
    └─ niv-campaign-execution-generator
    ↓
BlueprintV3Presentation (Frontend display)
```

### 2. Core Data Structure

```typescript
campaign.additionalTactics = Array<{
  type: string                // "executive-coffee", "analyst-briefing"
  who: string                 // "CEO / VP Sales"
  what: string               // Action description
  where: string              // "LinkedIn → Direct message"
  when: string               // "Week 2, after thought leadership"
  estimatedEffort: string    // "1-2 hours (including prep)"
  resources?: string[]       // ["Talking points", "Case studies"]
}>
```

### 3. User Action Types (5 Categories)

| Category | % | Examples |
|----------|---|----------|
| Relationship Building | 30% | Direct outreach, value-first engagement, pitch delivery |
| Event Participation | 20% | Proposal submission, active participation, follow-up |
| Community Engagement | 25% | Thread participation, content sharing, community building |
| Direct Engagement | 15% | Executive outreach, analyst relations, partnerships |
| Content Distribution | 10% | Influencer content, exclusive sharing |

### 4. Frontend Presentation

User actions are displayed with:
- **Amber/Yellow color scheme** for visual distinction
- **Header:** "👤 User Must Execute (N items)"
- **Card format** with WHO, WHERE, WHEN in grid layout
- **Description** showing what action to take
- **Effort estimate** showing time commitment

---

## Critical Code Locations

### Generation
- **Primary Generator:** `/supabase/functions/niv-campaign-orchestration-generator/index.ts` (lines 34-350)
- **Secondary Enrichment:** `/supabase/functions/niv-campaign-execution-generator/index.ts`
- **Finalization:** `/supabase/functions/niv-campaign-blueprint-finalize/index.ts` (lines 1-200)

### Frontend Display
- **Component:** `/src/components/campaign-builder/BlueprintV3Presentation.tsx`
  - Data structure: Lines 6-254
  - User actions display: Lines 722-761
  - Execution inventory: Lines 991-1164

### Workflow Integration
- **Main Component:** `/src/components/campaign-builder/CampaignBuilderWizard.tsx` (lines 1-1522)
- **Service Layer:** `/src/lib/services/campaignBuilderService.ts`

---

## Implementation for Opportunity Engine

### Step 1: Define Data Structure
- Create `opportunityActions` array similar to `additionalTactics`
- Include: type, who, what, where, when, estimatedEffort, priority, resources, successMetric

### Step 2: Create Generation Prompt
- Use Claude with Anthropic SDK (like Campaign Builder does)
- Analyze opportunity stage (Discovery → Closing)
- Map to key stakeholders
- Recommend high-impact human interactions
- Include effort estimates

### Step 3: Build Frontend Component
- Use amber/yellow color scheme (proven in Campaign Builder)
- Display WHO, WHAT, WHERE, WHEN in grid layout
- Show action type as badge
- Display effort estimate
- Link to supporting resources

### Step 4: Integrate with Workflow
- Show count in opportunity summary
- Group by phase/priority
- Enable filtering and sorting
- Track completion progress

### Step 5: Create Supporting Resources
- Email templates for outreach
- Talking points for calls
- Background research on contacts
- Meeting agenda templates

---

## Key Implementation Insights

1. **Visual Distinction is Critical**
   - Use amber/yellow consistently (proven effective)
   - Clear "User Must Execute" labeling prevents confusion with auto-execute actions

2. **Always Include WHO, WHAT, WHERE, WHEN**
   - Minimal structure: these 4 + estimatedEffort
   - Users need to know exactly what to do and how long it takes

3. **Effort Estimates Matter**
   - Must show time commitment upfront
   - Include breakdown (prep + action + follow-up)
   - Helps with prioritization and scheduling

4. **Resources Enable Action**
   - Don't just recommend actions—provide supporting materials
   - Email templates, talking points, contact research, background docs
   - Dramatically increases likelihood of execution

5. **Hierarchical Organization Works**
   - Group by stakeholder or phase
   - Show priority levels (1-4)
   - Enable filtering by effort/impact
   - Progressive disclosure (summary → details)

6. **Progress Tracking Drives Engagement**
   - Allow users to mark actions as complete
   - Track metrics on effectiveness
   - Show feedback on impact
   - Build engagement loop

---

## Quick Start Checklist

- [ ] Read CAMPAIGN_BUILDER_USER_ACTIONS_ANALYSIS.md (full context)
- [ ] Review CAMPAIGN_BUILDER_USER_ACTIONS_EXAMPLES.md (code examples)
- [ ] Copy data structure from Blueprint types
- [ ] Copy frontend display code (lines 722-761)
- [ ] Create generation prompt (template in analysis doc)
- [ ] Define supporting resources for your domain
- [ ] Build Supabase edge function (use orchestration-generator as template)
- [ ] Implement frontend component
- [ ] Add progress tracking
- [ ] Test with real opportunity data

---

## Questions This Research Answers

### Where are user actions generated?
See **Section 1** of analysis doc + Code Location table above

### How are they structured?
See **Section 2** of analysis doc + Data Structure reference

### What types of actions does it recommend?
See **Section 3-4** of analysis doc + Examples doc with real-world cases

### How are they displayed to users?
See **Frontend Display** section of examples doc + BlueprintV3Presentation code

### How can we implement similar functionality?
See **Section 6** of analysis doc + Implementation Checklist in examples doc

---

## Related Files in Project

- `CampaignBuilderWizard.tsx` - Main wizard workflow
- `BlueprintV3Presentation.tsx` - Blueprint display component
- `campaignBuilderService.ts` - Backend service layer
- `campaign_builder_sessions` table - Data persistence
- `VECTOR_CAMPAIGN_BUILDER_COMPLETE.md` - Campaign Builder system status

---

## Document Statistics

| Document | Size | Sections | Code Examples |
|----------|------|----------|----------------|
| Analysis | 17KB | 8 | 15+ |
| Examples | 18KB | 6 | 20+ |
| **Total** | **35KB** | **14** | **35+** |

---

## Version & Status

**Research Date:** October 24, 2025
**Campaign Builder Status:** Production-ready, fully deployed
**Documentation Status:** Complete and comprehensive
**Implementation Ready:** Yes - patterns are proven and tested

---

Generated with Claude Code
For: Opportunity Engine implementation planning
