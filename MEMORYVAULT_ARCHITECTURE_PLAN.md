# MemoryVault Architecture Plan
## Unified Content & Knowledge Management System

### Executive Summary

MemoryVault is the central knowledge repository and content management system for SignalDesk V3. It serves as the platform's "memory" - storing, organizing, and making retrievable all generated content, strategic frameworks, intelligence findings, and execution artifacts.

Currently, we have multiple fragmented storage systems:
- `niv_strategies` - Strategic frameworks
- `content_library` - Generated content
- `memory_vault` / `memoryvault_items` - Document storage
- `niv_artifacts` - Various outputs
- localStorage fallbacks

**This plan unifies these into a cohesive MemoryVault system.**

---

## 🎯 Core Vision

MemoryVault should be:
1. **The Single Source of Truth** - All platform-generated content lives here
2. **Intelligent & Searchable** - Vector embeddings for semantic search
3. **Contextually Aware** - Maintains relationships between content pieces
4. **Learning-Enabled** - Patterns and insights feed back into the system
5. **Component-Agnostic** - Any component can save/retrieve content

---

## 📊 Current State Analysis

### What's Working
- NIV strategies save successfully to `niv_strategies` table
- MemoryVaultModule UI displays saved strategies
- localStorage fallback provides resilience
- Strategic framework structure is well-defined

### What's Broken
1. **content_library** saves fail due to ID type mismatch (expects integer, gets string)
2. **Multiple disconnected tables** with overlapping purposes
3. **No unified content type system** - each component saves differently
4. **No semantic search** capabilities (vector embeddings not implemented)
5. **Limited cross-component access** - components can't easily use each other's content

---

## 🏗️ Proposed Architecture

### 1. Unified Content Model

```typescript
interface MemoryVaultItem {
  // Core Identification
  id: string                    // UUID
  organization_id: string       // Organization context

  // Content Type System
  content_type: ContentType     // Strongly typed
  content_subtype?: string      // Additional categorization

  // Flexible Content Storage
  content: {
    // Common fields across all types
    title: string
    summary?: string

    // Type-specific content (validated by content_type)
    data: any                  // Actual content structure

    // Rendering hints
    display_format?: 'text' | 'markdown' | 'json' | 'html'
    preview?: string           // Quick preview text
  }

  // Relationships & Context
  relationships: {
    parent_id?: string         // Parent item (e.g., strategy -> content)
    source_items?: string[]    // Items this was derived from
    related_items?: string[]   // Associated items
    workflow_id?: string       // Originating workflow
    session_id?: string        // NIV session context
  }

  // Intelligence & Learning
  intelligence: {
    embedding?: number[]       // Vector for semantic search
    keywords?: string[]        // Extracted keywords
    entities?: Entity[]        // People, companies, topics
    sentiment?: number         // -1 to 1 scale
    confidence?: number        // 0 to 1 scale
  }

  // Metadata
  metadata: {
    created_by: string         // User or component
    created_at: Date
    updated_at?: Date
    version?: number
    status: 'draft' | 'active' | 'archived'
    tags?: string[]
    custom?: Record<string, any>  // Component-specific metadata
  }

  // Execution Context
  execution?: {
    component: string          // Which component created this
    action?: string            // What action was taken
    results?: any              // Execution results
    performance?: {
      duration_ms?: number
      token_usage?: number
    }
  }
}

enum ContentType {
  // Strategic & Planning
  STRATEGIC_FRAMEWORK = 'strategic_framework',
  DISCOVERY_PROFILE = 'discovery_profile',
  OPPORTUNITY = 'opportunity',

  // Content Generation
  PRESS_RELEASE = 'press_release',
  BLOG_POST = 'blog_post',
  SOCIAL_POST = 'social_post',
  EMAIL_CAMPAIGN = 'email_campaign',
  EXECUTIVE_BRIEF = 'executive_brief',

  // Intelligence
  RESEARCH_FINDINGS = 'research_findings',
  COMPETITIVE_INTEL = 'competitive_intel',
  MARKET_ANALYSIS = 'market_analysis',
  SYNTHESIS = 'synthesis',

  // Media & Outreach
  MEDIA_LIST = 'media_list',
  PITCH_DECK = 'pitch_deck',
  TALKING_POINTS = 'talking_points',

  // Execution Artifacts
  CAMPAIGN_TIMELINE = 'campaign_timeline',
  WORKFLOW_OUTPUT = 'workflow_output',
  REPORT = 'report',

  // Learning & Patterns
  PATTERN = 'pattern',
  INSIGHT = 'insight',
  TEMPLATE = 'template'
}
```

