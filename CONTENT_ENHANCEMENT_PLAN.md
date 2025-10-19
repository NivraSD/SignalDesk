# Content Enhancement Plan for SignalDesk V3
## Unified Content Creation & Export Architecture

### Executive Summary
This plan outlines the implementation of comprehensive content creation capabilities using Google Vertex AI (Imagen 3 & Veo), Gamma API for presentations, and export-only distribution system. It addresses framework alignment, orchestration requirements, and media list generation.

---

## 1. Content Creation Capabilities

### A. Visual Content (Google Vertex AI) : API: AIzaSyBwiqy6i_fB_-u82B0tmJiBLGkg_Zu3lvc

#### Image Generation (Imagen 3)
```typescript
// supabase/functions/content-visual-generation/index.ts
import { ImageGenerationModel } from '@google-cloud/vertex-ai'

interface ImageGenerationRequest {
  prompt: string
  style?: 'photorealistic' | 'digital_art' | 'illustration'
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3'
  numberOfImages?: number
  negativePrompt?: string
}

async function generateWithImagen3(request: ImageGenerationRequest) {
  const model = new ImageGenerationModel('imagen-3')

  const result = await model.generateImages({
    prompt: request.prompt,
    numberOfImages: request.numberOfImages || 1,
    aspectRatio: request.aspectRatio || '16:9',
    negativePrompt: request.negativePrompt,
    safetySettings: {
      category: 'BLOCK_ONLY_HIGH'
    }
  })

  return {
    images: result.images.map(img => ({
      url: img.url,
      mimeType: img.mimeType,
      metadata: {
        prompt: request.prompt,
        model: 'imagen-3',
        timestamp: new Date().toISOString()
      }
    }))
  }
}
```

#### Video Generation (Veo)
```typescript
// supabase/functions/content-video-generation/index.ts
import { VideoGenerationModel } from '@google-cloud/vertex-ai'

interface VideoGenerationRequest {
  prompt: string
  duration?: number // seconds (up to 60)
  aspectRatio?: '16:9' | '9:16' | '1:1'
  style?: 'cinematic' | 'documentary' | 'animation'
  fps?: 24 | 30 | 60
}

async function generateWithVeo(request: VideoGenerationRequest) {
  const model = new VideoGenerationModel('veo')

  const result = await model.generateVideo({
    prompt: request.prompt,
    duration: request.duration || 10,
    aspectRatio: request.aspectRatio || '16:9',
    style: request.style || 'cinematic',
    fps: request.fps || 30
  })

  // Poll for completion (async process)
  return {
    jobId: result.jobId,
    status: 'processing',
    estimatedTime: result.estimatedCompletionTime,
    webhookUrl: `/api/webhooks/veo/${result.jobId}`
  }
}
```

### B. Presentation Content (Gamma API)
Already detailed in GAMMA_INTEGRATION_PLAN.md

### C. Text Content (Claude 3)
Existing implementation in ContentGenerationService.ts

---

## 2. Unified Content Service Architecture

```typescript
// src/services/UnifiedContentService.ts
export class UnifiedContentService {
  private static instance: UnifiedContentService

  // Content type to generator mapping
  private generators = {
    'text': this.generateTextContent,
    'image': this.generateImageContent,
    'video': this.generateVideoContent,
    'presentation': this.generatePresentationContent,
    'media-list': this.generateMediaList,
    'social-package': this.generateSocialPackage
  }

  async generateContent(request: ContentRequest): Promise<ContentResult> {
    // 1. Check capabilities
    const capability = this.checkCapability(request.type)

    if (!capability.available) {
      return this.handleUnavailableCapability(request, capability)
    }

    // 2. Generate content
    const result = await this.generators[request.type](request)

    // 3. Save to content library
    await this.saveToContentLibrary(result)

    // 4. Return with export options
    return {
      ...result,
      exportOptions: this.getExportOptions(request.type),
      capability: capability
    }
  }

  private checkCapability(type: ContentType): CapabilityStatus {
    const capabilities = {
      'text': { available: true, provider: 'Claude' },
      'image': { available: true, provider: 'Google Imagen 3' },
      'video': { available: true, provider: 'Google Veo' },
      'presentation': { available: true, provider: 'Gamma' },
      'media-list': { available: true, provider: 'Internal' },
      'social-package': { available: true, provider: 'Multi' }
    }

    return capabilities[type] || { available: false, fallback: 'manual' }
  }

  private async generateImageContent(request: ContentRequest) {
    // Transform framework/context into image prompt
    const imagePrompt = this.buildImagePrompt(request)

    // Call Google Imagen 3
    const response = await fetch('/api/supabase/functions/content-visual-generation', {
      method: 'POST',
      body: JSON.stringify({
        prompt: imagePrompt,
        style: request.style || 'professional',
        aspectRatio: this.getAspectRatio(request.usage)
      })
    })

    return response.json()
  }

  private async generateVideoContent(request: ContentRequest) {
    // Transform framework into video script
    const videoScript = this.buildVideoScript(request)

    // Call Google Veo
    const response = await fetch('/api/supabase/functions/content-video-generation', {
      method: 'POST',
      body: JSON.stringify({
        prompt: videoScript,
        duration: request.duration || 15,
        style: request.style || 'corporate'
      })
    })

    return response.json()
  }

  private buildImagePrompt(request: ContentRequest): string {
    const { framework, context, description } = request

    if (framework?.strategy?.visual_brief) {
      return framework.strategy.visual_brief
    }

    // Build intelligent prompt from framework
    return `
      Professional image for ${framework?.strategy?.objective || description}.
      Style: Corporate, modern, clean
      Elements: ${framework?.proof_points?.join(', ') || 'business concept'}
      Avoid: Stock photo clichés, people's faces
      Format: High resolution, suitable for ${request.usage || 'presentation'}
    `.trim()
  }
}
```

