# Content Generator Integration Architecture for Execute Tab

## Overview
The Content Generator will be integrated into the Execute tab as a comprehensive content creation and orchestration system that works seamlessly with NIV strategic frameworks and Memory Vault.

## Core Architecture Components

### 1. Dual-Mode Operation

#### A. Orchestrated Mode (Framework-Driven)
- **Trigger**: User has an active strategic framework from NIV
- **Flow**:
  1. Framework provides content_needs prioritized list
  2. System automatically populates content queue
  3. User can bulk-generate or selectively create content
  4. Each piece inherits framework context (narrative, tone, proof points)
- **Intelligence**: NIV provides real-time context and updates

#### B. Standalone Mode (Ad-Hoc Creation)
- **Trigger**: User needs specific content without framework
- **Flow**:
  1. User selects content type from organized menu
  2. Fills contextual form or uses AI assistant
  3. Optional: Links to existing Memory Vault strategies
  4. Generates with or without NIV intelligence enhancement

### 2. UI/UX Organization

```
Execute Tab
├── Content Hub (Main View)
│   ├── Active Framework Banner (if applicable)
│   │   ├── Framework Title & Objective
│   │   ├── Content Progress Bar (5/12 pieces created)
│   │   └── Quick Actions (Generate Next Priority, View All)
│   │
│   ├── Content Creation Center
│   │   ├── Quick Create (Most Used)
│   │   │   ├── Press Release
│   │   │   ├── Social Post
│   │   │   ├── Executive Statement
│   │   │   └── Q&A Document
│   │   │
│   │   ├── Content Categories (Expandable)
│   │   │   ├── External Communications
│   │   │   ├── Internal Communications
│   │   │   ├── Crisis Management
│   │   │   ├── Thought Leadership
│   │   │   └── Supporting Materials
│   │   │
│   │   └── AI Assistant Mode
│   │       └── Natural Language Request
│   │
│   ├── Content Queue (Right Sidebar)
│   │   ├── Framework Priorities
│   │   ├── In Progress
│   │   ├── Review Required
│   │   └── Published/Completed
│   │
│   └── Content Library (Bottom Section)
│       ├── Recent Creations
│       ├── Templates
│       └── Saved Drafts
```

### 3. Orchestration Workflow

#### Phase 1: Framework Activation
```javascript
// When user completes NIV strategic framework
const activateContentOrchestration = async (framework) => {
  const contentPlan = {
    frameworkId: framework.id,
    objective: framework.strategy.objective,
    narrative: framework.strategy.narrative,
    proofPoints: framework.strategy.proof_points,
    contentNeeds: framework.strategy.content_needs,
    timeline: framework.strategy.timeline_execution,
    tone: determineTone(framework),
    status: 'active'
  }

  // Create orchestration session
  await createOrchestrationSession(contentPlan)

  // Populate content queue
  await populateContentQueue(contentPlan.contentNeeds.priority_content)

  // Set up intelligence monitoring
  await activateNIVMonitoring(framework.context)
}
```

#### Phase 2: Intelligent Content Generation
```javascript
const generateOrchestrationContent = async (contentItem, framework) => {
  // Gather real-time intelligence
  const currentIntelligence = await NIV.getLatestIntelligence({
    topic: framework.objective,
    competitors: framework.context.competitors,
    timeframe: '48h'
  })

  // Merge framework context with current intelligence
  const enrichedContext = {
    ...framework,
    currentEvents: currentIntelligence.events,
    competitorMoves: currentIntelligence.competitive,
    mediaConversations: currentIntelligence.trending
  }

  // Generate content with full context
  const content = await ContentGenerator.create({
    type: contentItem.type,
    context: enrichedContext,
    tone: framework.tone,
    guidelines: getContentGuidelines(contentItem.type)
  })

  return content
}
```

### 4. NIV Integration Points

#### A. Pre-Generation Intelligence
- **Competitive Check**: What are competitors saying about this topic?
- **Trend Analysis**: What's the current media narrative?
- **Timing Optimization**: Is this the right time to publish?
- **Risk Assessment**: Any potential PR landmines?

#### B. Content Enhancement
- **Real-time Data**: Inject latest statistics and developments
- **Proof Points**: Pull from NIV research findings
- **Media Targets**: Suggest journalists covering this topic
- **Narrative Alignment**: Ensure consistency with strategic narrative