### 2. Database Schema

```sql
-- Main MemoryVault table (replacing multiple tables)
CREATE TABLE memory_vault (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),

  -- Content Type
  content_type TEXT NOT NULL,
  content_subtype TEXT,

  -- Content
  content JSONB NOT NULL,

  -- Relationships
  relationships JSONB DEFAULT '{}',

  -- Intelligence
  intelligence JSONB DEFAULT '{}',
  embedding vector(1536),  -- For semantic search

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Execution
  execution JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT valid_content_type CHECK (
    content_type IN (
      'strategic_framework', 'discovery_profile', 'opportunity',
      'press_release', 'blog_post', 'social_post', 'email_campaign',
      'research_findings', 'competitive_intel', 'synthesis',
      'media_list', 'pitch_deck', 'campaign_timeline',
      'pattern', 'insight', 'template'
    )
  )
);

-- Indexes for performance
CREATE INDEX idx_memory_vault_org ON memory_vault(organization_id);
CREATE INDEX idx_memory_vault_type ON memory_vault(content_type);
CREATE INDEX idx_memory_vault_created ON memory_vault(created_at DESC);
CREATE INDEX idx_memory_vault_metadata ON memory_vault USING GIN(metadata);
CREATE INDEX idx_memory_vault_relationships ON memory_vault USING GIN(relationships);
CREATE INDEX idx_memory_vault_embedding ON memory_vault USING ivfflat(embedding);

-- Full-text search
ALTER TABLE memory_vault ADD COLUMN search_text tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(content->>'title', '') || ' ' ||
      COALESCE(content->>'summary', '') || ' ' ||
      COALESCE(content->>'preview', '')
    )
  ) STORED;

CREATE INDEX idx_memory_vault_search ON memory_vault USING GIN(search_text);
```

### 3. Service Layer Architecture

```typescript
// Core MemoryVault Service
class MemoryVaultService {
  // Save any content type
  async save(item: Partial<MemoryVaultItem>): Promise<MemoryVaultItem> {
    // Validate content type
    // Generate embedding
    // Extract entities/keywords
    // Save to database
  }

  // Retrieve with filters
  async get(filters: {
    organization_id?: string
    content_type?: ContentType | ContentType[]
    parent_id?: string
    tags?: string[]
    date_range?: { from: Date, to: Date }
    limit?: number
  }): Promise<MemoryVaultItem[]>

  // Semantic search
  async search(query: string, options?: {
    content_types?: ContentType[]
    limit?: number
    similarity_threshold?: number
  }): Promise<MemoryVaultItem[]>

  // Get related items
  async getRelated(itemId: string): Promise<MemoryVaultItem[]>

  // Update existing item
  async update(id: string, updates: Partial<MemoryVaultItem>): Promise<MemoryVaultItem>

  // Learn from patterns
  async extractPatterns(items: MemoryVaultItem[]): Promise<Pattern[]>
}

// Component-specific adapters
class StrategicFrameworkAdapter {
  constructor(private vault: MemoryVaultService) {}

  async saveFramework(framework: NivStrategicFramework): Promise<MemoryVaultItem> {
    return this.vault.save({
      content_type: ContentType.STRATEGIC_FRAMEWORK,
      content: {
        title: framework.strategy.objective,
        data: framework,
        display_format: 'json'
      },
      relationships: {
        session_id: framework.sessionId
      },
      metadata: {
        created_by: 'niv_consultant',
        tags: ['strategic', 'framework']
      }
    })
  }
}

class ContentGenerationAdapter {
  async saveContent(content: GeneratedContent): Promise<MemoryVaultItem> {
    return this.vault.save({
      content_type: this.mapToContentType(content.type),
      content: {
        title: content.title,
        data: content.body,
        display_format: content.format || 'markdown'
      },
      relationships: {
        parent_id: content.frameworkId,
        source_items: content.sourceIds
      }
    })
  }
}
```

