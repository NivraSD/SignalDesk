# Memory Vault V2: Complete Overhaul Plan

**Date:** 2025-01-17
**Updated:** 2025-01-24 (added brand templates & smart export)
**Status:** Planning Phase
**Goal:** Transform Memory Vault from passive storage into an intelligent knowledge management system with brand asset management

**📎 Related Documents:**
- `MEMORY_VAULT_BRAND_TEMPLATES_ADDON.md` - Detailed technical specs for brand templates, file upload, export merging

---

## Current State Analysis (The Disaster)

### UI Problems
- **Polling Hell**: Refreshes every 5 seconds causing infinite console spam
- **No Intelligence**: Just dumps files with zero organization
- **Terrible UX**: Three-pane layout that shows almost nothing useful
- **Tab Confusion**: "All", "Strategies", "Media Plans", "Uploads", "Folders" - meaningless distinctions
- **Zero Discovery**: Can't find anything, no search that works, no recommendations

### Backend Problems
- **Unused Edge Functions**: `niv-memory-vault`, `mcp-memory`, `niv-campaign-memory` sitting idle
- **No MCPs Connected**: Memory Vault MCPs exist but aren't integrated
- **Dumb Storage**: Just INSERT into `content_library` with no intelligence
- **No Organization Logic**: Folders are manual, no auto-categorization
- **No Claude Integration**: Despite being perfect for conversational discovery

### Data Format Contract (MUST PRESERVE)
```typescript
// NIVContentIntelligentV2 saves in this format:
{
  content: {
    type: 'press-release' | 'social-post' | 'presentation' | etc,
    title: string,
    content: string | object,
    timestamp: ISO string,
    organization_id: UUID
  },
  metadata: {
    framework_data?: any,
    opportunity_data?: any,
    generatedAt: ISO string,
    ...additional fields
  },
  folder?: string  // Optional folder path
}

// Goes to: /api/content-library/save (POST)
// Inserts into: content_library table
```

**CRITICAL**: This save contract CANNOT change. Memory Vault V2 must accept this exact format.

---

## Vision: Intelligent Memory Vault

Memory Vault becomes:
1. **Conversational Discovery Interface** - Claude Skill-powered search and exploration
2. **Intelligent Organization System** - Auto-categorizes and routes content
3. **Proactive Recommendation Engine** - Suggests relevant past content
4. **Knowledge Graph** - Understands relationships between campaigns, content, frameworks
5. **Learning System** - Tracks what works, surfaces successful patterns

---

## Architecture: The Three Layers

```
┌─────────────────────────────────────────────────────────────┐
│                   LAYER 1: INGESTION                        │
│  (Content arrives → Intelligence processes → Routes storage)│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   LAYER 2: STORAGE                           │
│         (Organized, searchable, connected data)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   LAYER 3: DISCOVERY                         │
│    (Claude Skill + MCPs for intelligent retrieval)          │
└─────────────────────────────────────────────────────────────┘
```

---

## LAYER 1: Intelligent Ingestion

### Goal
When content is saved, **automatically**:
- Analyze content type and purpose
- Extract key themes, entities, topics
- Determine optimal folder structure
- Create relationships to existing content
- Generate metadata for discovery

### Implementation

#### 1.1: Enhanced Save API (`/api/content-library/save`)

**Current Flow:**
```typescript
POST /api/content-library/save
→ INSERT into content_library
→ Done ❌
```

**New Flow (ASYNC - Non-Blocking):**
```typescript
POST /api/content-library/save
→ Validate format (preserve NIVContentIntelligentV2 contract)
→ INSERT into content_library immediately (with status='processing')
→ Return success IMMEDIATELY (< 100ms) ✅

→ Queue background job: analyze-content-job
→ Background: Call niv-memory-intelligence Edge Function
→ Background: Receive intelligence, update row
→ Background: CREATE relationships
→ Background: UPDATE folder_index
→ Background: TRIGGER recommendations

// User gets instant save confirmation
// Intelligence happens in background
// UI updates via real-time subscription
```

**Critical Performance Rule:**
- **Save MUST complete in < 200ms** regardless of intelligence
- Intelligence processing happens **asynchronously**
- Content is usable immediately, intelligence adds value later
- If intelligence fails, content is still saved

#### 1.2: New Edge Function: `niv-memory-intelligence`

```typescript
// supabase/functions/niv-memory-intelligence/index.ts

serve(async (req) => {
  const { content, metadata } = await req.json()

  // Use Claude to analyze content
  const analysis = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    messages: [{
      role: 'user',
      content: `Analyze this content for Memory Vault organization:

Title: ${content.title}
Type: ${content.type}
Content: ${content.content.substring(0, 2000)}

Extract:
1. Main themes (max 5)
2. Entities mentioned (companies, people, products)
3. Optimal folder category
4. Related topics for discovery
5. Content signature (for finding similar items)`
    }]
  })

  // Parse Claude's analysis
  const intelligence = parseAnalysis(analysis.content[0].text)

  // Query for similar content using vector similarity (future)
  const similar = await findSimilarContent(intelligence.signature)

  // Suggest folder based on type + themes
  const folder = determineFolder(content.type, intelligence.themes)

  return {
    suggestedFolder: folder,
    extractedThemes: intelligence.themes,
    relatedContent: similar,
    contentSignature: intelligence.signature,
    metadata: {
      entities: intelligence.entities,
      topics: intelligence.topics,
      sentiment: intelligence.sentiment,
      complexity: intelligence.complexity
    }
  }
})
```

