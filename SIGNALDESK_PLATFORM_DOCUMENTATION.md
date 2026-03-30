# SignalDesk Platform Documentation
*Complete Technical Documentation and Deployment Guide*

**Last Updated:** August 12, 2025  
**Version:** 2.0 (Post-Crisis Fix)  
**Status:** ✅ FULLY OPERATIONAL

---

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [Current Production URLs](#current-production-urls)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Deployment Infrastructure](#deployment-infrastructure)
6. [Key Features](#key-features)
7. [AI Conversation System](#ai-conversation-system)
8. [File Structure](#file-structure)
9. [Authentication](#authentication)
10. [Database Schema](#database-schema)
11. [API Endpoints](#api-endpoints)
12. [Deployment Process](#deployment-process)
13. [Environment Variables](#environment-variables)
14. [Troubleshooting](#troubleshooting)
15. [Recent Fixes](#recent-fixes)
16. [Development Workflow](#development-workflow)

---

## Platform Overview

SignalDesk is an AI-powered PR and content generation platform that helps organizations create professional content through natural conversation with Claude AI. The platform features a sophisticated drag-and-drop interface inspired by Railway's UI design.

### Core Capabilities
- **AI Content Generation**: Natural conversation with Claude to create press releases, thought leadership, social media posts
- **Stakeholder Intelligence**: Analyze and manage stakeholder relationships
- **Campaign Management**: Plan and execute PR campaigns
- **Media Intelligence**: Find journalists and media opportunities
- **Crisis Management**: Handle crisis communications

### What Makes It Unique
- **Natural AI Conversation**: Claude asks contextual questions ONE at a time (no info dumps)
- **Railway-Style UI**: Beautiful draggable panels and smooth animations
- **Real-time Content Generation**: Content appears in dedicated workspace
- **Edit/Preview Modes**: Full control over generated content

---

## Current Production URLs

### Live Production Endpoints
```
Frontend (Vercel):  https://signaldesk-frontend.vercel.app
Backend (Railway):  https://signaldesk-production.up.railway.app
API Base:          https://signaldesk-production.up.railway.app/api
Health Check:      https://signaldesk-production.up.railway.app/api/health
```

### Login Credentials
```
Email:    demo@signaldesk.com
Password: demo123
```

---

## Architecture

### High-Level Architecture
```
┌─────────────────────┐         ┌─────────────────────┐
│                     │         │                     │
│   Vercel Frontend   │◄────────┤   Railway Backend   │
│   (React SPA)       │         │   (Node.js/Express) │
│                     │         │                     │
└─────────────────────┘         └──────────┬──────────┘
                                           │
                                           ▼
                               ┌─────────────────────┐
                               │                     │
                               │  Railway PostgreSQL │
                               │     (Database)      │
                               │                     │
                               └─────────────────────┘
```

### Request Flow
1. User interacts with React frontend (Vercel)
2. Frontend makes API call to Railway backend
3. Backend processes with Express routes
4. Claude AI integration for content generation
5. PostgreSQL for data persistence
6. Response sent back to frontend

---

## Technology Stack

### Frontend (Vercel Deployment)
- **Framework**: React 19.1.0
- **UI Library**: Custom components with Railway-inspired design
- **Icons**: Lucide React
- **Styling**: Inline styles (no CSS framework)
- **State Management**: React Context API
- **HTTP Client**: Native fetch API
- **Build Tool**: Create React App

### Backend (Railway Deployment)
- **Runtime**: Node.js 20 Alpine
- **Framework**: Express 4.18.2
- **AI Integration**: Anthropic Claude SDK 0.56.0
- **Database**: PostgreSQL with pg driver
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Environment**: dotenv for config

### Infrastructure
- **Frontend Host**: Vercel (automatic deployments from GitHub)
- **Backend Host**: Railway (automatic deployments from GitHub)
- **Database**: Railway PostgreSQL
- **Version Control**: GitHub
- **CI/CD**: Automatic on push to main branch

---

## Deployment Infrastructure

### Railway Backend Configuration

#### Railway Setup
```yaml
# railway.yaml
build:
  builder: nixpacks
  buildCommand: npm ci --production=false
deploy:
  startCommand: node index.js
  healthcheckPath: /api/health
  restartPolicyType: always
```

#### Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production --silent
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD ["node", "index.js"]
```

### Vercel Frontend Configuration

#### Vercel Settings
- **Framework Preset**: Create React App
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`
- **Development Command**: `npm start`

#### Automatic Deployments
- Triggered on push to `main` branch
- Preview deployments for pull requests
- Production domain: signaldesk-frontend.vercel.app

---

## Key Features

### 1. AI Content Generator
- **Natural Conversation**: Claude asks one question at a time
- **Content Types**: Press releases, thought leadership, social media, blogs, emails
- **Edit Mode**: Full manual editing of generated content
- **Save/Download**: Export content in various formats

### 2. Railway-Style Draggable UI
- **Draggable Panels**: Smooth drag-and-drop interface
- **Activity Cards**: Visual representation of features
- **Transitions**: Smooth animations between views
- **Dark Theme**: Professional dark UI design

### 3. Stakeholder Intelligence
- **Stakeholder Mapping**: Visual relationship management
- **Influence Analysis**: Track stakeholder influence
- **Engagement Tracking**: Monitor interactions

### 4. Campaign Management
- **Campaign Planning**: Strategic campaign development
- **Timeline Management**: Schedule and track progress
- **Resource Allocation**: Manage campaign resources

---

## AI Conversation System

### Current Implementation (WORKING)

#### Backend: `/backend/routes/aiRoutesClaudeFix.js`
```javascript
// Natural conversation with Claude - strict constraints
const prompt = `You are helping create ${contentType}. Have a NATURAL conversation.

CRITICAL RULES:
1. Ask exactly ONE question
2. Maximum 30 words
3. Be specific and contextual
4. Natural, conversational tone
5. NO tips, lists, or explanations

User: "${message}"
Ask ONE natural question (max 30 words):`;
```

#### Key Components
1. **Conversation State Management**: Tracks message history per user
2. **Content Type Detection**: Identifies when user wants to create content
3. **Generation Triggers**: Recognizes "yes", "generate", "create", etc.
4. **Claude Integration**: Uses claude-3-haiku for fast responses

### Frontend Integration

#### Message Flow
1. User types message in RailwayDraggable.js
2. Direct API call to `/api/ai/unified-chat`
3. No local processing (adaptiveAIService.js is gutted)
4. Response displayed in chat
5. Generated content goes to ContentGeneratorModule

---

## File Structure

### Backend Structure
```
/backend
├── index.js                    # Main server file
├── server.js                   # Entry point for Railway
├── package.json               # Dependencies
├── Dockerfile                 # Docker configuration
├── railway.yaml              # Railway config
│
├── /routes
│   ├── aiRoutesClaudeFix.js  # CURRENT AI implementation
│   ├── aiRoutesFixed.js      # Backup hardcoded version
│   ├── aiRoutes.js           # Original (problematic) version
│   └── authRoutes.js         # Authentication
│
├── /src
│   ├── /config
│   │   ├── database.js      # PostgreSQL connection
│   │   └── db.js            # Database config
│   │
│   ├── /middleware
│   │   └── authMiddleware.js # JWT verification
│   │
│   ├── /routes              # Feature routes
│   │   ├── stakeholderRoutes.js
│   │   ├── campaignRoutes.js
│   │   └── mediaRoutes.js
│   │
│   └── /utils
│       └── claudeInit.js    # Claude SDK initialization
```

### Frontend Structure
```
/frontend
├── package.json              # Dependencies
├── .env.production          # Production environment
│
├── /src
│   ├── index.js             # React entry point
│   ├── App.js              # Main app component
│   │
│   ├── /components
│   │   ├── RailwayDraggable.js        # Main UI component
│   │   ├── ContentGeneratorModule.js  # Content workspace
│   │   ├── Login.js                   # Auth UI
│   │   └── StakeholderIntelligence/  # Feature modules
│   │
│   ├── /contexts
│   │   ├── AuthContext.js            # Authentication state
│   │   └── ProjectContext.js         # Project management
│   │
│   ├── /services
│   │   ├── adaptiveAIService.js      # GUTTED - returns null
│   │   └── apiService.js             # API communication
│   │
│   └── /config
│       ├── api.js                    # API configuration
│       └── apiUrl.js                 # Hardcoded URL
```

---

## Authentication

### JWT Token System
- **Token Generation**: On successful login
- **Token Storage**: localStorage in browser
- **Token Expiry**: 24 hours
- **Token Format**: Bearer token in Authorization header

### Login Flow
1. User enters credentials
2. POST to `/api/auth/login`
3. Backend validates credentials
4. JWT token generated with user info
5. Token stored in localStorage
6. All API requests include token

### Demo User
```javascript
{
  id: '7f39af2e-933c-44e9-b67c-1f7e28b3a858',
  email: 'demo@signaldesk.com',
  name: 'Demo User',
  organization_id: 'demo-org'
}
```

---

## Database Schema

### PostgreSQL Tables

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  organization_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Content Table
```sql
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50),
  content TEXT,
  user_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints

### Authentication Endpoints
```
POST   /api/auth/login          # Login with email/password
GET    /api/auth/verify         # Verify JWT token
POST   /api/auth/logout         # Logout (client-side)
```

### AI Endpoints
```
POST   /api/ai/unified-chat     # Main conversation endpoint
GET    /api/ai/version          # Check AI system version
```

### Content Endpoints
```
GET    /api/content             # Get user's content
POST   /api/content             # Save new content
PUT    /api/content/:id         # Update content
DELETE /api/content/:id         # Delete content
```

### Project Endpoints
```
GET    /api/projects            # Get user's projects
POST   /api/projects            # Create project
PUT    /api/projects/:id        # Update project
DELETE /api/projects/:id        # Delete project
```

---

## Deployment Process

### GitHub → Railway (Backend)

1. **Push to main branch**
```bash
git add .
git commit -m "Your changes"
git push origin main
```

2. **Railway Auto-Deploy**
- Webhook triggers on push
- Nixpacks builds Docker image
- Runs health checks
- Replaces old containers
- Zero-downtime deployment

3. **Verify Deployment**
```bash
curl https://signaldesk-production.up.railway.app/api/health
```

### GitHub → Vercel (Frontend)

1. **Push to main branch** (same as above)

2. **Vercel Auto-Deploy**
- Webhook triggers on push
- Runs `npm install`
- Runs `npm run build`
- Deploys to CDN
- Updates domain

3. **Verify Deployment**
- Visit https://signaldesk-frontend.vercel.app
- Check browser console for errors

---

## Environment Variables

### Railway Backend Variables
```env
# Required
ANTHROPIC_API_KEY=sk-ant-...      # Claude API key
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Railway PostgreSQL
JWT_SECRET=your-secret-key        # JWT signing key
PORT=3000                          # Server port

# Optional
NODE_ENV=production               # Environment
RAILWAY_DEPLOYMENT_ID             # Auto-set by Railway
```

### Vercel Frontend Variables
```env
# Note: Hardcoded in code due to issues
REACT_APP_API_URL=https://signaldesk-production.up.railway.app/api
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. AI Dumps Comprehensive Information
**Problem**: AI gives 500+ word responses instead of one question  
**Solution**: Already fixed in aiRoutesClaudeFix.js with strict constraints

#### 2. Login Fails with 404/405
**Problem**: API URL incorrect or missing /api prefix  
**Solution**: Frontend hardcoded to use correct URL in apiUrl.js

#### 3. Content Appears in Chat Instead of Workspace
**Problem**: isGeneratedContent flag not set  
**Solution**: Backend properly sets flag when generating content

#### 4. Railway Cache Issues
**Problem**: Old code still running after deployment  
**Solution**: Add cache buster to package.json, force rebuild

#### 5. Environment Variables Not Working
**Problem**: Vercel not reading .env files  
**Solution**: Hardcoded in apiUrl.js as fallback

### Debug Commands

#### Check Backend Health
```bash
curl https://signaldesk-production.up.railway.app/api/health
```

#### Test Login
```bash
curl -X POST https://signaldesk-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@signaldesk.com","password":"demo123"}'
```

#### Test AI Conversation
```bash
curl -X POST https://signaldesk-production.up.railway.app/api/ai/unified-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message":"thought leadership","mode":"content"}'
```

---

## Recent Fixes (August 2025)

### The Crisis
- **10+ hours** of circular fixes
- AI dumping comprehensive information instead of asking questions
- Content appearing in wrong place
- Railway deploying cached/old code

### The Solution
1. **Gutted adaptiveAIService.js** - Removed all local conversation logic
2. **Created aiRoutesClaudeFix.js** - Claude with strict ONE question constraint
3. **Fixed RailwayDraggable.js** - Direct backend calls only
4. **Hardcoded API URLs** - Bypassed environment variable issues

### Key Lessons
- Single source of truth (backend only)
- Strict constraints for AI responses
- Hardcode critical configuration
- Comprehensive logging for debugging

---

## Development Workflow

### Local Development

#### Backend Setup
```bash
cd backend
npm install
npm start  # Runs on port 3001
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start  # Runs on port 3000
```

### Making Changes

1. **Create feature branch**
```bash
git checkout -b feature/your-feature
```

2. **Make changes and test locally**

3. **Commit with descriptive message**
```bash
git add .
git commit -m "FEATURE: Description of changes"
```

4. **Push to main for deployment**
```bash
git checkout main
git merge feature/your-feature
git push origin main
```

### Monitoring Deployments

#### Railway Logs
- Dashboard: https://railway.app
- Check build logs for errors
- Monitor runtime logs

#### Vercel Logs
- Dashboard: https://vercel.com
- Check build output
- Monitor function logs

---

## Testing

### Test Pages Created
1. **test-login-direct.html** - Direct API login test
2. **test-conversation-fix.html** - AI conversation testing
3. **test-final-fix.html** - Comprehensive platform test
4. **test-vercel-deployment.html** - Deployment verification

### Manual Testing Checklist
- [ ] Login works
- [ ] AI asks one question
- [ ] Content generates properly
- [ ] Content appears in workspace
- [ ] Edit mode works
- [ ] Save/Download works

---

## Support and Maintenance

### Key Files to Monitor
- `/backend/routes/aiRoutesClaudeFix.js` - AI conversation logic
- `/frontend/src/components/RailwayDraggable.js` - Main UI
- `/backend/index.js` - Server configuration
- `/frontend/src/config/apiUrl.js` - API URL configuration

### Performance Metrics
- Backend response time: <500ms
- AI response time: <2s (Claude Haiku)
- Frontend load time: <3s
- Database queries: <100ms

### Backup Strategy
- GitHub: Full code repository
- Railway: Automatic backups
- Database: Railway PostgreSQL backups

---

## Future Enhancements

### Planned Features
- [ ] User registration system
- [ ] Team collaboration
- [ ] Content templates
- [ ] Analytics dashboard
- [ ] Webhook integrations
- [ ] Mobile responsive design

### Technical Improvements
- [ ] Redis caching for conversations
- [ ] WebSocket for real-time updates
- [ ] CDN for static assets
- [ ] Automated testing suite
- [ ] CI/CD pipeline improvements

---

## Contact and Resources

### GitHub Repository
https://github.com/NivraSD/SignalDesk

### Deployment Platforms
- Railway: https://railway.app
- Vercel: https://vercel.com

### Documentation
- Claude API: https://docs.anthropic.com
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs

---

*This documentation represents the current state of the SignalDesk platform as of August 12, 2025, after resolving the critical AI conversation issues. The platform is fully operational with natural Claude AI conversations that ask one question at a time.*