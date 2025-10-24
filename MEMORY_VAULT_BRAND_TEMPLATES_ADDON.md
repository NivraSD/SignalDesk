# Memory Vault V2: Brand Templates & Smart Export Extension

**Date:** 2025-01-24
**Extension to:** MEMORY_VAULT_V2_MASTER_PLAN.md
**Critical Feature:** File uploads, template intelligence, and smart export

---

## ⚡ CRITICAL DESIGN PRINCIPLE ⚡

**Brand guidelines are an ENHANCEMENT, not a REQUIREMENT.**

Most companies do NOT have brand guidelines uploaded. The system must:

1. **Work perfectly without guidelines** - This is the default case
2. **Never slow down content generation** - < 10ms check, cached, fail-safe
3. **Never nag users** - No warnings/badges about "missing" guidelines
4. **Silently enhance when available** - If guidelines exist, quietly apply them
5. **Fail gracefully** - If lookup times out or fails, continue without guidelines

**Golden Rule:** Content generation should feel FASTER for users without guidelines than with them (because cache hits are instant).

---

## Problem Statement

Users need to:
1. **Upload brand assets**: PowerPoint templates, Word templates, style guides, brand guidelines, logos
2. **Have them automatically applied**: When generating content, use their brand voice/style
3. **Export with templates**: Merge generated content into their branded templates (not plain text)

**Example Flow:**
```
User uploads: "Acme_Corp_Press_Release_Template.docx"
NIV generates: Press release about product launch
User clicks: "Export"
System produces: Press release IN their branded Word template ✨
```

---

## Architecture Addition: Brand Assets Layer

```
┌─────────────────────────────────────────────────────────────┐
│                   BRAND ASSETS LAYER                         │
│  (Templates, Guidelines, Style Guides, Brand Voice)         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              LAYER 1: CONTENT INGESTION                      │
│        (Now checks brand guidelines during creation)         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              LAYER 2: INTELLIGENT STORAGE                    │
│    (Content + Brand Assets stored with relationships)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              LAYER 3: DISCOVERY & EXPORT                     │
│         (Claude helps find templates + smart export)         │
└─────────────────────────────────────────────────────────────┘
```

---

## Component 1: File Upload System

### 1.1: Upload UI

```typescript
// src/components/modules/BrandAssetUploader.tsx

interface BrandAssetUploaderProps {
  organizationId: string
  onUploadComplete: (asset: BrandAsset) => void
}

export function BrandAssetUploader() {
  return (
    <div className="brand-asset-uploader">
      <DropZone
        accept={{
          'application/pdf': ['.pdf'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
          'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
          'image/*': ['.png', '.jpg', '.svg'],
          'text/*': ['.txt', '.md']
        }}
        onDrop={handleFileUpload}
      />

      <AssetTypeSelector>
        <Option value="template-press-release">Press Release Template</Option>
        <Option value="template-social">Social Media Template</Option>
        <Option value="template-presentation">Presentation Template</Option>
        <Option value="guidelines-brand">Brand Guidelines</Option>
        <Option value="guidelines-style">Style Guide</Option>
        <Option value="guidelines-voice">Voice & Tone Guide</Option>
        <Option value="logo">Logo/Visual Asset</Option>
        <Option value="other">Other</Option>
      </AssetTypeSelector>

      <MetadataForm>
        <Input name="name" placeholder="Asset name" />
        <Input name="description" placeholder="How should this be used?" />
        <TagInput name="tags" placeholder="Add tags..." />
      </MetadataForm>
    </div>
  )
}
```

### 1.2: Upload API

