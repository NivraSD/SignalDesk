# SignalDesk V3: Critical Features Addendum
## Crisis Management, Export System, Context-Aware Niv & Alerts

**Addendum to Master Plan**  
**Date:** January 2025  
**Purpose:** Leverage existing components and add critical missing features

---

## 1. CRISIS COMMAND CENTER (Existing - Needs Integration)

### Current Component
You already have `CrisisCommandCenter.js` - let's integrate and enhance it:

### V3 Integration Plan
```typescript
// Keep existing Crisis Command Center UI
// Move logic to edge function for better performance

// supabase/functions/crisis-manager/
export async function manageCrisis(event: CrisisEvent) {
  return {
    // Use existing scenarios from your component
    scenario: detectScenarioType(event),
    severity: calculateSeverity(event),
    
    // Automated response generation
    responses: {
      immediate: generateHoldingStatement(event),
      stakeholders: generateStakeholderMessages(event),
      media: generateMediaResponse(event),
      social: generateSocialResponse(event),
      internal: generateInternalComms(event)
    },
    
    // Real-time monitoring
    monitoring: {
      sentiment: trackSentimentVelocity(),
      spread: trackViralSpread(),
      influencers: identifyKeyVoices(),
      cascades: predictCascades()
    },
    
    // Action items
    actions: generateActionPlan(event),
    timeline: generateResponseTimeline(event)
  }
}
```

### Crisis Playbooks (Leverage MemoryVault)
```typescript
interface CrisisPlaybook {
  type: 'data_breach' | 'executive_scandal' | 'product_recall' | 'layoffs' | 'controversy'
  
  templates: {
    holding_statement: string
    full_statement: string
    social_response: string
    employee_memo: string
    customer_email: string
  }
  
  timeline: {
    immediate: Task[] // 0-1 hour
    shortTerm: Task[] // 1-24 hours
    mediumTerm: Task[] // 1-7 days
    longTerm: Task[] // 7+ days
  }
  
  stakeholders: {
    group: string
    concerns: string[]
    messaging: string
    channel: string
  }[]
  
  lessons: {
    from_similar: Crisis[]
    what_worked: string[]
    what_failed: string[]
  }
}
```

---

## 2. UNIVERSAL EXPORT SYSTEM (No Direct Posting - Liability Protection)

### Core Principle
**NEVER post directly to platforms** - Always export for user review and manual posting

### Export Hub Architecture
```typescript
// components/export/ExportHub.tsx
interface ExportHub {
  formats: {
    // Documents
    pdf: 'Professional PDF with branding',
    docx: 'Editable Word document',
    markdown: 'Developer-friendly format',
    html: 'Web-ready with styling',
    
    // Social Media (Pre-formatted, not posted)
    twitter: {
      format: 'Thread-ready with character counts',
      output: 'Text file with breaks for threading',
      images: 'Separate folder with optimized images'
    },
    
    linkedin: {
      format: 'Post + article format',
      output: 'Text with formatting markers',
      images: 'LinkedIn-optimized dimensions'
    },
    
    instagram: {
      format: 'Caption + hashtags',
      output: 'Text file with emoji preserved',
      images: 'Square format 1080x1080'
    },
    
    // Media Kits
    mediaKit: {
      format: 'ZIP with all assets',
      contents: [
        'press_release.pdf',
        'fact_sheet.pdf',
        'images/',
        'logos/',
        'executive_bios.pdf',
        'company_backgrounder.pdf'
      ]
    },
    
    // Email Templates
    email: {
      format: 'HTML + Plain text',
      output: 'Copy-paste ready',
      personalization: 'Mail merge tags'
    }
  }
}
```

### Export Workflow
```typescript
// supabase/functions/export-generator/
export async function generateExport(campaign: Campaign, format: ExportFormat) {
  // 1. Gather all content
  const content = {
    written: campaign.content,
    visuals: campaign.visuals,
    media: campaign.mediaList,
    social: campaign.socialPosts
  }
  
  // 2. Format for export
  const formatted = await formatForExport(content, format)
  
  // 3. Add compliance footer
  const withCompliance = addComplianceNotice(formatted, {
    disclaimer: "For review and manual distribution only",
    generated: new Date().toISOString(),
    organization: organization.name
  })
  
  // 4. Generate downloadable file
  const file = await generateFile(withCompliance, format)
  
  // 5. Create audit trail
  await auditLog({
    action: 'export_generated',
    format,
    user: user.id,
    campaign: campaign.id,
    timestamp: new Date()
  })
  
  return {
    downloadUrl: file.url,
    expiresIn: '24 hours',
    preview: file.preview
  }
}
```

### Smart Copy System
```typescript
// One-click copy with formatting preserved
interface SmartCopy {
  // Copy for different purposes
  copyAsPlainText: () => void
  copyAsRichText: () => void
  copyAsMarkdown: () => void
  copyAsHTML: () => void
  
  // Platform-specific formatting
  copyForTwitter: () => void  // With character count
  copyForLinkedIn: () => void // With rich formatting
  copyForEmail: () => void    // With mail client formatting
  
  // Smart clipboard
  copyWithImages: () => void  // Includes image references
  copyWithData: () => void    // Includes structured data
}
```

