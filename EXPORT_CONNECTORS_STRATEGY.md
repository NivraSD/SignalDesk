# SignalDesk V3 Export Connectors Strategy
## Enabling User-Controlled Content Distribution

*Created: November 2024*

---

## Executive Summary

SignalDesk V3 will implement an **export-only distribution model** that allows users to connect their own services and control content distribution. This approach maintains compliance, reduces liability, and gives users flexibility to work with their existing tools.

**Core Philosophy**: SignalDesk generates → Users distribute through their own accounts

---

## 🎯 Strategic Objectives

1. **Zero Direct Posting** - No content sent directly from SignalDesk platform
2. **User Account Control** - Users connect and manage their own service credentials
3. **Audit Trail** - Complete tracking of what was exported when
4. **Enterprise Compliance** - IT departments maintain control over corporate accounts
5. **Tool Flexibility** - Work with whatever tools the organization already uses

---

## 📤 Direct Export from Content Generation Points

### Export Locations in SignalDesk

#### 1. **Content Generator (NIVContentOrchestrator)**
After content is generated, users can immediately:
```
[Content Generated]
       ↓
✅ Save to Library | 📤 Export to: [Google Docs] [Office 365] [Dropbox] [Box]
```

#### 2. **Memory Vault**
For saved strategies and content:
```
[Saved Strategies/Content]
       ↓
📂 Open in: [Google Docs] [Word] | 💾 Save to: [Dropbox] [Box] [OneDrive]
```

#### 3. **Content Workspace**
While editing content:
```
[Editing Content]
       ↓
🔄 Continue editing in: [Google Docs] [Word] | 📤 Share via: [Gmail] [Outlook]
```

### Supported Export Destinations

**Document Editing:**
- Google Docs
- Microsoft Word (Office 365)
- Apple Pages

**Cloud Storage:**
- Google Drive
- Dropbox
- Box
- OneDrive
- SharePoint

**Direct Download:**
- .docx (Word)
- .pdf (PDF)
- .md (Markdown)
- .html (HTML)
- .txt (Plain Text)

---

## 📧 Email Draft Creation (Game Changer)

### Concept
Instead of sending emails, create **drafts in user's email client** for review and sending.

### Workflow
```
1. SignalDesk generates pitch/email content
2. User selects "Create Draft in: [Gmail/Outlook]"
3. Draft appears in user's Drafts folder
4. User reviews, personalizes, and sends when ready
```

### Key Benefits
- **Personalization** - Users can add personal touches before sending
- **Native Features** - Uses their email signatures, tracking pixels, etc.
- **Contact Access** - Leverages their existing address book
- **Legal Protection** - Nothing sent without explicit user action
- **Scheduling** - Users can schedule sends through their email client

### Implementation Example - Gmail
```javascript
async function createGmailDraft(emailContent) {
  const draft = {
    message: {
      to: emailContent.recipient,
      subject: emailContent.subject,
      body: emailContent.body,
      cc: emailContent.cc || '',
      attachments: emailContent.attachments || []
    }
  }

  // Creates draft without sending
  const response = await gmailAPI.users.drafts.create({
    userId: 'me',
    resource: draft
  })

  // User can now open and send from Gmail
  return response.data.id
}
```

### Use Cases

**Media Pitches:**
- Generate personalized pitches for journalist list
- Create 20+ draft emails in user's Gmail
- User reviews each and sends individually

**Executive Communications:**
- Board updates as drafts for CEO review
- Investor letters with attachments ready to send
- All-hands messages pre-loaded for scheduling

**Crisis Response:**
- Pre-drafted statements for legal review
- Stakeholder updates ready to customize
- Media responses with approved messaging

---

## 🔧 Implementation Strategy

### Phase 1: Basic Export (Week 1-2)
**Objective**: Enable document export and downloads

**Deliverables:**
- Download buttons for all content types
- Basic file format conversions (.docx, .pdf, .txt)
- Google Docs one-click open
- Microsoft Word one-click open

