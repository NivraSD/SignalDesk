# SignalDesk V3: Complete Technical Architecture
## From Ground Zero to Production-Ready Platform

**Version:** 3.0  
**Date:** January 2025  
**Status:** Complete Rebuild Architecture

---

## Executive Summary

SignalDesk V3 is a complete architectural rebuild addressing 82 duplicate components, zero test coverage, memory leaks, and security vulnerabilities. This document provides a comprehensive technical blueprint for a modern, scalable, secure PR intelligence platform.

---

## Core Architecture Principles

### 1. Edge-First Intelligence
- **All heavy processing in Supabase Edge Functions**
- **Frontend is purely presentational**
- **No business logic in React components**

### 2. Module Isolation
- **Each module is independent**
- **Clear API contracts between modules**
- **No cross-module dependencies**

### 3. Security by Default
- **Zero secrets in frontend code**
- **All API calls through edge functions**
- **Row-level security on all data**

### 4. Performance First
- **Code splitting from day one**
- **Memoization everywhere**
- **Virtual scrolling for lists**

### 5. Testing Required
- **No code merges without tests**
- **80% coverage target**
- **E2E tests for critical paths**

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Next.js   │  │   Zustand   │  │   React    │             │
│  │   App Dir   │  │    Store    │  │   Query    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      EDGE FUNCTION LAYER                         │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     NIV ORCHESTRATOR                      │   │
│  │         (Master Edge Function - Coordinates All)          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │
│  │Intelligence│  │Opportunity │  │ Execution  │  │  Memory   │  │
│  │  Pipeline  │  │   Engine   │  │   Tools    │  │   Vault   │  │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    SUPABASE POSTGRES                     │    │
│  │  Tables: organizations, intelligence, opportunities,     │    │
│  │          campaigns, memoryvault, profiles               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture (Next.js 14 App Directory)

### Directory Structure
```
src/
├── app/                          # Next.js App Directory
│   ├── (auth)/                   # Auth group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Main app group
│   │   ├── layout.tsx            # Dashboard layout
│   │   ├── page.tsx              # Home/Overview
│   │   ├── intelligence/
│   │   ├── opportunities/
│   │   ├── campaigns/
│   │   └── niv/
│   └── api/                      # API routes (minimal)
├── components/
│   ├── intelligence/
│   │   ├── IntelligenceDashboard.tsx
│   │   ├── CompetitorCard.tsx
│   │   └── hooks/
│   ├── opportunities/
│   │   ├── OpportunityList.tsx
│   │   ├── OpportunityDetail.tsx
│   │   └── hooks/
│   ├── execution/
│   │   ├── ContentGenerator.tsx
│   │   ├── MediaListBuilder.tsx
│   │   └── hooks/
│   ├── niv/
│   │   ├── NivChat.tsx
│   │   ├── NivSuggestions.tsx
│   │   └── hooks/
│   └── shared/
│       ├── ErrorBoundary.tsx
│       ├── LoadingStates.tsx
│       └── ui/                   # Shadcn/ui components
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── middleware.ts        # Auth middleware
│   ├── api/
│   │   ├── intelligence.ts      # API calls
│   │   ├── opportunities.ts
│   │   └── niv.ts
│   └── utils/
│       ├── cn.ts                # Class names
│       └── format.ts            # Formatters
├── stores/
│   ├── useAppStore.ts           # Zustand store
│   ├── slices/
│   │   ├── auth.slice.ts
│   │   ├── intelligence.slice.ts
│   │   └── ui.slice.ts
│   └── persist.ts               # Persistence config
├── hooks/
│   ├── useIntelligence.ts
│   ├── useOpportunities.ts
│   └── useNiv.ts
└── types/
    ├── database.types.ts        # Supabase types
    ├── intelligence.types.ts
    └── api.types.ts
```

