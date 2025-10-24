# SignalDesk GEO/AI Advertising - Implementation Package for Claude Code

## PROJECT CONTEXT

You are implementing a GEO (Generative Experience Optimization) and AI advertising system into the existing SignalDesk platform. SignalDesk is a reputation management and PR platform that already has:

- Intelligence layer (monitoring 130+ sources)
- VECTOR campaign system (content generation at scale)
- Crisis management features
- Stakeholder orchestration

**Your mission:** Add AI visibility monitoring and dynamic schema management capabilities to make SignalDesk the first platform that orchestrates reputation across traditional PR, social media, AND AI agents.

---

## MARKET CONTEXT (Why This Matters)

- Traditional digital advertising ($600B market) is collapsing as AI browsers (ChatGPT Atlas, Perplexity Comet, Claude extension) eliminate ads
- AI-mediated discovery is exploding: 4,700% YoY growth in AI browser traffic
- Brands need visibility in AI-generated responses, not just Google search results
- No existing solution connects traditional PR to AI optimization
- This is a $365B market opportunity at the exact moment of disruption

**The Insight:** AI agents cite brands based on the same signals traditional PR builds—media coverage, authority, social proof, structured data. SignalDesk is uniquely positioned to orchestrate both.

---

## WHAT YOU'RE BUILDING

### Core Capabilities (Priority Order)

**Phase 1: Schema Management System (Weeks 1-2)**

1. Extract schemas from any website using Firecrawl
2. Store schemas in PostgreSQL with version control
3. Visual editing interface for schemas
4. AI-powered optimization suggestions using Claude
5. Multiple deployment methods (CDN, API, manual)

**Phase 2: AI Platform Monitoring (Weeks 3-4)**

1. Query major AI platforms (ChatGPT, Claude, Perplexity, Gemini)
2. Parse responses to extract brand mentions and rankings
3. Track competitive positioning
4. Alert on changes and opportunities

**Phase 3: Intelligence & Automation (Weeks 5-8)**

1. Competitive analysis (schema gap detection)
2. Citation tracking (what content drives AI mentions)
3. Dynamic schema updates based on intelligence
4. A/B testing for schemas
5. Integration with existing VECTOR campaigns

---

## TECHNICAL STACK

**Existing SignalDesk Stack:**

- Backend: Node.js
- Database: PostgreSQL
- Frontend: React
- Already uses: Firecrawl extensively

**New Integrations Needed:**

- Firecrawl Extract API (for schema extraction)
- Anthropic Claude API (for AI optimization)
- OpenAI API (for monitoring ChatGPT)
- Perplexity API (for monitoring Perplexity)
- Google Gemini API (for monitoring Gemini)

---

## PHASE 1: SCHEMA MANAGEMENT SYSTEM

### Database Schema

Create these tables in PostgreSQL:

```sql
-- Main schemas table
CREATE TABLE schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) NOT NULL,

  -- Schema identification
  schema_type VARCHAR(100) NOT NULL, -- Organization, Product, FAQPage, etc.
  source_url TEXT NOT NULL,

  -- The actual schema (stored as JSONB for queryability)
  content JSONB NOT NULL,

  -- Metadata extracted from schema
  metadata JSONB,

  -- Validation results
  validation_status VARCHAR(20) DEFAULT 'pending', -- valid, invalid, warning
  validation_errors JSONB,
  validation_warnings JSONB,

  -- Deployment tracking
  deployment_status VARCHAR(20) DEFAULT 'draft', -- draft, active, archived
  deployed_at TIMESTAMP,
  deployment_method VARCHAR(50), -- cdn, api, manual

  -- Platform targeting
  platform_specific BOOLEAN DEFAULT false,
  target_platform VARCHAR(50), -- chatgpt, claude, perplexity, null for universal

  -- Versioning
  version INTEGER DEFAULT 1,
  parent_schema_id UUID REFERENCES schemas(id), -- for version history

  -- Performance tracking
  performance_score DECIMAL(5,2),

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_schemas_brand_type ON schemas(brand_id, schema_type);
CREATE INDEX idx_schemas_deployment ON schemas(deployment_status, deployed_at);
CREATE INDEX idx_schemas_platform ON schemas(platform_specific, target_platform);
CREATE INDEX idx_schemas_content ON schemas USING gin(content);
CREATE INDEX idx_schemas_metadata ON schemas USING gin(metadata);

-- Schema change history
CREATE TABLE schema_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID REFERENCES schemas(id) NOT NULL,

  change_type VARCHAR(50) NOT NULL, -- created, updated, deployed, archived
  changes JSONB NOT NULL, -- diff of what changed
  reason TEXT,
  triggered_by VARCHAR(50), -- manual, intelligence, competitor, scheduled
  trigger_data JSONB,

  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Schema performance metrics (time-series)
CREATE TABLE schema_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID REFERENCES schemas(id) NOT NULL,
  date DATE NOT NULL,

  citation_count INTEGER DEFAULT 0,
  mention_count INTEGER DEFAULT 0,
  avg_position DECIMAL(4,2),
  positive_mentions INTEGER DEFAULT 0,
  neutral_mentions INTEGER DEFAULT 0,
  negative_mentions INTEGER DEFAULT 0,

  platform_breakdown JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(schema_id, date)
);

-- A/B tests for schemas
CREATE TABLE schema_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) NOT NULL,

  name VARCHAR(255) NOT NULL,
  schema_type VARCHAR(100) NOT NULL,
  hypothesis TEXT,

  control_schema_id UUID REFERENCES schemas(id),
  variant_schemas JSONB NOT NULL,

  traffic_split JSONB,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  status VARCHAR(20) DEFAULT 'running', -- running, completed, stopped
  winner_schema_id UUID REFERENCES schemas(id),
  results JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI suggestions for schema improvements
CREATE TABLE schema_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID REFERENCES schemas(id) NOT NULL,

  field_path TEXT NOT NULL, -- e.g., "description" or "offers.price"
  current_value JSONB,
  suggested_value JSONB,

  reason TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL, -- high, medium, low
  confidence DECIMAL(3,2), -- 0.0 to 1.0

  status VARCHAR(20) DEFAULT 'pending', -- pending, applied, rejected
  applied_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);
```