---

## 3. CONTEXT-AWARE NIV (Sees What User Sees)

### Niv Context System
```typescript
// stores/useNivContext.ts
interface NivContext {
  // Current user context
  currentModule: 'intelligence' | 'opportunities' | 'campaigns' | 'crisis'
  currentView: string // Specific component/page
  visibleData: any // What's on screen
  userActions: Action[] // Recent user actions
  cursorPosition: { x: number, y: number }
  selectedItems: any[]
  
  // Niv awareness
  nivSees: {
    module: Module
    data: any
    possibleActions: string[]
    suggestions: Suggestion[]
  }
}

// Niv adapts based on context
export function getNivSuggestions(context: NivContext) {
  switch(context.currentModule) {
    case 'intelligence':
      return {
        insight: "I see competitor X is showing weakness in...",
        action: "Would you like me to find opportunities related to this?",
        tips: "Click here to dive deeper into this data"
      }
    
    case 'opportunities':
      return {
        insight: "This opportunity scores 95/100 because...",
        action: "Execute campaign with Strategy A?",
        tips: "Similar opportunity succeeded 2 months ago"
      }
    
    case 'crisis':
      return {
        insight: "Crisis escalating on Twitter, 340% velocity",
        action: "Deploy response template B?",
        tips: "CEO statement needed within 2 hours"
      }
  }
}
```

### Niv Overlay Assistant
```typescript
// components/niv/NivOverlay.tsx
export function NivOverlay() {
  const context = useNivContext()
  const [isMinimized, setIsMinimized] = useState(false)
  
  return (
    <div className="niv-overlay">
      {/* Floating assistant that follows user's workflow */}
      <NivAssistant 
        position="bottom-right"
        context={context}
        mode={isMinimized ? 'mini' : 'expanded'}
      >
        {/* Contextual help */}
        <NivInsight>
          "I notice you're looking at {context.visibleData.title}. 
          This relates to the opportunity we identified yesterday."
        </NivInsight>
        
        {/* Contextual actions */}
        <NivActions>
          <button>Generate response for this</button>
          <button>Find similar patterns</button>
          <button>Create campaign</button>
        </NivActions>
        
        {/* Proactive suggestions */}
        <NivSuggestions>
          "Based on what you're viewing, you might want to..."
        </NivSuggestions>
      </NivAssistant>
    </div>
  )
}
```

---

## 4. COMPREHENSIVE ALERT SYSTEM

### Multi-Channel Alerts
```typescript
// supabase/functions/alert-manager/
interface AlertSystem {
  channels: {
    inApp: {
      badge: boolean
      sound: boolean
      desktop: boolean
      persistent: boolean
    },
    
    email: {
      immediate: string[] // Critical alerts
      digest: string[]    // Daily summary
      weekly: string[]    // Weekly report
    },
    
    sms: {
      critical: boolean  // Only crisis-level
      number: string
    },
    
    slack: {
      webhook: string
      channel: string
      mentions: string[]
    },
    
    browser: {
      push: boolean
      permission: 'granted' | 'denied' | 'default'
    }
  }
  
  types: {
    // Crisis Alerts (Immediate)
    crisis: {
      priority: 'critical',
      channels: ['all'],
      sound: 'siren',
      persist: true
    },
    
    // Opportunity Alerts (High Priority)
    opportunity: {
      priority: 'high',
      channels: ['inApp', 'email'],
      sound: 'ding',
      persist: false
    },
    
    // Intelligence Updates (Medium)
    intelligence: {
      priority: 'medium',
      channels: ['inApp', 'digest'],
      sound: null,
      persist: false
    },
    
    // Campaign Performance (Low)
    campaign: {
      priority: 'low',
      channels: ['digest'],
      sound: null,
      persist: false
    }
  }
}
```

### Smart Alert Rules
```typescript
// Alert only when it matters
interface SmartAlertRules {
  // Time-based
  quietHours: {
    enabled: boolean
    start: '22:00'
    end: '08:00'
    timezone: 'user_local'
    exceptions: ['crisis'] // Always alert for these
  }
  
  // Importance filtering
  thresholds: {
    opportunityScore: 80  // Only alert if score > 80
    sentimentDrop: -20    // Alert if sentiment drops > 20%
    competitorNews: 'major' // Only major competitor news
    trendingVelocity: 300  // Alert if trend velocity > 300%
  }
  
  // Deduplication
  deduplication: {
    enabled: true
    window: '1 hour'  // Don't repeat similar alerts
    groupBy: 'type'  // Group similar alerts
  }
  
  // Smart batching
  batching: {
    lowPriority: 'hourly'
    mediumPriority: '15min'
    highPriority: 'immediate'
    critical: 'never_batch'
  }
}
```

