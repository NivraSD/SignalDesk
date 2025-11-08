# Execute Module Implementation - Complete Analysis

## Overview
The execute module handles campaign execution and content generation across multiple content types, with special handling for Instagram posts (both caption-only and caption+image) and media plans (multi-content packages).

---

## 1. Instagram Post Creation Flow

### Two-Mode Instagram Generation

The system supports two distinct Instagram generation paths:

#### Mode 1: Caption Only
**File:** `/supabase/functions/niv-content-intelligent-v2/index.ts` (lines 2816-2824)
**Tool:** `generate_instagram_caption`

```javascript
if (toolUse && toolUse.name === 'generate_instagram_caption') {
  const content = await callMCPService('social-post', {
    organization: orgProfile.organizationName,
    message: toolUse.input.topic,
    platforms: ['instagram'],
    tone: toolUse.input.style || 'engaging'
  })
  return new Response(JSON.stringify({
    success: true,
    mode: 'content_generated',
    contentType: 'instagram-caption',
    message: `✅ Instagram caption generated`,
    content,
    conversationId
  }), ...)
}
```

#### Mode 2: Complete Post (Caption + Image)
**File:** `/supabase/functions/niv-content-intelligent-v2/index.ts` (lines 2829-2906)
**Tool:** `generate_instagram_post_with_image`

Process:
1. **Step 1:** Generate caption using MCP service
2. **Step 2:** Build image prompt from topic
3. **Step 3:** Call Vertex AI Visual for image generation
4. **Step 4:** Return both caption and imageUrl

```javascript
if (toolUse && toolUse.name === 'generate_instagram_post_with_image') {
  // Step 1: Generate caption
  const caption = await callMCPService('social-post', {
    organization: orgProfile.organizationName,
    message: toolUse.input.topic,
    platforms: ['instagram'],
    tone: toolUse.input.style || 'engaging'
  })

  // Step 2: Create image prompt
  const imagePrompt = `Professional ${toolUse.input.imageStyle || 'modern'} 
    social media graphic for ${orgProfile.organizationName} about: 
    ${toolUse.input.topic}. Clean, brand-appropriate design suitable for Instagram.`

  // Step 3: Generate image
  const imageResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/vertex-ai-visual`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
      body: JSON.stringify({
        type: 'image',
        prompt: imagePrompt,
        aspectRatio: '1:1',
        numberOfImages: 1
      })
    }
  )