```typescript
// src/app/api/brand-assets/upload/route.ts

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const assetType = formData.get('assetType') as string
  const metadata = JSON.parse(formData.get('metadata') as string)

  // 1. Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('brand-assets')
    .upload(`${organizationId}/${file.name}`, file)

  if (uploadError) throw uploadError

  // 2. Analyze the file using Claude
  const analysis = await analyzeBrandAsset({
    file,
    assetType,
    organizationId
  })

  // 3. Save to database with intelligence
  const { data: asset } = await supabase
    .from('brand_assets')
    .insert({
      organization_id: organizationId,
      asset_type: assetType,
      file_name: file.name,
      file_path: uploadData.path,
      file_size: file.size,
      mime_type: file.type,

      // Intelligence extracted from file
      extracted_guidelines: analysis.guidelines,
      brand_voice_profile: analysis.voiceProfile,
      template_structure: analysis.structure,
      usage_instructions: analysis.instructions,

      // User-provided metadata
      name: metadata.name,
      description: metadata.description,
      tags: metadata.tags,

      created_at: new Date().toISOString()
    })
    .select()
    .single()

  return NextResponse.json({ asset })
}
```

### 1.3: Brand Asset Intelligence

```typescript
// New Edge Function: supabase/functions/analyze-brand-asset/index.ts

serve(async (req) => {
  const { fileUrl, assetType, fileName } = await req.json()

  // Download file from storage
  const fileContent = await fetchFileContent(fileUrl)

  // Extract text/structure based on file type
  let extractedContent = ''

  if (fileName.endsWith('.pdf')) {
    extractedContent = await extractPDFText(fileContent)
  } else if (fileName.endsWith('.docx')) {
    extractedContent = await extractDocxText(fileContent)
  } else if (fileName.endsWith('.pptx')) {
    extractedContent = await extractPptxStructure(fileContent)
  }

  // Use Claude to analyze
  const analysis = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    messages: [{
      role: 'user',
      content: `Analyze this brand asset:

Asset Type: ${assetType}
File Name: ${fileName}
Content/Structure: ${extractedContent.substring(0, 5000)}

Extract:
1. **Brand Guidelines** (if applicable):
   - Tone/voice rules
   - Writing style requirements
   - Brand personality traits
   - Do's and don'ts

2. **Template Structure** (if applicable):
   - Sections/placeholders
   - Required fields
   - Format requirements
   - Style specifications

3. **Usage Instructions**:
   - When to use this asset
   - What content types it applies to
   - Any specific rules

4. **Brand Voice Profile**:
   - Adjectives describing brand voice
   - Example phrases
   - Language patterns

Return as structured JSON.`
    }]
  })

  const result = parseAnalysis(analysis.content[0].text)

  return new Response(JSON.stringify({
    guidelines: result.guidelines,
    voiceProfile: result.voiceProfile,
    structure: result.templateStructure,
    instructions: result.usageInstructions
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## Component 2: Template-Aware Content Generation

### 2.1: Integration with Content Generators (CRITICAL: Must be fast & optional)

```typescript
// Modify existing content generation to check for brand assets
// REQUIREMENT: Must complete in < 50ms if no guidelines exist
// REQUIREMENT: Must not block or slow down content generation

// Example: In NIV Content Assistant or Campaign Builder

async function generatePressRelease(params: GenerateParams) {
  // FAST CHECK: Single indexed query with timeout
  // This should return in < 10ms for "no guidelines" case
  const brandContext = await getBrandContextFast({
    organizationId: params.organizationId,
    contentType: 'press-release',
    timeout: 50 // ms - fail fast if slow
  }).catch(() => null) // If it fails, just continue without guidelines

  // Generate content IMMEDIATELY - don't wait for guidelines
  const pressRelease = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    messages: [{
      role: 'user',
      content: `Generate a press release${brandContext ? ' following these brand guidelines' : ''}:

${brandContext?.guidelines ? `
BRAND VOICE: ${brandContext.guidelines.brand_voice_profile}
WRITING RULES: ${brandContext.guidelines.extracted_guidelines}
` : ''}

${brandContext?.template ? `
TEMPLATE STRUCTURE: ${brandContext.template.template_structure}
Follow this structure.
` : ''}

Content requirements:
${params.requirements}

Generate a professional press release.`
    }]
  })

  return {
    content: pressRelease.content[0].text,
    brandGuidelineApplied: brandContext?.guidelines?.id || null,
    templateUsed: brandContext?.template?.id || null
  }
}