**Implementation:**
```javascript
// Simple export button component
<ExportButton
  content={generatedContent}
  options={['download', 'google-docs', 'word']}
/>
```

### Phase 2: Cloud Storage Integration (Week 3-4)
**Objective**: Direct save to cloud storage

**Deliverables:**
- Google Drive integration via Picker API
- Dropbox integration via Saver API
- OneDrive integration via File Picker
- Box integration via Content Picker

**Key APIs:**
- Google Picker API (easiest)
- Dropbox Chooser/Saver
- Microsoft OneDrive File Picker
- Box Content Picker

### Phase 3: Email Draft Creation (Week 5-6)
**Objective**: Create email drafts in user accounts

**Deliverables:**
- Gmail draft creation via Gmail API
- Outlook draft creation via Microsoft Graph
- Bulk draft creation for media lists
- Template preservation in drafts

**Authentication:**
- OAuth 2.0 for Gmail
- OAuth 2.0 for Office 365
- User consent for draft creation only

---

## 🏗️ Technical Architecture

### Authentication Flow
```
User Settings
    ↓
"Connect Services"
    ↓
OAuth to Gmail/Outlook/Google Drive/etc
    ↓
Tokens stored securely (encrypted)
    ↓
Available for export operations
```

### Security Considerations
- **Token Storage**: Encrypted in database
- **Scope Limitation**: Only request necessary permissions
- **Token Refresh**: Automatic refresh for expired tokens
- **Revocation**: Users can disconnect services anytime
- **Audit Log**: Track all export operations

### API Requirements

**Google Workspace:**
- Gmail API (drafts.create scope)
- Drive API (file.create scope)
- Docs API (document.create scope)

**Microsoft 365:**
- Microsoft Graph API
- Mail.ReadWrite (for drafts)
- Files.ReadWrite (for OneDrive)

**Storage Providers:**
- Dropbox API v2
- Box API 2.0
- Standard OAuth 2.0 flows

---

## 📊 User Experience Flow

### For Press Releases
```
Generate PR → Review → Export Options:
├── Open in Google Docs (for team editing)
├── Save to Dropbox (for archive)
├── Create Email Draft (for distribution)
└── Download as PDF (for wire service)
```

### For Social Media Posts
```
Generate Posts → Select Platforms → Export:
├── Download as CSV (for social media manager)
├── Save to Google Sheets (for approval workflow)
├── Create Slack Message (for team review)
└── Copy to Clipboard (for manual posting)
```

### For Media Pitches
```
Generate Pitches → Personalize → Create Drafts:
├── Create 20 Gmail drafts
├── Each with journalist's name/beat
├── Attachments included
└── Ready for final review and send
```

### For GEO Schemas (AI Visibility)
```
Generate/Optimize Schema → Review → Deploy:
├── Push to CDN (auto-update on website)
├── Update WordPress Plugin (via WP REST API)
├── Sync to Shopify (via Shopify API)
├── Update Webflow (via Webflow API)
├── Download JSON-LD (manual implementation)
└── Copy HTML snippet (paste in <head>)
```

---

## 🤖 GEO Schema Publishing (AI Visibility Integration)

### Concept
Automatically deploy optimized JSON-LD schemas to user websites for improved AI agent visibility (ChatGPT, Claude, Perplexity, Gemini).

### Deployment Methods

#### 1. **CDN Hosting (Recommended)**
SignalDesk hosts schemas on CDN, user includes single script tag:

```html
<!-- User adds once to website <head> -->
<script src="https://schemas.signaldesk.com/loader.js"
        data-org-id="org_123"></script>

<!-- Auto-loads all active schemas -->
<!-- Updates in real-time when changed in SignalDesk -->
```

**Benefits:**
- One-time setup
- Auto-updates when schemas change
- No manual deployment
- Version control maintained
- Rollback capability

#### 2. **CMS/Platform Plugins**

**WordPress Plugin:**
- Install via WordPress plugin directory
- OAuth connection to SignalDesk account
- Auto-syncs schemas from SignalDesk
- Displays schema validation in WP admin
- Updates in real-time

