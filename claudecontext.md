# 🚀 SignalDesk Platform Documentation

SignalDesk is a comprehensive AI-powered PR platform built with React frontend and Node.js/Express backend, featuring deep Claude AI integration for intelligent PR assistance. The platform features a unified project-based architecture where MemoryVault serves as the central hub for each project.

**Demo Access**: demo@signaldesk.com / password

## 📋 Table of Contents

1. [Current Architecture](#current-architecture)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Features Status](#features-status)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Development Guide](#development-guide)
8. [Claude Integration Patterns](#claude-integration-patterns)
9. [Recent Updates](#recent-updates)
10. [Common Issues & Solutions](#common-issues--solutions)
11. [Next Steps](#next-steps)

## Current Architecture

### Overview

SignalDesk is a unified, project-based platform where:

- **Homepage**: AI-powered assistant interface (SignalDesk Assistant)
- **Projects**: All work is organized by project
- **MemoryVault**: Project homepage and centralized content storage
- **Project Features**: All PR tools accessible via sidebar navigation
- **Natural Language**: AI assistant can execute any platform feature

### Navigation Flow

```
Login → Homepage (AI Assistant) → Projects List → Project (MemoryVault)
                                                   ├── AI Assistant
                                                   ├── Content Generator
                                                   ├── Media List Builder
                                                   ├── Campaign Intelligence
                                                   ├── AI Monitoring
                                                   ├── Crisis Command
                                                   └── Reports
```

### Key Components

1. **Homepage**: Central AI assistant for natural language interactions
2. **Project System**: All work organized by project with MemoryVault as landing
3. **MemoryVault**: Project homepage showing all content and AI insights
4. **Sidebar Navigation**: Project-specific features accessible from sidebar
5. **Adaptive Layout**: Single Layout component that adapts to project context
6. **Floating AI Assistant**: Global assistant available on all pages except homepage

## Technology Stack

### Frontend

- **Framework**: React 18 with React Router v6
- **Icons**: Lucide React (comprehensive icon set)
- **Styling**: Custom CSS with inline styles for consistency
- **State Management**: Context API (AuthContext, ProjectContext)
- **HTTP Client**: Direct fetch calls
- **API Base URL**: http://localhost:5001
- **Layout System**: Adaptive Layout component with project awareness

### Backend

- **Runtime**: Node.js with Express
- **Port**: 5001
- **Database**: PostgreSQL with pg package
- **Authentication**: JWT with bcrypt
- **AI Integration**: @anthropic-ai/sdk
- **AI Model**: claude-3-5-sonnet-20241022
- **Claude Service**: Singleton instance with sendMessage() and sendConversation()
- **File Uploads**: Multer
- **RSS Parser**: rss-parser package
- **Middleware**: Custom authMiddleware for protected routes

## Project Structure

```
SignalDesk/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── Layout.js          # Adaptive project-aware layout
│   │   │   │   ├── Layout.css         # Sidebar and layout styles
│   │   │   │   ├── Header.js          # (empty - not used)
│   │   │   │   └── Sidebar.js         # (optional)
│   │   │   ├── Homepage.js            # AI Assistant landing
│   │   │   ├── MemoryVault.js         # Project homepage
│   │   │   ├── ProjectList.js         # Projects management
│   │   │   ├── Login.js               # Authentication
│   │   │   ├── AIAssistant.js         # Chat interface
│   │   │   ├── ContentGenerator.js    # Content creation
│   │   │   ├── MediaListBuilder.js    # Media contacts
│   │   │   ├── CampaignIntelligence.js # Strategic planning
│   │   │   ├── CrisisCommandCenter.js # Crisis management
│   │   │   ├── FloatingAIAssistant.js # Global AI assistant
│   │   │   └── Monitoring/
│   │   │       └── AISentimentMonitor.js
│   │   ├── contexts/
│   │   │   ├── AuthContext.js         # Authentication state
│   │   │   └── ProjectContext.js      # Project management
│   │   ├── hooks/
│   │   │   └── useMemoryVault.js      # Auto-save functionality
│   │   └── App.js                     # Route configuration
│   └── package.json
│
└── backend/
    ├── routes/
    │   ├── projectRoutes.js           # Project & MemoryVault
    │   ├── aiRoutes.js                # Natural language
    │   └── [feature routes]
    ├── config/
    │   ├── claude.js                  # ClaudeService
    │   └── database.js                # PostgreSQL pool
    └── server.js                      # Express app (port 5001)
```

Project Context Integration
Every feature in SignalDesk operates within a project context:

Project-Aware Routing: All features use /projects/:projectId/feature-name pattern
Shared Project Context: Features access current project via useProject() hook
Auto-Save to MemoryVault: All features can save content directly to project's MemoryVault
Cross-Feature Integration: Content flows seamlessly between features through MemoryVault

MemoryVault as Central Hub
MemoryVault serves as the project's central content repository:

Automatic Folder Structure: 5 default folders created per project

Press Releases
Media Coverage
Campaign Strategy
Crisis Management
Analytics & Reports

Feature Integration Points:

Content Generator → saves to Press Releases folder
Media List Builder → saves contacts to Campaign Strategy
Crisis Command → saves plans to Crisis Management
AI Monitoring → saves reports to Analytics folder

AI Analysis: Every saved item receives AI scoring and insights
Search & Discovery: Full-text search across all project content

Add to "Key Development Patterns" section: 4. Project Context Pattern
javascript// Every feature component uses project context
import { useProject } from '../contexts/ProjectContext';

const FeatureComponent = () => {
const { selectedProject } = useProject();

// Feature automatically scoped to current project
const fetchData = async () => {
const response = await fetch(`/api/feature-endpoint`, {
headers: {
'Authorization': `Bearer ${token}`,
},
body: JSON.stringify({
projectId: selectedProject?.id
})
});
};
}; 5. MemoryVault Integration Pattern
javascript// Auto-save pattern used across all features
import { useMemoryVault } from '../hooks/useMemoryVault';

const ContentGenerator = () => {
const { saveToMemoryVault } = useMemoryVault();
const { selectedProject } = useProject();

const handleSave = async () => {
const result = await saveToMemoryVault({
content: generatedContent,
title: contentTitle,
type: 'press-release',
source: 'content-generator',
folder_type: 'press-releases',
tags: ['pr', 'announcement'],
metadata: {
generated_at: new Date(),
project_id: selectedProject?.id
}
});
};
}; 6. SaveToMemoryVaultButton Component
javascript// Reusable save button component
import SaveToMemoryVaultButton from './MemoryVault/SaveToMemoryVaultButton';

<SaveToMemoryVaultButton
content={JSON.stringify(data, null, 2)}
title="Crisis Management Plan"
type="crisis-plan"
source="crisis-command-center"
folder_type="crisis-management"
tags={['crisis', 'plan']}
metadata={{
    generated_at: new Date(),
    project_id: selectedProject?.id
  }}
/>
Add new section "Feature Integration with MemoryVault":
Feature Integration with MemoryVault
Each feature in SignalDesk is designed to save relevant content to MemoryVault:
Content Generator

Saves to: Press Releases folder
Content Types: Press releases, blog posts, social media content
Auto-Save: Triggered on content generation
Metadata: Includes content type, tone, word count

Media List Builder

Saves to: Campaign Strategy folder
Content Types: Media contacts, journalist profiles, outlet information
Auto-Save: On contact creation/update
Metadata: Contact details, beat, outlet, last contacted

Campaign Intelligence

Saves to: Campaign Strategy folder
Content Types: Strategic plans, competitor analysis, market insights
Auto-Save: On strategy creation
Metadata: Campaign goals, KPIs, timeline

Crisis Command Center

Saves to: Crisis Management folder
Content Types: Crisis plans, response templates, decision logs
Auto-Save: On plan generation, during active crisis
Metadata: Crisis type, severity, response team

AI Monitoring

Saves to: Analytics & Reports folder
Content Types: Sentiment reports, trend analysis, alerts
Auto-Save: On report generation
Metadata: Date range, sources analyzed, sentiment scores

Reports

Saves to: Analytics & Reports folder
Content Types: Campaign reports, executive summaries, analytics
Auto-Save: On report generation
Metadata: Report type, date range, metrics included

Cross-Feature Content Flow
Content saved in MemoryVault can be accessed and used by other features:

Content Reuse: Press releases from Content Generator can be referenced in Reports
Contact Integration: Media contacts from Media List Builder available in Campaign Intelligence
Crisis Templates: Crisis plans accessible during active crisis scenarios
Analytics Aggregation: Data from all features compiled in Reports

MemoryVault API Integration
javascript// Backend route handling
router.post('/api/projects/:projectId/memoryvault', authMiddleware, async (req, res) => {
const { projectId } = req.params;
const { content, title, type, source, folder_type, tags, metadata } = req.body;

// Auto-select folder based on folder_type
const folder = await getFolderByType(projectId, folder_type);

// Save with AI analysis
const item = await saveToMemoryVault({
project_id: projectId,
folder_id: folder.id,
content,
title,
type,
source,
tags,
metadata,
ai_insights: await analyzeContent(content)
});

res.json({ success: true, item });
});

## Features Status

### ✅ Core Infrastructure

1. **Authentication System**

   - JWT-based authentication
   - Protected routes with automatic redirects
   - User session management

2. **Project Management**

   - Create, update, delete projects
   - Project context maintained across features
   - MemoryVault as project homepage
   - Project-specific navigation

3. **Adaptive Layout**

   - Single Layout component adapts to context
   - Global navigation for non-project routes
   - Project navigation with black sidebar
   - Collapsible sidebar with project indicator
   - Mobile-responsive with proper header handling

4. **MemoryVault (Project Homepage)**

   - Landing page for each project
   - 5 automatic folders per project
   - AI analysis on saved content
   - Search and filter capabilities
   - Templates management
   - Project header with stats

5. **UI/UX Consistency**
   - Black sidebar with white text across project pages
   - Consistent navigation patterns
   - Floating AI Assistant on all pages except homepage
   - Responsive design with mobile menu support

### ✅ Fully Functional Features

All features accessible via project sidebar:

1. **AI Assistant** - Real-time chat with project context
2. **Content Generator** - AI-powered content creation
3. **Media List Builder** - Journalist database management
4. **Campaign Intelligence** - Strategic planning tools
5. **AI Monitoring** - Advanced sentiment analysis dashboard with Claude integration
6. **Crisis Command** - Crisis management hub
7. **Reports** - Analytics and exports
8. **Homepage AI** - Natural language interface for platform navigation

### 🏗️ Ready to Implement

- Auto-save integration for all features
- Cross-feature content flow
- Team collaboration
- Advanced analytics

## Database Schema

### Project Tables

```sql
-- Projects table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  campaign VARCHAR(255),
  industry VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Active',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MemoryVault folders
CREATE TABLE memoryvault_folders (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  folder_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MemoryVault items
CREATE TABLE memoryvault_items (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  folder_id INTEGER NOT NULL REFERENCES memoryvault_folders(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  preview TEXT,
  type VARCHAR(100),
  tags TEXT[],
  author VARCHAR(255),
  status VARCHAR(50),
  ai_score INTEGER,
  ai_insights JSONB,
  views INTEGER DEFAULT 0,
  starred BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

-- All feature tables reference projects
CREATE TABLE media_contacts (
id SERIAL PRIMARY KEY,
project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
memoryvault_item_id INTEGER REFERENCES memoryvault_items(id),
-- ... other fields
);

CREATE TABLE crisis_plans (
id SERIAL PRIMARY KEY,
project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
memoryvault_item_id INTEGER REFERENCES memoryvault_items(id),
-- ... other fields
);

-- Cross-reference table for content relationships
CREATE TABLE content_relationships (
id SERIAL PRIMARY KEY,
source_item_id INTEGER REFERENCES memoryvault_items(id),
target_item_id INTEGER REFERENCES memoryvault_items(id),
relationship_type VARCHAR(50),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

## API Documentation

### Base URL

All API endpoints use: `http://localhost:5001/api`

### Project & MemoryVault Endpoints

```
GET    /api/projects                          # List user's projects
POST   /api/projects                          # Create project
PUT    /api/projects/:id                      # Update project
DELETE /api/projects/:id                      # Delete project

GET    /api/projects/:projectId/memoryvault   # Get MemoryVault items
POST   /api/projects/:projectId/memoryvault   # Save to MemoryVault
PUT    /api/memoryvault/items/:id            # Update item
DELETE /api/memoryvault/items/:id            # Delete item
```

## Current State of Media List Builder (July 2025)

### Overview

The Media List Builder is now fully functional with real API integration for discovering journalists using natural language search queries. It uses Google Custom Search API and News API to find relevant journalists based on user queries.

### Key Features Implemented

1. **Natural Language Search**: Users can describe the type of journalists they're looking for in plain English
2. **Real API Integration**:
   - Google Custom Search API for web-based journalist discovery
   - News API for finding journalists from recent articles
   - AI enrichment using Claude for relevance scoring and insights
3. **List Management**: Save, load, and delete media lists
4. **Export Functionality**: Export selected journalists to CSV
5. **MemoryVault Integration**: Automatically saves lists to the MemoryVault system
6. **Filtering**: Filter results by beat, publication, and location
7. **Project Context**: Fully integrated with the project management system

### Technical Implementation

#### Frontend Component (`MediaListBuilder.js`)

- **Location**: `frontend/src/components/MediaListBuilder.js`
- **Dependencies**:
  - React hooks (useState, useEffect)
  - Context hooks (useAuth, useProject, useMemoryVault)
  - Lucide React icons
- **Key State Variables**:
  - `searchQuery`: The natural language search query
  - `journalists`: Array of discovered journalists
  - `selectedJournalists`: Array of selected journalist names
  - `savedLists`: Array of saved media lists
  - `filters`: Object containing beat, publication, location filters

#### Backend Services

1. **Media Routes** (`backend/routes/media.js`):

   - `POST /api/media/discover`: Main endpoint for journalist discovery
   - `GET /api/media/lists/:projectId`: Get saved lists for a project
   - `POST /api/media/lists`: Save a new media list
   - `DELETE /api/media/lists/:id`: Delete a media list
   - `GET /api/media/lists/:id/journalists`: Get journalists from a specific list

2. **Media Search Service** (`backend/services/mediaSearchService.js`):

   - Integrates with Google Custom Search API
   - Integrates with News API
   - Performs journalist deduplication
   - Enriches data with AI insights using Claude
   - Calculates relevance scores

3. **Database Schema**:

   ```sql
   -- media_lists table
   CREATE TABLE media_lists (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     project_id INTEGER REFERENCES projects(id),
     search_query TEXT,
     journalist_count INTEGER DEFAULT 0,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- journalists table
   CREATE TABLE journalists (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     publication VARCHAR(255),
     beat VARCHAR(255),
     location VARCHAR(255),
     bio TEXT,
     twitter VARCHAR(255),
     linkedin VARCHAR(255),
     email VARCHAR(255),
     website VARCHAR(255),
     relevance_score INTEGER,
     source VARCHAR(50),
     ai_insights TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Junction table
   CREATE TABLE media_list_journalists (
     media_list_id INTEGER REFERENCES media_lists(id),
     journalist_id INTEGER REFERENCES journalists(id),
     PRIMARY KEY (media_list_id, journalist_id)
   );
   ```

### API Configuration Required

The following environment variables must be set in `.env`:

```
GOOGLE_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
NEWS_API_KEY=your_news_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Authentication Flow

- The Media List Builder requires authentication
- Uses JWT tokens stored in localStorage
- Integrated with AuthContext for user state management
- PrivateRoute component protects the route

### Known Issues Resolved

1. ✅ Fixed authentication context to properly expose token
2. ✅ Fixed JSX syntax errors in social media links
3. ✅ Integrated with real APIs instead of mock data
4. ✅ Fixed project context integration (activeProject vs selectedProject)
5. ✅ Added proper error handling and loading states

### Usage Flow

1. User must be logged in to access the Media List Builder
2. User must select a project from the sidebar
3. User enters a natural language query (e.g., "Tech journalists covering AI startups")
4. System searches using Google and News APIs
5. Results are enriched with AI insights
6. User can filter, select, and export journalists
7. Lists can be saved for future use

### Example Queries That Work Well

- "Tech journalists covering startups"
- "Healthcare reporters in New York"
- "Business writers at WSJ"
- "Climate change journalists"
- "Environmental reporters at major publications"

### Integration Points

- **MemoryVault**: Automatically saves lists with metadata
- **Project Context**: Lists are associated with the active project
- **Authentication**: Requires valid JWT token for all operations

### Future Enhancements to Consider

1. Email outreach integration
2. Twitter/X API integration for real-time journalist data
3. LinkedIn integration for professional profiles
4. Journalist engagement tracking
5. Pitch success rate analytics
6. Advanced filtering by article recency
7. Bulk journalist import from CSV

## Current State of AI Sentiment Monitor (July 2025)

### Overview

The AI Sentiment Monitor is a comprehensive brand monitoring and sentiment analysis system that leverages Claude AI for intelligent PR insights. It provides real-time monitoring of brand mentions across RSS feeds, website changes, and social media with automated sentiment analysis and crisis detection.

### Key Features Implemented

1. **Multi-Tab Interface**:
   - **Live Feed**: Real-time display of brand mentions with sentiment analysis
   - **Data Sources**: Keyword input and RSS feed configuration for monitoring
   - **Agent Config**: Website monitoring and update intervals
   - **Brand Statistics**: Comprehensive analytics and visualizations
   - **Alerts**: Configurable alert rules and notifications
   - **AI Config**: Claude AI settings and analysis parameters

2. **Data Sources**:
   - RSS feed aggregation from 25+ major news sources
   - Website change monitoring (planned)
   - Real-time sentiment analysis using Claude AI
   - Batch analysis capabilities for historical data

3. **Claude AI Integration**:
   - Sentiment analysis (positive, negative, neutral, mixed)
   - PR implications assessment
   - Crisis detection and urgency levels
   - Actionable insights and recommendations
   - Configurable AI models (Opus, Sonnet, Haiku)

4. **Analytics & Reporting**:
   - Sentiment distribution charts (pie, area, bar)
   - Historical trend analysis
   - Source analytics and top mentions
   - Export functionality (CSV, JSON, PDF planned)

5. **Alert System**:
   - Negative sentiment threshold alerts
   - Volume spike detection
   - Keyword-based alerts
   - Crisis detection alerts
   - Multiple notification channels (in-app, email, SMS, Slack)

### Technical Implementation

#### Frontend Component (`AISentimentMonitor.js`)

- **Location**: `frontend/src/components/Monitoring/AISentimentMonitor.js`
- **Styling**: Inline styles following CrisisCommandCenter.js pattern
- **State Management**:
  - `monitoringFeed`: Array of mentions with analysis
  - `claudeConfig`: AI configuration settings
  - `alertConfig`: Alert rules and thresholds
  - `monitoredWebsites`: Websites being tracked
  - `searchKeywords`: Keywords for filtering mentions
  - `dataSourceConfig`: RSS feed and source configuration
  - `selectedTab`: Current active tab
- **Caching**: Uses ProjectContext for state persistence across navigation

#### Backend Services

1. **Monitoring Routes** (`backend/src/routes/monitoringRoutes.js`):
   - `POST /api/monitoring/config`: Save monitoring configuration
   - `GET /api/monitoring/config`: Get saved configuration
   - `POST /api/monitoring/analyze-sentiment`: Analyze single mention
   - `POST /api/monitoring/analyze-batch`: Batch analysis
   - `POST /api/monitoring/fetch-rss`: Fetch RSS feeds

2. **Monitoring Controller** (`backend/src/controllers/monitoringController.js`):
   - Integrates with Claude AI for sentiment analysis
   - RSS feed parsing with keyword filtering
   - Fallback analysis when Claude unavailable
   - Database persistence for analyses

3. **Database Schema**:
   ```sql
   -- monitoring_configs table
   CREATE TABLE monitoring_configs (
     user_id INTEGER PRIMARY KEY,
     config_type VARCHAR(50),
     config_data JSONB,
     updated_at TIMESTAMP
   );

   -- monitoring_analyses table
   CREATE TABLE monitoring_analyses (
     id SERIAL PRIMARY KEY,
     user_id INTEGER,
     text TEXT,
     source VARCHAR(255),
     analysis JSONB,
     created_at TIMESTAMP
   );

   -- monitoring_mentions table
   CREATE TABLE monitoring_mentions (
     id SERIAL PRIMARY KEY,
     user_id INTEGER,
     mention_id VARCHAR(255),
     content TEXT,
     source VARCHAR(255),
     sentiment VARCHAR(50),
     analysis JSONB,
     publish_date TIMESTAMP
   );
   ```

### AI Analysis Structure

Claude returns structured analysis for each mention:
```json
{
  "sentiment": "positive|negative|neutral|mixed",
  "sentiment_score": -100 to 100,
  "confidence": 0 to 1,
  "summary": "Brief summary of the mention",
  "rationale": "Why this sentiment was assigned",
  "key_topics": ["topic1", "topic2"],
  "urgency_level": "low|medium|high|critical",
  "actionable_insights": "Recommendations or null",
  "recommended_action": "Suggested response or null"
}
```

### Configuration Options

1. **Data Sources Configuration**:
   - Keywords management for RSS feed filtering
   - Source type selection (Demo, RSS, Custom API)
   - RSS feed category selection
   - Update interval settings

2. **Agent Configuration**:
   - Website monitoring URLs
   - Monitoring frequency settings
   - Event-specific templates (Milken, Davos, CES)

2. **AI Configuration**:
   - Enable/disable Claude analysis
   - Model selection (Opus, Sonnet, Haiku)
   - Temperature settings (0-1)
   - Custom analysis instructions
   - PR implications analysis toggles
   - Brand context and key topics

3. **Alert Configuration**:
   - Negative sentiment thresholds
   - Volume spike percentages
   - Critical keywords monitoring
   - Notification channel preferences

### RSS Feed Sources

The system monitors 25+ RSS feeds including:
- Technology: TechCrunch, The Verge, Wired, Ars Technica
- Business: Reuters, BBC Business, Bloomberg, Financial Times
- Press Releases: PR Newswire, Business Wire, GlobeNewswire
- Marketing: Marketing Week, AdWeek, Marketing Land
- Forums: Reddit Technology, Hacker News, Product Hunt

### Recent Updates (July 2025)

1. **Complete UI Implementation**:
   - All tabs fully functional with inline styling
   - Fixed duplicate style attributes error
   - Added missing computed values (sentimentCounts, sourceCounts)
   - Implemented project-aware caching to prevent auto-refresh

2. **Data Sources Tab**:
   - Added Data Sources tab for RSS feed configuration
   - Moved keywords from Agent Config to Data Sources tab
   - Keywords now properly integrated with monitoring functionality
   - Source type selection (Demo, RSS Feeds, Custom API)
   - RSS feed category selection and update intervals

3. **Keywords Management**:
   - Keywords input now in Data Sources tab for actual monitoring
   - Visual keyword tags with remove functionality
   - Keywords properly passed to RSS feed filtering
   - Real-time keyword updates reflected in feed fetching

4. **API Service Integration**:
   - Added all monitoring API functions to api.js
   - Proper error handling and response processing
   - Authentication headers on all requests
   - Fixed hardcoded "meta" keyword issue

5. **Analytics Enhancements**:
   - Real-time metrics calculation
   - Historical data visualization
   - Source distribution analysis
   - Export functionality

6. **Caching System**:
   - Implemented ProjectContext-based caching
   - State preserved when navigating away from component
   - Auto-restore on component remount
   - Prevents unnecessary API calls and data loss

### Integration with MemoryVault

The AI Monitoring system saves important findings to MemoryVault:
- **Folder**: Analytics & Reports
- **Content Types**: Sentiment reports, critical alerts, trend analyses
- **Auto-Save**: Triggered on significant findings or manual export
- **Metadata**: Includes date range, sources, sentiment scores

### Usage Flow

1. User selects project and navigates to AI Monitoring
2. Configures keywords in Data Sources tab for RSS monitoring
3. Sets up website monitoring in Agent Config if needed
4. System fetches mentions from RSS feeds based on keywords
5. Claude analyzes each mention for sentiment and PR implications
6. Results display in Live Feed with visual indicators
7. Analytics update in real-time in Brand Statistics
8. Alerts trigger based on configured rules
9. Reports can be exported or saved to MemoryVault

### Known Issues Resolved

1. ✅ Fixed all syntax errors and re-declaration issues
2. ✅ Merged styling from migration file
3. ✅ Converted to inline styles following project pattern
4. ✅ Fixed undefined sourceCounts and sentimentCounts
5. ✅ Added keywords management interface
6. ✅ Connected all tabs to Claude API
7. ✅ Fixed "Cannot access 'claudeConfig' before initialization" error
8. ✅ Added Data Sources tab for RSS feed configuration
9. ✅ Moved keywords to correct location (Data Sources tab)
10. ✅ Implemented caching to prevent auto-refresh on navigation

### Future Enhancements to Consider

1. Website screenshot comparison for visual changes
2. Social media monitoring integration
3. Competitor mention tracking
4. Automated PR response generation
5. Trend prediction using historical data
6. Custom RSS feed additions
7. Real-time websocket updates
8. Advanced filtering by date ranges

## Development Guide

### Environment Setup

```bash
# Backend (.env)
PORT=5001
CLAUDE_API_KEY=[REDACTED - Use GitHub Secrets]
JWT_SECRET=signaldesk-jwt-secret-2024
DB_HOST=localhost
DB_NAME=signaldesk
DB_USER=postgres
DB_PASSWORD=your_password

# Start Backend
cd ~/Desktop/SignalDesk/backend
npm run dev

# Start Frontend
cd ~/Desktop/SignalDesk/frontend
npm start
```

### Key Development Patterns

1. **Project-Aware Routing**

   ```javascript
   /projects/:projectId              # MemoryVault (project homepage)
   /projects/:projectId/ai-assistant # AI Assistant for project
   /projects/:projectId/content-generator # Content Generator for project
   // etc.
   ```

2. **Layout Adaptation**

   - Layout.js detects project context via URL
   - Shows appropriate navigation based on route
   - Maintains project context across features
   - Uses CSS classes and inline styles for consistency

3. **Auto-Save Pattern**

   ```javascript
   import { useMemoryVault } from "../hooks/useMemoryVault";

   const { saveToMemoryVault } = useMemoryVault();

   await saveToMemoryVault({
     content: generatedContent,
     title: "Content Title",
     type: "content-type",
     source: "feature-name",
   });
   ```

4. **Floating AI Assistant Control**
   ```javascript
   // FloatingAIAssistant automatically hidden on homepage
   const isHomepage = location.pathname === "/" || location.pathname === "";
   if (isHomepage || isLogin) {
     return null;
   }
   ```

## Claude Integration Patterns

### Frontend Pattern

```javascript
const makeAPICall = async () => {
  try {
    const res = await fetch("http://localhost:5001/api/endpoint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        data,
        projectId: activeProject?.id,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  } catch (error) {
    console.error("Error:", error);
  }
};
```

## Recent Updates

### July 2025 - UI/UX Consistency & Navigation Fixes

- ✅ **Black Sidebar Styling**: Fixed sidebar to properly display black background with white text
- ✅ **Layout CSS Integration**: Properly imported and applied Layout.css styles
- ✅ **Mobile Header Fix**: Hidden mobile header on desktop views using CSS classes
- ✅ **Homepage Redesign**:
  - Black navigation bar matching project sidebar
  - Filled search icon implementation
  - Narrower, centered search bar
  - Improved platform capabilities grid layout
- ✅ **Floating AI Assistant**: Fixed to only appear on non-homepage routes
- ✅ **Navigation Consistency**: SignalDesk logo now consistent across all pages
- ✅ **Inline Styles**: Added inline styles where Tailwind classes weren't applying

### July 2025 - MemoryVault as Project Homepage

- ✅ **Navigation Architecture**: MemoryVault now serves as project landing page
- ✅ **Adaptive Layout**: Single Layout component adapts to project context
- ✅ **Project Sidebar**: All features accessible via sidebar when in project
- ✅ **Enhanced MemoryVault**: Added project header with stats and context
- ✅ **useMemoryVault Hook**: Reusable auto-save functionality

### December 2024 - Project-Based Architecture

- Database schema with project management
- Backend infrastructure for projects
- Frontend project context management
- Initial MemoryVault implementation

## Common Issues & Solutions

### Cache Issues

**Problem**: Changes not reflecting after updates  
**Solution**: Clear all caches

```bash
rm -rf node_modules/.cache
rm -rf .cache
npm start
```

### Import Path Issues

**Problem**: Module not found errors in Layout  
**Solution**: Use correct relative paths

```javascript
// From components/Layout/Layout.js
import { useAuth } from "../../contexts/AuthContext";
```

### CSS Not Applying

**Problem**: Tailwind or CSS classes not working  
**Solution**: Use inline styles for critical styling

```javascript
style={{ backgroundColor: '#1a1d23', color: 'white' }}
```

### Navigation Not Working

**Problem**: Projects not clickable  
**Solution**: Ensure ProjectList has onClick handlers

```javascript
onClick={() => navigate(`/projects/${project.id}`)}
```

### Missing Icon Imports

**Problem**: 'IconName' is not defined errors  
**Solution**: Import missing icons from lucide-react

```javascript
import { Bot, Search, Briefcase } from "lucide-react";
```

## Next Steps

### Immediate

1. Test all features for proper functionality
2. Add auto-save to all features using useMemoryVault hook
3. Enhance project dashboard with analytics
4. Implement cross-feature content flow

### Short-term

1. File upload system for MemoryVault
2. Advanced search and filtering
3. Team collaboration features
4. Performance optimizations

### Long-term

1. AI-powered workflows
2. Predictive content suggestions
3. Enterprise features
4. Mobile app development

## Important Technical Notes

- **MemoryVault First**: Each project lands on MemoryVault as its homepage
- **Sidebar Navigation**: All features accessible from project sidebar
- **Layout Adaptation**: Single Layout.js adapts based on route context
- **Project Context**: Always available via useProject hook
- **Auto-Save Ready**: useMemoryVault hook available for all features
- **Direct Fetch**: Use direct fetch calls with full URLs
- **Cache Clearing**: Essential when making structural changes
- **Styling Priority**: Inline styles > CSS classes for consistency
- **Component Isolation**: FloatingAIAssistant managed globally, not per-page
  Project Scoping: Every API call includes projectId to ensure data isolation
  MemoryVault Hook: useMemoryVault() provides consistent save interface across all features
  Folder Mapping: Each feature maps to specific MemoryVault folders
  AI Analysis: Content automatically analyzed on save with insights stored
  Content Relationships: Items can reference each other for cross-feature workflows
  Consistent Metadata: All saves include source feature, timestamp, and project context