// FAST LOOKUP with caching
const brandContextCache = new Map<string, BrandContext | null>()

async function getBrandContextFast({ organizationId, contentType, timeout = 50 }) {
  const cacheKey = `${organizationId}:${contentType}`

  // Check cache first (instant)
  if (brandContextCache.has(cacheKey)) {
    return brandContextCache.get(cacheKey)
  }

  try {
    // Single fast query with index
    const result = await Promise.race([
      supabase
        .from('brand_assets')
        .select('id, asset_type, brand_voice_profile, extracted_guidelines, template_structure')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .or(`asset_type.eq.guidelines-brand,asset_type.eq.template-${contentType}`)
        .limit(2) // Max 1 guideline + 1 template
        .single(),

      // Timeout promise
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeout)
      )
    ])

    // Cache result (even if null)
    brandContextCache.set(cacheKey, result.data || null)

    // Auto-expire cache after 5 minutes
    setTimeout(() => brandContextCache.delete(cacheKey), 5 * 60 * 1000)

    return result.data || null
  } catch (error) {
    // On timeout or error, cache null and move on
    brandContextCache.set(cacheKey, null)
    return null
  }
}
```

### 2.2: Brand Guidelines API

```typescript
// src/app/api/brand-assets/guidelines/route.ts

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organizationId')
  const contentType = searchParams.get('contentType') // 'press-release', 'social-post', etc.

  // Get all applicable brand guidelines
  const { data: guidelines } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('organization_id', organizationId)
    .or(`asset_type.eq.guidelines-brand,asset_type.eq.guidelines-style,asset_type.eq.guidelines-voice`)
    .order('created_at', { ascending: false })

  // Get template for specific content type
  const { data: templates } = await supabase
    .from('brand_assets')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('asset_type', `template-${contentType}`)
    .order('created_at', { ascending: false })
    .limit(1)

  return NextResponse.json({
    guidelines: guidelines || [],
    template: templates?.[0] || null
  })
}
```

---

## Component 3: Smart Export with Template Merging

### 3.1: Export API

```typescript
// src/app/api/content-library/export/route.ts

export async function POST(request: Request) {
  const { contentId, format, templateId } = await request.json()

  // 1. Get the content
  const { data: content } = await supabase
    .from('content_library')
    .select('*')
    .eq('id', contentId)
    .single()

  // 2. If templateId provided, get template
  let template = null
  if (templateId) {
    const { data: templateData } = await supabase
      .from('brand_assets')
      .select('*')
      .eq('id', templateId)
      .single()

    template = templateData
  } else {
    // Auto-detect best template for this content type
    const { data: autoTemplate } = await supabase
      .from('brand_assets')
      .select('*')
      .eq('organization_id', content.organization_id)
      .eq('asset_type', `template-${content.content_type}`)
      .order('usage_count', { ascending: false })
      .limit(1)
      .single()

    template = autoTemplate
  }

  // 3. Merge content with template
  if (template) {
    const mergedFile = await mergeContentWithTemplate({
      content,
      template,
      format
    })

    // Track template usage
    await supabase
      .from('brand_assets')
      .update({
        usage_count: template.usage_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', template.id)

    return new Response(mergedFile, {
      headers: {
        'Content-Type': getMimeType(format),
        'Content-Disposition': `attachment; filename="${content.title}.${format}"`
      }
    })
  }

  // 4. If no template, export as plain format
  return exportPlainFormat(content, format)
}
```

### 3.2: Template Merging Logic

```typescript
// New Edge Function: supabase/functions/merge-template/index.ts

import { Document, Packer, Paragraph, TextRun } from 'docx'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

async function mergeContentWithTemplate({ content, template, format }) {

  if (format === 'docx' || template.mime_type.includes('wordprocessingml')) {
    return await mergeWordTemplate(content, template)
  }

  if (format === 'pptx' || template.mime_type.includes('presentationml')) {
    return await mergePowerPointTemplate(content, template)
  }

  if (format === 'pdf') {
    // First merge with template, then convert to PDF
    const docx = await mergeWordTemplate(content, template)
    return await convertToPDF(docx)
  }

  // Fallback
  return content.content
}

async function mergeWordTemplate(content, template) {
  // Download template file
  const templateFile = await downloadFromStorage(template.file_path)

  // Use Claude to intelligently map content to template placeholders
  const mapping = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    messages: [{
      role: 'user',
      content: `Map this content to template placeholders:

TEMPLATE STRUCTURE:
${template.template_structure}

CONTENT TO INSERT:
Title: ${content.title}
Type: ${content.content_type}
Content: ${typeof content.content === 'string' ? content.content : JSON.stringify(content.content)}

Return a JSON mapping of template placeholders to content values.
Example: {"{{headline}}": "Actual headline", "{{body}}": "Actual body text", ...}`
    }]
  })

  const placeholderMapping = JSON.parse(mapping.content[0].text)

  // Use docxtemplater to merge
  const zip = new PizZip(templateFile)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true
  })

  doc.render(placeholderMapping)

  const buffer = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  })

  return buffer
}