**Shopify App:**
- Install from Shopify App Store
- Connects to SignalDesk
- Syncs Product, Organization, Offer schemas
- Auto-updates when products change

**Webflow Integration:**
- Custom code component
- Connects via API
- Syncs schemas to site code
- Updates on publish

**Implementation:**
```javascript
// WordPress plugin auto-sync
add_action('wp_head', function() {
  $schemas = fetch_signaldesk_schemas(get_option('signaldesk_org_id'));
  foreach ($schemas as $schema) {
    echo '<script type="application/ld+json">';
    echo json_encode($schema->content);
    echo '</script>';
  }
});
```

#### 3. **API Endpoint Access**
For custom implementations:

```javascript
// User's website fetches schemas
GET https://api.signaldesk.com/v1/schemas/org_123/active

Response:
{
  schemas: [
    { "@context": "https://schema.org", "@type": "Organization", ... },
    { "@context": "https://schema.org", "@type": "Product", ... }
  ],
  lastUpdated: "2025-10-26T14:00:00Z",
  deploymentUrl: "https://schemas.signaldesk.com/org_123/all.json"
}

// Inject into page
```

#### 4. **Manual Export Options**

**Download Formats:**
- JSON-LD file (all.json)
- Individual schema files (organization.json, product.json)
- HTML snippet (ready to paste)
- Google Tag Manager tag (import and deploy)
- WordPress plugin code (self-hosted)

**Use Case:** For developers who want full control or custom implementations

#### 5. **Direct Platform Integrations**

**Squarespace:**
- Code injection in Settings → Advanced
- Auto-update via API

**Wix:**
- Custom HTML element
- Velo code for dynamic updates

**HubSpot:**
- Site settings header HTML
- API integration for auto-sync

### Schema Validation System

**Pre-Deployment Validation:**
```
1. User updates schema in SignalDesk
   ↓
2. Auto-validate against schema.org
   ↓
3. Check for required fields
   ↓
4. Test JSON-LD syntax
   ↓
5. If valid → Mark ready for deployment
   If invalid → Show errors, block deployment
```

**Post-Deployment Verification:**
```
1. Schema deployed via chosen method
   ↓
2. SignalDesk crawls user's website (via Firecrawl)
   ↓
3. Extracts actual schemas from page
   ↓
4. Compares to expected schemas
   ↓
5. If match → Mark as "Active ✓"
   If mismatch → Alert user with diff
   If missing → "Deployment failed" notification
```

### Deployment Tracking

**Database Schema:**
```sql
CREATE TABLE schema_deployments (
  id UUID PRIMARY KEY,
  schema_id UUID REFERENCES schemas(id),
  organization_id UUID REFERENCES organizations(id),

  -- Deployment method
  method VARCHAR(50), -- 'cdn', 'wordpress', 'shopify', 'api', 'manual'
  status VARCHAR(20), -- 'pending', 'active', 'failed', 'archived'

  -- Deployment details
  deployment_url TEXT, -- Where it's deployed
  platform_data JSONB, -- Platform-specific details

  -- Validation
  last_validated TIMESTAMPTZ,
  validation_status VARCHAR(20), -- 'verified', 'mismatch', 'missing'
  validation_errors JSONB,

  -- Tracking
  deployed_at TIMESTAMPTZ,
  last_synced TIMESTAMPTZ,
  sync_frequency VARCHAR(20), -- 'realtime', 'hourly', 'daily', 'manual'

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### User Experience Flow

**Initial Setup:**
```
1. User generates/optimizes schemas in SignalDesk
2. Clicks "Deploy Schemas"
3. Chooses deployment method:
   - "Auto-deploy via CDN" (easiest)
   - "Install WordPress Plugin"
   - "Connect Shopify"
   - "Download JSON-LD" (manual)