```

### Instagram Caption Generation (mcp-content)
**File:** `/supabase/functions/mcp-content/index.ts` (lines 760-830)

```typescript
async function generateInstagramPost(args: any) {
  const message = args.message || args.topic || args.subject || '';
  const keyMessages = args.keyMessages || args.key_messages || [];
  const tone = args.tone || 'engaging';
  const includeHashtags = args.includeHashtags !== undefined ? args.includeHashtags : true;
  const variations = args.variations || 3;
  const carousel = args.carousel || false;

  const prompt = `Create ${variations} DISTINCT Instagram ${carousel ? 'carousel' : 'post'} captions:
  
  TOPIC: ${message}
  TONE: ${tone}
  
  REQUIREMENTS:
  - 125-150 words (Instagram sweet spot for engagement)
  - Strong hook in first line (pre-"...more")
  - ${includeHashtags ? 'Include 8-12 relevant hashtags at the end' : 'No hashtags'}
  - Use emojis strategically (2-4 per post)
  - Line breaks for readability
  - Call-to-action at the end
  
  Generate ${variations} unique versions with DIFFERENT approaches:
  Version 1: Educational/Tutorial style
  Version 2: Behind-the-scenes/Personal story
  Version 3: Bold statement/Hot take`;

  const instagramPosts = await callAnthropic([{ role: 'user', content: prompt }], 1200);
  
  const postMatches = instagramPosts.match(/POST \d+:\s*\n([\s\S]*?)(?=\nPOST \d+:|$)/g);
  const posts = postMatches
    ? postMatches.map(p => p.replace(/POST \d+:\s*\n/, '').trim())
    : [instagramPosts];

  return {
    content: posts.map((p, i) => `**Version ${i + 1}:**\n${p}`).join('\n\n---\n\n'),
    platform: 'instagram',
    posts,
    variations: posts.length,
    carousel,
    wordCount: posts.map(p => p.split(' ').length)
  };
}
```

---

## 2. Content Type Determination

### Primary Determination: NIVContentOrchestratorProduction
**File:** `/src/components/execute/NIVContentOrchestratorProduction.tsx` (lines 33-150)

The system uses a **Content Routing Map** to determine workflow:

```typescript
const CONTENT_ROUTING_MAP: Record<string, {
  service: string;
  complexity: 'simple' | 'medium' | 'complex';
  workflow: 'direct' | 'orchestrated';
  api?: string;
  tool?: string;
  outputs?: string[];
}> = {
  'media-plan': {
    service: 'niv-content-intelligent-v2',
    complexity: 'complex',
    workflow: 'orchestrated',
    outputs: ['press-release', 'media-list', 'media-pitch', 'qa-document', 'social-posts']
  },
  'social-post': {
    service: 'mcp-content',
    complexity: 'simple',
    workflow: 'direct',
    tool: 'generate_social_posts'
  },
  'instagram-caption': {
    service: 'niv-content-intelligent-v2',
    complexity: 'simple',
    workflow: 'direct',
    tool: 'generate_instagram_caption'
  },
  'presentation': {
    service: 'niv-content-intelligent-v2',
    complexity: 'complex',
    workflow: 'orchestrated'
  }
  // ... more mappings
}
```

### Content Type Detection Logic (needsOrchestration)
**File:** `/src/services/content-orchestrator.ts` (lines 16-53)

```typescript
export function needsOrchestration(prompt: string): boolean {
  const promptLower = prompt.toLowerCase();

  // Multi-content patterns that need orchestration
  const orchestrationPatterns = [
    'media plan',
    'media campaign',
    'pr campaign',
    'launch campaign',
    'crisis response',
    'announcement package',
    'content package',
    'multiple',
    'campaign',
    'complete plan',
    'all content',
    'full suite'
  ];

  // Check if prompt mentions multiple content types
  const contentTypes = [
    'press release',
    'social',
    'email',
    'blog',
    'media list',
    'pitch',
    'talking points'
  ];

  const mentionedTypes = contentTypes.filter(type => promptLower.includes(type));
  if (mentionedTypes.length >= 2) {
    return true;  // Needs orchestration if 2+ content types detected
  }

  // Check for orchestration patterns
  return orchestrationPatterns.some(pattern => promptLower.includes(pattern));
}
```

**Decision Tree:**
1. If prompt contains 2+ content types → ORCHESTRATED
2. If prompt matches orchestration patterns → ORCHESTRATED
3. Otherwise → DIRECT workflow

### Content Type Normalization
Handles both underscored and camelCase parameter names:
- `instagram-post` → maps to `generate_instagram_post`
- `instagram` → maps to `generate_instagram_post`
- `social-post` → routes to `mcp-content` service
- Parameters accept both `target_audience` and `targetAudiences`

---

## 3. Image Generation Success/Failure Detection

### Vertex AI Visual Response Handling
**File:** `/src/app/api/visual/image/route.ts` (lines 1-85)

Three-tier response handling:

#### Success Path
```typescript
if (data.success && data.images && data.images.length > 0) {
  return NextResponse.json({
    success: true,
    content: {
      imageUrl: data.images[0].url,
      prompt: data.prompt,
      metadata: {
        ...data.images[0].metadata,
        style: body.style || 'professional'
      }
    }
  })
}
```

#### Fallback Path (Service degradation)
```typescript
else if (data.fallback) {
  console.log('Using fallback response:', data.fallback)
  return NextResponse.json({
    success: false,
    error: data.error || 'Image generation failed',
    content: {
      imageUrl: `data:image/svg+xml;base64,...`,  // SVG placeholder
      prompt: body.prompt,
      metadata: {
        fallback: true,
        message: data.fallback.instructions
      }
    }
  })
}
```

#### Error Path
```typescript
else {
  throw new Error('Unexpected response format from vertex-ai-visual')
}
```

### Instagram Post Image Detection
**File:** `/supabase/functions/niv-content-intelligent-v2/index.ts` (lines 2876-2906)

```typescript
// Attempt image extraction from multiple possible response formats
const imageUrl = imageData.images?.[0]?.url ||
                imageData.images?.[0]?.uri ||
                imageData.images?.[0]?.gcsUri ||
                imageData.imageUrl ||
                imageData.url ||
                null

