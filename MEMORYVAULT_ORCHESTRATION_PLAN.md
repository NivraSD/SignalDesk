# MemoryVault Campaign Orchestration Plan
## From Strategy to Execution - Complete Workflow Integration

### Executive Summary

MemoryVault needs to evolve from a static storage system to an active orchestration hub. When NIV creates a strategic framework, it should become a **Campaign Workspace** that:
1. **Orchestrates** downstream workflows with action buttons
2. **Organizes** all outputs in a folder structure
3. **Tracks** execution status and progress
4. **Enables** components to access the campaign context

---

## 🎯 Vision: Campaign as a Living Workspace

### Current State (What's Missing)
```
MemoryVault
└── Strategic Framework (saved by NIV)
    └── [END - No orchestration, no organization]
```

### Desired State
```
MemoryVault
└── Campaign Workspace [ACTIVE]
    ├── 📋 Strategic Framework (NIV)
    ├── 🎯 Orchestration Controls [Execute Buttons]
    ├── 📁 Generated Content/
    │   ├── Press Release (Content Generator)
    │   ├── Blog Posts (Content Generator)
    │   └── Social Posts (Content Generator)
    ├── 📰 Media Outreach/
    │   ├── Media List (Media Module)
    │   ├── Pitch Emails (Outreach Module)
    │   └── Reporter Notes
    ├── 📊 Intelligence/
    │   ├── Market Analysis
    │   ├── Competitor Intel
    │   └── Opportunity Reports
    └── 📈 Campaign Analytics/
        ├── Performance Metrics
        └── Learning Insights
```

---

## 🏗️ Implementation Architecture

### 1. Campaign Workspace Model

```typescript
interface CampaignWorkspace {
  // Core Identity
  id: string                          // Campaign ID
  framework_id: string                // Original strategic framework
  organization_id: string

  // Campaign Metadata
  metadata: {
    name: string                      // Campaign name
    created_at: Date
    created_by: string
    status: 'draft' | 'active' | 'executing' | 'completed'
    tags: string[]
  }

  // Strategic Framework (Root Document)
  framework: NivStrategicFramework

  // Orchestration Configuration
  orchestration: {
    workflows: {
      content_generation: WorkflowConfig
      media_outreach: WorkflowConfig
      intelligence_gathering: WorkflowConfig
      strategic_planning: WorkflowConfig
    }

    execution_plan: {
      sequence: 'parallel' | 'sequential'
      dependencies: WorkflowDependency[]
      triggers: WorkflowTrigger[]
    }

    status: {
      overall_progress: number         // 0-100
      active_workflows: string[]
      completed_workflows: string[]
      failed_workflows: string[]
    }
  }

  // Content Organization (Folder Structure)
  content_tree: {
    folders: CampaignFolder[]
    items: CampaignItem[]
  }

  // Execution History
  execution_log: ExecutionEvent[]
}

interface CampaignFolder {
  id: string
  name: string
  type: 'content' | 'media' | 'intelligence' | 'analytics'
  parent_id?: string
  created_at: Date
  item_count: number
}

interface CampaignItem {
  id: string
  folder_id: string
  content_type: ContentType
  title: string
  preview?: string
  created_by: string              // Which component created it
  created_at: Date
  content_id: string              // Reference to actual content in memory_vault
  metadata: {
    component: string             // Component that can open/edit it
    format: string
    size?: number
    version?: number
  }
}

interface WorkflowConfig {
  enabled: boolean
  auto_execute: boolean
  priority: 'high' | 'medium' | 'low'
  parameters?: Record<string, any>
  assigned_component: string
  estimated_duration?: number
  status?: 'pending' | 'running' | 'completed' | 'failed'
  result?: {
    items_created: number
    success: boolean
    message?: string
  }
}
```

### 2. Orchestration UI Components

#### A. Campaign Header with Orchestration Controls