#### C. Post-Generation Optimization
- **A/B Variations**: Generate multiple versions for testing
- **Platform Optimization**: Adapt for different channels
- **Timing Recommendations**: Best time to publish based on intelligence

### 5. Memory Vault Integration

#### Storage Structure
```typescript
interface ContentRecord {
  id: string
  frameworkId?: string  // Links to strategic framework
  type: ContentType
  title: string
  content: {
    draft: string
    final?: string
    variations?: ContentVariation[]
  }
  metadata: {
    createdAt: Date
    updatedAt: Date
    author: string
    status: 'draft' | 'review' | 'approved' | 'published'
    intelligence?: {
      competitiveLandscape: any
      mediaEnvironment: any
      timingAnalysis: any
    }
  }
  performance?: {
    views?: number
    engagement?: number
    mediaPickup?: string[]
    effectiveness?: number
  }
  linkedAssets?: {
    visualAssets?: string[]
    supportingDocs?: string[]
    translations?: ContentTranslation[]
  }
}
```

#### Retrieval & Reuse
- **Template Library**: Save successful content as templates
- **Context Inheritance**: New content can inherit from similar past content
- **Performance Learning**: Use metrics to improve future content
- **Version Control**: Track all edits and approvals

### 6. Content Versioning by Audience

#### Audience Segmentation System
```typescript
interface AudienceVersion {
  id: string
  audience: AudienceType
  adaptations: {
    tone: ToneProfile
    language: LanguageStyle  // Technical, casual, formal, etc.
    emphasis: string[]  // Key points to emphasize
    omissions: string[]  // Points to exclude
    additions: string[]  // Audience-specific additions
  }
  content: string
  metadata: {
    readingLevel: number  // Flesch-Kincaid score
    technicalDepth: 'basic' | 'intermediate' | 'advanced'
    culturalContext?: string
  }
}

enum AudienceType {
  INVESTORS = 'investors',
  CUSTOMERS = 'customers',
  EMPLOYEES = 'employees',
  MEDIA = 'media',
  REGULATORS = 'regulators',
  PARTNERS = 'partners',
  GENERAL_PUBLIC = 'general_public',
  TECHNICAL_AUDIENCE = 'technical_audience',
  EXECUTIVES = 'executives',
  BOARD = 'board'
}
```

#### Version Generation Workflow
```javascript
const generateAudienceVersions = async (masterContent, audiences) => {
  const versions = []

  for (const audience of audiences) {
    const audienceProfile = getAudienceProfile(audience)

    const version = await ContentGenerator.adapt({
      content: masterContent,
      audience: audienceProfile,
      adaptations: {
        tone: audienceProfile.preferredTone,
        complexity: audienceProfile.comprehensionLevel,
        interests: audienceProfile.keyInterests,
        concerns: audienceProfile.primaryConcerns,
        language: audienceProfile.languageStyle,
        examples: audienceProfile.relatableExamples
      }
    })

    versions.push({
      audience,
      content: version,
      validation: await validateAudienceAlignment(version, audienceProfile)
    })
  }

  return versions
}
```

#### UI Implementation
```typescript
// Audience Version Manager Component
const AudienceVersionManager = ({ masterContent, framework }) => {
  const [selectedAudiences, setSelectedAudiences] = useState<AudienceType[]>([])
  const [versions, setVersions] = useState<AudienceVersion[]>([])
  const [comparisonMode, setComparisonMode] = useState(false)

  return (
    <div className="audience-version-manager">
      {/* Audience Selector */}
      <div className="audience-selector grid grid-cols-5 gap-2 mb-4">
        {Object.values(AudienceType).map(audience => (
          <button
            key={audience}
            onClick={() => toggleAudience(audience)}
            className={`p-2 rounded-lg ${
              selectedAudiences.includes(audience)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {getAudienceIcon(audience)} {audience}
          </button>
        ))}
      </div>

      {/* Version Tabs */}
      <div className="version-tabs">
        {versions.map(version => (
          <Tab key={version.audience} title={version.audience}>
            <VersionEditor version={version} />
          </Tab>
        ))}
      </div>

      {/* Side-by-Side Comparison */}
      {comparisonMode && (
        <div className="grid grid-cols-2 gap-4">
          {versions.slice(0, 2).map(version => (
            <VersionDisplay key={version.id} version={version} highlight={true} />
          ))}
        </div>
      )}
    </div>
  )
}
```

### 7. External Tool Integrations

#### Integration Registry
```typescript
interface ExternalIntegration {
  id: string
  name: string
  type: IntegrationType
  capabilities: string[]
  authentication: AuthMethod
  endpoints: IntegrationEndpoint[]
  dataMapping: DataMappingSchema
}