#### 1.3: Database Schema Updates

```sql
-- Enhanced content_library table
ALTER TABLE content_library ADD COLUMN IF NOT EXISTS
  themes TEXT[],
  entities JSONB,  -- {companies: [], people: [], products: []}
  topics TEXT[],
  content_signature TEXT,  -- For similarity matching
  complexity VARCHAR(20),
  sentiment NUMERIC(3,2),
  related_content_ids UUID[];

-- New table: Content relationships
CREATE TABLE content_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_content_id UUID REFERENCES content_library(id) ON DELETE CASCADE,
  target_content_id UUID REFERENCES content_library(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50), -- 'similar', 'follow-up', 'references', 'part-of-campaign'
  confidence NUMERIC(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- New table: Folder index (for smart organization)
CREATE TABLE folder_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_path TEXT UNIQUE NOT NULL,
  description TEXT,
  content_types TEXT[],
  themes TEXT[],
  item_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX idx_content_themes ON content_library USING GIN(themes);
CREATE INDEX idx_content_entities ON content_library USING GIN(entities);
CREATE INDEX idx_content_signature ON content_library(content_signature);
CREATE INDEX idx_relationships_source ON content_relationships(source_content_id);

-- ⭐ NEW: Brand assets table
CREATE TABLE brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- File metadata
  asset_type VARCHAR(50) NOT NULL, -- 'template-press-release', 'guidelines-brand', 'logo', etc.
  file_name VARCHAR(500) NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size BIGINT,
  mime_type VARCHAR(100),

  -- Intelligence extracted from file
  extracted_guidelines JSONB, -- {tone: [], style: [], dos: [], donts: []}
  brand_voice_profile JSONB,  -- {adjectives: [], patterns: [], examples: []}
  template_structure JSONB,   -- {sections: [], placeholders: [], format: {}}
  usage_instructions TEXT,

  -- User-provided metadata
  name VARCHAR(500),
  description TEXT,
  tags TEXT[],

  -- Performance tracking
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP,
  success_rate NUMERIC(3,2),

  -- Standard fields
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'archived', 'deprecated'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100)
);

-- CRITICAL: Fast lookup index for brand context (< 5ms queries)
CREATE INDEX idx_brand_assets_fast_lookup
ON brand_assets(organization_id, status, asset_type)
WHERE status = 'active';

CREATE INDEX idx_brand_assets_tags ON brand_assets USING GIN(tags);

-- Link content to templates/guidelines used
ALTER TABLE content_library ADD COLUMN IF NOT EXISTS
  template_used_id UUID REFERENCES brand_assets(id),
  brand_guidelines_applied UUID[] DEFAULT '{}';

-- Track template performance by content type
CREATE TABLE template_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES brand_assets(id) ON DELETE CASCADE,
  content_type VARCHAR(100),
  usage_count INT DEFAULT 0,
  success_rate NUMERIC(3,2),
  avg_engagement NUMERIC(10,2),
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_template_perf_template ON template_performance(template_id);
CREATE INDEX idx_template_perf_type ON template_performance(content_type);
```

---

## LAYER 2: Intelligent Storage & Organization

### 2.1: Smart Folder Structure

**Auto-Generated Folders** (created by intelligence layer):

```
Memory Vault/
├── Brand Assets/ ⭐ NEW
│   ├── Templates/
│   │   ├── Press Releases/
│   │   ├── Social Media/
│   │   ├── Presentations/
│   │   └── Emails/
│   ├── Guidelines/
│   │   ├── Brand Guidelines/
│   │   ├── Style Guides/
│   │   └── Voice & Tone/
│   └── Visual Assets/
│       ├── Logos/
│       └── Images/
├── Campaigns/
│   ├── Product Launches/
│   │   ├── [Product Name]/
│   │   │   ├── Frameworks/
│   │   │   ├── Content/
│   │   │   └── Research/
│   ├── Competitive Response/
│   ├── Thought Leadership/
│   └── Crisis Management/
├── Content By Type/
│   ├── Press Releases/
│   ├── Social Posts/
│   ├── Presentations/
│   ├── Media Pitches/
│   └── Blog Posts/
├── Themes/
│   ├── AI Safety/
│   ├── Infrastructure/
│   ├── Education/
│   └── Enterprise/
├── Entities/
│   ├── Competitors/
│   │   ├── Oracle/
│   │   ├── AWS/
│   │   └── Google/
│   ├── Partners/
│   └── Stakeholders/
├── Performance/
│   ├── High Performing/ (based on metrics)
│   ├── Templates/  (reusable patterns)
│   └── Lessons Learned/
└── Time-Based/
    ├── 2025/
    │   ├── Q1/
    │   └── Q2/
    └── Recent/ (last 30 days)
```

### 2.2: Automatic Tagging System