```typescript
// New component: CampaignOrchestrator.tsx
export function CampaignOrchestrator({ campaign }: { campaign: CampaignWorkspace }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      {/* Campaign Info */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold">{campaign.metadata.name}</h2>
          <p className="text-sm text-gray-400">
            Created {formatDate(campaign.metadata.created_at)}
          </p>
        </div>

        {/* Overall Progress */}
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-500">
            {campaign.orchestration.status.overall_progress}%
          </div>
          <div className="text-xs text-gray-400">Complete</div>
        </div>
      </div>

      {/* Orchestration Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Content Generation */}
        <WorkflowCard
          title="Content Generation"
          icon={<FileText />}
          workflow={campaign.orchestration.workflows.content_generation}
          onExecute={() => executeWorkflow('content_generation', campaign.id)}
        />

        {/* Media Outreach */}
        <WorkflowCard
          title="Media Outreach"
          icon={<Send />}
          workflow={campaign.orchestration.workflows.media_outreach}
          onExecute={() => executeWorkflow('media_outreach', campaign.id)}
        />

        {/* Intelligence */}
        <WorkflowCard
          title="Intelligence"
          icon={<Search />}
          workflow={campaign.orchestration.workflows.intelligence_gathering}
          onExecute={() => executeWorkflow('intelligence_gathering', campaign.id)}
        />

        {/* Strategic Planning */}
        <WorkflowCard
          title="Planning"
          icon={<Calendar />}
          workflow={campaign.orchestration.workflows.strategic_planning}
          onExecute={() => executeWorkflow('strategic_planning', campaign.id)}
        />
      </div>

      {/* Execute All Button */}
      <button
        onClick={() => executeAllWorkflows(campaign.id)}
        className="w-full mt-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black
                   rounded-lg font-medium transition-colors flex items-center
                   justify-center gap-2"
      >
        <PlayCircle className="w-5 h-5" />
        Execute All Workflows
      </button>
    </div>
  )
}

// Individual Workflow Card
function WorkflowCard({ title, icon, workflow, onExecute }) {
  const statusColors = {
    pending: 'bg-gray-700',
    running: 'bg-yellow-500/20 animate-pulse',
    completed: 'bg-green-500/20',
    failed: 'bg-red-500/20'
  }

  return (
    <div className={`p-3 rounded-lg ${statusColors[workflow.status || 'pending']}`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        <StatusIndicator status={workflow.status} />
      </div>

      <h4 className="text-sm font-medium mb-1">{title}</h4>

      {workflow.status === 'completed' && workflow.result && (
        <p className="text-xs text-gray-400">
          {workflow.result.items_created} items created
        </p>
      )}

      {workflow.status !== 'running' && (
        <button
          onClick={onExecute}
          className="mt-2 w-full py-1 bg-gray-700 hover:bg-gray-600
                     rounded text-xs transition-colors"
        >
          {workflow.status === 'completed' ? 'Re-run' : 'Execute'}
        </button>
      )}

      {workflow.status === 'running' && (
        <div className="mt-2">
          <div className="text-xs text-yellow-400">Executing...</div>
          <ProgressBar progress={50} />
        </div>
      )}
    </div>
  )
}
```

#### B. Campaign Content Explorer

```typescript
// Enhanced MemoryVault view with folder structure
export function CampaignContentExplorer({ campaign }: { campaign: CampaignWorkspace }) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<CampaignItem | null>(null)

  return (
    <div className="flex h-full">
      {/* Folder Tree */}
      <div className="w-64 border-r border-gray-800 p-4">
        <h3 className="font-semibold mb-3">Campaign Contents</h3>

        <div className="space-y-1">
          {/* Strategic Framework (Root) */}
          <FolderItem
            icon={<Target />}
            label="Strategic Framework"
            count={1}
            isRoot
            onClick={() => setSelectedFolder('framework')}
          />

          {/* Content Folders */}
          {campaign.content_tree.folders.map(folder => (
            <FolderItem
              key={folder.id}
              icon={getFolderIcon(folder.type)}
              label={folder.name}
              count={folder.item_count}
              isSelected={selectedFolder === folder.id}
              onClick={() => setSelectedFolder(folder.id)}
            />
          ))}
        </div>

        {/* Add Folder Button */}
        <button className="mt-4 w-full py-2 border border-gray-700 rounded text-sm">
          + New Folder
        </button>
      </div>

      {/* Content List */}
      <div className="flex-1 p-4">
        <ContentGrid
          items={getItemsForFolder(selectedFolder, campaign)}
          onSelectItem={setSelectedItem}
        />
      </div>

      {/* Item Preview/Editor */}
      {selectedItem && (
        <div className="w-96 border-l border-gray-800 p-4">
          <ItemPreview
            item={selectedItem}
            onOpenInComponent={() => openInComponent(selectedItem)}
          />
        </div>
      )}
    </div>
  )
}

function FolderItem({ icon, label, count, isRoot, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-2 rounded cursor-pointer
                  ${isSelected ? 'bg-yellow-500/10' : 'hover:bg-gray-800'}
                  ${isRoot ? 'font-semibold' : ''}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-xs text-gray-500">{count}</span>
    </div>
  )
}
```