console.log('✅ Complete Instagram post package ready')

// Success case - both caption and image
if (imageUrl && typeof imageUrl === 'string') {
  return new Response(JSON.stringify({
    success: true,
    mode: 'instagram_post_complete',
    contentType: 'instagram-post',
    message: `✅ Instagram post generated with caption and image`,
    caption: caption,
    imageUrl: imageUrl,
    imagePrompt: imagePrompt,
    conversationId
  }), ...)
}

// Fallback case - caption only when image fails
catch (error) {
  console.error('Error generating image:', error)
  return new Response(JSON.stringify({
    success: true,
    mode: 'content_generated',
    contentType: 'instagram-caption',
    message: `✅ Instagram caption generated (image error: ${error.message})`,
    content: caption,
    conversationId
  }), ...)
}
```

**Detection Strategy:**
1. Attempts multiple imageUrl extraction patterns (accounts for API variations)
2. Validates imageUrl is non-null and string type
3. Falls back to caption-only if image fails
4. Returns success: true even with fallback (graceful degradation)

---

## 4. Multi-Content Capability for Media Plans

### Media Plan Architecture
**File:** `/supabase/functions/niv-campaign-executor/index.ts` (lines 46-56, 195-404)

Media plans implement a **phase-campaign orchestration architecture** for coordinated multi-content generation:

```typescript
interface PhaseCampaign {
  phase: string;
  phaseNumber: number;
  objective: string;
  narrative: string;
  stakeholders: string[];
  ownedContent: OwnedContentRequest[];  // Multiple content pieces
  mediaEngagement: MediaEngagementRequest[];  // Multiple engagement pieces
  keyMessages: string[];
  timeline: string;
}
```

### Parallel Generation
**File:** `/supabase/functions/niv-campaign-executor/index.ts` (lines 262-346)

```typescript
// Extract phase campaigns from blueprint
const phaseCampaigns = extractPhaseCampaigns(blueprint, campaignType);