```typescript
// Tags generated automatically:
{
  // Type tags
  type: 'press-release',

  // Theme tags
  themes: ['ai-safety', 'product-launch'],

  // Entity tags
  entities: ['OpenAI', 'Sam Altman', 'GPT-4'],

  // Performance tags (added over time)
  performance: ['high-engagement', 'template-worthy'],

  // Campaign tags (if part of campaign)
  campaign: 'Q1-Product-Launch',

  // Relationship tags
  relationships: ['similar-to-id-123', 'part-of-campaign-456']
}
```

---

## LAYER 3: Claude-Powered Discovery

### 3.1: Memory Vault Skill

Create: `.claude/skills/memory-vault-navigator/SKILL.md`

```markdown
---
name: Memory Vault Navigator
description: Intelligent guide for discovering and retrieving content from SignalDesk's Memory Vault using natural language
---

# Memory Vault Navigator Skill

## Your Role
You are the Memory Vault Navigator - an expert at helping users discover relevant campaigns, content, frameworks, and organizational knowledge through conversational search.

## Tools Available (via MCP)

### mcp-memory-vault-search
Query content library with semantic understanding
- `query`: Natural language search query
- `filters`: {type, theme, entity, dateRange, folder}
- Returns: Ranked results with relevance scores

### mcp-memory-vault-get
Retrieve specific content by ID
- `contentId`: UUID of content
- Returns: Full content with metadata and relationships

### mcp-memory-vault-related
Find related content
- `contentId`: UUID of source content
- `relationshipType`: 'similar', 'campaign', 'theme', 'entity'
- Returns: Related content with relationship explanations

### mcp-memory-vault-patterns
Get successful patterns and templates
- `theme`: Optional theme filter
- `minUsage`: Minimum usage count
- Returns: High-performing content sorted by success metrics

## Conversation Patterns

### Pattern 1: Vague Query → Clarification → Results
```
User: "Show me stuff about competitors"
You: "I can help you find competitor-related content. Are you looking for:
     • Competitive response campaigns
     • Research about specific competitors (Oracle, AWS, Google, etc.)
     • Content that mentions competitors
     • Successful patterns for competitive positioning

     Or tell me more about what you're working on?"

User: "Oracle stuff"
You: [Searches: theme='competitive-response' AND entity='Oracle']
     "Found 12 items related to Oracle:

     **Recent Campaigns (3)**
     • Q4 2024: Infrastructure Leader Positioning (88% confidence)
       - Press release, social posts, framework
       - High engagement (4.2k shares)

     **Research & Analysis (5)**
     • Oracle-OpenAI partnership analysis
     • Competitive vulnerability assessment

     **Content Templates (4)**
     • Response framework for Oracle announcements
     • Counter-narrative templates

     Which would you like to explore?"
```

### Pattern 2: Campaign Discovery
```
User: "Find campaigns about product launches"
You: [Searches: type='campaign' AND theme='product-launch']
     "Found 8 product launch campaigns. Here are the top performers:

     **🏆 Q3 2024: GPT-4 Vision Launch**
     • Engagement: 12.5k shares, 450 media mentions
     • Content: Press release, 47 social posts, 12 blog articles
     • Framework: Available
     • Key success: Early education focus + visual storytelling

     **Q1 2024: DALL-E 3 Launch**
     • Engagement: 8.2k shares, 280 media mentions
     • Key success: Artist partnership angle

     Want to see the full framework for either campaign?"
```

### Pattern 3: Template/Pattern Requests
```
User: "I need a press release template for AI safety announcements"
You: [Calls: mcp-memory-vault-patterns with theme='ai-safety']
     "Found 3 high-performing AI safety press release templates:

     **Template 1: Safety Partnership Announcement** (Used 7x, 92% success rate)
     • Best for: Announcing safety collaborations
     • Key elements: Research partnership angle, third-party validation
     • Last used: Dec 2024 (successful)
     • [View Template]

     **Template 2: Safety Milestone Release** (Used 5x, 88% success rate)
     • Best for: Technical safety achievements
     • Key elements: Technical depth + accessible explanation

     Which template fits your announcement?"
```

### Pattern 4: Relationship Discovery
```
User: "What else did we create for the Q4 infrastructure campaign?"
You: [Gets campaign content, then calls: mcp-memory-vault-related]
     "The Q4 Infrastructure campaign has 23 related items:

     **Core Framework** (1)
     • Strategic positioning document

     **Content Created** (15)
     • 1 press release (highest media pickup: WSJ, TechCrunch)
     • 8 social posts (avg 2.1k engagement)
     • 3 blog posts
     • 2 executive statements
     • 1 partner announcement

     **Research Used** (5)
     • Oracle competitive analysis
     • Infrastructure market trends
     • Developer survey data

     **Follow-up Campaigns** (2)
     • Q1 2025: Developer Infrastructure
     • Enterprise Infrastructure Q1

     Which would you like to explore?"
