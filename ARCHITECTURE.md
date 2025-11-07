# SignalDesk Multi-Tenant Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │  Homepage  │  │   Auth     │  │  Dashboard │               │
│  │     /      │  │ /auth/*    │  │ /dashboard │               │
│  └────────────┘  └────────────┘  └────────────┘               │
│                        ↓                                        │
│  ┌──────────────────────────────────────────────────────┐     │
│  │           AuthProvider (React Context)                │     │
│  │  • Manages user session state                         │     │
│  │  • Provides useAuth() hook                            │     │
│  │  • Syncs with useAppStore                             │     │
│  └──────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Middleware                         │
├─────────────────────────────────────────────────────────────────┤
│  Route Protection Logic:                                        │
│                                                                 │
│  Public Routes:        Protected Routes:                        │
│  • /                   • /dashboard                             │
│  • /auth/*             • /api/* (most)                          │
│                                                                 │
│  Logic:                                                         │
│  1. Check session cookie                                        │
│  2. If no session & protected route → redirect to /auth/login  │
│  3. If session & auth route → redirect to /dashboard           │
│  4. Refresh session if needed                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Backend                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │                  Authentication                        │    │
│  │  • Email/Password                                      │    │
│  │  • OAuth (Google, GitHub)                              │    │
│  │  • Session management                                  │    │
│  │  • JWT tokens                                          │    │
│  └───────────────────────────────────────────────────────┘    │
│                              ↓                                  │
│  ┌───────────────────────────────────────────────────────┐    │
│  │                    PostgreSQL                          │    │
│  │                                                        │    │
│  │  auth.users                                            │    │
│  │    ↓ (trigger)                                         │    │
│  │  user_profiles                                         │    │
│  │    • id (FK to auth.users)                             │    │
│  │    • email                                             │    │
│  │    • full_name                                         │    │
│  │    • avatar_url                                        │    │
│  │                                                        │    │
│  │  org_users (junction)                                  │    │
│  │    • user_id (FK to auth.users)                        │    │
│  │    • organization_id (FK to organizations)             │    │
│  │    • role (owner|admin|member|viewer)                  │    │
│  │                                                        │    │
│  │  organizations                                         │    │
│  │    • id                                                │    │
│  │    • name                                              │    │
│  │    • industry                                          │    │
│  │                                                        │    │
│  │  intelligence_targets                                  │    │
│  │  monitoring_alerts                                     │    │
│  │  content_library                                       │    │
│  │  ... (all other tables)                                │    │
│  │                                                        │    │
│  └───────────────────────────────────────────────────────┘    │
│                              ↓                                  │
│  ┌───────────────────────────────────────────────────────┐    │
│  │            Row Level Security (RLS)                    │    │
│  │                                                        │    │
│  │  Policies:                                             │    │
│  │  • user_profiles: user can only see own profile       │    │
│  │  • org_users: user can see members of their orgs      │    │
│  │  • intelligence_targets: user can see targets from    │    │
│  │    organizations they belong to                        │    │
│  │  • ... (apply to all tables)                           │    │
│  │                                                        │    │
│  │  Access Control:                                       │    │
│  │  auth.uid() = current authenticated user ID           │    │
│  │                                                        │    │
│  └───────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### Sign Up Flow
```
User clicks "Sign Up"
  ↓
/auth/signup page
  ↓
Enter: email, password, full_name
  ↓
Supabase Auth.signUp()
  ↓
1. Creates auth.users entry
2. Trigger: handle_new_user() creates user_profiles entry
3. Sends verification email
  ↓
User clicks verification link
  ↓
/auth/callback?code=...
  ↓
Exchange code for session
  ↓
Set session cookies
  ↓
Redirect to /dashboard (or /onboarding if no org)
```

### Sign In Flow
```
User clicks "Sign In"
  ↓
/auth/login page
  ↓
Enter: email, password
  ↓
Supabase Auth.signInWithPassword()
  ↓
Session created, cookies set
  ↓
AuthProvider updates context
  ↓
useAppStore.setUser() called
  ↓
Redirect to /dashboard
```

### OAuth Flow
```
User clicks "Continue with Google"
  ↓
Supabase Auth.signInWithOAuth({ provider: 'google' })
  ↓
Redirect to Google login page
  ↓
User authorizes app
  ↓
Google redirects to: /auth/callback?code=...
  ↓
Exchange code for session
  ↓
Session created, cookies set
  ↓
If first login: trigger creates user_profiles
  ↓
Redirect to /dashboard
```

---

## Data Access Patterns

### Before (Single-Tenant)
```typescript
// ❌ No authentication, service role bypasses all security
const supabase = createServerClient() // Uses service role key
const { data } = await supabase.from('intelligence_targets').select('*')
// Returns ALL targets from ALL organizations (security risk!)
```

### After Phase 1 (Auth Added, but APIs not updated yet)
```typescript
// ⚠️ Frontend has auth, but APIs still use service role
// This is current state - needs Phase 2 to fix

// Frontend (protected)
const { user } = useAuth()  // ✅ User is authenticated

// API route (not protected yet)
export async function GET(request: Request) {
  const supabase = createServerClient()  // ❌ Still uses service role
  const { data } = await supabase.from('intelligence_targets').select('*')
  // Still returns everything, no org filtering
}
```

### After Phase 2 (Full Multi-Tenant)
```typescript
// ✅ Full RLS enforcement, org-based access control

// API route
export async function GET(request: Request) {
  const supabase = await createClient()  // Uses session, respects RLS
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('organization_id')

  // Validate user has access to this org
  const { data: orgUser } = await supabase
    .from('org_users')
    .select('*')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!orgUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // RLS automatically filters by org_users membership
  const { data } = await supabase
    .from('intelligence_targets')
    .select('*')
    .eq('organization_id', orgId)

  // Only returns targets from organizations user belongs to
  return NextResponse.json(data)
}
```

---

## User → Organization Relationship

### Data Model
```
┌─────────────┐
│   User      │
│  (auth.users)│
└──────┬──────┘
       │ 1
       │
       │ N (can belong to multiple orgs)
       │
┌──────┴───────────┐
│   org_users      │  (junction table)
│                  │
│ • user_id        │
│ • organization_id│
│ • role           │  (owner, admin, member, viewer)
└──────┬───────────┘
       │ N
       │
┌──────┴──────┐
│Organization │
└─────────────┘
       │ 1
       │
       │ N (has many targets, alerts, content, etc.)
       │
┌──────┴─────────────────────┐
│ intelligence_targets       │
│ monitoring_alerts          │
│ content_library            │
│ campaigns                  │
│ ...                        │
└────────────────────────────┘
```

### Example Queries

**Get user's organizations:**
```sql
SELECT o.*
FROM organizations o
JOIN org_users ou ON ou.organization_id = o.id
WHERE ou.user_id = auth.uid();
```

**Get users in an organization:**
```sql
SELECT u.email, u.full_name, ou.role
FROM user_profiles u
JOIN org_users ou ON ou.user_id = u.id
WHERE ou.organization_id = 'org-id-here';
```

**Check if user can access organization:**
```sql
SELECT EXISTS (
  SELECT 1 FROM org_users
  WHERE user_id = auth.uid()
  AND organization_id = 'org-id-here'
);
```

---

## Role-Based Access Control (RBAC)

### Roles

| Role | Permissions |
|------|-------------|
| **owner** | Full access: manage team, delete org, billing |
| **admin** | Manage content, invite members (except owner actions) |
| **member** | Create/edit content, view intelligence |
| **viewer** | Read-only access |

### Permission Matrix

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| View intelligence | ✅ | ✅ | ✅ | ✅ |
| Create targets | ✅ | ✅ | ✅ | ❌ |
| Edit targets | ✅ | ✅ | ✅ (own) | ❌ |
| Delete targets | ✅ | ✅ | ✅ (own) | ❌ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| Change roles | ✅ | ✅ (not owner) | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ |
| Billing | ✅ | ❌ | ❌ | ❌ |

### Implementation

**Database (RLS):**
```sql
-- Example: Only admins/owners can invite
CREATE POLICY "Admins can invite members"
  ON org_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_users
      WHERE organization_id = org_invitations.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

**Frontend (UI):**
```typescript
const { user } = useAuth()
const { organization } = useAppStore()

// Get user's role in current org
const { data: orgUser } = await supabase
  .from('org_users')
  .select('role')
  .eq('organization_id', organization.id)
  .eq('user_id', user.id)
  .single()

const canInvite = ['owner', 'admin'].includes(orgUser.role)

return (
  <div>
    {canInvite && (
      <button onClick={inviteMember}>Invite Member</button>
    )}
  </div>
)
```

---

## Session Management

### Cookie-Based Sessions
Supabase uses HTTP-only cookies for security:

```
Set-Cookie: sb-access-token=...; HttpOnly; Secure; SameSite=Lax
Set-Cookie: sb-refresh-token=...; HttpOnly; Secure; SameSite=Lax
```

**Benefits:**
- Secure (can't be accessed by JavaScript)
- Auto-sent with requests
- Refresh automatically

### Session Lifecycle
```
User signs in
  ↓
Access token (JWT, expires in 1 hour)
Refresh token (expires in 30 days)
  ↓
Middleware checks token on every request
  ↓
If expired: use refresh token to get new access token
  ↓
If refresh token expired: redirect to login
```

### Manual Session Check
```typescript
import { createAuthClient } from '@/lib/supabase/auth-client'

const supabase = createAuthClient()
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  console.log('User is signed in:', session.user.email)
} else {
  console.log('User is NOT signed in')
}
```

---

## Security Best Practices

### 1. Never Expose Service Role Key
```typescript
// ❌ NEVER do this
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // ❌ Exposed to frontend!
)

// ✅ Only use in server-side code
// src/lib/supabase/server.ts
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // Only accessible server-side
  )
}
```

### 2. Always Validate Organization Access
```typescript
// ❌ Trusting client input
const orgId = request.query.organization_id  // Could be any org!
const { data } = await supabase.from('targets').select('*').eq('organization_id', orgId)

// ✅ Validate user has access
const { data: orgUser } = await supabase
  .from('org_users')
  .select('*')
  .eq('organization_id', orgId)
  .eq('user_id', user.id)
  .single()

if (!orgUser) throw new Error('Forbidden')
```

### 3. Use RLS Everywhere
```sql
-- ❌ No RLS
CREATE TABLE intelligence_targets (...);

-- ✅ RLS enabled
CREATE TABLE intelligence_targets (...);
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org targets" ON intelligence_targets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_users
      WHERE organization_id = intelligence_targets.organization_id
      AND user_id = auth.uid()
    )
  );
```

### 4. Rate Limiting
```typescript
// TODO: Add rate limiting middleware
// Prevent abuse, protect against DDoS

import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100  // Limit each IP to 100 requests per window
})
```

---

## Deployment Architecture

### Development
```
Local Machine
  ↓
Next.js Dev Server (localhost:3000)
  ↓
Supabase Project (remote or local)
```

### Production
```
GitHub Repository
  ↓ (push to main)
Vercel (CI/CD)
  ↓ (build & deploy)
Edge Network (Vercel CDN)
  ↓
User's Browser
  ↓
Supabase Production Project
```

### Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| **Local** | Development | localhost:3000 |
| **Staging** | Testing | staging.signaldesk.com |
| **Production** | Live | app.signaldesk.com |

---

## Migration Strategy

### Backward-Compatible Changes
```sql
-- ✅ Safe: Add optional column
ALTER TABLE users ADD COLUMN phone TEXT;

-- ✅ Safe: Add index
CREATE INDEX idx_users_email ON users(email);

-- ✅ Safe: Add new table
CREATE TABLE new_feature (...);
```

### Breaking Changes (Requires Downtime or Careful Migration)
```sql
-- ❌ Breaking: Drop column
ALTER TABLE users DROP COLUMN email;  -- Breaks old code!

-- ✅ Solution: Multi-step migration
-- 1. Add new column
ALTER TABLE users ADD COLUMN email_new TEXT;
-- 2. Backfill data
UPDATE users SET email_new = email;
-- 3. Deploy new code that uses email_new
-- 4. Wait for deployment
-- 5. Drop old column
ALTER TABLE users DROP COLUMN email;
```

---

## Monitoring & Observability

### Key Metrics to Track

1. **Authentication Metrics**
   - Sign-up rate
   - Sign-in success rate
   - Password reset requests
   - OAuth failures

2. **Database Performance**
   - Query latency
   - Connection pool usage
   - RLS policy performance
   - Slow queries (>100ms)

3. **User Activity**
   - Active users (DAU/MAU)
   - Organizations created
   - Team invitations sent/accepted
   - Feature usage

4. **Error Rates**
   - API errors (4xx, 5xx)
   - Auth errors
   - Database errors

### Tools

- **Supabase Dashboard**: Database performance, auth logs
- **Vercel Analytics**: Web vitals, page performance
- **Sentry**: Error tracking
- **Posthog**: Product analytics

---

## Troubleshooting Guide

### "No session" errors
**Cause**: Cookies not being set or cleared
**Solution**:
- Clear browser cookies
- Check Supabase URL/keys in .env.local
- Verify middleware is running

### "Forbidden" on API calls
**Cause**: User doesn't belong to organization
**Solution**:
- Check org_users table
- Ensure user was added to org
- Implement onboarding flow

### OAuth redirect errors
**Cause**: Callback URL mismatch
**Solution**:
- Verify Supabase auth settings
- Check OAuth app redirect URLs
- Ensure URLs match exactly (https, no trailing slash)

### RLS policies blocking queries
**Cause**: Overly restrictive policies
**Solution**:
- Test queries in Supabase SQL editor with `auth.uid()` set
- Check if org_users entry exists
- Review policy logic

---

This architecture supports:
- ✅ Multi-tenant data isolation
- ✅ Role-based access control
- ✅ Secure authentication
- ✅ Scalable to millions of users
- ✅ Team collaboration
- ✅ OAuth integration
- ✅ Session management
- ✅ Row-level security