### Backend Services Architecture

Create these service files:

```
backend/
├── services/
│   ├── schema/
│   │   ├── extractor.service.js       # Extract schemas using Firecrawl
│   │   ├── parser.service.js          # Parse and classify schemas
│   │   ├── validator.service.js       # Validate schemas
│   │   ├── optimizer.service.js       # AI-powered optimization
│   │   ├── deployer.service.js        # Deploy schemas
│   │   └── repository.service.js      # Database operations
│   │
│   ├── ai-monitoring/
│   │   ├── query.service.js           # Query AI platforms
│   │   ├── parser.service.js          # Parse AI responses
│   │   ├── tracker.service.js         # Track mentions over time
│   │   └── competitive.service.js     # Competitive analysis
│   │
│   └── intelligence/
│       ├── analyzer.service.js        # Analyze signals
│       └── orchestrator.service.js    # Trigger schema updates
│
├── routes/
│   ├── schema.routes.js               # Schema CRUD + operations
│   ├── ai-monitoring.routes.js        # AI monitoring endpoints
│   └── geo.routes.js                  # GEO-specific endpoints
│
├── models/
│   ├── schema.model.js
│   ├── schema-change.model.js
│   ├── schema-performance.model.js
│   └── schema-suggestion.model.js
│
└── utils/
    ├── firecrawl.client.js            # Firecrawl API wrapper
    ├── claude.client.js               # Claude API wrapper
    └── schema-diff.util.js            # Schema comparison utilities
```

### Schema Extractor Service

File: `backend/services/schema/extractor.service.js`

```javascript
const firecrawl = require("../../utils/firecrawl.client");
const ParserService = require("./parser.service");

class SchemaExtractorService {
  constructor() {
    this.parser = new ParserService();
  }

  /**
   * Extract all schemas from a URL
   */
  async extractFromUrl(url) {
    try {
      const result = await firecrawl.extract({
        url: url,
        formats: ["extract"],
        onlyMainContent: false,
        extract: {
          schema: {
            type: "object",
            properties: {
              jsonLdSchemas: {
                type: "array",
                description:
                  "All JSON-LD schema.org structured data found on the page",
                items: {
                  type: "object",
                },
              },
              pageMetadata: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  lastModified: { type: "string" },
                },
              },
            },
            required: ["jsonLdSchemas"],
          },
        },
      });

      const extracted = result.data?.extract || {};

      if (!extracted.jsonLdSchemas || extracted.jsonLdSchemas.length === 0) {
        return {
          url: url,
          schemas: [],
          metadata: extracted.pageMetadata || {},
          found: false,
        };
      }

      // Parse and classify each schema
      const parsed = extracted.jsonLdSchemas.map((schema) =>
        this.parser.parse(schema)
      );

      return {
        url: url,
        schemas: parsed,
        metadata: extracted.pageMetadata || {},
        found: true,
      };
    } catch (error) {
      console.error("Schema extraction failed:", error);
      throw new Error(
        `Failed to extract schemas from ${url}: ${error.message}`
      );
    }
  }

  /**
   * Extract schemas from multiple URLs
   */
  async extractFromUrls(urls) {
    const results = await Promise.allSettled(
      urls.map((url) => this.extractFromUrl(url))
    );

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          url: urls[index],
          schemas: [],
          error: result.reason.message,
          found: false,
        };
      }
    });
  }

  /**
   * Discover common schema URLs for a brand
   */
  discoverUrls(brand) {
    const baseUrl = brand.website.replace(/\/$/, "");

    return [
      baseUrl,
      `${baseUrl}/about`,
      `${baseUrl}/products`,
      `${baseUrl}/contact`,
      ...(brand.productPages || []),
    ];
  }

  /**
   * Extract all schemas for a brand
   */
  async extractForBrand(brand) {
    const urls = this.discoverUrls(brand);
    const results = await this.extractFromUrls(urls);

    // Flatten and deduplicate
    const allSchemas = results
      .filter((r) => r.found)
      .flatMap((r) =>
        r.schemas.map((s) => ({
          ...s,
          sourceUrl: r.url,
        }))
      );

    return {
      brandId: brand.id,
      urlsScanned: urls.length,
      schemasFound: allSchemas.length,
      schemas: allSchemas,
      byType: this.countByType(allSchemas),
    };
  }

  countByType(schemas) {
    return schemas.reduce((acc, schema) => {
      acc[schema.type] = (acc[schema.type] || 0) + 1;
      return acc;
    }, {});
  }
}

module.exports = SchemaExtractorService;
```