// Generate ALL phases in PARALLEL (4x speed boost!)
const phasePromises = phaseCampaigns.map(async (phaseCampaign) => {
  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-content-intelligent-v2`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({
        message: `Generate coordinated ${phaseCampaign.phase} phase campaign`,
        campaignContext: {
          blueprintId,
          campaignType,
          phase: phaseCampaign.phase,
          contentRequirements: {
            owned: phaseCampaign.ownedContent,  // Multiple pieces per phase
            media: phaseCampaign.mediaEngagement
          }
        }
      })
    }
  )
})

// Wait for ALL phases to complete in parallel
const results = await Promise.all(phasePromises);
```

**Key Features:**
- Parallel execution (20 seconds instead of 80 seconds)
- Multiple content pieces per phase (owned + media engagement)
- Coordinated context passed to each generation
- Aggregation of all generated content

### Multi-Content Package Generation Tool
**File:** `/supabase/functions/niv-content-intelligent-v2/index.ts` (lines 978-1100, 3214-3350)

```typescript
{
  name: "generate_content_package",
  description: "Generate multiple content pieces at once as a coordinated package",
  input_schema: {
    type: "object",
    properties: {
      content_types: {
        type: "array",
        description: "List of content types: presentation, press-release, social-posts, media-pitch, talking-points, qa-document, event-brief, etc.",
        items: { type: "string" }
      },
      context: {
        type: "object",
        description: "Shared context for all pieces",
        properties: {
          topic: { type: "string" },
          audience: { type: "string" },
          purpose: { type: "string" },
          key_messages: { type: "array", items: { type: "string" } },
          narrative: { type: "string" }
        }
      },
      details: {
        type: "object",
        description: "Specific details per content type"
      }
    },
    required: ["content_types", "context"]
  }
}
```

### Multi-Content Generation Implementation
**File:** `/supabase/functions/niv-content-intelligent-v2/index.ts` (lines 3215-3320)

```typescript
// Handle multi-content package generation
if (toolUse && toolUse.name === 'generate_content_package') {
  const contentTypes = toolUse.input.content_types || [];
  const context = toolUse.input.context || {};
  const details = toolUse.input.details || {};

  const generationResults: any[] = [];

  for (const contentType of contentTypes) {
    try {
      let result = null;

      switch (contentType) {
        case 'press-release':
          const pr = await callMCPService('press-release', {
            organization: orgProfile.organizationName,
            announcement: context.topic,
            keyPoints: context.key_messages || [],
            quotes: details.quotes || []
          });
          result = { 
            type: 'press-release', 
            content: pr, 
            message: '✅ Press release generated' 
          };
          generationResults.push(result);
          break;

        case 'social-posts':
          const posts = await callMCPService('social-post', {
            organization: orgProfile.organizationName,
            message: context.topic,
            platforms: details.platforms || ['linkedin', 'twitter'],
            count: details.post_count || 5
          });
          result = { 
            type: 'social-posts', 
            content: posts, 
            message: '✅ Social posts generated' 
          };
          generationResults.push(result);
          break;

        case 'talking-points':
          const talkingPoints = await callMCPService('talking-points', {
            organization: orgProfile.organizationName,
            subject: context.topic,
            keyMessages: context.key_messages || [],
            audience: context.audience
          });
          result = { 
            type: 'talking-points', 
            content: talkingPoints, 
            message: '✅ Talking points generated' 
          };
          generationResults.push(result);
          break;

        // ... more content types
      }
    } catch (error) {
      generationResults.push({
        type: contentType,
        error: error.message,
        message: `❌ Failed to generate ${contentType}`
      });
    }
  }

  return new Response(JSON.stringify({
    success: true,
    mode: 'content_package_generated',
    message: `✅ Generated ${generationResults.length} content pieces`,
    generatedContent: generationResults,
    conversationId
  }), ...)
}
```

### Media List Generation
**File:** `/supabase/functions/mcp-content/index.ts` (lines 1273-1380)

Media lists support **multiple tiers and sources**:

```typescript
async function generateMediaList(args: any) {
  const industry = args.industry || 'technology';
  const topic = args.topic || args.message || args.announcement || '';
  const company = args.company || args.organization || '';
  const count = args.count || 10;

  // Extract strategy context for richer media list
  const context = args.context || {};
  const strategy = context.strategy || {};
  const keyMessages = args.keyMessages || strategy.keyMessages || [];
  const narrative = args.newsHook || args.narrative || strategy.narrative || '';
  
  // Extract media_targets from framework (tiered approach)
  const media_targets = args.media_targets || args.mediaTargets || {};
  const tier1FromFramework = media_targets.tier_1_targets || [];
  const tier2FromFramework = media_targets.tier_2_targets || [];
  const tier3FromFramework = media_targets.tier_3_targets || [];

  console.log('📰 Generating targeted media list...');

  // Try mcp-media first for web-based journalist research
  try {
    const mcpMediaResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-media`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        body: JSON.stringify({
          tool: 'media-list',
          parameters: {
            company: company,
            industry: industry,
            topic: topic,
            tiers: ['tier1', 'tier2'],  // Multi-tier support
            count: count
          }
        })
      }
    );

    if (mcpMediaResponse.ok) {
      const mcpData = await mcpMediaResponse.json();
      return { content: mcpData.content || mcpData.result || '' };
    }
  } catch (error) {
    // Fallback to Claude generation
  }

  // Fallback to Claude-generated media list with framework tiers
  let tiers = args.tiers || [];
  if (tiers.length === 0) {
    if (tier1FromFramework.length > 0) tiers.push('tier1');
    if (tier2FromFramework.length > 0) tiers.push('tier2');
    if (tier3FromFramework.length > 0) tiers.push('tier3');
    if (tiers.length === 0) tiers = ['tier1', 'tier2', 'trade'];
  }

  return { content: mediaListContent };
}
```

**Multi-Content Support in Media Lists:**
- Tier-based journalist segmentation (Tier 1, 2, 3)
- Framework integration with targeted outlets
- Multiple source fallback (mcp-media → Claude generation)
- Context-aware messaging per journalist tier

---

## 5. Campaign Execution Flow

### Campaign Executor Entry Point
**File:** `/src/app/api/campaign-executor/route.ts`

Routes to Supabase edge function:
```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/niv-campaign-executor`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    body: JSON.stringify(body)
  }
)
```