---

## 3. Media List Generation Component

```typescript
// src/components/execute/MediaListGenerator.tsx
export function MediaListGenerator({ framework, intelligence }) {
  const [mediaList, setMediaList] = useState<MediaTarget[]>([])
  const [generating, setGenerating] = useState(false)

  const generateMediaList = async () => {
    setGenerating(true)

    // Extract context from framework
    const context = {
      objective: framework?.strategy?.objective,
      narrative: framework?.strategy?.narrative,
      target_audience: framework?.distribution?.media_targets,
      beat_categories: framework?.strategy?.media_targets?.beat_categories,
      urgency: framework?.core?.urgency
    }

    // Call media list generation
    const response = await fetch('/api/supabase/functions/media-list-generation', {
      method: 'POST',
      body: JSON.stringify({
        context,
        intelligence,
        tier1Count: 10,
        tier2Count: 20
      })
    })

    const data = await response.json()
    setMediaList(data.mediaTargets)
    setGenerating(false)
  }

  return (
    <div className="media-list-generator">
      <div className="header">
        <h3>Media Target List</h3>
        <button onClick={generateMediaList} disabled={generating}>
          {generating ? 'Generating...' : 'Generate Media List'}
        </button>
      </div>

      {mediaList.length > 0 && (
        <div className="media-targets">
          <div className="tier-1">
            <h4>Tier 1 Targets (Priority)</h4>
            {mediaList.filter(m => m.tier === 1).map(target => (
              <MediaTargetCard key={target.id} target={target} />
            ))}
          </div>

          <div className="tier-2">
            <h4>Tier 2 Targets</h4>
            {mediaList.filter(m => m.tier === 2).map(target => (
              <MediaTargetCard key={target.id} target={target} />
            ))}
          </div>
        </div>
      )}

      <ExportOptions
        data={mediaList}
        formats={['csv', 'excel', 'pdf']}
        filename="media-targets"
      />
    </div>
  )
}
```

---

## 4. Export-Only Distribution System

```typescript
// src/services/ExportService.ts
export class ExportService {
  static async exportContent(
    content: any,
    format: ExportFormat,
    options?: ExportOptions
  ): Promise<ExportResult> {
    // Log export for audit trail
    await this.logExport({
      contentId: content.id,
      format,
      timestamp: new Date().toISOString(),
      userId: options?.userId
    })

    switch (format) {
      case 'pdf':
        return this.exportAsPDF(content, options)
      case 'docx':
        return this.exportAsWord(content, options)
      case 'pptx':
        return this.exportAsPowerPoint(content, options)
      case 'csv':
        return this.exportAsCSV(content, options)
      case 'markdown':
        return this.exportAsMarkdown(content, options)
      case 'social-package':
        return this.exportAsSocialPackage(content, options)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  private static async exportAsPDF(content: any, options?: ExportOptions) {
    // Use react-pdf or puppeteer
    const doc = new PDFDocument()

    // Add content based on type
    if (content.type === 'press-release') {
      doc.addPage()
        .fontSize(16).text(content.title)
        .fontSize(12).text(content.body)
    }

    // Add watermark if needed
    if (options?.watermark) {
      doc.opacity(0.3).text('DRAFT - Export Only', 100, 100)
    }

    return {
      buffer: doc.output(),
      filename: `${content.title}-${Date.now()}.pdf`,
      mimeType: 'application/pdf'
    }
  }

  private static async logExport(exportData: ExportLog) {
    // Save to exports_log table for audit trail
    await supabase.from('exports_log').insert(exportData)
  }
}
```

---

## 5. Orchestration Architecture

### A. MemoryVault as Orchestrator
```typescript
// src/components/modules/MemoryVaultOrchestrator.tsx
export function MemoryVaultOrchestrator({ framework }) {
  const [orchestrationState, setOrchestrationState] = useState<OrchestrationState>()

  const orchestrateWorkflow = async (workflowType: WorkflowType) => {
    // 1. Analyze framework requirements
    const requirements = analyzeFrameworkRequirements(framework)

    // 2. Check capabilities
    const capabilities = await checkPlatformCapabilities(requirements)

    // 3. Create execution plan
    const executionPlan = createExecutionPlan(requirements, capabilities)

    // 4. Execute with Claude oversight
    const orchestrator = new ClaudeOrchestrator({
      framework,
      plan: executionPlan,
      onProgress: updateProgress
    })

    await orchestrator.execute()
  }

  return (
    <div className="orchestrator-panel">
      <FrameworkSummary framework={framework} />

      <WorkflowSelector
        onSelect={orchestrateWorkflow}
        availableWorkflows={getAvailableWorkflows(framework)}
      />

      <OrchestrationProgress state={orchestrationState} />

      <GeneratedAssets
        assets={orchestrationState?.completedAssets}
        onExport={handleExport}
      />
    </div>
  )
}
```