### Schema Parser Service

File: `backend/services/schema/parser.service.js`

```javascript
class SchemaParserService {
  /**
   * Parse and normalize a schema
   */
  parse(rawSchema) {
    const type = this.getSchemaType(rawSchema);
    const normalized = this.normalize(rawSchema);
    const metadata = this.extractMetadata(normalized);
    const validation = this.validate(normalized);

    return {
      type: type,
      content: normalized,
      metadata: metadata,
      validation: validation,
    };
  }

  /**
   * Get schema type
   */
  getSchemaType(schema) {
    const type = schema["@type"];
    return Array.isArray(type) ? type[0] : type;
  }

  /**
   * Normalize schema structure
   */
  normalize(schema) {
    // Ensure @context exists
    if (!schema["@context"]) {
      schema["@context"] = "https://schema.org";
    }

    // Handle nested schemas
    if (schema["@graph"]) {
      // Multiple schemas in one - take the first
      return this.normalize(schema["@graph"][0]);
    }

    return schema;
  }

  /**
   * Extract key metadata for quick reference
   */
  extractMetadata(schema) {
    const metadata = {
      name: schema.name,
      description: schema.description,
      url: schema.url,
    };

    // Type-specific metadata
    switch (this.getSchemaType(schema)) {
      case "Organization":
        metadata.logo = schema.logo;
        metadata.foundingDate = schema.foundingDate;
        break;

      case "Product":
      case "SoftwareApplication":
        metadata.price = schema.offers?.price;
        metadata.currency = schema.offers?.priceCurrency;
        metadata.rating = schema.aggregateRating?.ratingValue;
        break;

      case "FAQPage":
        metadata.questionCount = schema.mainEntity?.length || 0;
        break;
    }

    return metadata;
  }

  /**
   * Basic validation
   */
  validate(schema) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!schema["@context"]) {
      errors.push("Missing @context");
    }
    if (!schema["@type"]) {
      errors.push("Missing @type");
    }

    // Type-specific validation
    const type = this.getSchemaType(schema);

    switch (type) {
      case "Organization":
        if (!schema.name) errors.push("Organization missing name");
        if (!schema.url) warnings.push("Organization missing url");
        if (!schema.logo) warnings.push("Organization missing logo");
        break;

      case "Product":
      case "SoftwareApplication":
        if (!schema.name) errors.push("Product missing name");
        if (!schema.description) warnings.push("Product missing description");
        if (!schema.offers) warnings.push("Product missing offers");
        break;
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
    };
  }

  /**
   * Compare two schemas and generate diff
   */
  diff(schema1, schema2) {
    const added = this.getAddedFields(schema1, schema2);
    const removed = this.getRemovedFields(schema1, schema2);
    const modified = this.getModifiedFields(schema1, schema2);

    return { added, removed, modified };
  }

  getAddedFields(old, new_) {
    const added = {};
    for (const key in new_) {
      if (!(key in old)) {
        added[key] = new_[key];
      }
    }
    return added;
  }

  getRemovedFields(old, new_) {
    const removed = {};
    for (const key in old) {
      if (!(key in new_)) {
        removed[key] = old[key];
      }
    }
    return removed;
  }

  getModifiedFields(old, new_) {
    const modified = {};
    for (const key in new_) {
      if (
        key in old &&
        JSON.stringify(old[key]) !== JSON.stringify(new_[key])
      ) {
        modified[key] = {
          old: old[key],
          new: new_[key],
        };
      }
    }
    return modified;
  }
}

module.exports = SchemaParserService;
```