```

### Pattern 5: Performance Analysis
```
User: "What press releases have performed best?"
You: [Calls: mcp-memory-vault-patterns with type='press-release', sort='performance']
     "Top 5 performing press releases:

     **1. GPT-4 Launch Press Release** (Mar 2024)
     • 450 media pickups, 12.5k social shares
     • Why it worked: Technical + accessible, CEO quote, visual assets

     **2. DALL-E 3 Artist Partnership** (Oct 2023)
     • 280 media pickups, 8.2k social shares
     • Why it worked: Human angle, artist testimonials

     **3. Safety Partnership with MIT** (Jun 2024)
     • 180 media pickups, 6.1k social shares
     • Why it worked: Academic credibility, research angle

     I can show you the full template for any of these, or analyze what made them successful."
```

## Smart Behaviors

### Auto-Suggestions
After every search result, suggest related actions:
- "Want to see the full campaign framework?"
- "Should I find similar content from other campaigns?"
- "I can open this in Execute for editing"
- "Would you like me to create a template from this?"

### Context Awareness
Remember previous queries in session:
- "You asked about Oracle earlier - this relates to that campaign"
- "This is a follow-up to the product launch you viewed"
- "This template is similar to the one you just looked at"

### Proactive Recommendations
When appropriate:
- "I notice you're working on a competitive response. You created a successful Oracle framework in Q4 - want to see it?"
- "This is the 3rd time you've searched for AI safety content. Should I show you your AI safety template library?"

## What NOT to Do
- ❌ Don't execute workflows (that's Execute/Campaign Builder's job)
- ❌ Don't modify or delete content (read-only)
- ❌ Don't generate new content (that's Content Assistant's job)
- ❌ Don't make routing decisions (present options, user decides)

## Integration Points

### Hand off to other modules:
```
User: "Use this framework for a new campaign"
You: "I'll open Campaign Builder with this framework pre-loaded.
      [Dispatches: openCampaignBuilder event with framework data]"

User: "Edit this press release"
You: "Opening this in Execute for editing.
      [Dispatches: openInExecute event with content]"

User: "Find similar campaigns and create a report"
You: "I'll gather the similar campaigns:
      [Searches and compiles]
      Here are 5 similar campaigns. Should I:
      • Open them all in separate tabs?
      • Create a comparison summary?
      • Export as a report?"
```

## Response Style
- **Concise but informative**: Show key metadata, don't dump everything
- **Visual hierarchy**: Use headings, bullets, numbers for scannability
- **Action-oriented**: Always offer next steps
- **Explain relevance**: Why is this result relevant to their query?
- **Confidence scores**: Show when content is highly relevant vs. tangentially related

## Example Full Conversation

```
User: "Show me campaigns about product launches"

You: "Found 8 product launch campaigns in your Memory Vault. Here are the top 3 by performance:

**🏆 GPT-4 Vision Launch (Q3 2024)**
• 12.5k social shares, 450 media mentions
• Content: 1 press release, 47 social posts, 12 articles
• Key success factor: Early education focus + visual storytelling
• [View Campaign] [See Framework]

**DALL-E 3 Launch (Q1 2024)**
• 8.2k shares, 280 media mentions
• Key success factor: Artist partnership angle
• [View Campaign]

**API Platform Launch (Q2 2023)**
• 6.1k shares, 180 media mentions
• Key success factor: Developer-first messaging
• [View Campaign]

Want to explore any of these, or see all 8 campaigns?"

User: "Show me the GPT-4 framework"

You: [Retrieves framework]
"Here's the GPT-4 Vision Launch strategic framework:

**Core Objective**
Position GPT-4V as the future of human-AI interaction through vision

**Key Messaging Pillars**
1. Accessibility: AI that sees and understands like humans
2. Practical applications: Real-world use cases
3. Safety first: Vision safety considerations addressed

**Content Strategy**
• Press: Technical capabilities + accessibility angle
• Social: Visual demos + user stories
• Blog: Deep dives on vision capabilities

**Results**
• 12.5k social engagement (327% above average)
• 450 media pickups (215% above goal)
• Sentiment: 94% positive

[Copy Framework] [Use for New Campaign] [See All Content]"

User: "Use for new campaign"

You: "I'll open Campaign Builder with this framework pre-loaded. You can adapt it for your new campaign.

[Opens Campaign Builder with framework]

I'll stay here if you need to reference other successful campaigns or content from this launch."
```
```

### 3.2: Memory Vault MCPs

Create three MCP servers that the Skill uses:

#### MCP 1: `mcp-memory-search`
```typescript
// Semantic search across content_library
tools: [
  {
    name: 'search_memory',
    input: { query: string, filters: {...} },
    output: { results: ContentItem[], relevanceScores: number[] }
  }
]
```

#### MCP 2: `mcp-memory-relationships`
```typescript
// Find related content
tools: [
  {
    name: 'get_related',
    input: { contentId: string, relationshipType: string },
    output: { related: ContentItem[], relationships: Relationship[] }
  }
]
```

#### MCP 3: `mcp-memory-patterns`
```typescript
// Get successful patterns and templates
tools: [
  {
    name: 'get_patterns',
    input: { theme?: string, minUsageCount: number },
    output: { patterns: Template[], successMetrics: Metrics[] }
  }
]
```

---

## LAYER 3 (continued): New UI

### 3.3: Memory Vault V2 Interface

Replace current disaster with:

```typescript
// src/components/modules/MemoryVaultV2.tsx

<div className="memory-vault-v2">
  {/* Left Sidebar: Folder Tree (collapsible) */}
  <aside className="folder-nav">
    <FolderTree
      folders={intelligentFolderStructure}
      onSelect={handleFolderSelect}
    />
  </aside>

  {/* Center: Claude Chat Interface */}
  <main className="chat-discovery">
    <MemoryVaultChat
      skill="memory-vault-navigator"
      mcps={['mcp-memory-search', 'mcp-memory-relationships', 'mcp-memory-patterns']}
      onContentSelect={handleContentView}
    />
  </main>

  {/* Right: Content Preview (when selected) */}
  <aside className="content-preview">
    {selectedContent && (
      <ContentPreview
        content={selectedContent}
        relationships={relatedContent}
        onOpenInExecute={() => openInExecute(selectedContent)}
        onUseinCampaign={() => openCampaignBuilder(selectedContent)}
      />
    )}
  </aside>
</div>
```

**Key UI Improvements:**
- ❌ Remove: Polling hell (5-second refresh)
- ❌ Remove: Confusing tabs (All, Strategies, Media Plans, etc.)
- ✅ Add: Conversational search with Claude
- ✅ Add: Intelligent folder navigation (auto-organized)
- ✅ Add: Rich content preview with relationships
- ✅ Add: One-click actions (Open in Execute, Use in Campaign, etc.)

---

## Implementation Phases

### Phase 1: Intelligent Ingestion (Week 1)
**Goal:** Auto-organize content on save + brand asset upload

**Tasks:**
1. Create `niv-memory-intelligence` Edge Function
2. Update `/api/content-library/save` to call intelligence function
3. Add database columns: themes, entities, topics, content_signature
4. Create `content_relationships` table
5. Create `folder_index` table
6. **NEW: Create `brand_assets` table** (templates, guidelines, logos)
7. **NEW: Build file upload system** for brand assets (API + Storage)
8. **NEW: Create `analyze-brand-asset` Edge Function** (extract guidelines/structure)
9. **NEW: Implement fast brand context lookup** (< 10ms, cached, fail-safe)
10. Test with NIVContentIntelligentV2 saves (MUST NOT BREAK)

**Success Criteria:**
- Content saves with auto-generated themes, entities, topics
- Folders auto-assigned based on content analysis
- Related content automatically linked
- NIVContentIntelligentV2 still works perfectly
- **NEW: Users can upload templates/guidelines**
- **NEW: Brand context lookup < 10ms (zero impact on users without guidelines)**

---

### Phase 2: Storage & Organization (Week 2)
**Goal:** Smart folder structure, tagging, and brand asset intelligence

**Tasks:**
1. Implement smart folder generation logic
2. Create folder hierarchy based on content analysis
3. Build automatic tagging system
4. Add performance tracking (usage counts, success metrics)
5. Create indexes for fast retrieval (including brand_assets composite index)
6. **NEW: Template categorization and intelligence extraction**
7. **NEW: Brand voice profile extraction from guidelines**
8. **NEW: Content generators check for brand assets** (fast, cached, optional)
9. Backfill existing content with intelligence

**Success Criteria:**
- Folders auto-created based on themes/types
- All content properly tagged and organized
- Fast search across 1000+ items
- Related content discoverable
- **NEW: Brand templates intelligently categorized**
- **NEW: Content generation applies brand guidelines when available (silently)**
- **NEW: 95%+ of brand lookups complete in < 10ms**

---

### Phase 3: Claude-Powered Discovery (Week 3)
**Goal:** Conversational search interface + smart export

**Tasks:**
1. Create Memory Vault Navigator Skill (with template awareness)
2. Build 3 MCP servers (search, relationships, patterns)
3. Create new MemoryVaultV2 UI component
4. Integrate Claude chat interface
5. Add content preview panel
6. **NEW: Add brand assets browser in sidebar** (templates, guidelines)
7. **NEW: Build smart export with template merging** (Word/PPTX)
8. **NEW: Create `merge-template` Edge Function** (content → template)
9. **NEW: Template selector UI** (only shown if templates exist)
10. Remove old polling-based UI

**Success Criteria:**
- Users can search with natural language
- Claude Skill returns relevant results
- MCPs work seamlessly
- Content preview shows relationships
- No more polling hell
- **NEW: Users can export content merged into branded templates**
- **NEW: Template browser shows available brand assets**
- **NEW: Zero nagging about missing templates**

---

### Phase 4: Proactive Recommendations (Week 4)
**Goal:** Memory Vault suggests content and templates proactively

**Tasks:**
1. Create recommendation engine
2. Track user behavior (what they search for, what they use)
3. Implement "You might be interested in..." suggestions
4. Add "Similar to this campaign" suggestions
5. Create "Trending in your org" widget
6. Surface successful patterns automatically
7. **NEW: Auto-suggest best-performing templates** (based on usage/success)
8. **NEW: Track template performance** (usage count, success rate, engagement)
9. **NEW: Monitoring dashboard** for brand asset lookup performance

