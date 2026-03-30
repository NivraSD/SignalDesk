# SignalDesk V3 - Authentication & Multi-Tenant Audit Report

**Date:** November 7, 2024
**Project:** SignalDesk V3 - Autonomous PR Platform
**Status:** Single-tenant with organization scoping, no user authentication

---

## Executive Summary

SignalDesk V3 is currently a **single-tenant application per organization** with basic organization management but **NO user authentication or multi-tenant user isolation**. The app uses Supabase backend, but authentication is not implemented. All API routes use Supabase service role keys, bypassing any Row-Level Security (RLS).

### Current Flow:
1. App loads at `/` with no authentication
2. Hardcoded user ("John Doe") appears in UI
3. Organizations are shown in dropdown selector
4. All data is scoped by `organization_id` at the database query level
5. No individual user concept exists in the system

### Key Risk:
**Security vulnerability:** organization_id is passed from the client with no validation that the user owns that organization. Service role key allows full database access regardless.

---

## 1. Authentication System Assessment

### What Exists:
- Supabase auth-js library in dependencies (not configured)
- Service role authentication on all API endpoints
- Basic session storage in Zustand

### What's Missing:
- User registration/signup flow
- Login authentication
- Session validation middleware
- JWT token verification
- Password management
- Email verification
- Multi-factor authentication
- Social login integrations

### Files Involved:
```
src/lib/supabase/server.ts       - Creates service role client
src/lib/supabase/service.ts      - Service role client instance
src/lib/supabase/types.ts        - Type definitions (unused)
src/stores/useAppStore.ts        - State management (user unused)
```

---

## 2. Database Schema Analysis

### Organization-Level Multi-Tenancy (Implemented)
All 25+ tables include `organization_id` foreign key:
- intelligence_targets
- intelligence_findings
- opportunities
- campaigns
- content_library
- memory_vault (partitioned by date)
- monitoring_alerts
- crisis_alerts
- niv_conversations
- patterns, pattern_outcomes
- ... and 15+ more

### User-Level Multi-Tenancy (NOT Implemented)
- No `users` table in active schema
- No `org_users` junction table for team management
- No `user_id` columns on any data tables
- No role-based access control (RBAC) schema
- No permission definitions

### Current State:
```
✓ organization_id everywhere
✓ Org-level data isolation (via SQL WHERE clauses)
✗ user_id columns (nowhere)
✗ User ownership tracking (doesn't exist)
✗ RLS policies (bypassed by service role)
✗ Role-based permissions (not defined)
```

### Primary Schema File:
`/Users/jonathanliebowitz/Desktop/signaldesk-v3/database/schema/intelligence_monitoring.sql` (321 lines)

---

## 3. User & Ownership Concept

### Current Implementation:
```typescript
// From useAppStore.ts
interface AppState {
  user: User | null              // Defined but NEVER set
  organization: Organization | null  // Used for scoping
}

// User interface (lines 7-11)
interface User {
  id: string
  email: string
  name?: string
}
```

### Reality:
- `setUser()` action exists but is never called
- Hardcoded "John Doe" / "john@signaldesk.ai" in UI (page.tsx lines 670-671)
- No actual user data from database
- organization.id is used as the primary scope for all queries

### Database Evidence:
No `user_id` found in:
- opportunities table (uses organization_id only)
- content_library table (uses organization_id only)
- campaigns table (uses organization_id only)
- memory_vault table (uses organization_id only)
- Any other data table

---

## 4. Current Routing Structure

### Application Routes:
```
/src/app/
├─ page.tsx (main dashboard - no auth)
├─ layout.tsx (root layout - no auth provider)
├─ campaign-builder/page.tsx (separate app)
└─ api/ (31 route directories)
```

### Route Analysis:
- **No login route** (`/login`, `/auth`, etc.)
- **No signup route**
- **No auth callback route**
- **No user dashboard** (`/dashboard`, `/profile`, `/settings`)
- **No team management** (`/team`, `/members`, `/invite`)
- **Single entry point:** `/` goes straight to app

### API Route Examples:
```
GET  /api/organizations
POST /api/organizations
DEL  /api/organizations?id=uuid

GET  /api/organizations/targets?organization_id=uuid
POST /api/organizations/targets (body: {organization_id, targets})

GET  /api/opportunities?organization_id=uuid
GET  /api/memory-vault/list?organization_id=uuid
```

**Pattern:** All routes accept `organization_id` as query parameter with no validation.

---

## 5. Homepage / Landing Page

### Current Landing Page:
**File:** `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/app/page.tsx` (823 lines)

### No Onboarding Flow:
1. App loads immediately
2. Fetches all organizations
3. Selects first org automatically
4. Renders main canvas