### Schema Optimizer Service (AI-Powered)

File: `backend/services/schema/optimizer.service.js`

```javascript
const claudeClient = require("../../utils/claude.client");

class SchemaOptimizerService {
  /**
   * Generate AI-powered suggestions for schema improvement
   */
  async generateSuggestions(schema, intelligence = {}) {
    const prompt = this.buildOptimizationPrompt(schema, intelligence);

    try {
      const response = await claudeClient.complete({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const suggestions = JSON.parse(response.content[0].text);

      return suggestions.map((s) => ({
        ...s,
        schemaId: schema.id,
        status: "pending",
        confidence: s.confidence || 0.8,
      }));
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      return [];
    }
  }

  buildOptimizationPrompt(schema, intelligence) {
    return `You are a GEO (Generative Experience Optimization) expert optimizing JSON-LD schemas for maximum AI visibility.

CURRENT SCHEMA:
${JSON.stringify(schema.content, null, 2)}

COMPETITIVE INTELLIGENCE:
${
  intelligence.competitors
    ? JSON.stringify(intelligence.competitors, null, 2)
    : "No competitor data available"
}

CURRENT AI RANKINGS:
${
  intelligence.rankings
    ? JSON.stringify(intelligence.rankings, null, 2)
    : "No ranking data available"
}

COMMON QUERIES IN CATEGORY:
${
  intelligence.commonQueries
    ? intelligence.commonQueries.join(", ")
    : "No query data available"
}

TASK: Provide 3-5 specific, actionable suggestions to improve this schema for better AI visibility.

For each suggestion, provide a JSON object with:
- field: The field path to change (e.g., "description" or "offers.price")
- currentValue: The current value (if exists)
- suggestedValue: Your recommended value
- reason: Detailed explanation of how this improves AI visibility
- priority: "high", "medium", or "low"
- confidence: A number between 0 and 1 indicating your confidence

Rules:
1. Focus on changes that will help AI agents cite and recommend this brand
2. Emphasize competitive differentiation based on competitor data
3. Use clear, factual language (AI agents prefer specificity over marketing fluff)
4. Include concrete numbers and data points where possible
5. Make descriptions comprehensive but scannable

Return ONLY a JSON array of suggestion objects, no other text.`;
  }

  /**
   * Apply a suggestion to a schema
   */
  async applySuggestion(schema, suggestion) {
    const updated = JSON.parse(JSON.stringify(schema.content));

    // Apply the suggested change using field path
    this.setNestedValue(updated, suggestion.field, suggestion.suggestedValue);

    return {
      ...schema,
      content: updated,
      version: schema.version + 1,
      parentSchemaId: schema.id,
    };
  }

  /**
   * Set a nested value in an object using dot notation
   */
  setNestedValue(obj, path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    const target = keys.reduce((o, k) => (o[k] = o[k] || {}), obj);
    target[lastKey] = value;
  }

  /**
   * Generate optimized description using Claude
   */
  async generateDescription(brand, competitors = []) {
    const prompt = `Generate a compelling, AI-optimized description for this brand.

BRAND: ${brand.name}
WEBSITE: ${brand.website}
CURRENT DESCRIPTION: ${brand.description || "None"}

COMPETITORS:
${competitors.map((c) => `- ${c.name}: ${c.description}`).join("\n")}

Requirements:
1. 150-200 characters
2. Include key differentiators vs competitors
3. Use specific, factual language
4. Avoid marketing fluff
5. Include what the company does and who it's for
6. Make it compelling for AI agents to cite

Return ONLY the description text, no other commentary.`;

    const response = await claudeClient.complete({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    return response.content[0].text.trim();
  }

  /**
   * Generate FAQ schema based on common queries
   */
  async generateFAQSchema(brand, commonQueries = []) {
    const prompt = `Generate a FAQ schema for this brand based on common queries.

BRAND: ${brand.name}
DESCRIPTION: ${brand.description}

COMMON QUERIES:
${commonQueries.join("\n")}

Generate 5-7 question-answer pairs that:
1. Address common queries about this product/service
2. Include competitive differentiation
3. Use specific, factual answers
4. Are optimized for AI comprehension

Return a JSON object with this structure:
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Question text",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Answer text"
      }
    }
  ]
}`;

    const response = await claudeClient.complete({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    return JSON.parse(response.content[0].text);
  }
}

module.exports = SchemaOptimizerService;
```

### Schema Repository Service

File: `backend/services/schema/repository.service.js`

