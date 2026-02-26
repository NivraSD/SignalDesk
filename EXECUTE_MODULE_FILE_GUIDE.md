# Execute Module - File Reference Guide

## Quick Navigation

### Frontend Components

#### Execute Module UI
- `/src/components/execute/ExecuteTabProduction.tsx` - Main execute tab (lines 1-100+)
  - Content routing map (lines 33-150)
  - Content types configuration (lines 45-94)

#### Content Orchestrator
- `/src/components/execute/NIVContentOrchestratorProduction.tsx` - Interactive content generation
  - Content routing map (lines 33-150)
  - Service routing logic
  - Response handling

### API Routes (Next.js)

#### Campaign Execution
- `/src/app/api/campaign-executor/route.ts` - Entry point for campaign execution
  - Routes to Supabase edge function `niv-campaign-executor`
  - Logs blueprint info, executes campaign

#### Visual Content
- `/src/app/api/visual/image/route.ts` - Image generation API
  - Lines 1-85: Three-tier response handling (success/fallback/error)
  - Extracts imageUrl from Vertex AI Visual responses
  - Implements graceful degradation with SVG placeholders

### Services

#### Content Orchestration Logic
- `/src/services/content-orchestrator.ts`
  - Lines 16-53: `needsOrchestration()` function
    - Determines if prompt needs multi-content orchestration
    - Checks for 2+ content types or orchestration patterns
    - Used to route between DIRECT vs ORCHESTRATED workflows

### Supabase Edge Functions

#### NIV Content Intelligent V2 (Main Generator)
**Path:** `/supabase/functions/niv-content-intelligent-v2/index.ts` (5556 lines)

**Key Sections:**

1. **Instagram Tools Definition** (lines 645-750)
   - `generate_instagram_caption` tool definition
   - `generate_instagram_post_with_image` tool definition

2. **Instagram Caption Generation** (lines 2816-2824)
   ```
   if (toolUse && toolUse.name === 'generate_instagram_caption')
   ```

3. **Instagram Post with Image** (lines 2829-2906)
   - Complete flow: caption generation → image generation → response

4. **Image URL Extraction** (lines 2876-2906)
   - Multiple pattern extraction (url, uri, gcsUri, imageUrl, etc.)
   - Type validation
   - Fallback to caption-only

5. **Multi-Content Package Tool** (lines 978-1100)
   - Tool definition with schema

6. **Multi-Content Generation Implementation** (lines 3214-3350)
   - Loop through content types
   - Switch statement for each type
   - Error handling per content piece

7. **Direct Content Generation** (lines 5003-5150)
   - `generateContentDirectly()` function
   - Platform-specific content prompts
   - Normalization of content types

#### MCP Content Function
**Path:** `/supabase/functions/mcp-content/index.ts` (1754 lines)

**Key Sections:**

1. **Instagram Post Generation** (lines 760-830)
   - `generateInstagramPost()` function
   - Claude Anthropic call for caption generation
   - Parsing POST markers from response
   - Returns variations with hashtags/emojis

2. **Twitter Post Generation** (lines 702-760)
   - Similar structure for Twitter/X
   - 280 character limit enforcement
   - Thread support

3. **Social Posts (Multi-Platform)** (lines 593-702)
   - Handles multiple platforms in one call
   - Variation generation for different styles
   - Platform-specific requirements

4. **Media List Generation** (lines 1273-1380)
   - Tier-based journalist selection
   - Framework integration for media targets
   - Fallback from mcp-media to Claude generation

5. **Tool Mapping** (lines 1645-1750)
   ```typescript
   case 'generate_instagram_post':
     result = await generateInstagramPost(args);
   ```

#### Campaign Executor Function
**Path:** `/supabase/functions/niv-campaign-executor/index.ts`

**Key Sections:**

1. **Interfaces** (lines 9-72)
   - `ContentPieceRequest`
   - `OwnedContentRequest`
   - `MediaEngagementRequest`
   - `PhaseCampaign`
   - `ExecutorRequest`

2. **Campaign Blueprint Handling** (lines 85-192)
   - Session data fetching
   - Blueprint saving to database
   - Research data attachment

3. **VECTOR_CAMPAIGN (Phase-Campaign Architecture)** (lines 195-404)
   - Phase extraction (line 247)
   - Parallel generation setup (line 262)
   - Phase promises mapping (line 262-343)
   - Results aggregation (line 346-365)