### Campaign Orchestrator (NIV Campaign Executor)
**File:** `/supabase/functions/niv-campaign-executor/index.ts`

**Two Architecture Paths:**

#### Path 1: VECTOR_CAMPAIGN (Phase-Based)
- Uses phase-campaign orchestration
- Parallel generation of all phases
- Each phase has owned content + media engagement
- Stored in campaign folders with memory vault integration

#### Path 2: PR_CAMPAIGN (Direct Orchestration)
- Parallel orchestration of content requirements
- All content types generated from single blueprint
- Faster execution for immediate PR needs

---

## 6. Key Integration Points

### MCP Service Integration
**File:** `/supabase/functions/niv-content-intelligent-v2/index.ts`

```typescript
async function callMCPService(contentType: string, args: any) {
  const mcpMap: Record<string, string> = {
    'press-release': 'generate_press_release',
    'social-post': 'generate_social_posts',
    'talking-points': 'generate_executive_talking_points',
    'media-list': 'generate_media_list',
    'media-pitch': 'generate_media_pitch',
    'qa-document': 'generate_qa_document'
  };

  const tool = mcpMap[contentType];
  return fetch(`${SUPABASE_URL}/functions/v1/mcp-content`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
    body: JSON.stringify({ tool, args })
  });
}
```

### Content Routing Workflow
```
User Input
    ↓
needsOrchestration() decision
    ↓
    ├─ DIRECT → Single content type
    │           ↓
    │           Single MCP tool call
    │           ↓
    │           Return content
    │
    └─ ORCHESTRATED → Multiple content types
                      ↓
                      callMCPService() for each type
                      ↓
                      Parallel or sequential generation
                      ↓
                      Aggregate results
```

---

## 7. Response Structure Patterns

### Single Content Response
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

### Instagram Post with Image Response
```json
{
  "success": true,
  "mode": "instagram_post_complete",
  "contentType": "instagram-post",
  "message": "✅ Instagram post generated with caption and image",
  "caption": "...",
  "imageUrl": "https://...",
  "imagePrompt": "...",
  "conversationId": "..."
}
```

### Multi-Content Package Response
```json
{
  "success": true,
  "mode": "content_package_generated",
  "message": "✅ Generated 5 content pieces",
  "generatedContent": [
    { "type": "press-release", "content": "..." },
    { "type": "social-posts", "content": "..." },
    { "type": "talking-points", "content": "..." },
    { "type": "media-list", "content": "..." },
    { "type": "qa-document", "content": "..." }
  ],
  "conversationId": "..."
}
```

### Campaign Execution Response
```json
{
  "success": true,
  "architecture": "phase-campaign",
  "campaignFolder": "campaigns/campaign-name-id",
  "phasesGenerated": 3,
  "totalPhases": 3,
  "totalContentPieces": 42,
  "phaseResults": [
    {
      "phase": "Awareness Phase",
      "phaseNumber": 1,
      "success": true,
      "contentCount": 14,
      "folder": "campaigns/campaign-name-id/phase-1"
    }
  ],
  "content": [...]
}
```

---

## Summary Table

| Aspect | Implementation | Location |
|--------|----------------|----------|
| Instagram Caption | `generate_instagram_post` → callAnthropic | `mcp-content/index.ts:760` |
| Instagram Post + Image | `generate_instagram_post_with_image` tool | `niv-content-intelligent-v2/index.ts:2829` |
| Content Type Determination | `needsOrchestration()` + routing map | `content-orchestrator.ts:16` & `NIVContentOrchestratorProduction.tsx:33` |
| Image Success Detection | Multiple extraction patterns + fallback | `niv-content-intelligent-v2/index.ts:2876` |
| Multi-Content Capability | `generate_content_package` tool + phase-campaign | `niv-content-intelligent-v2/index.ts:978` & `niv-campaign-executor/index.ts:195` |
| Media Plans | Parallel phase generation with owned+media content | `niv-campaign-executor/index.ts:262` |
| Media Lists | Tiered journalist generation | `mcp-content/index.ts:1273` |