### 3. Workflow Execution Service

```typescript
// services/campaign-orchestrator.ts
export class CampaignOrchestrator {
  async executeWorkflow(
    campaignId: string,
    workflowType: WorkflowType
  ): Promise<WorkflowResult> {
    // Get campaign and framework
    const campaign = await this.getCampaign(campaignId)
    const framework = campaign.framework

    // Update status to running
    await this.updateWorkflowStatus(campaignId, workflowType, 'running')

    try {
      let result: WorkflowResult

      switch (workflowType) {
        case 'content_generation':
          result = await this.executeContentGeneration(framework, campaign)
          break

        case 'media_outreach':
          result = await this.executeMediaOutreach(framework, campaign)
          break

        case 'intelligence_gathering':
          result = await this.executeIntelligence(framework, campaign)
          break

        case 'strategic_planning':
          result = await this.executeStrategicPlanning(framework, campaign)
          break
      }

      // Save generated items to campaign folder
      await this.saveWorkflowOutputs(campaignId, workflowType, result)

      // Update status
      await this.updateWorkflowStatus(campaignId, workflowType, 'completed', result)

      return result
    } catch (error) {
      await this.updateWorkflowStatus(campaignId, workflowType, 'failed')
      throw error
    }
  }

  private async executeContentGeneration(
    framework: NivStrategicFramework,
    campaign: CampaignWorkspace
  ): Promise<WorkflowResult> {
    const outputs = []

    // Generate press release
    if (framework.orchestration.components_to_activate.includes('press-release')) {
      const pr = await contentGenerator.generatePressRelease(framework)
      outputs.push(await this.saveToFolder(campaign.id, 'content', pr))
    }

    // Generate blog posts
    if (framework.orchestration.components_to_activate.includes('blog-posts')) {
      const posts = await contentGenerator.generateBlogPosts(framework)
      for (const post of posts) {
        outputs.push(await this.saveToFolder(campaign.id, 'content', post))
      }
    }

    // Generate social posts
    if (framework.orchestration.components_to_activate.includes('social-posts')) {
      const social = await contentGenerator.generateSocialPosts(framework)
      outputs.push(await this.saveToFolder(campaign.id, 'content', social))
    }

    return {
      success: true,
      items_created: outputs.length,
      outputs
    }
  }

  private async saveToFolder(
    campaignId: string,
    folderType: string,
    content: any
  ): Promise<CampaignItem> {
    // Save to memory_vault
    const saved = await memoryVault.save({
      content_type: content.type,
      content: content,
      relationships: {
        campaign_id: campaignId,
        folder_type: folderType
      }
    })

    // Add to campaign folder structure
    const campaignItem: CampaignItem = {
      id: generateId(),
      folder_id: this.getFolderId(campaignId, folderType),
      content_type: content.type,
      title: content.title,
      preview: content.preview,
      created_by: 'content_generator',
      created_at: new Date(),
      content_id: saved.id,
      metadata: {
        component: this.getComponentForType(content.type),
        format: content.format || 'markdown',
        version: 1
      }
    }

    await this.addToCampaignTree(campaignId, campaignItem)

    return campaignItem
  }
}
```

### 4. Component Integration