```javascript
const db = require("../../db");

class SchemaRepositoryService {
  /**
   * Save a schema
   */
  async save(brandId, schemaData) {
    // Check if schema already exists
    const existing = await this.findBySourceUrl(
      brandId,
      schemaData.sourceUrl,
      schemaData.type
    );

    if (existing) {
      // Check if content changed
      const hasChanged =
        JSON.stringify(existing.content) !== JSON.stringify(schemaData.content);

      if (hasChanged) {
        return await this.createVersion(existing, schemaData);
      }

      return existing;
    }

    // Create new schema
    return await db.schemas.create({
      brandId: brandId,
      schemaType: schemaData.type,
      sourceUrl: schemaData.sourceUrl,
      content: schemaData.content,
      metadata: schemaData.metadata,
      validationStatus: schemaData.validation.valid ? "valid" : "invalid",
      validationErrors: schemaData.validation.errors,
      validationWarnings: schemaData.validation.warnings,
      version: 1,
      deploymentStatus: "draft",
    });
  }

  /**
   * Create new version of schema
   */
  async createVersion(parentSchema, updates) {
    const newSchema = await db.schemas.create({
      brandId: parentSchema.brandId,
      schemaType: parentSchema.schemaType,
      sourceUrl: parentSchema.sourceUrl,
      content: updates.content,
      metadata: updates.metadata,
      validationStatus: updates.validation?.valid ? "valid" : "invalid",
      validationErrors: updates.validation?.errors || [],
      validationWarnings: updates.validation?.warnings || [],
      version: parentSchema.version + 1,
      parentSchemaId: parentSchema.id,
      deploymentStatus: "draft",
    });

    // Record the change
    await this.recordChange(newSchema.id, {
      changeType: "updated",
      changes: this.diff(parentSchema.content, updates.content),
      reason: updates.reason || "Manual update",
      triggeredBy: updates.triggeredBy || "manual",
      triggerData: updates.triggerData,
    });

    return newSchema;
  }

  /**
   * Find schema by source URL
   */
  async findBySourceUrl(brandId, sourceUrl, schemaType) {
    return await db.schemas.findOne({
      where: {
        brandId: brandId,
        sourceUrl: sourceUrl,
        schemaType: schemaType,
        deploymentStatus: { $ne: "archived" },
      },
      orderBy: { version: "desc" },
    });
  }

  /**
   * Get all schemas for a brand
   */
  async getByBrand(brandId, options = {}) {
    const where = { brandId: brandId };

    if (options.type) {
      where.schemaType = options.type;
    }

    if (options.deploymentStatus) {
      where.deploymentStatus = options.deploymentStatus;
    }

    if (options.platformSpecific !== undefined) {
      where.platformSpecific = options.platformSpecific;
    }

    return await db.schemas.findMany({
      where: where,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get version history
   */
  async getVersionHistory(schemaId) {
    const versions = [];
    let current = await db.schemas.findById(schemaId);

    while (current) {
      versions.push(current);
      current = current.parentSchemaId
        ? await db.schemas.findById(current.parentSchemaId)
        : null;
    }

    return versions.reverse(); // oldest first
  }

  /**
   * Record a change
   */
  async recordChange(schemaId, changeData) {
    return await db.schemaChanges.create({
      schemaId: schemaId,
      changeType: changeData.changeType,
      changes: changeData.changes,
      reason: changeData.reason,
      triggeredBy: changeData.triggeredBy,
      triggerData: changeData.triggerData,
      userId: changeData.userId,
    });
  }

  /**
   * Generate diff between two schemas
   */
  diff(schema1, schema2) {
    const added = {};
    const removed = {};
    const modified = {};

    // Find added fields
    for (const key in schema2) {
      if (!(key in schema1)) {
        added[key] = schema2[key];
      }
    }

    // Find removed fields
    for (const key in schema1) {
      if (!(key in schema2)) {
        removed[key] = schema1[key];
      }
    }

    // Find modified fields
    for (const key in schema2) {
      if (
        key in schema1 &&
        JSON.stringify(schema1[key]) !== JSON.stringify(schema2[key])
      ) {
        modified[key] = {
          old: schema1[key],
          new: schema2[key],
        };
      }
    }

    return { added, removed, modified };
  }

  /**
   * Save suggestions
   */
  async saveSuggestions(suggestions) {
    return await db.schemaSuggestions.createMany(suggestions);
  }

  /**
   * Get suggestions for schema
   */
  async getSuggestions(schemaId, status = "pending") {
    return await db.schemaSuggestions.findMany({
      where: {
        schemaId: schemaId,
        status: status,
      },
      orderBy: { priority: "asc" },
    });
  }

  /**
   * Mark suggestion as applied
   */
  async markSuggestionApplied(suggestionId) {
    return await db.schemaSuggestions.update(suggestionId, {
      status: "applied",
      appliedAt: new Date(),
    });
  }
}

module.exports = SchemaRepositoryService;
```