### State Management (Zustand)
```typescript
// stores/useAppStore.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface AppState {
  // Auth
  user: User | null
  organization: Organization | null
  
  // Intelligence
  intelligenceData: IntelligenceData | null
  isLoadingIntelligence: boolean
  
  // UI
  activeModule: 'intelligence' | 'opportunities' | 'execution' | 'niv'
  sidebarOpen: boolean
  
  // Actions
  setUser: (user: User) => void
  loadIntelligence: () => Promise<void>
  switchModule: (module: string) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        user: null,
        organization: null,
        intelligenceData: null,
        isLoadingIntelligence: false,
        activeModule: 'intelligence',
        sidebarOpen: true,
        
        // Actions
        setUser: (user) => set((state) => {
          state.user = user
        }),
        
        loadIntelligence: async () => {
          set((state) => {
            state.isLoadingIntelligence = true
          })
          
          const data = await fetchIntelligence()
          
          set((state) => {
            state.intelligenceData = data
            state.isLoadingIntelligence = false
          })
        },
        
        switchModule: (module) => set((state) => {
          state.activeModule = module
        })
      })),
      {
        name: 'signaldesk-store',
        partialize: (state) => ({
          user: state.user,
          organization: state.organization
        })
      }
    )
  )
)
```

---

## Edge Function Architecture

### Master Directory Structure
```
supabase/functions/
├── _shared/
│   ├── auth.ts                  # Shared auth utilities
│   ├── cors.ts                  # CORS config
│   ├── database.ts              # DB helpers
│   ├── errors.ts                # Error handling
│   └── types.ts                 # Shared types
├── niv-orchestrator/             # Master orchestrator
│   ├── index.ts
│   ├── modules/
│   │   ├── intelligence.ts
│   │   ├── opportunities.ts
│   │   ├── strategy.ts
│   │   └── memory.ts
│   └── prompts/
├── intelligence-pipeline/        # All 7 stages
│   ├── discovery/
│   ├── competitors/
│   ├── stakeholders/
│   ├── media/
│   ├── regulatory/
│   ├── trends/
│   └── synthesis/
├── opportunity-engine/
│   ├── index.ts
│   ├── detector.ts
│   ├── scorer.ts
│   └── predictor.ts
├── execution-tools/
│   ├── content-generator/
│   ├── media-list-builder/
│   ├── campaign-planner/
│   └── template-engine/
└── memoryvault/
    ├── index.ts
    ├── store.ts
    ├── retrieve.ts
    └── patterns.ts
```

### Edge Function Template
```typescript
// supabase/functions/[function-name]/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { handleError } from '../_shared/errors.ts'

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')
    
    // Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { 
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    )
    
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')
    
    // Parse request
    const { action, params } = await req.json()
    
    // Process based on action
    let result
    switch (action) {
      case 'analyze':
        result = await analyze(params, supabase)
        break
      case 'generate':
        result = await generate(params, supabase)
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }
    
    // Return success
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return handleError(error)
  }
})
```

---

## Data Architecture

### Database Schema
```sql
-- Core Tables
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intelligence Tables
CREATE TABLE intelligence_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  status TEXT DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  data JSONB,
  error TEXT
);

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  score INTEGER,
  window_hours INTEGER,
  status TEXT DEFAULT 'active',
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  opportunity_id UUID REFERENCES opportunities(id),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  content JSONB,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE memoryvault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  type TEXT NOT NULL, -- 'pattern', 'success', 'failure', 'insight'
  category TEXT,
  content JSONB NOT NULL,
  metadata JSONB,
  embedding vector(1536), -- For semantic search
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE memoryvault ENABLE ROW LEVEL SECURITY;

-- Example RLS Policy
CREATE POLICY "Users can view their organization's data" ON intelligence_runs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid()
    )
  );
```

---

## API Design

