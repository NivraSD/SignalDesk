# Edge Function Architecture Review

## Content Generation Edge Functions

### 1. mcp-content
- **Type**: Tool-based MCP
- **Purpose**: Generate various content types (press releases, blog posts, social posts, emails)
- **Call Format**:
```json
{
  "tool": "generate_press_release" | "generate_blog_post" | "generate_social_posts" | "generate_email_campaign",
  "arguments": { ...specific to each tool... }
}
```
- **Tools Available**:
  - `generate_press_release`: Creates professional press releases
  - `generate_blog_post`: Generates blog posts
  - `generate_social_posts`: Creates platform-specific social media content
  - `generate_email_campaign`: Builds email campaigns
  - `generate_executive_talking_points`: Creates executive briefings
  - `optimize_content_seo`: SEO optimization

### 2. mcp-social
- **Type**: Tool-based MCP
- **Purpose**: Social media MONITORING and ANALYSIS (NOT content generation!)
- **Tools Available**:
  - `monitor_social_mentions`: Track mentions and keywords
  - `analyze_social_trends`: Identify trending topics
  - `identify_influencers`: Find key influencers
  - NOT for generating social content!

### 3. mcp-campaigns
- **Type**: Tool-based MCP
- **Purpose**: Campaign management and email marketing
- **Status**: Need to check implementation

### 4. mcp-crisis
- **Type**: Tool-based MCP
- **Purpose**: Crisis communication management
- **Status**: Need to check implementation

### 5. mcp-media
- **Type**: Tool-based MCP
- **Purpose**: Media relations and pitch generation
- **Status**: Need to check implementation

### 6. mcp-narratives
- **Type**: Tool-based MCP
- **Purpose**: Brand narratives and messaging frameworks
- **Status**: Need to check implementation

### 7. mcp-executive-synthesis / mcp-executive-synthesis-v2
- **Type**: Tool-based MCP
- **Purpose**: Executive summaries and synthesis
- **Status**: Need to check implementation

## Visual Generation Edge Functions

### 1. vertex-ai-visual
- **Type**: Direct function
- **Purpose**: Generate images using Google Imagen 3
- **Call Format**:
```json
{
  "type": "image",
  "prompt": "...",
  "aspectRatio": "16:9",
  "style": "professional",
  "numberOfImages": 1
}
```
- **Returns**: `{ success: true, images: [{url: "..."}], prompt: "..." }`

### 2. google-visual-generation
- **Type**: Direct function
- **Purpose**: Generate images (Imagen 3) AND videos (Veo)
- **Status**: Need to verify if this is duplicate of vertex-ai-visual

### 3. gamma-presentation
- **Type**: Direct function
- **Purpose**: Generate presentations using Gamma API
- **Status**: Need to check implementation

### 4. content-visual-generation
- **Type**: Unknown
- **Purpose**: Need to check
- **Status**: Need to check implementation

## Intelligence & Research Edge Functions

### 1. niv-fireplexity
- **Type**: Direct function
- **Purpose**: Web search and research using Perplexity
- **Status**: Need to check implementation

### 2. mcp-intelligence
- **Type**: Tool-based MCP
- **Purpose**: Deep research and market analysis
- **Status**: Need to check implementation

### 3. mcp-discovery
- **Type**: Tool-based MCP
- **Purpose**: Organization intelligence and stakeholder mapping
- **Status**: Need to check implementation

## Storage Edge Functions

### 1. niv-memory-vault
- **Type**: Direct function
- **Purpose**: Store and retrieve content with versioning
- **Actions**: save, retrieve, list, update, delete
- **Status**: Need to check implementation

## Orchestration Edge Functions

### 1. niv-orchestrator-robust
- **Type**: Direct function
- **Purpose**: Main NIV brain for strategic planning
- **Status**: Working

### 2. niv-strategic-framework
- **Type**: Direct function
- **Purpose**: Create strategic frameworks
- **Status**: Working

### 3. opportunity-orchestrator-v2
- **Type**: Direct function
- **Purpose**: Manage opportunities and playbooks
- **Status**: Need to check

## CRITICAL ISSUES FOUND:

1. **mcp-social is NOT for content generation** - it's for monitoring
2. **mcp-content needs tool-based calls** - not direct prompts
3. **Multiple visual generation functions** - need to determine which to use
4. **Response formats vary wildly** - need standardization

## NEXT STEPS:

1. Check each edge function's actual implementation
2. Create proper API endpoint for each content type
3. Test each endpoint with correct format
4. Standardize response handling