### API Routes

File: `backend/routes/schema.routes.js`

```javascript
const express = require("express");
const router = express.Router();
const SchemaExtractorService = require("../services/schema/extractor.service");
const SchemaOptimizerService = require("../services/schema/optimizer.service");
const SchemaRepositoryService = require("../services/schema/repository.service");

const extractor = new SchemaExtractorService();
const optimizer = new SchemaOptimizerService();
const repository = new SchemaRepositoryService();

/**
 * POST /api/schemas/extract
 * Extract schemas from a URL
 */
router.post("/extract", async (req, res) => {
  try {
    const { url, brandId } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const result = await extractor.extractFromUrl(url);

    // If brandId provided, save to database
    if (brandId && result.found) {
      const saved = await Promise.all(
        result.schemas.map((schema) =>
          repository.save(brandId, { ...schema, sourceUrl: url })
        )
      );

      return res.json({
        ...result,
        saved: saved.length,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Extract error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/schemas/extract-brand
 * Extract all schemas for a brand
 */
router.post("/extract-brand", async (req, res) => {
  try {
    const { brandId } = req.body;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    const brand = await db.brands.findById(brandId);
    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    const result = await extractor.extractForBrand(brand);

    // Save all schemas
    const saved = await Promise.all(
      result.schemas.map((schema) => repository.save(brandId, schema))
    );

    res.json({
      ...result,
      saved: saved.length,
      schemas: saved,
    });
  } catch (error) {
    console.error("Extract brand error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/schemas/:brandId
 * Get all schemas for a brand
 */
router.get("/:brandId", async (req, res) => {
  try {
    const { brandId } = req.params;
    const { type, status, platformSpecific } = req.query;

    const schemas = await repository.getByBrand(brandId, {
      type,
      deploymentStatus: status,
      platformSpecific: platformSpecific === "true",
    });

    res.json(schemas);
  } catch (error) {
    console.error("Get schemas error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/schemas/:brandId/:schemaId
 * Get a specific schema
 */
router.get("/:brandId/:schemaId", async (req, res) => {
  try {
    const { schemaId } = req.params;

    const schema = await db.schemas.findById(schemaId);
    if (!schema) {
      return res.status(404).json({ error: "Schema not found" });
    }

    res.json(schema);
  } catch (error) {
    console.error("Get schema error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/schemas/:schemaId
 * Update a schema
 */
router.put("/:schemaId", async (req, res) => {
  try {
    const { schemaId } = req.params;
    const { content, reason, triggeredBy } = req.body;

    const schema = await db.schemas.findById(schemaId);
    if (!schema) {
      return res.status(404).json({ error: "Schema not found" });
    }

    const parser = new (require("../services/schema/parser.service"))();
    const validation = parser.validate(content);

    if (!validation.valid) {
      return res.status(400).json({
        error: "Invalid schema",
        errors: validation.errors,
      });
    }

    const updated = await repository.createVersion(schema, {
      content,
      validation,
      reason,
      triggeredBy: triggeredBy || "manual",
    });

    res.json(updated);
  } catch (error) {
    console.error("Update schema error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/schemas/:schemaId/suggestions
 * Generate AI suggestions for a schema
 */
router.post("/:schemaId/suggestions", async (req, res) => {
  try {
    const { schemaId } = req.params;
    const { intelligence } = req.body;

    const schema = await db.schemas.findById(schemaId);
    if (!schema) {
      return res.status(404).json({ error: "Schema not found" });
    }

    const suggestions = await optimizer.generateSuggestions(
      schema,
      intelligence
    );
    const saved = await repository.saveSuggestions(suggestions);

    res.json(saved);
  } catch (error) {
    console.error("Generate suggestions error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/schemas/:schemaId/suggestions
 * Get suggestions for a schema
 */
router.get("/:schemaId/suggestions", async (req, res) => {
  try {
    const { schemaId } = req.params;
    const { status } = req.query;

    const suggestions = await repository.getSuggestions(schemaId, status);

    res.json(suggestions);
  } catch (error) {
    console.error("Get suggestions error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/schemas/:schemaId/suggestions/:suggestionId/apply
 * Apply a suggestion
 */
router.post("/:schemaId/suggestions/:suggestionId/apply", async (req, res) => {
  try {
    const { schemaId, suggestionId } = req.params;

    const schema = await db.schemas.findById(schemaId);
    const suggestion = await db.schemaSuggestions.findById(suggestionId);

    if (!schema || !suggestion) {
      return res.status(404).json({ error: "Schema or suggestion not found" });
    }

    const updated = await optimizer.applySuggestion(schema, suggestion);
    const saved = await repository.createVersion(schema, {
      content: updated.content,
      reason: `Applied suggestion: ${suggestion.reason}`,
      triggeredBy: "ai_suggestion",
      triggerData: suggestion,
    });

    await repository.markSuggestionApplied(suggestionId);

    res.json(saved);
  } catch (error) {
    console.error("Apply suggestion error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/schemas/:schemaId/history
 * Get version history
 */
router.get("/:schemaId/history", async (req, res) => {
  try {
    const { schemaId } = req.params;

    const history = await repository.getVersionHistory(schemaId);

    res.json(history);
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## FRONTEND COMPONENTS

Create these React components:

```
frontend/
├── pages/
│   └── geo/
│       ├── SchemaList.jsx              # List all schemas
│       ├── SchemaEditor.jsx            # Edit a schema
│       └── SchemaExtractor.jsx         # Extract schemas from URL
│
├── components/
│   └── geo/
│       ├── SchemaCard.jsx              # Display schema summary
│       ├── SchemaViewer.jsx            # View schema JSON
│       ├── SchemaValidation.jsx        # Show validation results
│       ├── SuggestionCard.jsx          # Display a suggestion
│       ├── JSONEditor.jsx              # Edit JSON directly
│       └── editors/
│           ├── OrganizationEditor.jsx  # Visual editor for Organization
│           ├── ProductEditor.jsx       # Visual editor for Product
│           └── FAQEditor.jsx           # Visual editor for FAQ
```

### Schema List Component

File: `frontend/pages/geo/SchemaList.jsx`

```jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SchemaCard from "../../components/geo/SchemaCard";