enum IntegrationType {
  DOCUMENT_EDITOR = 'document_editor',    // Google Docs, Office 365
  COMMUNICATION = 'communication',        // Slack, Teams, Discord
  EMAIL_PLATFORM = 'email_platform',      // Mailchimp, SendGrid, HubSpot
  SOCIAL_MEDIA = 'social_media',         // Twitter, LinkedIn, Facebook
  PROJECT_MANAGEMENT = 'project_mgmt',    // Asana, Jira, Monday
  CMS = 'cms',                           // WordPress, Contentful, Strapi
  ANALYTICS = 'analytics',               // Google Analytics, Mixpanel
  CRM = 'crm',                          // Salesforce, HubSpot CRM
  DAM = 'dam'                           // Digital Asset Management
}

const integrations: ExternalIntegration[] = [
  {
    id: 'google_docs',
    name: 'Google Docs',
    type: IntegrationType.DOCUMENT_EDITOR,
    capabilities: ['export', 'import', 'collaborate', 'version_control'],
    authentication: AuthMethod.OAUTH2,
    endpoints: {
      export: 'https://docs.googleapis.com/v1/documents',
      import: 'https://docs.googleapis.com/v1/documents/{id}',
      collaborate: 'https://docs.googleapis.com/v1/documents/{id}/permissions'
    },
    dataMapping: {
      title: 'doc.title',
      content: 'doc.body',
      metadata: 'doc.properties'
    }
  },
  {
    id: 'slack',
    name: 'Slack',
    type: IntegrationType.COMMUNICATION,
    capabilities: ['share', 'notify', 'approve', 'discuss'],
    authentication: AuthMethod.WEBHOOK,
    endpoints: {
      postMessage: 'https://slack.com/api/chat.postMessage',
      createThread: 'https://slack.com/api/conversations.create'
    }
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    type: IntegrationType.EMAIL_PLATFORM,
    capabilities: ['campaign_create', 'template_sync', 'list_management'],
    authentication: AuthMethod.API_KEY,
    endpoints: {
      campaigns: 'https://api.mailchimp.com/3.0/campaigns',
      templates: 'https://api.mailchimp.com/3.0/templates'
    }
  }
]
```

#### Export/Import Handlers
```javascript
class ExternalIntegrationService {
  // Export to Google Docs
  async exportToGoogleDocs(content: ContentRecord, options: ExportOptions) {
    const doc = await GoogleDocsAPI.create({
      title: content.title,
      body: this.formatForGoogleDocs(content.content),
      sharing: options.sharing || 'private'
    })

    // Add collaborators if specified
    if (options.collaborators) {
      await GoogleDocsAPI.addCollaborators(doc.id, options.collaborators)
    }

    // Set up two-way sync if requested
    if (options.enableSync) {
      await this.setupContentSync(content.id, doc.id, 'google_docs')
    }

    return {
      success: true,
      url: doc.url,
      docId: doc.id
    }
  }