### API Structure
```typescript
// All APIs go through edge functions
const API = {
  // Niv Orchestrator (Master)
  niv: {
    chat: (prompt: string) => POST('/niv-orchestrator', { action: 'chat', prompt }),
    analyze: (context: any) => POST('/niv-orchestrator', { action: 'analyze', context }),
    recommend: () => POST('/niv-orchestrator', { action: 'recommend' })
  },
  
  // Intelligence
  intelligence: {
    run: (config: any) => POST('/intelligence-pipeline', { action: 'run', config }),
    getLatest: () => POST('/intelligence-pipeline', { action: 'getLatest' }),
    getStage: (stage: string) => POST('/intelligence-pipeline', { action: 'getStage', stage })
  },
  
  // Opportunities
  opportunities: {
    detect: () => POST('/opportunity-engine', { action: 'detect' }),
    score: (id: string) => POST('/opportunity-engine', { action: 'score', id }),
    predict: (id: string) => POST('/opportunity-engine', { action: 'predict', id })
  },
  
  // Execution
  execution: {
    generateContent: (params: any) => POST('/content-generator', params),
    buildMediaList: (params: any) => POST('/media-list-builder', params),
    planCampaign: (params: any) => POST('/campaign-planner', params)
  },
  
  // Memory
  memory: {
    search: (query: string) => POST('/memoryvault', { action: 'search', query }),
    getPatterns: (type: string) => POST('/memoryvault', { action: 'getPatterns', type }),
    learn: (data: any) => POST('/memoryvault', { action: 'learn', data })
  }
}
```

---

## Performance Optimizations

### 1. Code Splitting
```typescript
// app/(dashboard)/intelligence/page.tsx
import dynamic from 'next/dynamic'

const IntelligenceDashboard = dynamic(
  () => import('@/components/intelligence/IntelligenceDashboard'),
  { 
    loading: () => <IntelligenceLoader />,
    ssr: false 
  }
)
```

### 2. React Query for Data Fetching
```typescript
// hooks/useIntelligence.ts
import { useQuery, useMutation } from '@tanstack/react-query'

export function useIntelligence() {
  return useQuery({
    queryKey: ['intelligence', organizationId],
    queryFn: () => api.intelligence.getLatest(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  })
}
```

### 3. Memoization
```typescript
// components/intelligence/CompetitorCard.tsx
import { memo } from 'react'

export const CompetitorCard = memo(({ competitor }) => {
  // Component logic
}, (prevProps, nextProps) => {
  return prevProps.competitor.id === nextProps.competitor.id
})
```

### 4. Virtual Scrolling
```typescript
// components/opportunities/OpportunityList.tsx
import { FixedSizeList } from 'react-window'

export function OpportunityList({ opportunities }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={opportunities.length}
      itemSize={120}
      width="100%"
    >
      {({ index, style }) => (
        <OpportunityCard 
          style={style}
          opportunity={opportunities[index]} 
        />
      )}
    </FixedSizeList>
  )
}
```

---

## Security Implementation

### 1. Environment Variables
```env
# .env.local (NEVER commit)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]

# Server-only (Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=[service-key]
ANTHROPIC_API_KEY=[claude-key]
OPENAI_API_KEY=[openai-key]
```

### 2. API Security
```typescript
// No direct API calls from frontend
// Everything goes through edge functions
// Edge functions validate auth and sanitize input
```

### 3. Content Security Policy
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      connect-src 'self' https://*.supabase.co;
    `.replace(/\n/g, '')
  }
]
```

---

## Testing Strategy

### 1. Unit Tests (Vitest)
```typescript
// components/intelligence/CompetitorCard.test.tsx
import { render, screen } from '@testing-library/react'
import { CompetitorCard } from './CompetitorCard'

describe('CompetitorCard', () => {
  it('displays competitor name', () => {
    const competitor = { id: '1', name: 'Acme Corp' }
    render(<CompetitorCard competitor={competitor} />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })
})
```

### 2. Integration Tests
```typescript
// tests/intelligence-pipeline.test.ts
import { createClient } from '@supabase/supabase-js'

describe('Intelligence Pipeline', () => {
  it('completes full pipeline run', async () => {
    const result = await runIntelligencePipeline({
      organization: 'Toyota'
    })
    
    expect(result.stages).toHaveLength(7)
    expect(result.status).toBe('completed')
  })
})
```