async function mergePowerPointTemplate(content, template) {
  // Similar logic for PowerPoint
  // Use pptxtemplater or similar library
  // Claude maps content to slide placeholders

  const templateFile = await downloadFromStorage(template.file_path)

  const mapping = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    messages: [{
      role: 'user',
      content: `Map this content to PowerPoint template:

TEMPLATE: ${template.template_structure}
CONTENT: ${JSON.stringify(content)}

Create slide-by-slide mapping with text for each placeholder.`
    }]
  })

  // Use library to inject content into PPTX
  // Return modified PPTX buffer
}
```

---

## Component 4: Database Schema

```sql
-- Brand assets table
CREATE TABLE brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- File metadata
  asset_type VARCHAR(50) NOT NULL, -- 'template-press-release', 'guidelines-brand', etc.
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

  -- Standard fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),

  -- Status
  status VARCHAR(50) DEFAULT 'active' -- 'active', 'archived', 'deprecated'
)

-- Indexes
CREATE INDEX idx_brand_assets_org ON brand_assets(organization_id);
CREATE INDEX idx_brand_assets_type ON brand_assets(asset_type);
CREATE INDEX idx_brand_assets_tags ON brand_assets USING GIN(tags);

-- Link content to templates used
ALTER TABLE content_library ADD COLUMN IF NOT EXISTS
  template_used_id UUID REFERENCES brand_assets(id),
  brand_guidelines_applied UUID[] DEFAULT '{}'; -- Array of guideline asset IDs

-- Track which templates work best for which content types
CREATE TABLE template_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES brand_assets(id) ON DELETE CASCADE,
  content_type VARCHAR(100),
  usage_count INT DEFAULT 0,
  success_rate NUMERIC(3,2), -- Based on user feedback
  avg_engagement NUMERIC(10,2), -- If content has metrics
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_template_perf_template ON template_performance(template_id);
CREATE INDEX idx_template_perf_type ON template_performance(content_type);
```

---

## Component 5: UI Integration

### 5.1: Brand Assets Manager in Memory Vault

```typescript
// Add to MemoryVaultV2 UI

<MemoryVaultV2>
  <Sidebar>
    <FolderNav />

    {/* NEW: Brand Assets Section */}
    <BrandAssetsNav>
      <Section title="Templates">
        <TemplateItem type="press-release" count={3} />
        <TemplateItem type="social" count={5} />
        <TemplateItem type="presentation" count={2} />
      </Section>

      <Section title="Guidelines">
        <GuidelineItem type="brand" name="Acme Brand Guidelines" />
        <GuidelineItem type="voice" name="Voice & Tone Guide" />
      </Section>

      <UploadButton onClick={openUploader}>
        + Upload Brand Asset
      </UploadButton>
    </BrandAssetsNav>
  </Sidebar>

  <Main>
    <ClaudeChat skill="memory-vault-navigator" />
  </Main>

  <Preview>
    {selectedContent && (
      <ContentPreview>
        {/* NEW: Show template used */}
        {selectedContent.template_used_id && (
          <TemplateInfo templateId={selectedContent.template_used_id} />
        )}

        {/* NEW: Export with template */}
        <ExportMenu>
          <ExportOption format="docx" useTemplate={true}>
            Export to Word (with template)
          </ExportOption>
          <ExportOption format="pptx" useTemplate={true}>
            Export to PowerPoint (with template)
          </ExportOption>
          <ExportOption format="pdf" useTemplate={true}>
            Export to PDF (with template)
          </ExportOption>
        </ExportMenu>
      </ContentPreview>
    )}
  </Preview>
