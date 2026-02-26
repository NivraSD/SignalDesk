# Complete Architecture Analysis and Fix Plan

## CRITICAL FINDINGS

### The Previous Agent Fucked Up Everything
1. **NEVER examined the actual edge functions** - just made assumptions
2. **Created wrong API call formats** - direct prompts instead of tool-based calls
3. **Called wrong edge functions** - used mcp-social for content generation (it's for MONITORING!)
4. **Ignored required parameters** - vertex-ai-visual needs `type: "image"`
5. **Created duplicate/unnecessary endpoints** - multiple endpoints doing same thing

## ACTUAL EDGE FUNCTION ARCHITECTURE

### Content Generation (mcp-content)
**FORMAT**: `{tool: "tool_name", arguments: {...}}`

**TOOLS AVAILABLE**:
1. `generate_press_release` - Press releases with AP style
2. `generate_blog_post` - Blog posts with SEO optimization
3. `generate_social_posts` - Platform-specific social content
4. `generate_email_campaign` - Email campaigns with personalization
5. `generate_executive_talking_points` - Executive briefings
6. `generate_visual_content` - Visual content specs (not actual images!)
7. `optimize_content_seo` - SEO optimization for existing content

### Visual Generation
1. **vertex-ai-visual** - Google Imagen 3 for images
   - REQUIRES: `{type: "image", prompt: "...", aspectRatio: "16:9", ...}`

2. **google-visual-generation** - Images AND videos (Veo)
   - May be duplicate of vertex-ai-visual

3. **gamma-presentation** - Presentation generation via Gamma API

4. **content-visual-generation** - Unknown purpose (needs investigation)

### Social Media (mcp-social)
**NOT FOR CONTENT GENERATION!!!**
- `monitor_social_mentions` - Track mentions
- `analyze_social_trends` - Trend analysis
- `identify_influencers` - Influencer identification

### Other MCPs (All Tool-Based)
- **mcp-campaigns** - Campaign management
- **mcp-crisis** - Crisis communication
- **mcp-media** - Media relations and pitches
- **mcp-narratives** - Brand narratives
- **mcp-executive-synthesis** - Executive summaries
- **mcp-intelligence** - Market research
- **mcp-discovery** - Organization intel

### Direct Functions
- **niv-orchestrator-robust** - NIV brain (WORKING)
- **niv-strategic-framework** - Strategic frameworks (WORKING)
- **niv-fireplexity** - Web search via Perplexity
- **niv-memory-vault** - Content storage with versioning
- **opportunity-orchestrator-v2** - Opportunity management

## CURRENT BROKEN ENDPOINTS

### Content Endpoints (ALL BROKEN - Wrong Format)
```
/api/content/press-release - ❌ Sends {prompt, type} instead of {tool, arguments}
/api/content/blog-post - ❌ Not created
/api/content/social-post - ✅ FIXED (uses tool format)
/api/content/email-campaign - ❌ Wrong format
/api/content/executive-statement - ❌ Wrong format
/api/content/media-pitch - ❌ Wrong format
/api/content/messaging-framework - ❌ Wrong format
/api/content/thought-leadership - ❌ Wrong format
/api/content/crisis-response - ❌ Wrong format
/api/content/qa-document - ❌ Wrong format
```

### Visual Endpoints
```
/api/visual/image - ✅ FIXED (added type: "image")
/api/visual/video - ❌ Needs investigation
/api/visual/presentation - ❌ Should use gamma-presentation
```

### Other Broken Endpoints
```
/api/generate-content - ❌ Duplicate/unnecessary
/api/generate-media - ❌ Duplicate/unnecessary
/api/generate-social - ❌ Duplicate/unnecessary
/api/generate-strategy - ❌ Duplicate/unnecessary
/api/generate-visuals - ❌ Duplicate/unnecessary
```

## THE FIX PLAN

### Phase 1: Fix ALL Content API Endpoints
Each endpoint must use the CORRECT tool format:

```typescript
// CORRECT FORMAT
{
  tool: "generate_press_release",
  arguments: {
    headline: "...",
    keyPoints: [...],
    quotes: [...],
    tone: "formal"
  }
}
```

**Endpoints to Fix**:
1. `/api/content/press-release` → `tool: "generate_press_release"`
2. `/api/content/blog-post` → `tool: "generate_blog_post"`
3. `/api/content/email-campaign` → `tool: "generate_email_campaign"`
4. `/api/content/executive-statement` → `tool: "generate_executive_talking_points"`
5. `/api/content/media-pitch` → Use mcp-media (need to check tools)
6. `/api/content/messaging-framework` → Use mcp-narratives (need to check tools)
7. `/api/content/thought-leadership` → `tool: "generate_blog_post"` with style
8. `/api/content/crisis-response` → Use mcp-crisis (need to check tools)
9. `/api/content/qa-document` → Create custom handler

### Phase 2: Fix Visual API Endpoints
1. `/api/visual/video` → Use google-visual-generation with `type: "video"`
2. `/api/visual/presentation` → Use gamma-presentation edge function

### Phase 3: Delete Duplicate Endpoints
Remove these unnecessary endpoints:
- `/api/generate-content`
- `/api/generate-media`
- `/api/generate-social`
- `/api/generate-strategy`
- `/api/generate-visuals`

### Phase 4: Update NIVContentOrchestratorProduction
1. Handle correct response formats from each edge function
2. Map content types to correct API endpoints
3. Parse tool-based responses properly

### Phase 5: Test Everything
1. Test each content type generation
2. Test visual generation (image, video, presentation)
3. Test framework integration
4. Test opportunity playbook execution
5. Test Memory Vault storage

## CONTENT TYPE TO EDGE FUNCTION MAPPING

| Content Type | Edge Function | Tool Name |
|-------------|---------------|-----------|
| Press Release | mcp-content | generate_press_release |
| Blog Post | mcp-content | generate_blog_post |
| Social Post | mcp-content | generate_social_posts |
| Email Campaign | mcp-content | generate_email_campaign |
| Executive Statement | mcp-content | generate_executive_talking_points |
| Media Pitch | mcp-media | (need to check) |
| Crisis Response | mcp-crisis | (need to check) |
| Messaging Framework | mcp-narratives | (need to check) |
| Image | vertex-ai-visual | (direct, type: "image") |
| Video | google-visual-generation | (direct, type: "video") |
| Presentation | gamma-presentation | (direct) |

## IMMEDIATE ACTIONS

1. **Fix all content endpoints to use tool format**
2. **Check mcp-media, mcp-crisis, mcp-narratives for available tools**
3. **Test each endpoint with actual calls**
4. **Update frontend to handle correct response formats**
5. **Delete duplicate endpoints**

## WHY THIS HAPPENED

The previous agent:
1. Never read the actual edge function code
2. Made assumptions about API formats
3. Created endpoints without testing
4. Didn't understand MCP tool-based architecture
5. Rushed implementation without verification

## SUCCESS CRITERIA

✅ All content types generate successfully
✅ Visual generation works (images, videos, presentations)
✅ Framework-driven content queue populates
✅ Opportunity playbooks execute
✅ Memory Vault storage works
✅ No 404 or 500 errors
✅ NIV responds appropriately to all content types