### Page Components:
```typescript
<header>
  Logo: "SIGNALDESK"
  Navigation tabs (Intelligence, Opportunities, Campaigns, etc.)
  Organization selector dropdown
  User profile (hardcoded John Doe)
</header>

<main>
  <InfiniteCanvas />
    // Dynamically loaded modules:
    - NIV Command Center
    - Intelligence Module
    - Opportunities Display
    - Campaign Planner
    - Execute Module
    - Crisis Command Center
    - Memory Vault
</main>

<Modals>
  - OrganizationOnboarding (for creating new org)
  - OrganizationSettings (for org config)
  - OrgManagementDashboard (for org admin)
  - Delete confirmation dialogs
</Modals>
```

### Missing:
- Welcome/intro page
- User registration
- Email verification
- Password setup
- Team setup wizard

---

## 6. Security Issues

### Critical Vulnerabilities:

#### 1. **Unauthenticated API Access**
```typescript
// Client sends:
fetch(`/api/opportunities?organization_id=${state.organization.id}`)

// Server receives org_id from client with NO validation
const organization_id = searchParams.get('organization_id')
// No check if user owns this org
await supabase.from('opportunities').select('*').eq('organization_id', organization_id)
```

**Risk:** Client could request ANY organization's data.

#### 2. **Service Role Key in Production**
All APIs use service role key which:
- Bypasses Row-Level Security (RLS) entirely
- Has full database access
- Should only be used for admin operations
- Exposes credentials in environment

**Risk:** If .env is compromised, attacker has full database access.

#### 3. **No Permission Validation**
```typescript
// No checks like:
- if (!user) return 401
- if (!user.organizations.includes(org_id)) return 403
- if (user.role !== 'admin') return 403
// All missing!
```

#### 4. **Hardcoded User Data**
```typescript
// page.tsx line 670
<p className="text-sm font-semibold">John Doe</p>
<p className="text-xs text-gray-500">john@signaldesk.ai</p>
```

**Risk:** Pretends to show user but is hardcoded.

#### 5. **RLS Disabled/Permissive**
```sql
-- From CREATE_TABLES.sql
CREATE POLICY "Enable all access for opportunities" ON opportunities 
    FOR ALL USING (true) WITH CHECK (true);
```

**Risk:** RLS policies are permissive (allow all), not restrictive.

---

## 7. Comparison: Single-Tenant vs. Missing Multi-Tenant

### What's Implemented (Single-Tenant):
```
✓ Organization table with CRUD
✓ Organization selector UI
✓ organization_id scoping in all queries
✓ Org-level deletion cascade
✓ Organization settings/profile
✓ Org management dashboard
```

### What's Missing (Multi-Tenant):
```
✗ User authentication
✗ User registration
✗ User roles/permissions
✗ Org-user relationships
✗ Team management
✗ User invitations
✗ Permission matrix
✗ Audit logging
✗ Session management
```

---

## 8. State Management Analysis

### Zustand Store: useAppStore
**File:** `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/stores/useAppStore.ts`

### Implemented:
```typescript
user: User | null
organization: Organization | null
intelligenceData: IntelligenceData | null
opportunities: Opportunity[]
activeModule: ModuleType
canvasComponents: Map<string, ComponentState>
```

### Unused:
```typescript
setUser() // Never called
user.id, user.email, user.name // Never set
```

### Only Used:
```typescript
setOrganization() // For switching organizations
organization.id // For scoping all queries
```

### Storage Strategy:
- Uses Zustand persist middleware
- Stores to localStorage
- Persists: user, organization, framework, activeModule, canvasComponents
- User is persisted but never set, so always null

---

## 9. Database Connection Details

### Supabase Configuration:
```
NEXT_PUBLIC_SUPABASE_URL      - Project URL (in env)
SUPABASE_SERVICE_ROLE_KEY     - Admin key (in env)
NEXT_PUBLIC_SUPABASE_ANON_KEY - Public key (in env, unused)
```

### Current Connection Method:
```typescript
// src/lib/supabase/service.ts
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Admin key!
)
```

### Environment Variables:
See `.env.local` and `.env.production` (not checked into git, as expected)

---

## 10. Multi-Tenant Transformation Roadmap

### Phase 1: Authentication Foundation (Weeks 1-2)
**Objective:** Implement Supabase Auth and basic user management

#### Tasks:
1. Configure Supabase Auth
   - Enable email/password auth provider
   - Set up email templates
   - Configure redirect URLs