const SchemaList = ({ brandId }) => {
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadSchemas();
  }, [brandId, filter]);

  const loadSchemas = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("status", filter);
      }

      const response = await fetch(`/api/schemas/${brandId}?${params}`);
      const data = await response.json();
      setSchemas(data);
    } catch (error) {
      console.error("Failed to load schemas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async () => {
    // Trigger extraction for this brand
    try {
      const response = await fetch("/api/schemas/extract-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId }),
      });

      const result = await response.json();
      alert(`Extracted ${result.schemasFound} schemas`);
      loadSchemas();
    } catch (error) {
      console.error("Extraction failed:", error);
    }
  };

  if (loading) {
    return <div>Loading schemas...</div>;
  }

  return (
    <div className="schema-list">
      <div className="header">
        <h2>Schemas</h2>
        <div className="controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Schemas</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          <button onClick={handleExtract}>Extract from Website</button>
        </div>
      </div>

      {schemas.length === 0 ? (
        <div className="empty-state">
          <p>No schemas found</p>
          <button onClick={handleExtract}>Extract Schemas</button>
        </div>
      ) : (
        <div className="schema-grid">
          {schemas.map((schema) => (
            <SchemaCard
              key={schema.id}
              schema={schema}
              onEdit={() => navigate(`/geo/schemas/${schema.id}`)}
              onRefresh={loadSchemas}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SchemaList;
```

### Schema Editor Component

File: `frontend/pages/geo/SchemaEditor.jsx`

```jsx
import React, { useState, useEffect } from "react";
import JSONEditor from "../../components/geo/JSONEditor";
import SchemaValidation from "../../components/geo/SchemaValidation";
import SuggestionCard from "../../components/geo/SuggestionCard";

const SchemaEditor = ({ schemaId }) => {
  const [schema, setSchema] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [editMode, setEditMode] = useState("json");
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchema();
    loadSuggestions();
  }, [schemaId]);

  const loadSchema = async () => {
    try {
      const response = await fetch(`/api/schemas/${schemaId}`);
      const data = await response.json();
      setSchema(data);
    } catch (error) {
      console.error("Failed to load schema:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await fetch(`/api/schemas/${schemaId}/suggestions`);
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Failed to load suggestions:", error);
    }
  };

  const handleChange = (newContent) => {
    setSchema({ ...schema, content: newContent });
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/schemas/${schemaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: schema.content,
          reason: "Manual edit",
          triggeredBy: "manual",
        }),
      });

      const updated = await response.json();
      setSchema(updated);
      setIsDirty(false);
      alert("Schema saved successfully");
    } catch (error) {
      console.error("Failed to save schema:", error);
      alert("Failed to save schema");
    }
  };

  const handleGenerateSuggestions = async () => {
    try {
      const response = await fetch(`/api/schemas/${schemaId}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intelligence: {} }),
      });

      const newSuggestions = await response.json();
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
    }
  };

  const handleApplySuggestion = async (suggestion) => {
    try {
      const response = await fetch(
        `/api/schemas/${schemaId}/suggestions/${suggestion.id}/apply`,
        { method: "POST" }
      );

      const updated = await response.json();
      setSchema(updated);
      loadSuggestions(); // Refresh suggestions
      alert("Suggestion applied successfully");
    } catch (error) {
      console.error("Failed to apply suggestion:", error);
      alert("Failed to apply suggestion");
    }
  };

  if (loading) {
    return <div>Loading schema...</div>;
  }

  return (
    <div className="schema-editor">
      <div className="editor-header">
        <h2>{schema.schemaType} Schema</h2>
        <div className="controls">
          <button onClick={() => setEditMode("json")}>JSON</button>
          <button onClick={handleSave} disabled={!isDirty}>
            Save
          </button>
        </div>
      </div>

      <div className="editor-layout">
        <div className="editor-main">
          <JSONEditor value={schema.content} onChange={handleChange} />

          <SchemaValidation
            errors={schema.validationErrors}
            warnings={schema.validationWarnings}
          />
        </div>

        <div className="editor-sidebar">
          <div className="suggestions-panel">
            <div className="suggestions-header">
              <h3>AI Suggestions</h3>
              <button onClick={handleGenerateSuggestions}>✨ Generate</button>
            </div>

            {suggestions.length === 0 ? (
              <p>No suggestions yet</p>
            ) : (
              suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={() => handleApplySuggestion(suggestion)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchemaEditor;
```

---

## PHASE 2: AI PLATFORM MONITORING

Will be provided in follow-up implementation package once Phase 1 is complete.

---

## ENVIRONMENT VARIABLES NEEDED

Add these to your `.env` file:

```bash
# Firecrawl
FIRECRAWL_API_KEY=your_firecrawl_api_key

# Claude
ANTHROPIC_API_KEY=your_anthropic_api_key

# AI Platforms (for Phase 2)
OPENAI_API_KEY=your_openai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Database (should already exist)
DATABASE_URL=your_postgresql_connection_string
```

---

## IMPLEMENTATION CHECKLIST

### Week 1: Database & Backend Core

- [ ] Create database tables (schemas, schema_changes, schema_performance, etc.)
- [ ] Implement SchemaExtractorService using Firecrawl
- [ ] Implement SchemaParserService
- [ ] Implement SchemaRepositoryService
- [ ] Create API routes for schema CRUD operations
- [ ] Test extraction from sample websites

### Week 2: AI Optimization & Frontend

- [ ] Implement SchemaOptimizerService using Claude
- [ ] Add suggestion generation and application
- [ ] Create SchemaList component
- [ ] Create SchemaEditor component
- [ ] Create JSONEditor component
- [ ] Test end-to-end workflow: extract → edit → save

### Testing Requirements

- [ ] Extract schemas from at least 5 different websites
- [ ] Verify all schema types are parsed correctly (Organization, Product, FAQ, etc.)
- [ ] Test AI suggestion generation
- [ ] Test applying suggestions and creating new versions
- [ ] Verify version history tracking works
- [ ] Test validation errors and warnings

### Success Criteria

- [ ] Can extract schemas from any URL using Firecrawl
- [ ] Schemas are stored with full version control
- [ ] UI allows viewing and editing schemas
- [ ] Claude generates relevant optimization suggestions
- [ ] Can apply suggestions and see improvements
- [ ] All changes are tracked in schema_changes table

---

## IMPORTANT NOTES FOR CLAUDE CODE

1. **Use Existing SignalDesk Patterns**: Look at how the existing codebase structures services, routes, and database models. Follow the same patterns.

2. **Firecrawl Integration**: SignalDesk already uses Firecrawl extensively. Check existing Firecrawl implementations for authentication and usage patterns.

3. **Database**: SignalDesk uses PostgreSQL. Use the existing database connection and ORM patterns.

4. **Error Handling**: Follow existing error handling patterns in the codebase.

5. **Authentication**: Routes should use existing authentication middleware.

6. **Testing**: Write tests following the existing test structure.

7. **API Keys**: Never hardcode API keys. Always use environment variables.

8. **Start Simple**: Get basic extraction and storage working first, then add optimization features.

---

## QUESTIONS TO ASK IF UNCLEAR

1. What ORM/database library does SignalDesk currently use?
2. What is the existing authentication middleware structure?
3. Are there existing patterns for API route organization?
4. What testing framework is used?
5. How are environment variables currently loaded?

---

## NEXT STEPS AFTER PHASE 1

Once Phase 1 (Schema Management) is complete and tested:

1. Implement AI Platform Monitoring (query ChatGPT, Claude, etc.)
2. Add competitive analysis features
3. Build intelligence-driven automation
4. Integrate with existing VECTOR campaigns
5. Add A/B testing for schemas

This package contains everything needed to implement Phase 1 of the GEO/AI advertising system. Start with database setup, then backend services, then frontend components. Test thoroughly at each step.