```typescript
// Each component needs to:
// 1. Accept campaign context
// 2. Save outputs to campaign folder
// 3. Update execution status

// Example: Content Generator Integration
export class ContentGeneratorWithOrchestration {
  async generateFromCampaign(campaignId: string, framework: NivStrategicFramework) {
    // Component receives campaign context
    const campaign = await campaignService.getCampaign(campaignId)

    // Generate content based on framework
    const content = await this.generate({
      objective: framework.strategy.objective,
      narrative: framework.strategy.narrative,
      proof_points: framework.strategy.proof_points,
      tone: framework.tactics.tone,
      format: framework.tactics.content_format
    })

    // Save to campaign folder automatically
    await campaignService.saveToFolder(campaignId, 'content', {
      type: 'blog_post',
      title: content.title,
      body: content.body,
      metadata: {
        generated_from: framework.id,
        campaign_id: campaignId
      }
    })

    // Update campaign progress
    await campaignService.updateProgress(campaignId, 'content_generation')

    return content
  }
}
```

### 5. Database Schema Updates

```sql
-- Campaign Workspaces Table
CREATE TABLE campaign_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID REFERENCES niv_strategies(id),
  organization_id UUID REFERENCES organizations(id),

  -- Campaign metadata
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'executing', 'completed')),

  -- Orchestration configuration
  orchestration JSONB NOT NULL DEFAULT '{}',

  -- Content tree structure
  content_tree JSONB NOT NULL DEFAULT '{"folders": [], "items": []}',

  -- Execution log
  execution_log JSONB[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  INDEX idx_campaign_framework ON campaign_workspaces(framework_id),
  INDEX idx_campaign_org ON campaign_workspaces(organization_id),
  INDEX idx_campaign_status ON campaign_workspaces(status)
);

-- Campaign Items (references to content in folders)
CREATE TABLE campaign_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaign_workspaces(id) ON DELETE CASCADE,
  folder_id TEXT NOT NULL,

  -- Item details
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  preview TEXT,

  -- References
  content_id UUID REFERENCES memory_vault(id),

  -- Metadata
  created_by TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  INDEX idx_items_campaign ON campaign_items(campaign_id),
  INDEX idx_items_folder ON campaign_items(campaign_id, folder_id)
);
```

---

## 🎮 User Experience Flow

### 1. Creating a Campaign
1. NIV generates strategic framework
2. User clicks "Create Campaign Workspace"
3. System creates campaign with folder structure
4. Framework saved as root document

### 2. Orchestrating Execution
1. User opens campaign in MemoryVault
2. Sees orchestration dashboard with workflow buttons
3. Clicks "Execute Content Generation"
4. System runs workflow, saves outputs to content folder
5. Progress bar shows completion
6. New items appear in folder tree

### 3. Accessing Generated Content
1. User browses campaign folders
2. Clicks on generated blog post
3. Preview shows on right
4. "Open in Content Editor" button launches component
5. Component has full campaign context

### 4. Campaign Completion
1. All workflows executed
2. Campaign shows 100% complete
3. User can export entire campaign
4. Learning system analyzes patterns

---

## 🚀 Implementation Roadmap

### Phase 1: Core Orchestration (Week 1)
- [ ] Create CampaignWorkspace model
- [ ] Build orchestration UI components
- [ ] Add execute buttons to MemoryVault
- [ ] Implement basic workflow execution

### Phase 2: Folder System (Week 1-2)
- [ ] Design folder structure
- [ ] Build content tree UI
- [ ] Implement save-to-folder logic
- [ ] Add folder navigation

### Phase 3: Component Integration (Week 2)
- [ ] Update Content Generator to accept campaign context
- [ ] Update Media Module for campaign saves
- [ ] Connect Intelligence Pipeline
- [ ] Ensure all outputs save to campaigns

### Phase 4: Advanced Features (Week 3)
- [ ] Add workflow dependencies
- [ ] Implement parallel execution
- [ ] Build progress tracking
- [ ] Create campaign templates

---

## ✅ Success Criteria

1. **One-Click Execution**: User can execute all workflows from MemoryVault
2. **Organized Outputs**: All generated content appears in campaign folders
3. **Component Context**: Components know they're working within a campaign
4. **Progress Visibility**: Clear status of what's running/completed
5. **Unified Workspace**: Everything related to a campaign in one place

---

## 🔑 Key Benefits

1. **Orchestration**: Strategic frameworks become actionable
2. **Organization**: All campaign materials in structured folders
3. **Efficiency**: One-click to execute entire campaigns
4. **Context**: Components share campaign knowledge
5. **Learning**: System learns from complete campaigns

This transforms MemoryVault from a passive storage system into an active campaign orchestration platform, exactly as envisioned in your master plan.