**Success Criteria:**
- Recommendations appear in Command Center
- Users discover content they didn't know existed
- Successful patterns automatically surfaced
- Memory Vault becomes proactive, not reactive
- **NEW: Templates automatically suggested based on content type**
- **NEW: High-performing templates surface first**
- **NEW: System maintains < 10ms brand lookup performance at scale**

---

## Success Metrics

### User Experience
- **Time to find content**: < 30 seconds (currently: minutes or never)
- **Search success rate**: > 80% (currently: ~20%)
- **Content reuse**: 3x increase (most content never reused)
- **User satisfaction**: "I actually found what I needed"

### System Performance
- **Search speed**: < 500ms for any query
- **Auto-organization accuracy**: > 85% (folders make sense)
- **Relationship accuracy**: > 75% (related content is actually related)
- **No polling**: 0 unnecessary API calls

### Business Value
- **Content reuse rate**: Track how often past campaigns inform new ones
- **Template adoption**: Track usage of successful patterns
- **Knowledge retention**: Measure discovery of historical content
- **Campaign velocity**: Faster campaign creation using past learnings

---

## Migration Path

### Preserve NIVContentIntelligentV2 Contract
```typescript
// BEFORE (current):
POST /api/content-library/save
→ Direct INSERT

// AFTER (V2):
POST /api/content-library/save
→ Intelligence layer processing
→ Enhanced INSERT with metadata
→ Relationship creation
→ Folder assignment

// User code: NO CHANGES NEEDED ✅
```

### Gradual Rollout
1. **Phase 1**: Intelligence layer runs alongside current system (no UI changes)
2. **Phase 2**: New folder structure visible but old UI still works
3. **Phase 3**: New UI released as "Memory Vault V2" (old one still accessible)
4. **Phase 4**: Full migration, old UI deprecated

### Backfill Strategy
```sql
-- Run intelligence on existing content
SELECT id, title, content_type, content
FROM content_library
WHERE themes IS NULL
ORDER BY created_at DESC
LIMIT 100;

-- For each item:
-- 1. Call niv-memory-intelligence
-- 2. Update with themes, entities, topics
-- 3. Create relationships
-- 4. Assign folders
```

---

## Technical Specifications

### Edge Function: niv-memory-intelligence
```typescript
// Input
interface AnalysisRequest {
  content: {
    type: string
    title: string
    content: string | object
    organization_id: string
  }
  metadata?: any
}

// Output
interface AnalysisResponse {
  suggestedFolder: string
  extractedThemes: string[]
  relatedContentIds: string[]
  contentSignature: string
  metadata: {
    entities: {
      companies: string[]
      people: string[]
      products: string[]
    }
    topics: string[]
    sentiment: number  // -1 to 1
    complexity: 'simple' | 'moderate' | 'complex'
    keywords: string[]
  }
}
```

### Database Schema (Full)
```sql
-- Enhanced content_library
CREATE TABLE content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  content_type VARCHAR(100),
  title VARCHAR(500),
  content TEXT,
  metadata JSONB,

  -- NEW: Intelligence fields
  themes TEXT[],
  entities JSONB,  -- {companies: [], people: [], products: []}
  topics TEXT[],
  content_signature TEXT,
  complexity VARCHAR(20),
  sentiment NUMERIC(3,2),
  related_content_ids UUID[],

  -- Existing fields
  tags TEXT[],
  status VARCHAR(50) DEFAULT 'saved',
  folder TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),

  -- Performance tracking
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP,
  success_rating NUMERIC(3,2)
);

-- Content relationships
CREATE TABLE content_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_content_id UUID REFERENCES content_library(id) ON DELETE CASCADE,
  target_content_id UUID REFERENCES content_library(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50),
  confidence NUMERIC(3,2),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Folder index
CREATE TABLE folder_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_path TEXT UNIQUE NOT NULL,
  parent_folder TEXT,
  description TEXT,
  content_types TEXT[],
  themes TEXT[],
  item_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Indexes
CREATE INDEX idx_content_themes ON content_library USING GIN(themes);
CREATE INDEX idx_content_entities ON content_library USING GIN(entities);
CREATE INDEX idx_content_topics ON content_library USING GIN(topics);
CREATE INDEX idx_content_signature ON content_library(content_signature);
CREATE INDEX idx_content_folder ON content_library(folder);
CREATE INDEX idx_relationships_source ON content_relationships(source_content_id);
CREATE INDEX idx_relationships_target ON content_relationships(target_content_id);
CREATE INDEX idx_folder_path ON folder_index(folder_path);
```

---

## ⚡ PERFORMANCE ARCHITECTURE (Critical for Timeout Prevention)

### The Problem
**Edge functions are hitting timeouts. Memory Vault CANNOT add latency to critical paths.**