### 3. E2E Tests (Playwright)
```typescript
// e2e/critical-path.spec.ts
import { test, expect } from '@playwright/test'

test('user can run intelligence and view opportunities', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=email]', 'test@example.com')
  await page.fill('[name=password]', 'password')
  await page.click('button[type=submit]')
  
  await page.waitForURL('/dashboard')
  await page.click('text=Run Intelligence')
  
  await expect(page.locator('.opportunity-card')).toBeVisible()
})
```

---

## Deployment Architecture

### 1. Frontend (Vercel)
```yaml
# vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "functions": {
    "app/api/health/route.ts": {
      "maxDuration": 10
    }
  }
}
```

### 2. Edge Functions (Supabase)
```bash
# Deploy all edge functions
supabase functions deploy --no-verify-jwt

# Deploy specific function
supabase functions deploy niv-orchestrator
```

### 3. Database (Supabase)
```bash
# Run migrations
supabase db push

# Create backup
supabase db dump -f backup.sql
```

---

## Development Workflow

### 1. Local Development
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Edge Functions
supabase functions serve

# Terminal 3: Database
supabase db diff --use-migra
```

### 2. Git Workflow
```
main
  ├── develop
  │     ├── feature/intelligence-v2
  │     ├── feature/niv-orchestrator
  │     └── fix/memory-leaks
  └── release/v3.0
```

### 3. CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run deploy
```

---

## Migration Plan

### Phase 1: Foundation (Week 1)
- [ ] Set up Next.js 14 with App Directory
- [ ] Configure Supabase project
- [ ] Create database schema
- [ ] Set up authentication flow
- [ ] Deploy first edge function (health check)

### Phase 2: Core Modules (Week 2-3)
- [ ] Build Niv Orchestrator edge function
- [ ] Migrate Intelligence Pipeline to edge functions
- [ ] Create Opportunity Engine
- [ ] Set up MemoryVault

### Phase 3: Frontend (Week 4-5)
- [ ] Build component library (shared/ui)
- [ ] Implement Intelligence module UI
- [ ] Create Opportunities module UI
- [ ] Add Execution tools UI
- [ ] Integrate Niv chat interface

### Phase 4: Integration (Week 6)
- [ ] Connect all modules
- [ ] Implement state management
- [ ] Add error boundaries
- [ ] Set up monitoring

### Phase 5: Testing & Optimization (Week 7)
- [ ] Write unit tests (80% coverage)
- [ ] Add integration tests
- [ ] Create E2E tests for critical paths
- [ ] Performance optimization
- [ ] Security audit

### Phase 6: Deployment (Week 8)
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Monitor and iterate

---

## Success Metrics

### Technical Metrics
- **Bundle Size**: < 500KB initial load
- **Time to Interactive**: < 3 seconds
- **Lighthouse Score**: > 90
- **Test Coverage**: > 80%
- **Zero Runtime Errors**: Error boundary catches all

### Performance Metrics
- **API Response Time**: < 200ms p50, < 1s p99
- **Intelligence Pipeline**: < 30s full run
- **Memory Usage**: < 100MB browser
- **No Memory Leaks**: Stable over 24 hours

### Business Metrics
- **User Satisfaction**: > 4.5/5
- **Feature Adoption**: > 60% using all modules
- **Time to Value**: < 5 minutes to first insight
- **Reliability**: 99.9% uptime

---

## Conclusion

This architecture addresses every issue from the frontend analysis:
- ✅ No duplicate components - clean module structure
- ✅ 80% test coverage target
- ✅ Zero hardcoded secrets
- ✅ No memory leaks - proper cleanup
- ✅ Error boundaries everywhere
- ✅ No console logs in production
- ✅ Performance optimized from day one
- ✅ Scalable edge function architecture
- ✅ Clear separation of concerns

Start with Phase 1 and build incrementally. Each phase delivers value while maintaining architectural integrity.