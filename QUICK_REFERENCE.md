# SignalDesk V3 - Authentication Quick Reference

## TL;DR - Current State
- **Auth Status:** NONE - No user authentication
- **Multi-Tenancy:** Single-tenant per organization only
- **Database:** 25+ tables scoped by `organization_id`, no user_id anywhere
- **Security:** CRITICAL - Client can request any organization, service role bypasses all checks
- **User State:** Hardcoded "John Doe" in UI, Zustand store has user field but never populated

## Key File Locations

### Authentication Files (What Exists)
```
src/lib/supabase/server.ts        ← Creates Supabase admin client
src/lib/supabase/service.ts       ← Service role client (used by all APIs)
src/lib/supabase/types.ts         ← Type definitions (unused)
src/stores/useAppStore.ts         ← State management (user field unused)
```

### Main Application Files
```
src/app/page.tsx                  ← Main dashboard (823 lines, no auth)
src/app/layout.tsx                ← Root layout (no auth provider)
src/app/campaign-builder/page.tsx ← Separate route
```

### API Routes (31 directories)
```
src/app/api/organizations/        ← Get/create/delete orgs
src/app/api/opportunities/        ← Opportunity CRUD
src/app/api/intelligence/         ← Intelligence data
src/app/api/memory-vault/         ← Memory vault ops
src/app/api/content/              ← Content generation
src/app/api/niv-*/                ← NIV orchestration
```

### Database Schema
```
database/schema/intelligence_monitoring.sql  ← Primary schema (321 lines)
CREATE_TABLES.sql                           ← Opportunities/alerts table
database-init.sql                           ← Legacy users table (not used)
```

## Database Structure

### All Tables Include:
- `organization_id` (UUID, foreign key to organizations)
- Organization-level data isolation

### Missing:
- `user_id` columns (non-existent)
- `org_users` junction table (non-existent)
- RLS policies (permissive, not restrictive)
- Permission definitions

## API Security Issue

### Current Pattern (INSECURE):
```typescript
// Frontend sends org_id in query params:
fetch(`/api/opportunities?organization_id=${state.organization.id}`)

// Backend accepts with NO validation:
const organization_id = searchParams.get('organization_id')
// ^^^ Could be ANY organization!

// Uses service role (full access):
const supabase = createClient(url, SERVICE_ROLE_KEY)
```

### What's Missing:
1. Authentication check: No `if (!user) return 401`
2. Authorization check: No `if (!user.orgs.includes(org_id)) return 403`
3. User context: No session/JWT validation
4. Permission check: No role/permission validation

## Transformation Phases

### Phase 1: Authentication (Weeks 1-2)
- [ ] Configure Supabase Auth
- [ ] Create `/auth/login`, `/auth/signup` pages
- [ ] Create users table linked to auth.users
- [ ] Build auth provider context
- [ ] Add auth middleware

### Phase 2: Org-User Relationships (Weeks 3-4)
- [ ] Create org_users junction table with roles
- [ ] Build team management UI
- [ ] Implement user invitations
- [ ] Define admin/editor/member/viewer roles

### Phase 3: Security (Weeks 5-6)
- [ ] Enable RLS on all tables
- [ ] Create RLS policies (user-based)
- [ ] Switch APIs to authenticated client
- [ ] Add permission validation

### Phase 4: User Context (Weeks 7-8)
- [ ] Add created_by user_id to content tables
- [ ] Update APIs to include current user
- [ ] Implement user-specific views
- [ ] Update frontend state

### Phase 5: Features (Weeks 9-10)
- [ ] Audit logging
- [ ] Activity timeline
- [ ] Advanced RBAC
- [ ] API key management

## Quick Fixes (Do First!)

### 1. Add Auth Validation to APIs
```typescript
// Add to every API route:
const session = await getSession()
if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

const userOrgs = await getUserOrganizations(session.user.id)
if (!userOrgs.includes(organization_id)) {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
```

### 2. Stop Using Service Role
```typescript
// BEFORE (UNSAFE):
const supabase = createClient(url, SERVICE_ROLE_KEY)

// AFTER (SAFE with RLS):
const supabase = createClient(url, ANON_KEY, {
  auth: { getSession: () => getCurrentSession() }
})
```

### 3. Populate User State
```typescript
// In layout.tsx or auth provider:
const { data: { session } } = await supabase.auth.getSession()
useAppStore.setUser({
  id: session.user.id,
  email: session.user.email,
  name: session.user.user_metadata?.name
})
```

## Test Security

### Current Vulnerability Test:
1. Log in as User A
2. Manually change organization_id in network request to User B's org_id
3. User A can access User B's data (FAILURE)

### After Fix:
1. API validates session user owns org_id
2. RLS enforces data visibility at database level
3. Can't access other organizations (SUCCESS)

## Dependencies Already Installed
- `@supabase/supabase-js` ✓ (ready to use)
- `@supabase/auth-js` ✓ (dependency of above)
- Zustand ✓ (state management ready)
- Next.js 13+ App Router ✓ (ready for middleware)

## Environment Variables Needed
```
NEXT_PUBLIC_SUPABASE_URL         ← Already configured
SUPABASE_SERVICE_ROLE_KEY        ← Already configured
NEXT_PUBLIC_SUPABASE_ANON_KEY    ← Need to use this instead!
```

## Next Steps
1. Read full `AUTHENTICATION_AUDIT.md` for complete strategy
2. Start with Phase 1 (Supabase Auth setup)
3. Don't move to production without Phase 3 security fixes
4. Run security tests after each phase

## References
- Full Audit: `AUTHENTICATION_AUDIT.md` (15 sections, 500+ lines)
- Architecture: `ARCHITECTURE_DIAGRAM.md` 
- Current Files: See "Key File Locations" above

---
**Status:** Ready to start multi-tenant transformation
**Priority:** CRITICAL - Fix security vulnerabilities before production
**Estimated Timeline:** 8-10 weeks for full implementation