4. **Phase Campaign Generation** (lines 262-346)
   - Calls niv-content-intelligent-v2 for each phase
   - Passes owned content + media engagement requirements
   - Context includes phase, narrative, positioning, research

5. **PR_CAMPAIGN (Direct Orchestration)** (lines 406-450+)
   - Parallel orchestration of content requirements
   - All content from single blueprint call

### Supporting Files

#### Type Definitions
- `/src/types/content.ts` - Content item interfaces

#### Campaign Builder Service
- `/src/lib/services/campaignBuilderService.ts` - Campaign context

#### Memory Vault Integration
- `/src/lib/memoryVaultIntegration.ts` - Content storage
- `/src/components/execute/ContentLibraryWithFolders.tsx` - Content library UI

---

## Function Call Flow Diagram

```
Frontend (ExecuteTabProduction.tsx)
    ↓
needsOrchestration() check (content-orchestrator.ts:16)
    ↓
    ├─ DIRECT path:
    │  └─ callMCPService() → mcp-content function
    │     └─ Specific tool (generate_instagram_post, etc.)
    │
    └─ ORCHESTRATED path:
       └─ niv-content-intelligent-v2 function
          └─ Claude decides which tools to use
             ├─ generate_instagram_caption
             ├─ generate_instagram_post_with_image
             │  ├─ callMCPService() for caption
             │  ├─ fetch() Vertex AI for image
             │  └─ Return both
             ├─ generate_content_package
             │  └─ Loop through content types
             │     └─ callMCPService() for each
             └─ ... other tools
```

---

## Key Code Patterns

### Pattern 1: Content Type Determination
```typescript
// In content-orchestrator.ts or NIVContentOrchestratorProduction.tsx
const needsMultiContent = contentTypes.filter(type => prompt.includes(type)).length >= 2;
const workflow = needsMultiContent ? 'orchestrated' : 'direct';
```

### Pattern 2: Instagram Post with Image
```typescript
// In niv-content-intelligent-v2/index.ts
1. Generate caption: callMCPService('social-post', { platforms: ['instagram'] })
2. Build image prompt: `Professional ${style} social media graphic...`
3. Fetch image: `/functions/v1/vertex-ai-visual`
4. Extract URL: imageData.images?.[0]?.url || imageData.imageUrl || null
5. Return both: { caption, imageUrl }
```

### Pattern 3: Multi-Content Package
```typescript
// In niv-content-intelligent-v2/index.ts
for (const contentType of contentTypes) {
  switch(contentType) {
    case 'press-release':
      result = await callMCPService('press-release', args);
      break;
    case 'social-posts':
      result = await callMCPService('social-post', args);
      break;
    // ... more types
  }
}
return { generatedContent: results };
```

### Pattern 4: Parallel Campaign Generation
```typescript
// In niv-campaign-executor/index.ts
const phasePromises = phaseCampaigns.map(async (phase) => {
  return fetch(`/functions/v1/niv-content-intelligent-v2`, {
    body: JSON.stringify({
      phase: phase.phase,
      contentRequirements: {
        owned: phase.ownedContent,
        media: phase.mediaEngagement
      }
    })
  })
});
const results = await Promise.all(phasePromises);
```

---

## Response Patterns

### Success Pattern
```json
{
  "success": true,
  "mode": "content_generated",
  "contentType": "instagram-caption",
  "message": "✅ Instagram caption generated",
  "content": "...",
  "conversationId": "..."
}
```

### Multi-Content Pattern
```json
{
  "success": true,
  "mode": "content_package_generated",
  "generatedContent": [
    { "type": "press-release", "content": "..." },
    { "type": "social-posts", "content": "..." }
  ]
}
```

### Failure with Fallback Pattern
```json
{
  "success": true,
  "contentType": "instagram-post",
  "message": "✅ Instagram caption generated (image error: ...)",
  "content": "caption-only",
  "error": "Image generation unavailable"
}
```

---

## Debugging Checklist

- [ ] Check `needsOrchestration()` logic for content type detection
- [ ] Verify content type routing map in NIVContentOrchestratorProduction.tsx
- [ ] Check MCP service tool mapping (mcp-content/index.ts line 1645+)
- [ ] Verify image URL extraction patterns (niv-content-intelligent-v2/index.ts line 2876)
- [ ] Check response mode detection (success vs fallback)
- [ ] Verify campaign phase structure (niv-campaign-executor/index.ts line 247)
- [ ] Check Promise.all() aggregation for parallel phases
- [ ] Verify context passed to each content type generation
- [ ] Check error handling for failed content pieces

