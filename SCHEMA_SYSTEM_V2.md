# Schema Discovery & Generation System v2.0

## Overview

Comprehensive schema.org graph generation system that discovers entities from company websites and external sources, validates them with AI, and generates rich interconnected schema markup optimized for AI visibility.

---

## Architecture

### Three Independent Systems

#### **SYSTEM 1: Website Entity Discovery**
Extracts structured data from the organization's own website.

**Components:**
- `website-entity-scraper` - Uses Firecrawl Extract API
- `website-entity-compiler` - Uses Claude for validation

**What it discovers:**
- Products/Services offered
- Business units/service lines
- Physical locations/offices
- Subsidiaries/child organizations
- Leadership team members

**Data flow:**
1. Scraper calls Firecrawl Extract with structured schemas
2. Firecrawl crawls website and extracts entities
3. Compiler validates with Claude (deduplication, enrichment)
4. Saves to `content_library` table

#### **SYSTEM 2: Positive Coverage Discovery**
Searches external web for positive mentions, awards, achievements.

**Components:**
- `positive-coverage-scraper` - Uses niv-fireplexity web search
- `positive-coverage-compiler` - Uses Claude for filtering

**What it discovers:**
- Awards won
- Achievements/milestones
- Industry recognition
- Leadership positioning
- Innovation awards

**Data flow:**
1. Scraper searches web with targeted queries
2. Finds articles from past 90 days
3. Compiler analyzes with Claude to filter false positives
4. Generates summaries for each piece of coverage
5. Saves to `intelligence_findings` table with relevance_score=80

#### **SYSTEM 3: Schema Graph Generation**
Combines all discovered data into comprehensive schema.org @graph.

**Components:**
- `schema-graph-generator` - Queries all sources, builds graph

**What it generates:**
- Organization (main entity)
- Product schemas (for each product)
- Service schemas (for each service)
- Place schemas (for each location)
- Organization schemas (for each subsidiary)
- Person schemas (for each team member)
- NewsArticle schemas (for each positive coverage item)

**Data flow:**
1. Queries `content_library` for all entity types
2. Queries `intelligence_findings` for positive coverage
3. Builds comprehensive @graph structure
4. Links all entities via @id references
5. Saves complete graph to `content_library` as active schema

---

## Orchestration

### **geo-schema-optimizer v2.0**

Main orchestrator that runs all three systems in sequence.

**Flow:**
```
1. Check for existing schema (skip if exists and !force_regenerate)
2. Run SYSTEM 1: Website Entity Discovery (if URL provided)
   → website-entity-scraper
   → website-entity-compiler
3. Run SYSTEM 2: Positive Coverage Discovery
   → positive-coverage-scraper
   → positive-coverage-compiler
4. Run SYSTEM 3: Schema Graph Generation
   → schema-graph-generator
5. Return comprehensive schema graph
```