</MemoryVaultV2>
```

### 5.2: Template Selector in Content Creation (CRITICAL: Don't nag users)

```typescript
// Add to NIV Content Assistant / Campaign Builder
// RULE: Only show if templates/guidelines exist. Don't show warnings/badges if none.

<ContentCreator>
  {/* Only render this section if they have templates/guidelines */}
  {(templates.length > 0 || guidelines.length > 0) && (
    <TemplateSelector>
      {templates.length > 0 && (
        <>
          <Label>Brand Template (Optional)</Label>
          <Select defaultValue={null}>
            <Option value={null}>Generate without template</Option>
            {templates.map(t => (
              <Option value={t.id} key={t.id}>
                {t.name} (used {t.usage_count}x)
              </Option>
            ))}
          </Select>
        </>
      )}

      {guidelines.length > 0 && (
        <Badge variant="success" className="subtle">
          ✓ Using your brand guidelines
        </Badge>
      )}
    </TemplateSelector>
  )}

  {/* Rest of content creation UI - works perfectly without templates */}
</ContentCreator>

// ANTI-PATTERN - DO NOT DO THIS:
// ❌ Don't show "No brand guidelines" warnings
// ❌ Don't show "Upload guidelines" CTAs during content creation
// ❌ Don't make users feel like they're missing something
// ❌ Don't slow down generation waiting for guidelines

// CORRECT PATTERN:
// ✅ If guidelines exist: quietly apply them
// ✅ If no guidelines: generate normally
// ✅ Make upload available in Memory Vault, not during creation
// ✅ Cache "no guidelines" result so subsequent checks are instant
```

---

## Component 6: Claude Skill Enhancement

Update Memory Vault Navigator Skill to understand templates:

```markdown
## Template & Brand Asset Queries

### Pattern: Find Template
User: "Do we have a press release template?"
You: [Searches brand_assets for asset_type='template-press-release']
     "Yes! Found 2 press release templates:

     **Acme Press Release Template v2** (Most recent)
     • Used 12 times (92% success rate)
     • Last used: Jan 2025
     • Includes: Logo, contact info, boilerplate
     • [Preview] [Use in new content]

     **Classic PR Template**
     • Used 8 times (85% success rate)
     • Good for product announcements
     • [Preview]

     Which would you like to use?"

### Pattern: Upload Guidance
User: "I need to upload our brand guidelines"
You: "I'll help you upload brand guidelines. You can upload:

     • **Brand Guidelines PDF** - Full brand book
     • **Style Guide** - Writing style rules
     • **Voice & Tone Guide** - How to write in your brand voice
     • **Templates** - Word/PowerPoint branded templates

     Once uploaded, I'll analyze them and automatically apply the guidelines
     when generating content. Ready to upload?"

     [Opens uploader]

### Pattern: Export with Template
User: "Export this press release"
You: "I found your Acme Press Release Template (used 12x). Would you like to:

     • **Export with template** - Merge into branded Word doc
     • **Export as plain text** - Just the content
     • **Choose different template** - Use a different template

     Recommended: Export with template for branded output."