4. Follows platform-specific setup (one-time)
5. Schemas automatically sync from then on
```

**Ongoing Updates:**
```
1. User updates schema in SignalDesk (or NIV auto-updates)
2. Schema auto-deploys based on method:
   - CDN: Instant update
   - WordPress: Syncs on next page load
   - Shopify: Syncs within 1 minute
   - API: Syncs per user's implementation
   - Manual: User notified to re-export
3. Validation runs automatically
4. User sees "Schema updated ✓" notification
```

### Platform-Specific Considerations

**WordPress:**
- REST API for authentication
- Custom endpoint for schema sync
- Caching compatibility (purge on update)
- Multisite support

**Shopify:**
- Shopify API for product data
- Auto-sync with product updates
- Theme integration
- Shopify Plus features

**Webflow:**
- Custom code components
- CMS collection integration
- Publish hooks
- Staging vs. production

### Integration with Export Connectors

**Unified Export UI:**
```jsx
<ExportButton content={schema}>
  <ExportOption icon={<Globe />} label="Deploy to Website">
    <DeployOption method="cdn" status="connected" />
    <DeployOption method="wordpress" status="available" />
    <DeployOption method="shopify" status="available" />
  </ExportOption>

  <ExportOption icon={<Download />} label="Download">
    <DownloadFormat type="json-ld" />
    <DownloadFormat type="html" />
    <DownloadFormat type="gtm" />
  </ExportOption>

  <ExportOption icon={<Code />} label="Get API Endpoint">
    <CopyableUrl url="https://api.signaldesk.com/v1/schemas/org_123/active" />
  </ExportOption>
</ExportButton>
```

### Security & Compliance

**Schema Hosting:**
- CDN with SSL/TLS
- Read-only public access
- Rate limiting
- DDoS protection

**Platform Connections:**
- OAuth 2.0 for CMS platforms
- Encrypted credential storage
- Scope limitation (only schema deployment)
- User can revoke anytime

**Data Privacy:**
- Schemas are public by nature (visible in HTML)
- No PII in schemas
- User controls what data is included

### Performance Monitoring

**Track Deployment Success:**
- % of schemas successfully deployed
- Average deployment time
- Validation success rate
- Platform-specific success rates

**AI Visibility Impact:**
- Citation rate before/after schema deployment
- Rank improvement in AI responses
- Platform-specific performance (ChatGPT vs Claude)

---

## 🎯 Benefits Summary

### For Users
- Work with familiar tools
- No learning curve for new systems
- Maintain control over distribution
- Leverage existing workflows

### For SignalDesk
- No liability for content distribution
- Reduced infrastructure needs
- No social media API maintenance
- Clear value proposition

### For Enterprise
- IT maintains control
- Compliance requirements met
- Audit trail maintained
- No shadow IT concerns

---

## 📅 Rollout Timeline

**Month 1:**
- Basic export functionality
- Download options
- Google Docs integration
- GEO schema CDN hosting

**Month 2:**
- Cloud storage providers
- Email draft creation
- Bulk operations
- WordPress/Shopify schema plugins

**Month 3:**
- Advanced integrations
- Workflow automation
- Enterprise features
- Multi-platform schema variants
- Schema A/B testing

---

## 🚀 Quick Wins

1. **Add "Open in Google Docs" button** - 1 day implementation
2. **Enable PDF download** - Already partially built
3. **Create Gmail draft API proof of concept** - 2-3 days
4. **Add Dropbox Saver** - 1 day with their SDK

---

## 📝 Next Steps

1. **Prioritize integrations** based on user feedback
2. **Start with Google Workspace** (most common)
3. **Build reusable export component** for consistency
4. **Create OAuth connection manager** in settings
5. **Design permission request flow** for user clarity

---

## 🔑 Key Success Metrics

- **Export Usage Rate**: % of generated content exported
- **Integration Adoption**: Number of connected services per user
- **Draft-to-Send Rate**: % of drafts that become sent emails
- **Time Savings**: Reduction in distribution time
- **User Satisfaction**: Feedback on workflow improvement

---

*This strategy positions SignalDesk as the intelligence and content generation hub while respecting existing enterprise workflows and maintaining compliance standards.*