### The Solution: Async-First Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   CRITICAL PATH (Fast)                       │
│  Content Generation → Save → Return (< 500ms total)         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                BACKGROUND JOBS (Async)                       │
│  Intelligence → Relationships → Indexing                     │
│  (Can take 5-30s, doesn't block user)                       │
└─────────────────────────────────────────────────────────────┘
```

### 1. Content Generation (NIV/Campaign Builder)

**CURRENT CONCERN:** These already hit timeouts, can't add more latency

**SOLUTION:** Use cached brand context only

```typescript
// In NIV Content Assistant / Campaign Builder
async function generateContent(params) {
  const startTime = Date.now()

  // FAST: Check in-memory cache ONLY (< 1ms)
  const brandContext = brandContextCache.get(`${orgId}:${contentType}`)

  // If not cached, skip it (don't wait)
  // Background job will populate cache for next time

  if (!brandContext && !cacheWarmedUp) {
    // Fire-and-forget: warm cache for next time
    warmBrandContextCache(orgId, contentType).catch(() => {}) // Don't await
  }

  // Generate immediately (with or without brand context)
  const content = await claude.generate({
    ...params,
    brandGuidelines: brandContext?.guidelines || null // Optional
  })

  console.log(`Generation took ${Date.now() - startTime}ms`) // Should be same as before
  return content
}
```

**Performance Target:**
- ✅ Brand cache hit: +0ms overhead
- ✅ Brand cache miss: +0ms overhead (skip it, warm cache async)
- ✅ Never wait for database
- ✅ Never wait for Edge Function

### 2. Saving Content

**CURRENT CONCERN:** Can't add 5-10s of intelligence processing to save

**SOLUTION:** Save immediately, process intelligence async

```typescript
// /api/content-library/save
export async function POST(request: Request) {
  const { content, metadata, folder } = await request.json()

  // 1. FAST: Validate and save immediately (< 100ms)
  const { data: savedContent } = await supabase
    .from('content_library')
    .insert({
      ...content,
      metadata,
      folder: folder || 'Unsorted',
      status: 'saved', // Not 'processing' - it's already usable
      intelligence_status: 'pending' // Intelligence will come later
    })
    .select()
    .single()

  // 2. FAST: Return success immediately
  const response = NextResponse.json({
    success: true,
    content: savedContent
  })

  // 3. ASYNC: Queue intelligence job (fire-and-forget)
  // This runs AFTER response is sent
  queueIntelligenceJob(savedContent.id).catch(err =>
    console.error('Failed to queue intelligence:', err)
  )

  return response // User gets instant confirmation
}

// Background job (separate from save request)
async function processIntelligence(contentId: string) {
  try {
    // This can take 5-30s, user doesn't wait
    const intelligence = await fetch('https://supabase.com/functions/v1/niv-memory-intelligence', {
      method: 'POST',
      body: JSON.stringify({ contentId })
    })

    // Update content with intelligence
    await supabase
      .from('content_library')
      .update({
        themes: intelligence.themes,
        entities: intelligence.entities,
        folder: intelligence.suggestedFolder,
        intelligence_status: 'complete'
      })
      .eq('id', contentId)

    // Create relationships
    await createRelationships(contentId, intelligence.relatedContent)

  } catch (error) {
    // If intelligence fails, content is still saved and usable
    await supabase
      .from('content_library')
      .update({ intelligence_status: 'failed' })
      .eq('id', contentId)
  }
}
```

**Performance Target:**
- ✅ Save completes in < 200ms
- ✅ User can continue immediately
- ✅ Intelligence happens in background (5-30s OK)
- ✅ If intelligence fails, save still succeeded

### 3. Brand Asset Lookup

**CURRENT CONCERN:** Can't add database queries to every content generation

**SOLUTION:** Multi-layer caching

```typescript
// Layer 1: In-memory cache (instant)
const brandContextCache = new Map<string, BrandContext | null>()

// Layer 2: Redis cache (< 5ms) - optional but recommended
const redisCache = createClient({ url: process.env.REDIS_URL })

// Layer 3: Database (< 20ms with proper index)

async function getBrandContext(orgId: string, contentType: string) {
  const cacheKey = `${orgId}:${contentType}`

  // Layer 1: In-memory (< 1ms)
  if (brandContextCache.has(cacheKey)) {
    return brandContextCache.get(cacheKey)
  }

  // Layer 2: Redis (< 5ms) - if available
  if (redisCache) {
    try {
      const cached = await redisCache.get(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        brandContextCache.set(cacheKey, parsed) // Promote to L1
        return parsed
      }
    } catch (err) {
      // Redis failure, continue to DB
    }
  }

  // Layer 3: Database (< 20ms)
  try {
    const result = await Promise.race([
      supabase
        .from('brand_assets')
        .select('id, asset_type, brand_voice_profile, extracted_guidelines')
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .or(`asset_type.eq.guidelines-brand,asset_type.eq.template-${contentType}`)
        .limit(2)
        .maybeSingle(),

      // Timeout after 20ms
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 20)
      )
    ])

    // Cache in both layers
    const data = result?.data || null
    brandContextCache.set(cacheKey, data)
    if (redisCache) {
      await redisCache.setEx(cacheKey, 300, JSON.stringify(data)) // 5 min TTL
    }

    return data
  } catch (error) {
    // On timeout/error: cache null, continue without guidelines
    brandContextCache.set(cacheKey, null)
    return null
  }
}
```

**Performance Target:**
- ✅ L1 cache hit (99% of requests): < 1ms
- ✅ L2 cache hit: < 5ms
- ✅ L3 database hit: < 20ms
- ✅ Timeout/error: Return null, continue without guidelines

### 4. Queue System for Background Jobs

**Use Supabase pg_cron or external job queue:**

```sql
-- Option 1: Simple Postgres queue table
CREATE TABLE job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error TEXT
);