```

---

## Implementation Timeline

### Phase 1 Addition: Brand Asset Upload (Week 1)
- File upload UI and API
- Supabase Storage setup
- `analyze-brand-asset` Edge Function
- `brand_assets` table creation
- **CRITICAL: Performance testing** - Ensure < 10ms lookup without guidelines

**Deliverable**: Users can upload templates/guidelines, system extracts intelligence
**Performance Target**: Zero impact on users without guidelines

### Phase 2 Addition: Template Intelligence (Week 2)
- Template categorization
- Brand voice extraction
- Usage instruction parsing
- Template performance tracking
- **Fast lookup implementation** - Single query, indexed, cached, timeout
- **Cache strategy** - In-memory cache for instant repeated lookups

**Deliverable**: System understands what each template is for
**Performance Target**: < 50ms first lookup, < 1ms cached

### Phase 3 Addition: Export Integration (Week 3)
- Export API with template merging
- `merge-template` Edge Function
- Word/PowerPoint template merging
- UI for template selection during export
- **Conditional UI** - Only show template options if templates exist

**Deliverable**: Users can export content merged with their templates
**UX Target**: Zero nagging about missing templates

### Phase 4 Addition: Automatic Template Application (Week 4)
- Content generators check for brand assets (with fast fail-safe)
- Auto-apply guidelines during generation (no slowdown)
- Recommend templates based on content type (only if they exist)
- Track template performance
- **Monitoring** - Track lookup times, cache hit rates, failures

**Deliverable**: Templates automatically suggested and applied when available
**Validation**: 95%+ of lookups complete in < 10ms

---

## Success Metrics

### Upload & Organization
- Templates uploaded per organization: > 5 average
- Time to analyze template: < 30 seconds
- Brand guideline extraction accuracy: > 80%

### Usage
- Content generated with brand guidelines: > 60%
- Export with template vs. plain text: > 75% use template
- Template reuse rate: 3x increase

### Quality
- Brand consistency score (if measurable): > 85%
- User satisfaction with branded exports: > 90%
- Template merge success rate: > 95%

---

## CRITICAL: Performance Requirements

**Golden Rule:** Brand guidelines are an enhancement, not a requirement. The system must be FASTER without guidelines than with them.

### Performance Targets

**Without Guidelines (majority of users):**
- First check: < 10ms (cached "no guidelines" result)
- Subsequent checks: < 1ms (in-memory cache hit)
- Content generation: ZERO delay added

**With Guidelines (power users):**
- First check: < 50ms (single indexed query)
- Subsequent checks: < 1ms (cached)
- Content generation: Same speed (guidelines in prompt, no extra API calls)

### Implementation Rules

```typescript
// ✅ CORRECT: Fast, cached, fail-safe
const brandContext = await getBrandContextFast(orgId, type).catch(() => null)
// If it fails or times out, content generation continues normally

// ❌ WRONG: Multiple queries, no timeout, blocks generation
const guidelines = await getGuidelines(orgId)
const template = await getTemplate(orgId, type)
const assets = await getAssets(orgId)
// This would be 3x slower and block content generation!

// ✅ CORRECT: Single query, indexed, limited
SELECT * FROM brand_assets
WHERE organization_id = $1
  AND status = 'active'
  AND asset_type IN ('guidelines-brand', 'template-press-release')
LIMIT 2

// ❌ WRONG: Full table scan, no limit
SELECT * FROM brand_assets WHERE organization_id = $1
```

### Caching Strategy

```typescript
// In-memory cache (per server instance)
const brandContextCache = new Map<string, BrandContext | null>()

// Cache key: orgId + contentType
const cacheKey = `${organizationId}:${contentType}`

// Cache "no guidelines" result for 5 minutes
// This means most users pay ZERO cost after first check

// Cache "has guidelines" result for 5 minutes
// This means power users also get instant lookups
```

### Database Indexes

```sql
-- CRITICAL: These indexes make the difference between 10ms and 500ms

-- Composite index for fast brand context lookup
CREATE INDEX idx_brand_assets_fast_lookup
ON brand_assets(organization_id, status, asset_type)
WHERE status = 'active';

