# Media Targeting for Opportunities - Implementation Summary

## Overview
Enhanced the opportunity detection system to include journalist targeting guidance, ensuring that when opportunities are executed, the system generates relevant, targeted media lists instead of generic journalist lists.

## Problem Solved
Previously, when opportunities were detected, there was no guidance on which journalists would actually care about the story. This led to:
- Generic media lists with irrelevant journalists
- Manual work to figure out targeting strategy
- Missed opportunities to reach the right audience

## Solution
Opportunities now include `media_targeting` metadata that specifies:
- Who would care about this story (journalist types)
- Which publications to target
- Why these journalists would be interested
- Beat keywords for filtering

## Changes Made

### 1. Type Definitions (`types-v2.ts`)
Added `MediaTargeting` interface:
```typescript
export interface MediaTargeting {
  primary_journalist_types: string[]  // e.g., "PR trade journalists"
  target_industries: string[]         // e.g., ["public_relations"]
  target_outlets: string[]            // e.g., ["PRWeek", "TechCrunch"]
  reasoning: string                   // Why these journalists would care
  beat_keywords: string[]             // Keywords for filtering by beat
}
```

Added `media_targeting` to `StrategicContext`:
```typescript
export interface StrategicContext {
  // ... existing fields ...
  media_targeting?: MediaTargeting
}
```

### 2. Opportunity Detection Prompt (`prompt-v2.ts`)
Updated the prompt to:
- Instruct Claude to think like a PR strategist when recommending journalists
- Provide context about available journalist database (PR trades, tech, advertising, etc.)
- Require `media_targeting` for every opportunity
- Include detailed example showing proper media targeting structure

Key additions:
- Section "3. MEDIA TARGETING GUIDANCE" explaining how to think about journalist targeting
- Added `media_targeting` to the example opportunity structure
- Made media_targeting a required field in critical requirements

### 3. Opportunity Detector (`index.ts`)
Added logging to track media targeting:
```typescript
if (opp.strategic_context?.media_targeting) {
  console.log(`📰 Media targeting for "${opp.title}":`, {
    journalist_types: opp.strategic_context.media_targeting.primary_journalist_types,
    target_industries: opp.strategic_context.media_targeting.target_industries,
    target_outlets: opp.strategic_context.media_targeting.target_outlets?.slice(0, 3)
  });
}
```

The `strategic_context` (which includes `media_targeting`) is automatically stored in the database as JSONB.

### 4. NIV System Prompt (`system-prompt.ts`)
Updated NIV to use media targeting guidance:

**Added section "🎯 EXECUTING OPPORTUNITIES - CRITICAL GUIDANCE":**
- Explains what `opportunity.strategic_context.media_targeting` contains
- Instructs NIV to check for media_targeting when generating media lists
- Provides guidance on how to use the targeting data strategically
- Example: Use the reasoning from media_targeting to craft targeted focus_area

**Updated Media List tool description:**
- Changed count from 149+ to 169+ journalists (accurate)
- Added note about checking `opportunity.strategic_context.media_targeting`
- Emphasizes using this guidance to ensure targeted, relevant media lists

## Workflow

### Before (Generic Approach):
1. Opportunity detected: "Competitor launches product"
2. User executes opportunity in NIV
3. NIV generates generic media list: "tech journalists"
4. Results: Random NYT tech reporters, not relevant to the story

### After (Targeted Approach):
1. Opportunity detected: "Competitor launches product"
2. Opportunity includes media_targeting:
   ```json
   {
     "primary_journalist_types": ["Enterprise tech journalists", "SaaS reporters"],
     "target_industries": ["technology"],
     "target_outlets": ["TechCrunch", "The Information", "VentureBeat"],
     "reasoning": "Enterprise tech journalists are actively covering this space and would be interested in competitive analysis and alternative solutions",
     "beat_keywords": ["enterprise software", "SaaS", "B2B technology"]
   }
   ```
3. User executes opportunity in NIV
4. NIV reads media_targeting and generates targeted list
5. Results: Relevant enterprise/SaaS journalists who actually cover this beat

## Example Output

When Claude detects an opportunity, it will now include:

```json
{
  "title": "Counter Competitor's Product Launch",
  "strategic_context": {
    "trigger_events": ["Competitor X launched new product"],
    "media_targeting": {
      "primary_journalist_types": [
        "Enterprise tech journalists covering SaaS",
        "Technology reporters focusing on competitive analysis"
      ],
      "target_industries": ["technology"],
      "target_outlets": [
        "TechCrunch",
        "The Information",
        "VentureBeat",
        "SaaStr",
        "TechTarget"
      ],
      "reasoning": "Enterprise tech journalists are actively covering product launches in this space and would be interested in competitive positioning, alternative solutions, and expert analysis on why timing/features matter. They typically look for counter-narratives and different perspectives on major announcements.",
      "beat_keywords": [
        "enterprise software",
        "SaaS",
        "B2B technology",
        "competitive analysis",
        "product launches"
      ]
    }
  }
}
```

## Benefits

1. **Targeted Lists**: Media lists generated for opportunities will include journalists who actually care about the story
2. **Saved Time**: No manual work to figure out journalist targeting strategy
3. **Better Results**: Higher chance of media pickup because journalists are pre-qualified as interested
4. **Strategic Context**: Opportunity detector thinks like a PR strategist from the start
5. **Consistency**: Every opportunity has clear media targeting guidance

## Database Impact

No database migration needed - the `strategic_context` column already exists as JSONB and will automatically store the `media_targeting` object as part of the strategic context.

## Testing

To test this feature:
1. Run opportunity detection (detects opportunities from intelligence data)
2. Check logs for `📰 Media targeting for...` to see the targeting guidance
3. Execute an opportunity in NIV
4. Request a media list - NIV should use the media_targeting guidance
5. Verify the media list includes relevant, targeted journalists

## Next Steps

1. Deploy updated opportunity detector
2. Monitor opportunity detection logs to see media targeting suggestions
3. Have users execute opportunities and verify media lists are targeted
4. Collect feedback on journalist relevance
5. Potentially expand journalist database based on targeting needs