### B. OpportunityEngine as Orchestrator
```typescript
// Enhanced opportunity with orchestration
interface ExecutableOpportunity {
  // Existing fields...

  orchestration: {
    canAutoExecute: boolean
    requiredCapabilities: Capability[]
    executionPlan: ExecutionStep[]
    claudeAssistance: 'required' | 'optional' | 'none'
  }
}

// Opportunity orchestration service
class OpportunityOrchestrator {
  async executeOpportunity(opportunity: ExecutableOpportunity) {
    // 1. Validate capabilities
    const validation = await this.validateCapabilities(opportunity)

    if (!validation.canExecute) {
      return this.handleMissingCapabilities(validation)
    }

    // 2. Execute with Claude if needed
    if (opportunity.orchestration.claudeAssistance === 'required') {
      return this.executeWithClaude(opportunity)
    }

    // 3. Execute steps
    for (const step of opportunity.orchestration.executionPlan) {
      await this.executeStep(step, opportunity)
    }
  }

  private async executeWithClaude(opportunity: ExecutableOpportunity) {
    // Use Claude to coordinate execution
    const prompt = this.buildOrchestrationPrompt(opportunity)

    const response = await claude.complete({
      prompt,
      tools: this.getAvailableTools()
    })

    return this.processClaudeOrchestration(response)
  }
}
```

---

## 6. Framework Alignment Updates

```typescript
// Update NIV strategic framework to include capability checks
interface EnhancedStrategicFramework {
  // Existing fields...

  capabilities: {
    required: Array<{
      type: CapabilityType
      status: 'available' | 'manual' | 'missing'
      provider?: string
      fallback?: string
    }>

    recommendations: Array<{
      content: string
      canGenerate: boolean
      generationType: 'automatic' | 'assisted' | 'manual'
      estimatedTime: string
    }>
  }

  execution: {
    automationLevel: 'full' | 'partial' | 'manual'
    estimatedDuration: string
    humanInterventionPoints: string[]
  }
}
```

---

## 7. Implementation Timeline

### Week 1: Core Infrastructure
- [ ] Set up Google Vertex AI authentication
- [ ] Implement Imagen 3 integration
- [ ] Implement Veo integration
- [ ] Create UnifiedContentService
- [ ] Update framework structures

### Week 2: Content Generation
- [ ] Image generation with prompts from frameworks
- [ ] Video script generation and Veo integration
- [ ] Gamma presentation integration
- [ ] Media list generation component

### Week 3: Export System
- [ ] PDF export implementation
- [ ] Word document export
- [ ] CSV/Excel for data exports
- [ ] Social media package exports
- [ ] Audit trail logging

### Week 4: Orchestration
- [ ] MemoryVault orchestrator UI
- [ ] OpportunityEngine execution enhancement
- [ ] Claude orchestration integration
- [ ] Testing and optimization

---

## 8. Environment Variables

```env
# Google Vertex AI
GOOGLE_CLOUD_PROJECT_ID=signaldesk-v3
GOOGLE_CLOUD_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
VERTEX_AI_API_ENDPOINT=https://us-central1-aiplatform.googleapis.com

# Gamma API (already have)
GAMMA_API_KEY=sk-gamma-zFOvUwGMpXZaDiB5sWkl3a5lakNfP19E90ZUZUdZM

# Export Service
EXPORT_WATERMARK_TEXT=DRAFT - Export Only
EXPORT_AUDIT_ENABLED=true
```

---

## 9. Key Benefits

1. **Unified Provider**: Single Google account for all visual content
2. **Complete Capabilities**: Text, image, video, and presentations
3. **Export-Only Safety**: No accidental posting, full audit trail
4. **Framework Alignment**: Capabilities checked before recommendations
5. **Orchestration Ready**: Both MemoryVault and OpportunityEngine can coordinate

---

## 10. Risk Mitigation

### Technical Risks
- **API Rate Limits**: Implement queuing and caching
- **Generation Failures**: Provide fallback options and manual briefs
- **Cost Management**: Set quotas and monitor usage

### Business Risks
- **Capability Expectations**: Clear UI indicators of what's automatic vs manual
- **Export Compliance**: Watermarks and audit trails for all exports
- **Quality Control**: Human review points before final export

---

## Next Steps

1. **Immediate**: Set up Google Cloud project and service account
2. **Day 1-2**: Implement Imagen 3 for image generation
3. **Day 3-4**: Add Veo for video generation
4. **Day 5**: Media list generation in Execute module
5. **Week 2**: Complete export system with all formats
6. **Week 3**: Orchestration enhancements
7. **Week 4**: Testing and optimization