### Alert Center UI
```typescript
// components/alerts/AlertCenter.tsx
export function AlertCenter() {
  const alerts = useAlerts()
  const [filter, setFilter] = useState('all')
  
  return (
    <div className="alert-center">
      {/* Alert Stats */}
      <AlertStats>
        <Critical count={alerts.critical.length} />
        <High count={alerts.high.length} />
        <Unread count={alerts.unread.length} />
      </AlertStats>
      
      {/* Alert Feed */}
      <AlertFeed>
        {alerts.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            actions={[
              { label: 'View', action: () => navigateTo(alert) },
              { label: 'Execute', action: () => executeAction(alert) },
              { label: 'Dismiss', action: () => dismiss(alert) }
            ]}
          />
        ))}
      </AlertFeed>
      
      {/* Alert Settings */}
      <AlertSettings>
        <ChannelConfig />
        <RuleBuilder />
        <TestAlert />
      </AlertSettings>
    </div>
  )
}
```

### Predictive Alerts
```typescript
// AI-powered predictive alerting
interface PredictiveAlerts {
  // Pattern-based predictions
  patterns: {
    "Competitor usually announces on Tuesdays": {
      alert: 'monday_evening',
      message: 'Competitor announcement likely tomorrow'
    },
    
    "Sentiment dropping for 3 days": {
      alert: 'immediate',
      message: 'Crisis likely within 24 hours'
    },
    
    "Journalist requesting comment": {
      alert: 'immediate',
      message: 'Story likely publishing soon'
    }
  }
  
  // Cascade predictions
  cascades: {
    detect: () => CascadeRisk
    alert: (risk: CascadeRisk) => Alert
    prevent: (risk: CascadeRisk) => PreventionPlan
  }
  
  // Opportunity windows
  windows: {
    closing: Alert[] // Opportunities about to expire
    opening: Alert[] // New opportunities emerging
    optimal: Alert[] // Best time to act
  }
}
```

---

## 5. INTEGRATION WITH MASTER PLAN

### Week 3 Addition: Crisis & Alerts
```typescript
// Add to Week 3 (Opportunity Engine week)
// Day 5 becomes Crisis & Alert integration

// supabase/functions/crisis-manager/
// supabase/functions/alert-manager/

// Components
// components/crisis/CrisisCommandCenter.tsx (existing, enhanced)
// components/alerts/AlertCenter.tsx
```

### Week 5 Addition: Export System
```typescript
// Add to Week 5 (Execution Module week)
// Day 5 becomes Export System

// supabase/functions/export-generator/

// Components
// components/export/ExportHub.tsx
// components/export/FormatSelector.tsx
```

### Week 4 Enhancement: Context-Aware Niv
```typescript
// Enhance Week 4 Niv implementation
// Add context awareness to Niv orchestrator

// stores/useNivContext.ts
// components/niv/NivOverlay.tsx
// components/niv/NivContextualAssistant.tsx
```

---

## 6. LIABILITY PROTECTION MEASURES

### No Direct Posting Policy
```typescript
// CRITICAL: Never store platform credentials
// CRITICAL: Never post directly to platforms
// CRITICAL: Always require human review

const PROHIBITED_ACTIONS = [
  'twitter.post()',
  'linkedin.publish()',
  'facebook.share()',
  'instagram.upload()',
  'email.send()'
]

// Instead, always:
const SAFE_ACTIONS = [
  'export.asTwitterDraft()',
  'export.asLinkedInDraft()',
  'export.asEmailTemplate()',
  'clipboard.copyForPlatform()'
]
```

### Audit Trail
```typescript
// Track everything for compliance
interface AuditLog {
  user: string
  action: string
  content: string
  timestamp: Date
  ip: string
  exported: boolean
  posted: null // Never true - we don't post
}
```

### Terms of Service Notice
```typescript
// Display on every export
const EXPORT_NOTICE = `
This content is generated for review and editing.
SignalDesk does not post directly to any platform.
User is responsible for reviewing, editing, and posting content.
User assumes all liability for published content.
`
```

---

## 7. IMPLEMENTATION PRIORITY UPDATES

### Updated Week-by-Week Plan

**Week 3 Day 5:** Crisis & Alerts
- Integrate existing CrisisCommandCenter
- Add alert system
- Test crisis scenarios

**Week 4 Day 4:** Context-Aware Niv
- Add context tracking
- Implement overlay assistant
- Test contextual suggestions

**Week 5 Day 5:** Export System
- Build export hub
- Add all format generators
- Implement audit logging

**Week 6 Day 3:** Enhanced Testing
- Crisis simulation testing
- Alert testing
- Export validation
- Liability protection verification

---

## SUMMARY

These critical additions ensure SignalDesk V3:

1. **Leverages existing work** - Your Crisis Command Center is integrated, not rebuilt
2. **Protects from liability** - No direct posting, comprehensive audit trails
3. **Provides flexibility** - Export to any format users need
4. **Stays intelligent** - Niv sees and understands user context
5. **Keeps users informed** - Smart, non-annoying alerts

The export system is particularly critical for enterprise adoption - legal teams will require this separation of content generation from publication.

The context-aware Niv transforms it from a separate tool to an ever-present assistant that genuinely understands what the user is trying to accomplish.

---

*Add this addendum to your V3 Master Plan for complete feature coverage.*