### 4. Migration Strategy

#### Phase 1: Immediate Fixes (Today)
1. Fix `content_library` table ID issue
2. Update ContentGenerationService to handle proper ID types
3. Ensure all current saves work

#### Phase 2: Unified Schema (Week 1)
1. Create new `memory_vault` table with proposed schema
2. Build MemoryVaultService with basic CRUD
3. Create adapters for existing components

#### Phase 3: Migration (Week 1-2)
1. Migrate existing `niv_strategies` data
2. Migrate `content_library` data
3. Update components to use new service
4. Maintain backwards compatibility

#### Phase 4: Intelligence Layer (Week 2-3)
1. Implement embedding generation
2. Add semantic search
3. Build entity extraction
4. Create pattern recognition

#### Phase 5: Advanced Features (Week 3-4)
1. Cross-component content discovery
2. Learning system implementation
3. Template extraction
4. Performance optimization

---

## 🔧 Implementation Details

### Component Integration Points

```typescript
// NIV Consultant saves strategic framework
const framework = await nivConsultant.generateFramework(query)
const saved = await memoryVault.save({
  content_type: ContentType.STRATEGIC_FRAMEWORK,
  content: { title: framework.objective, data: framework }
})

// Content Generator uses framework to create content
const framework = await memoryVault.get({
  content_type: ContentType.STRATEGIC_FRAMEWORK,
  organization_id: orgId
})[0]

const blogPost = await contentGen.generate(framework)
await memoryVault.save({
  content_type: ContentType.BLOG_POST,
  content: { title: blogPost.title, data: blogPost },
  relationships: { parent_id: framework.id }
})

// Intelligence module saves findings
const findings = await intelligencePipeline.run()
await memoryVault.save({
  content_type: ContentType.RESEARCH_FINDINGS,
  content: { title: 'Market Intelligence', data: findings }
})

// Components discover related content
const related = await memoryVault.search(
  "competitor product launch",
  { content_types: [ContentType.COMPETITIVE_INTEL, ContentType.MARKET_ANALYSIS] }
)
```

### API Endpoints

```typescript
// Supabase Edge Functions
POST   /memory-vault/save
GET    /memory-vault/list
POST   /memory-vault/search
GET    /memory-vault/related/{id}
PATCH  /memory-vault/update/{id}
DELETE /memory-vault/archive/{id}
POST   /memory-vault/learn
```

---

## 📈 Success Metrics

1. **Unified Storage**: All content types saving to single system
2. **Search Performance**: <500ms semantic search across all content
3. **Cross-Component Usage**: Components using each other's content
4. **Pattern Recognition**: System learning from saved content
5. **Zero Data Loss**: All saves successful with proper fallbacks

---

## 🚀 Next Steps

### Immediate Actions (Fix Current Issues)
1. ✅ Fix content_library ID type issue
2. Update ContentGenerationService error handling
3. Add proper type validation

### Short Term (This Week)
1. Design final database schema
2. Build core MemoryVaultService
3. Create component adapters
4. Test with existing components

### Medium Term (Next 2 Weeks)
1. Implement vector embeddings
2. Add semantic search
3. Build learning system
4. Migrate existing data

### Long Term (Month)
1. Full platform integration
2. Advanced pattern recognition
3. Template extraction
4. Performance optimization

---

## 📝 Technical Notes

### Why Unify?
- **Single source of truth** prevents data fragmentation
- **Semantic search** enables intelligent content discovery
- **Relationships** maintain context between content pieces
- **Learning** improves system over time
- **Flexibility** supports any content type

### Key Decisions
- Use JSONB for flexible content storage
- Vector embeddings for semantic search
- Strong typing with TypeScript enums
- Component adapters for clean integration
- Fallback to localStorage for resilience

### Risk Mitigation
- Backwards compatibility during migration
- localStorage fallback for offline/errors
- Validation at service layer
- Comprehensive error handling
- Gradual rollout with feature flags

---

This architecture positions MemoryVault as the intelligent knowledge center of SignalDesk V3, enabling the platform to not just store content, but to understand, connect, and learn from it.