-- This single index handles the most common query in < 5ms
```

### Monitoring

```typescript
// Track performance to ensure we meet targets
logger.info('brand_context_lookup', {
  organizationId,
  duration: endTime - startTime,
  cacheHit: fromCache,
  hasGuidelines: !!result
})

// Alert if lookups exceed 50ms
if (duration > 50) {
  logger.warn('slow_brand_lookup', { organizationId, duration })
}
```

---

## Technical Considerations

### File Size Limits
- Templates: Up to 50MB
- Guidelines PDFs: Up to 25MB
- Images/logos: Up to 10MB

### Supported Formats
**Templates:**
- `.docx` (Word)
- `.pptx` (PowerPoint)
- `.pdf` (read-only, for reference)

**Guidelines:**
- `.pdf`
- `.docx`
- `.txt` / `.md`

**Visual Assets:**
- `.png`, `.jpg`, `.svg`

### Security
- Files scoped to organization (RLS policies)
- Virus scanning on upload
- Size/type validation
- Signed URLs for downloads

### Performance
- Template file streaming (not full load into memory)
- Cached template analysis results
- Background processing for large files
- CDN for frequently used templates

---

## Integration Points

### With Existing Systems

**NIV Content Assistant:**
- Check for brand guidelines before generation
- Auto-apply voice/tone rules
- Suggest templates based on content type

**Campaign Builder:**
- Load templates for campaign frameworks
- Apply brand consistency across all content
- Export entire campaigns with templates

**Execute:**
- Edit content while maintaining template structure
- Preview with template applied
- Quick export to branded formats

**Command Center:**
- Show "Brand assets uploaded" status
- Alert if no brand guidelines exist
- Recommend uploading templates

---

## Example Workflows

### Workflow 1: First-Time Setup
```
1. User goes to Memory Vault
2. Sees banner: "Upload your brand templates for better content"
3. Clicks "Upload Template"
4. Drops in "Acme_Press_Release.docx"
5. System analyzes:
   - Detects it's a press release template
   - Extracts placeholder structure
   - Identifies sections (headline, body, boilerplate, contact)
6. User tags it: "primary", "press-releases"
7. Template saved and ready to use
```

### Workflow 2: Generate Content with Brand
```
1. User creates new press release in NIV Content Assistant
2. System shows: "✓ Acme Brand Guidelines will be applied"
3. Claude generates content following brand voice
4. User clicks "Save to Memory Vault"
5. Content saved with link to template used
6. User clicks "Export"
7. Options:
   - Export to Word (with Acme template) ← Recommended
   - Export to PDF (with Acme template)
   - Export plain text
8. User selects "Export to Word"
9. System merges content into Acme_Press_Release.docx
10. Downloads perfectly branded Word document
```

### Workflow 3: Discover Best Template
```
1. User asks Claude: "What's our best performing press release template?"
2. Claude searches template_performance
3. Returns: "Acme Press Release Template v2 has been used 12 times
            with 92% success rate. Last successful use: Jan 2025
            for product launch announcement."
4. User: "Use that for my new announcement"
5. Claude loads template, generates content following its structure
```

---

## Future Enhancements

### V2.1: AI Template Generation
- Generate templates from successful content
- "Save this as a template" option
- AI suggests template improvements

### V2.2: Multi-Language Templates
- Upload templates in multiple languages
- Auto-detect language and use appropriate template
- Maintain brand consistency across languages

### V2.3: Dynamic Brand Guidelines
- Learn from user edits (what they change in generated content)
- Update brand voice profile based on approved content
- Suggest guideline updates

### V2.4: Template Versioning
- Track template changes over time
- A/B test different template versions
- Roll back to previous template versions

---

## Critical Success Factors

✅ **Zero friction upload** - Drag & drop, instant analysis
✅ **Intelligent extraction** - Accurately understand template structure
✅ **Seamless export** - One click to branded document
✅ **Automatic application** - Guidelines applied without user action
✅ **Performance** - Fast merging, no delays

---

**The Goal:** Make brand consistency effortless. Users upload templates once, and every piece of content automatically follows their brand guidelines and exports in their branded formats.