CREATE INDEX idx_job_queue_pending ON job_queue(status, created_at)
WHERE status = 'pending';

-- Queue a job
INSERT INTO job_queue (job_type, payload)
VALUES ('analyze-content', '{"contentId": "123"}');

-- Worker picks up jobs
SELECT * FROM job_queue
WHERE status = 'pending'
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

**Job Worker (separate process):**
```typescript
// Runs separately, processes jobs in background
async function jobWorker() {
  while (true) {
    const job = await getNextJob()

    if (job) {
      try {
        await processJob(job)
        await markJobComplete(job.id)
      } catch (error) {
        await markJobFailed(job.id, error)
      }
    } else {
      await sleep(1000) // No jobs, wait 1s
    }
  }
}
```

### 5. Real-Time Updates

**Use Supabase Realtime to notify UI when intelligence completes:**

```typescript
// In React component
useEffect(() => {
  const subscription = supabase
    .channel('content-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'content_library',
        filter: `id=eq.${contentId}`
      },
      (payload) => {
        if (payload.new.intelligence_status === 'complete') {
          // Refresh content with new themes, folder, relationships
          refreshContent()
        }
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [contentId])
```

**User Experience:**
1. Save content → instant success message
2. Content appears in Memory Vault immediately (in "Unsorted")
3. 5-10s later → content moves to smart folder, themes appear
4. UI updates seamlessly via real-time subscription

### 6. Cache Warming Strategy

**Proactively warm caches during low-usage times:**

```typescript
// Run every 5 minutes via cron
async function warmBrandContextCaches() {
  // Get all active organizations
  const orgs = await supabase
    .from('organizations')
    .select('id')
    .eq('status', 'active')

  // Warm cache for each org + common content types
  const contentTypes = ['press-release', 'social-post', 'blog-post']

  for (const org of orgs) {
    for (const type of contentTypes) {
      await getBrandContext(org.id, type) // Populates cache
    }
  }
}
```

### 7. Monitoring & Alerting

```typescript
// Track performance metrics
const metrics = {
  brandContextLookupTime: [], // Should be < 1ms (cached)
  saveTime: [],              // Should be < 200ms
  intelligenceProcessingTime: [], // Can be slow, it's async
  cacheHitRate: 0            // Should be > 95%
}

// Alert if performance degrades
if (avgSaveTime > 500) {
  alert('Memory Vault save is slow!')
}

if (cacheHitRate < 0.90) {
  alert('Cache hit rate dropped below 90%')
}
```

### Performance Guarantees

| Operation | Current (Before MV) | Target (After MV) | How |
|-----------|---------------------|-------------------|-----|
| Content Generation | 3-10s | 3-10s (no change) | Cached brand context only |
| Save to Memory Vault | 100ms | < 200ms | Async intelligence processing |
| Brand context lookup | N/A | < 1ms (cached) | Multi-layer cache |
| Intelligence processing | N/A | 5-30s (async) | Background job, doesn't block |
| Export with template | N/A | 2-5s | Acceptable (user-initiated) |

### Fallback Strategy

**If any component times out or fails:**

```typescript
// Content generation
if (!brandContext) {
  // Continue without brand guidelines ✅
}

// Intelligence processing
if (intelligenceFails) {
  // Content still saved, just no auto-categorization ✅
}

// Template export
if (templateMergeFails) {
  // Export as plain format ✅
}
```

**Never block. Always have a fallback. Intelligence is enhancement, not requirement.**

---

## Key Decisions

### Why Claude Skill + MCPs?
- **Skills**: Perfect for conversational discovery (vague queries → clarification → results)
- **MCPs**: Provide tools for Claude to query database intelligently
- **Together**: Skill guides conversation, MCPs do the data heavy lifting

### Why Intelligence Layer?
- **Auto-organization**: Users terrible at manual organization
- **Relationship discovery**: Humans miss connections
- **Consistent tagging**: No "CompetitiveResponse" vs "Competitive Response" vs "competitive-response"
- **Future-proof**: Foundation for vector search, semantic similarity

### Why Preserve NIVContentIntelligentV2 Contract?
- **Zero regression risk**: NIV still saves perfectly
- **Gradual enhancement**: Intelligence added transparently
- **User trust**: Nothing breaks during migration

---

## Open Questions

1. **Vector search?** Add later for semantic similarity?
2. **External integrations?** Connect to Google Drive, Notion for additional content?
3. **Collaborative features?** Team annotations, comments on content?
4. **Version control?** Track changes to successful templates?
5. **Analytics dashboard?** Show content performance trends?

---

## Next Steps

1. **Review this plan** - Validate approach
2. **Phase 1 execution** - Build intelligence layer
3. **Test with real data** - Ensure NIVContentIntelligentV2 compatibility
4. **Iterate** - Adjust based on results
5. **Phase 2+** - Continue rollout

---

**The Goal:** Transform Memory Vault from a neglected file dump into the **intelligent knowledge hub** that makes SignalDesk's learning and reuse capabilities a true competitive advantage.