  // Share to Slack
  async shareToSlack(content: ContentRecord, channel: string, options?: ShareOptions) {
    const message = {
      channel,
      text: `New ${content.type} created: ${content.title}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: this.formatForSlack(content.content)
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Approve' },
              action_id: `approve_${content.id}`
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Request Changes' },
              action_id: `change_${content.id}`
            }
          ]
        }
      ]
    }

    const result = await SlackAPI.postMessage(message)

    // Track engagement
    await this.trackExternalShare(content.id, 'slack', result.ts)

    return result
  }

  // Publish to WordPress
  async publishToWordPress(content: ContentRecord, site: WordPressSite) {
    const post = await WordPressAPI.createPost({
      site: site.url,
      auth: site.credentials,
      post: {
        title: content.title,
        content: this.formatForWordPress(content.content),
        status: 'draft', // Always start as draft for safety
        categories: this.mapCategories(content.type),
        tags: this.extractTags(content),
        featured_media: await this.uploadMedia(content.linkedAssets)
      }
    })

    return {
      success: true,
      url: post.link,
      postId: post.id
    }
  }

  // Email Campaign Integration
  async createEmailCampaign(content: ContentRecord, platform: 'mailchimp' | 'sendgrid' | 'hubspot') {
    const campaign = {
      subject: content.title,
      body: this.formatForEmail(content.content),
      segments: this.determineEmailSegments(content.metadata.audience),
      schedule: content.metadata.publishDate
    }

    switch (platform) {
      case 'mailchimp':
        return await MailchimpAPI.createCampaign(campaign)
      case 'sendgrid':
        return await SendGridAPI.createCampaign(campaign)
      case 'hubspot':
        return await HubSpotAPI.createEmailCampaign(campaign)
    }
  }

  // Sync with Project Management
  async createProjectTask(content: ContentRecord, platform: 'asana' | 'jira' | 'monday') {
    const task = {
      name: `Review and approve: ${content.title}`,
      description: content.content.substring(0, 500),
      assignee: content.metadata.author,
      dueDate: content.metadata.deadline,
      attachments: [content.id],
      customFields: {
        contentType: content.type,
        framework: content.frameworkId
      }
    }

    switch (platform) {
      case 'asana':
        return await AsanaAPI.createTask(task)
      case 'jira':
        return await JiraAPI.createIssue(task)
      case 'monday':
        return await MondayAPI.createItem(task)
    }
  }
}
```

#### Integration UI Component
```typescript
const ExternalIntegrationsPanel = ({ content }) => {
  const [connectedServices, setConnectedServices] = useState([])
  const [exportStatus, setExportStatus] = useState({})

  return (
    <div className="external-integrations-panel">
      <h3 className="text-lg font-semibold mb-4">Share & Export</h3>

      {/* Quick Actions */}
      <div className="quick-actions grid grid-cols-4 gap-2 mb-6">
        <button onClick={() => exportToGoogleDocs(content)}
                className="p-3 bg-blue-600 rounded-lg hover:bg-blue-700">
          <GoogleDocsIcon /> Export to Docs
        </button>

        <button onClick={() => shareToSlack(content)}
                className="p-3 bg-purple-600 rounded-lg hover:bg-purple-700">
          <SlackIcon /> Share to Slack
        </button>

        <button onClick={() => createEmailDraft(content)}
                className="p-3 bg-green-600 rounded-lg hover:bg-green-700">
          <MailIcon /> Email Campaign
        </button>

        <button onClick={() => schedulePost(content)}
                className="p-3 bg-indigo-600 rounded-lg hover:bg-indigo-700">
          <CalendarIcon /> Schedule Post
        </button>
      </div>

      {/* Connected Services */}
      <div className="connected-services">
        <h4 className="text-sm font-medium mb-2">Connected Services</h4>
        <div className="space-y-2">
          {connectedServices.map(service => (
            <ServiceConnection
              key={service.id}
              service={service}
              content={content}
              onAction={handleServiceAction}
            />
          ))}
        </div>
      </div>

      {/* Add New Integration */}
      <button className="mt-4 text-blue-400 hover:text-blue-300">
        + Connect New Service
      </button>
    </div>
  )
}
```

#### Automation Rules
```typescript
interface AutomationRule {
  id: string
  trigger: TriggerType
  conditions: Condition[]
  actions: AutomationAction[]
  enabled: boolean
}

// Example: Auto-publish to multiple platforms
const multiChannelPublishing: AutomationRule = {
  id: 'multi_channel_publish',
  trigger: TriggerType.CONTENT_APPROVED,
  conditions: [
    { field: 'content.type', operator: 'equals', value: 'press-release' }
  ],
  actions: [
    { type: 'export', platform: 'google_docs', options: { sharing: 'public' } },
    { type: 'publish', platform: 'wordpress', options: { status: 'published' } },
    { type: 'share', platform: 'slack', options: { channel: '#pr-team' } },
    { type: 'email', platform: 'mailchimp', options: { list: 'media-contacts' } },
    { type: 'social', platform: 'twitter', options: { schedule: '+2h' } }
  ],
  enabled: true
}
```

### 8. Additional Critical Features

#### A. Approval Workflow
```typescript
interface ApprovalFlow {
  stages: [
    { name: 'Draft', reviewers: ['creator'] },
    { name: 'Legal Review', reviewers: ['legal_team'], required: boolean },
    { name: 'Executive Approval', reviewers: ['executives'], required: boolean },
    { name: 'Final', reviewers: ['pr_team'] }
  ]
  currentStage: number
  comments: Comment[]
  approvals: Approval[]
}
```

#### B. Distribution Management
- **Multi-channel Publishing**: Direct publish to platforms
- **Scheduling**: Time-based release coordination
- **Embargo Management**: Control release timing
- **Tracking Links**: Monitor content performance

#### C. Brand Consistency Engine
- **Style Guide Enforcement**: Automated checks for brand compliance
- **Tone Analyzer**: Ensure content matches desired tone
- **Terminology Management**: Consistent use of key terms
- **Visual Asset Library**: Approved images, logos, graphics

#### D. Real-time Collaboration
- **Live Editing**: Multiple users can work simultaneously
- **Comment System**: Inline feedback and suggestions
- **Change Tracking**: See who changed what and when
- **Role-based Access**: Control who can edit vs. review

### 7. Implementation Phases

#### Phase 1: Core Integration (Week 1-2)
- [ ] Create ExecuteTab component structure
- [ ] Implement basic content type selection
- [ ] Connect to content generation API
- [ ] Basic Memory Vault save/retrieve

#### Phase 2: Orchestration (Week 3-4)
- [ ] Framework activation system
- [ ] Content queue management
- [ ] Priority-based generation
- [ ] Progress tracking

#### Phase 3: Intelligence Enhancement (Week 5-6)
- [ ] NIV real-time intelligence integration
- [ ] Competitive analysis injection
- [ ] Timing optimization
- [ ] Risk assessment

#### Phase 4: Advanced Features (Week 7-8)
- [ ] Approval workflows
- [ ] Distribution management
- [ ] Performance analytics
- [ ] Template library

### 8. Component Structure

```typescript
// Main Execute Tab Component
interface ExecuteTabProps {
  activeFramework?: StrategicFramework
  organization: Organization
}

const ExecuteTab: React.FC<ExecuteTabProps> = ({ activeFramework, organization }) => {
  const [mode, setMode] = useState<'orchestrated' | 'standalone'>('standalone')
  const [contentQueue, setContentQueue] = useState<ContentItem[]>([])
  const [activeContent, setActiveContent] = useState<ContentRecord | null>(null)

  // Initialize based on framework presence
  useEffect(() => {
    if (activeFramework) {
      setMode('orchestrated')
      initializeOrchestration(activeFramework)
    }
  }, [activeFramework])

  return (
    <div className="execute-tab">
      {mode === 'orchestrated' && (
        <FrameworkBanner framework={activeFramework} />
      )}

      <div className="content-main">
        <ContentCreationCenter
          mode={mode}
          framework={activeFramework}
          onContentCreate={handleContentCreate}
        />

        <ContentQueue
          items={contentQueue}
          onItemSelect={setActiveContent}
        />
      </div>

      <ContentLibrary
        organization={organization}
        onTemplateSelect={handleTemplateSelect}
      />
    </div>
  )
}
```

### 9. API Structure

```typescript
// Content Generator Service
class ContentGeneratorService {
  async generateContent(params: {
    type: ContentType
    context: FrameworkContext | StandaloneContext
    intelligence?: NIVIntelligence
    tone?: ToneProfile
  }): Promise<ContentRecord>

  async enhanceWithIntelligence(
    content: string,
    intelligence: NIVIntelligence
  ): Promise<string>

  async optimizeForPlatform(
    content: string,
    platform: Platform
  ): Promise<string>

  async generateVariations(
    content: string,
    count: number
  ): Promise<ContentVariation[]>
}
```

### 10. Success Metrics

#### Efficiency Metrics
- Time from framework to first content: < 2 minutes
- Bulk generation speed: 10 pieces in < 5 minutes
- Revision cycles reduced by 50%

#### Quality Metrics
- Brand consistency score: > 95%
- Intelligence relevance: > 90%
- Approval rate on first submission: > 80%

#### Usage Metrics
- % of frameworks with content generation: > 75%
- Average content pieces per framework: 8-12
- Template reuse rate: > 40%

## Next Steps

1. **Immediate Actions**:
   - Create ExecuteTab component scaffold
   - Set up content type registry
   - Implement basic generation flow

2. **Integration Points**:
   - Connect to NIV orchestrator for intelligence
   - Link to Memory Vault for persistence
   - Set up real-time updates via WebSocket

3. **Testing Strategy**:
   - Unit tests for each content type
   - Integration tests for orchestration flow
   - E2E tests for complete workflow

This architecture provides a robust foundation for content generation that seamlessly integrates with NIV's intelligence capabilities while maintaining flexibility for standalone use cases.