**Error handling:**
- Systems 1 & 2 are non-blocking (failures don't stop flow)
- System 3 is required (failure stops execution)
- All systems log detailed progress

---

## Integration Points

### **1. Onboarding**

**When:** During organization creation (Step 5)

**What happens:**
```
User creates org → Discovery → Targets → GEO config
→ geo-schema-optimizer called automatically
→ Full discovery & schema generation
→ Organization ready with comprehensive schema
```

**Code location:** `src/components/onboarding/OrganizationOnboarding.tsx`

### **2. Settings Regenerate Button**

**When:** User clicks "Regenerate Schema" in Settings → About

**What happens:**
```
User clicks regenerate → geo-schema-optimizer called with force_regenerate=true
→ Full rediscovery (fresh website scrape, fresh coverage search)
→ New schema graph generated
→ Replaces old schema
```

**Code location:** `src/components/settings/OrganizationSettings.tsx`

---

## Data Storage

### **content_library table**

Stores discovered entities and final schema:

| content_type | What it stores | Folder |
|-------------|----------------|--------|
| `product` | Products from website | Products/ |
| `service` | Services from website | Services/ |
| `location` | Physical locations | Locations/ |
| `subsidiary` | Child organizations | Subsidiaries/ |
| `person` | Team members | Team/ |
| `schema` | Final schema graph | Schemas/Active/ |

**Metadata fields:**
- `schema_ready: true` - Entity is ready for schema generation
- `compiled_by` - Which compiler created it
- Schema-specific fields (category, service_type, etc.)

### **intelligence_findings table**

Stores positive coverage:

| Field | Value for positive coverage |
|-------|----------------------------|
| `relevance_score` | 80 (high relevance) |
| `sentiment_score` | 0.9 (very positive) |
| `metadata.coverage_type` | award, achievement, recognition, etc. |
| `metadata.compiled_by` | positive-coverage-compiler |
| `metadata.schema_ready` | true |

---

## API Endpoints

### **website-entity-scraper**

```typescript
POST /functions/v1/website-entity-scraper

Request:
{
  organization_id: string
  organization_name: string
  website_url: string
  entity_types?: string[] // Optional filter
}

Response:
{
  success: true,
  entities: {
    products: [...],
    services: [...],
    locations: [...],
    subsidiaries: [...],
    team: [...]
  },
  summary: {
    total_entities: number,
    by_type: {...}
  }
}
```

### **website-entity-compiler**

```typescript
POST /functions/v1/website-entity-compiler

Request:
{
  organization_id: string
  organization_name: string
  entities: {...} // From scraper
}

Response:
{
  success: true,
  compiled_entities: {...},
  saved_count: number,
  summary: {...}
}
```

### **positive-coverage-scraper**

```typescript
POST /functions/v1/positive-coverage-scraper

Request:
{
  organization_id: string
  organization_name: string
  recency_window?: string // '7days', '30days', '90days'
  max_results_per_query?: number
}

Response:
{
  success: true,
  articles: [...],
  summary: {
    total_searches: number,
    recent_articles: number
  }
}
```

### **positive-coverage-compiler**

```typescript
POST /functions/v1/positive-coverage-compiler

Request:
{
  organization_id: string
  organization_name: string
  articles: [...] // From scraper
}

Response:
{
  success: true,
  coverage_items: [...],
  saved_count: number,
  summary: {...}
}
```

### **schema-graph-generator**

```typescript
POST /functions/v1/schema-graph-generator

Request:
{
  organization_id: string
  organization_name: string
  industry?: string
  url?: string
}

Response:
{
  success: true,
  schema_graph: {...}, // Full @graph structure
  entity_count: number,
  summary: {
    products: number,
    services: number,
    locations: number,
    subsidiaries: number,
    team: number,
    coverage: number
  }
}
```

### **geo-schema-optimizer** (Orchestrator)

```typescript
POST /functions/v1/geo-schema-optimizer

Request:
{
  organization_id: string
  organization_name: string
  industry?: string
  url?: string
  force_regenerate?: boolean
  skip_entity_extraction?: boolean // For testing
  skip_positive_coverage?: boolean // For testing
}

Response:
{
  success: true,
  schema_graph: {...},
  entity_count: number,
  summary: {...},
  message: string
}
```

---

## Schema Output Structure

### Example @graph structure:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://company.com#organization",
      "name": "Company Name",
      "url": "https://company.com",
      "makesOffer": [
        { "@id": "https://company.com#product-0" },
        { "@id": "https://company.com#product-1" }
      ],
      "location": [
        { "@id": "https://company.com#location-0" }
      ],
      "subOrganization": [
        { "@id": "https://company.com#subsidiary-0" }
      ],
      "employee": [
        { "@id": "https://company.com#person-0" }
      ],
      "subjectOf": [
        { "@id": "https://company.com#article-0" }
      ]
    },
    {
      "@type": "Product",
      "@id": "https://company.com#product-0",
      "name": "Product Name",
      "description": "Product description",
      "category": "Category"
    },
    {
      "@type": "Place",
      "@id": "https://company.com#location-0",
      "name": "Headquarters",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "123 Main St",
        "addressLocality": "City",
        "addressRegion": "State"
      }
    },
    {
      "@type": "NewsArticle",
      "@id": "https://company.com#article-0",
      "headline": "Company wins award",
      "url": "https://news.com/article",
      "datePublished": "2025-01-15",
      "about": { "@id": "https://company.com#organization" },
      "publisher": {
        "@type": "Organization",
        "name": "News Outlet"
      }
    }
  ]
}
```

---

## Testing

### Test System 1 (Website Entities) Only:

```typescript
await fetch('/functions/v1/website-entity-scraper', {
  method: 'POST',
  body: JSON.stringify({
    organization_id: 'test-org',
    organization_name: 'Test Company',
    website_url: 'https://testcompany.com'
  })
})
```

### Test System 2 (Positive Coverage) Only:

```typescript
await fetch('/functions/v1/positive-coverage-scraper', {
  method: 'POST',
  body: JSON.stringify({
    organization_id: 'test-org',
    organization_name: 'Test Company',
    recency_window: '90days'
  })
})
```

### Test Full Flow:

```typescript
await fetch('/functions/v1/geo-schema-optimizer', {
  method: 'POST',
  body: JSON.stringify({
    organization_id: 'test-org',
    organization_name: 'Test Company',
    industry: 'Technology',
    url: 'https://testcompany.com',
    force_regenerate: true
  })
})
```

---

## Performance Considerations

**Execution time:**
- System 1 (Website): ~30-60 seconds (depends on Firecrawl)
- System 2 (Coverage): ~20-40 seconds (6 searches + compilation)
- System 3 (Graph): ~5-10 seconds (database queries + generation)
- **Total: ~60-120 seconds** for complete flow

**Costs:**
- Firecrawl Extract: ~$0.50 per website scan
- Claude API: ~$0.10 per compilation
- niv-fireplexity: Depends on search backend
- **Total: ~$1-2 per organization**

**Optimization tips:**
- Use `force_regenerate=false` to skip if schema exists
- Use `skip_entity_extraction=true` to skip website scraping
- Use `skip_positive_coverage=true` to skip coverage search
- All systems are non-blocking except graph generation

---

## Future Enhancements

1. **Incremental Updates**: Only regenerate changed entities
2. **Scheduled Refresh**: Periodic schema updates (monthly/quarterly)
3. **More Entity Types**: Events, FAQs, Reviews
4. **Image Extraction**: Product images, team photos
5. **Multi-language**: Generate schemas in multiple languages
6. **Schema Validation**: Automated testing against schema.org standards
7. **Deployment**: Automatic JSON-LD file generation and hosting

---

## Troubleshooting

### Schema not generating?

Check logs for:
- `schema_graph_generator` errors
- Missing organization_id or organization_name
- Database connection issues

### Entities not being discovered?

Check:
- Website URL is accessible
- Firecrawl API key is valid
- Website has structured content (not just images)

### Positive coverage empty?

Check:
- niv-fireplexity is working
- Organization name is well-known (has press coverage)
- Recency window isn't too narrow

### Compilation failing?

Check:
- Claude API key is valid
- Response parsing logic
- Input data format

---

## Related Files

**Edge Functions:**
- `supabase/functions/website-entity-scraper/index.ts`
- `supabase/functions/website-entity-compiler/index.ts`
- `supabase/functions/positive-coverage-scraper/index.ts`
- `supabase/functions/positive-coverage-compiler/index.ts`
- `supabase/functions/schema-graph-generator/index.ts`
- `supabase/functions/geo-schema-optimizer/index.ts`

**Frontend:**
- `src/components/onboarding/OrganizationOnboarding.tsx`
- `src/components/settings/OrganizationSettings.tsx`

**API Routes:**
- `src/app/api/organizations/discover/route.ts` (MCP discovery only)

---

## Version History

**v2.0** (Current)
- Complete rebuild with 3-tier architecture
- Firecrawl Extract for website entities
- niv-fireplexity for coverage search
- Claude for all validation/compilation
- Comprehensive @graph output

**v1.0** (Deprecated)
- Single schema generation with Claude
- Limited to Organization schema only
- No entity discovery