2. Create Users Table
   ```sql
   CREATE TABLE users (
     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
     email TEXT UNIQUE NOT NULL,
     name TEXT,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. Build Auth Pages
   - `/auth/login`
   - `/auth/signup`
   - `/auth/forgot-password`
   - `/auth/reset-password`
   - Auth callback route

4. Implement Auth Provider
   - Create auth context
   - Add session validation
   - Set up auth state management

5. Auth Middleware
   - Protect routes (redirect to login if no session)
   - Check session on page load
   - Handle token refresh

### Phase 2: Organization-User Relationships (Weeks 3-4)
**Objective:** Connect users to organizations with roles

#### Tasks:
1. Create Org-User Junction Table
   ```sql
   CREATE TABLE org_users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     organization_id UUID NOT NULL REFERENCES organizations(id),
     user_id UUID NOT NULL REFERENCES users(id),
     role VARCHAR(50) DEFAULT 'member', -- admin, editor, member, viewer
     permissions JSONB DEFAULT '{}',
     invited_at TIMESTAMP,
     accepted_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(organization_id, user_id)
   );
   ```

2. Define Role Structure
   ```
   admin     - Can manage org, users, all features
   editor    - Can create/edit content
   member    - Can view and execute
   viewer    - Read-only access
   ```

3. Build Team Management UI
   - Member list
   - Add/remove members
   - Change roles
   - Pending invitations

4. Update Organization Loading
   ```typescript
   // Instead of loading all orgs:
   GET /api/organizations  // Old - insecure
   
   // Load only user's orgs:
   GET /api/user/organizations  // New - filter by auth user
   ```

### Phase 3: Row-Level Security & API Protection (Weeks 5-6)
**Objective:** Implement proper RLS policies and API validation

#### Tasks:
1. Enable RLS on All Tables
   ```sql
   ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
   ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
   -- ... for all tables
   ```

2. Create RLS Policies
   ```sql
   CREATE POLICY "Users can see org data they belong to"
   ON opportunities FOR SELECT
   USING (
     EXISTS (
       SELECT 1 FROM org_users
       WHERE org_users.organization_id = opportunities.organization_id
       AND org_users.user_id = auth.uid()
     )
   );
   ```

3. Update API Routes to Use Authenticated Client
   ```typescript
   // Before: Service role (all access)
   const supabase = createClient(url, SERVICE_ROLE_KEY)
   
   // After: Authenticated user client (RLS enforced)
   const supabase = createClient(url, ANON_KEY, {
     auth: { getSession: () => getCurrentSession() }
   })
   ```

4. Add Permission Checks
   ```typescript
   // Check in every API route
   const { data: { session } } = await supabase.auth.getSession()
   if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
   
   const hasAccess = await checkUserOrgAccess(session.user.id, org_id)
   if (!hasAccess) return Response.json({ error: 'Forbidden' }, { status: 403 })
   ```

### Phase 4: Data Isolation & User Fields (Weeks 7-8)
**Objective:** Add user_id to all data tables and implement user-specific views

#### Tasks:
1. Add user_id to Data Tables
   ```sql
   ALTER TABLE campaigns ADD COLUMN created_by UUID REFERENCES users(id);
   ALTER TABLE content_library ADD COLUMN created_by UUID REFERENCES users(id);
   -- ... for all content tables
   ```

2. Update API Responses
   ```typescript
   // Auto-include current user on create
   INSERT INTO campaigns (..., created_by) VALUES (..., auth.uid())
   ```

3. Add User-Specific Views
   ```sql
   -- View: Campaigns visible to user
   CREATE VIEW user_campaigns AS
   SELECT c.* FROM campaigns c
   JOIN org_users ou ON c.organization_id = ou.organization_id
   WHERE ou.user_id = auth.uid();
   ```

4. Update Frontend State
   ```typescript
   interface AppState {
     user: User & { organizations: OrgUser[] }  // Now populated
     organization: Organization | null
     userRole: Role | null  // admin, editor, member, viewer
     permissions: Permission[] | null
   }
   ```

### Phase 5: Advanced Features (Weeks 9-10)
**Objective:** Add team collaboration, audit logs, and advanced permissions

#### Tasks:
1. User Invitations
   - Generate invite tokens
   - Send emails
   - Accept/reject flow

2. Audit Logging
   ```sql
   CREATE TABLE audit_logs (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     organization_id UUID REFERENCES organizations(id),
     action VARCHAR(100),
     resource_type VARCHAR(50),
     resource_id UUID,
     changes JSONB,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. Activity Timeline
   - Show who did what and when
   - Filter by user/resource/action

4. Advanced Permissions
   - Custom permission groups
   - Feature flags per role
   - API key management

---

## 11. Files to Modify for Multi-Tenant Implementation

### Essential Files:
1. `/src/app/layout.tsx` - Add auth provider
2. `/src/app/page.tsx` - Protect route, show dashboard
3. `/src/stores/useAppStore.ts` - Update user state management
4. `/src/lib/supabase/*.ts` - Switch to authenticated client
5. All `/src/app/api/` routes - Add auth validation

### New Files to Create:
1. `/src/app/auth/` - Login, signup, reset pages
2. `/src/app/admin/` - User/team management
3. `/src/lib/auth/` - Auth utilities
4. `/src/middleware.ts` - Auth middleware
5. `/src/components/auth/` - Auth components
6. Database migrations for users/org_users tables

### Database Files:
1. Create migration for users table
2. Create migration for org_users table
3. Update RLS policies on all tables
4. Add audit_logs table

---

## 12. Risks & Considerations

### Security Risks:
- Current: Any organization_id accessible to any client
- Mitigation: Validate in API using authenticated session
- Current: Service role key may be exposed
- Mitigation: Use anon key + RLS for client access

### Data Migration:
- All existing opportunities/campaigns have no user ownership
- Decision: Assign to org owner, or migrate as org-level data?
- Plan: Add migration script for created_by field

### Performance:
- Added RLS policies will add query overhead
- Solution: Test with production data, optimize indexes
- Consider: Caching user org memberships

### Backward Compatibility:
- Existing API contracts expect organization_id in query params
- Decision: Keep for compatibility, add user_id to body
- Deprecation: Plan timeline for removing client-side org_id

---

## 13. Checklist for Implementation

### Pre-Implementation:
- [ ] Review all 31 API routes
- [ ] Identify all tables that need user_id
- [ ] Plan data migration strategy
- [ ] Document current organization assignments
- [ ] Create backup of production database

### Authentication:
- [ ] Configure Supabase Auth
- [ ] Create auth pages
- [ ] Build auth provider context
- [ ] Add session management
- [ ] Implement refresh token logic

### Database:
- [ ] Create users table
- [ ] Create org_users junction table
- [ ] Add user_id to content tables
- [ ] Create migration scripts
- [ ] Test RLS policies

### API:
- [ ] Add auth middleware
- [ ] Update all routes for authentication
- [ ] Add permission validation
- [ ] Implement error handling
- [ ] Add logging/audit trails

### Frontend:
- [ ] Update auth pages
- [ ] Update app store (user state)
- [ ] Add team management UI
- [ ] Add user settings page
- [ ] Test with multiple users

### Testing:
- [ ] Unit tests for auth
- [ ] Integration tests for APIs
- [ ] End-to-end tests for user flows
- [ ] Security testing (OWASP)
- [ ] Load testing with RLS

### Deployment:
- [ ] Database migrations in production
- [ ] Feature flags for new auth
- [ ] Monitor errors and performance
- [ ] Gradual rollout (feature flags)
- [ ] Rollback plan

---

## 14. Files Referenced in This Audit

### Source Code:
- `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/app/page.tsx` (823 lines)
- `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/app/layout.tsx`
- `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/stores/useAppStore.ts` (276 lines)
- `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/lib/supabase/server.ts`
- `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/lib/supabase/service.ts`
- `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/app/api/organizations/route.ts`
- `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/app/api/organizations/targets/route.ts`

### Database:
- `/Users/jonathanliebowitz/Desktop/signaldesk-v3/database/schema/intelligence_monitoring.sql` (321 lines)
- `/Users/jonathanliebowitz/Desktop/signaldesk-v3/CREATE_TABLES.sql`
- `/Users/jonathanliebowitz/Desktop/signaldesk-v3/database-init.sql` (legacy)

### Configuration:
- `.env.local` and `.env.production` (contains Supabase keys)

---

## 15. Recommendations

### Immediate Actions:
1. **Don't deploy without fixing organization_id validation** - Add checks in every API
2. **Document current state** - List all tables and their org_id dependencies
3. **Plan data migration** - Decide how to assign user ownership to existing data

### Short-term (1-2 weeks):
1. Implement basic Supabase Auth
2. Create users table and auth pages
3. Update appStore to use real user data
4. Add auth middleware to protect routes

### Medium-term (3-4 weeks):
1. Create org_users relationships
2. Implement RLS policies
3. Switch to authenticated client
4. Add permission validation

### Long-term (5-8 weeks):
1. Team management features
2. Audit logging
3. Advanced RBAC
4. User invitations

---

## Conclusion

SignalDesk V3 has a solid organization-scoped data model but lacks user authentication and true multi-tenancy. The architecture is ready for transformation with minimal refactoring of core data structures. The main work involves:

1. Adding user authentication (Supabase Auth)
2. Linking users to organizations (org_users table)
3. Implementing proper access validation (auth middleware + RLS)
4. Adding user context to existing operations

With careful planning and phased implementation, the transformation to true multi-tenant with user authentication can be completed in 8-10 weeks without disrupting existing functionality.

---

**Report generated:** November 7, 2024
**Auditor:** Claude Code AI
**Status:** Ready for multi-tenant transformation
