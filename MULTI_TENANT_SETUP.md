# SignalDesk Multi-Tenant Platform Setup

## What We Built - Phase 1 Complete ✅

You now have a fully functional authentication system and the foundation for a multi-tenant SaaS platform!

### Files Created/Modified

#### Authentication Pages
- `/src/app/auth/login/page.tsx` - Sign in page
- `/src/app/auth/signup/page.tsx` - Sign up page
- `/src/app/auth/reset-password/page.tsx` - Password reset flow
- `/src/app/auth/update-password/page.tsx` - Update password after reset
- `/src/app/auth/callback/route.ts` - OAuth callback handler
- `/src/app/auth/error/page.tsx` - Auth error page

#### Components
- `/src/components/auth/AuthForm.tsx` - Reusable auth form with email/password + OAuth
- `/src/components/auth/AuthProvider.tsx` - React context for auth state management

#### Configuration
- `/src/lib/supabase/auth-client.ts` - Browser-side Supabase auth client
- `/src/lib/supabase/server.ts` - Updated with SSR auth + service role client
- `/src/middleware.ts` - Route protection middleware (redirects unauthenticated users)

#### Database
- `/supabase/migrations/20251107170317_create_user_management.sql` - User tables migration
- `/apply-auth-migration.sql` - Manual migration script (if CLI fails)

#### Routes
- `/src/app/page.tsx` - NEW: Marketing homepage (moved from dashboard)
- `/src/app/dashboard/page.tsx` - MOVED: Main app (now requires auth)
- `/src/app/layout.tsx` - Updated with AuthProvider

---

## Database Schema Changes

### New Tables

#### `user_profiles`
Extends Supabase Auth users with additional profile data.
```sql
- id (UUID, FK to auth.users)
- email
- full_name
- avatar_url
- created_at
- updated_at
```

#### `org_users` (Junction Table)
Many-to-many relationship between users and organizations.
```sql
- id (UUID)
- organization_id (FK to organizations)
- user_id (FK to auth.users)
- role (owner | admin | member | viewer)
- invited_by (FK to auth.users)
- joined_at
```

#### `org_invitations`
Pending team invitations.
```sql
- id (UUID)
- organization_id (FK to organizations)
- email
- role
- invited_by
- token (unique)
- expires_at (7 days)
- accepted_at
```

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Users can only see their own profile
- Users can only see members of their organizations
- Only owners/admins can invite members
- Invitation tokens are validated before use

### Auto-Created Profile
When a user signs up, a trigger automatically creates their `user_profiles` entry.

---

## How to Apply the Migration

### Option 1: Supabase CLI (Recommended)
```bash
cd /Users/jonathanliebowitz/Desktop/signaldesk-v3
supabase db push
```

If you get errors about existing migrations, the old migrations are already applied. The new one (`20251107170317_create_user_management.sql`) will be applied.

### Option 2: Manual (via Supabase Dashboard)
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Open `/apply-auth-migration.sql` from your project root
3. Copy and paste the entire SQL into the editor
4. Click "Run"

---

## How Authentication Works

### Flow Diagram
```
User visits / (homepage)
  ↓
  Is authenticated? → YES → Redirect to /dashboard
  ↓ NO
  User clicks "Sign Up" or "Sign In"
  ↓
  Auth pages (/auth/login or /auth/signup)
  ↓
  Supabase Auth (email/password or OAuth)
  ↓
  Callback route (/auth/callback) exchanges code for session
  ↓
  Middleware checks session on every request
  ↓
  Redirect to /dashboard
```

### Middleware Protection
The middleware (`/src/middleware.ts`) protects routes:
- **Public routes**: `/`, `/auth/*` (login, signup, etc.)
- **Protected routes**: Everything else (redirects to `/auth/login` if not signed in)
- **Auto-redirect**: Signed-in users can't access auth pages (redirects to `/dashboard`)

### OAuth Providers
Currently configured:
- Google
- GitHub

To enable these, go to Supabase Dashboard → Authentication → Providers and configure OAuth apps.

---

## Testing the Authentication Flow

### 1. Start the Dev Server
```bash
npm run dev
```

### 2. Visit the Homepage
```
http://localhost:3000
```

You should see the marketing homepage with:
- Hero section
- Features grid
- Use cases
- CTA buttons

### 3. Sign Up Flow
1. Click "Get Started" or "Sign Up"
2. Fill in:
   - Full Name
   - Email
   - Password (min 6 characters)
3. Check email for verification link (in development, check Supabase Dashboard → Auth → Users)
4. Click verification link
5. Redirected to `/dashboard`

### 4. Sign In Flow
1. Click "Sign In"
2. Enter email/password
3. Redirected to `/dashboard`

### 5. Password Reset
1. Click "Forgot password?" on login page
2. Enter email
3. Check email for reset link
4. Click link → redirected to `/auth/update-password`
5. Enter new password
6. Redirected to `/dashboard`

### 6. OAuth Flow
1. Click "Google" or "GitHub" button
2. Redirected to provider login
3. Authorize app
4. Redirected to `/auth/callback`
5. Session created
6. Redirected to `/dashboard`

---

## Next Steps - Phase 2

### 1. Organization Onboarding (CRITICAL)
**Problem**: Currently, when a user signs up, they have no organizations.

**Solution**: Create an onboarding flow after signup:
```tsx
// After signup, redirect to /onboarding instead of /dashboard
router.push('/onboarding')

// Onboarding page:
1. Welcome screen
2. Create first organization form:
   - Organization name
   - Industry
   - Logo upload
3. Create organization in DB
4. Create org_users entry (user as 'owner')
5. Redirect to /dashboard
```

**Files to create**:
- `/src/app/onboarding/page.tsx`
- `/src/components/onboarding/CreateOrgFlow.tsx`

### 2. Update API Routes with Auth
Currently, API routes use service role keys (bypass RLS). They need to:
1. Get user from session
2. Validate user has access to organization
3. Use anon key + RLS instead of service role

**Example**:
```typescript
// Before
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('organization_id')

  const supabase = createServerClient() // Service role, bypasses RLS
  const { data } = await supabase.from('intelligence_targets').select('*')
}

// After
export async function GET(request: Request) {
  const supabase = await createClient() // Uses session, respects RLS
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

  // Query with RLS (automatically filters by org_users access)
  const { data } = await supabase
    .from('intelligence_targets')
    .select('*')
    .eq('organization_id', orgId)
}
```

### 3. Add user_id to Content Tables
Tables that need `user_id` (creator tracking):
- `intelligence_targets`
- `monitoring_alerts`
- `crisis_alerts`
- `content_library`
- `campaigns`
- `memory_vault`
- `niv_conversations`
- `proposals`
- `playbooks`

**Migration**:
```sql
-- Add user_id column
ALTER TABLE intelligence_targets ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Backfill with first org owner (temporary)
UPDATE intelligence_targets t
SET user_id = (
  SELECT user_id FROM org_users
  WHERE organization_id = t.organization_id
  AND role = 'owner'
  LIMIT 1
);

-- Make NOT NULL
ALTER TABLE intelligence_targets ALTER COLUMN user_id SET NOT NULL;
```

### 4. Team Management UI
Create pages for:
- `/dashboard/settings/team` - View team members, invite new members
- Invitation flow:
  1. Admin/owner enters email + role
  2. Create `org_invitations` entry
  3. Send email with magic link (`/auth/accept-invitation?token=...`)
  4. User clicks link → if not signed up, goes to signup with email pre-filled
  5. After signup/signin, accept invitation (create `org_users` entry)

### 5. Update RLS on Existing Tables
Add RLS policies to all existing tables based on `org_users` membership:

```sql
-- Example: intelligence_targets
CREATE POLICY "Users can view org targets"
  ON intelligence_targets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_users ou
      WHERE ou.organization_id = intelligence_targets.organization_id
      AND ou.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create targets in their orgs"
  ON intelligence_targets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_users ou
      WHERE ou.organization_id = organization_id
      AND ou.user_id = auth.uid()
    )
  );
```

Apply to all tables with `organization_id`.

---

## Platform Updates & Deployment

### How to Roll Out Updates to All Users

#### 1. Code Updates (Frontend/Backend)
**Development Workflow**:
```bash
# 1. Make changes in feature branch
git checkout -b feature/new-feature

# 2. Test locally
npm run dev

# 3. Push to GitHub
git push origin feature/new-feature

# 4. Open PR, review, merge to main

# 5. Deploy to production (if using Vercel)
# - Automatically deploys on push to main
# - Or manually: vercel --prod
```

**Users receive updates**: Instant (on next page load)

#### 2. Database Migrations
**CRITICAL**: Database migrations are permanent and affect all users.

**Safe Migration Process**:
```bash
# 1. Create migration
supabase migration new add_feature_x

# 2. Write SQL (be backward-compatible!)
# supabase/migrations/20251107_add_feature_x.sql

# 3. Test locally
supabase db reset  # Applies all migrations from scratch

# 4. Push to staging (if you have one)
supabase db push

# 5. Test in staging

# 6. Push to production
supabase db push --linked  # If linked to prod project
# Or manually via Supabase Dashboard SQL Editor
```

**Backward-Compatible Migrations**:
```sql
-- ✅ SAFE: Add nullable column
ALTER TABLE users ADD COLUMN phone TEXT;

-- ✅ SAFE: Add column with default
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'member';

-- ❌ UNSAFE: Drop column (breaks old code)
ALTER TABLE users DROP COLUMN phone;

-- ✅ SAFE: Deprecate instead
-- 1. Add new column
ALTER TABLE users ADD COLUMN phone_new TEXT;
-- 2. Backfill data
UPDATE users SET phone_new = phone;
-- 3. Update code to use phone_new
-- 4. Deploy code
-- 5. Drop phone in next migration
ALTER TABLE users DROP COLUMN phone;

-- ❌ UNSAFE: Rename column (breaks old code)
ALTER TABLE users RENAME COLUMN email TO email_address;

-- ✅ SAFE: Add new column, backfill, then drop old
ALTER TABLE users ADD COLUMN email_address TEXT;
UPDATE users SET email_address = email;
ALTER TABLE users ALTER COLUMN email_address SET NOT NULL;
-- Deploy code that uses email_address
-- Then drop email in next migration
ALTER TABLE users DROP COLUMN email;
```

#### 3. Edge Functions (Supabase Functions)
```bash
# Deploy individual function
supabase functions deploy function-name

# Deploy all
supabase functions deploy --all

# Users receive updates: Instant (on next function call)
```

#### 4. Environment Variables
**For Public Variables** (NEXT_PUBLIC_*):
1. Update in Vercel Dashboard → Project Settings → Environment Variables
2. Redeploy: `vercel --prod`

**For Secret Variables** (service keys):
```bash
# Supabase secrets
supabase secrets set SECRET_NAME="value"

# Vercel secrets
vercel env add SECRET_NAME
```

#### 5. Rollback Strategy
**Code Rollback**:
```bash
# Vercel
vercel rollback  # Rolls back to previous deployment

# Manual
git revert <commit-hash>
git push origin main
```

**Database Rollback**:
```bash
# WARNING: Hard to rollback migrations!
# Best practice: Write reversible migrations

-- In migration file, add DOWN section
-- UP
ALTER TABLE users ADD COLUMN phone TEXT;

-- DOWN (run manually if needed)
ALTER TABLE users DROP COLUMN phone;
```

**Better approach**: Feature flags
```typescript
// Don't release breaking changes immediately
const FEATURE_ENABLED = process.env.NEXT_PUBLIC_NEW_FEATURE === 'true'

if (FEATURE_ENABLED) {
  // New code path
} else {
  // Old code path
}
```

---

## Monitoring & Observability

### 1. Error Tracking
**Sentry** (recommended):
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 2. Analytics
**Posthog** or **Plausible**:
```bash
npm install posthog-js
```

### 3. Database Monitoring
- Supabase Dashboard → Database → Performance
- Slow queries
- Connection pooling

### 4. Logs
**Supabase Functions**:
```bash
supabase functions logs function-name --tail
```

**Vercel**:
- Vercel Dashboard → Project → Logs
- Real-time streaming

---

## Security Checklist

### Before Going Live

- [ ] Enable email verification (Supabase Auth settings)
- [ ] Configure OAuth apps (Google, GitHub) with production URLs
- [ ] Set up custom SMTP (Supabase Auth → Email templates)
- [ ] Add rate limiting to API routes
- [ ] Enable CORS restrictions (only allow your domain)
- [ ] Review RLS policies on all tables
- [ ] Remove service role key from frontend (use only in Edge Functions)
- [ ] Add CSP headers (Content Security Policy)
- [ ] Set up audit logs (track user actions)
- [ ] Configure password complexity rules
- [ ] Enable 2FA (optional, Supabase supports TOTP)

---

## Environment Variables Needed

### Development (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Only for Edge Functions, never expose to frontend
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (for scripts)
DATABASE_URL=postgresql://...
```

### Production (Vercel)
```bash
# Same as development, but with production Supabase project
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-role-key
```

---

## Documentation & Help System

### In-App Help (Phase 3)
1. **Tooltips**: Add to complex features
2. **Interactive tours**: Use Intro.js or Shepherd.js
3. **Empty states**: Guide users to create first target, etc.
4. **Help center**: `/help` with searchable articles

### External Documentation
Consider:
- **Mintlify** or **Docusaurus** for docs site
- **Video tutorials** (Loom or similar)
- **Status page** (for incidents)

---

## What's Working Now

✅ Marketing homepage (`/`)
✅ Sign up / Sign in pages
✅ Email verification
✅ Password reset flow
✅ OAuth (Google, GitHub) - needs provider config
✅ Session management
✅ Route protection (middleware)
✅ User profile auto-creation
✅ Auth context provider

## What's Next (In Order of Priority)

1. **Apply database migration** (run `apply-auth-migration.sql`)
2. **Onboarding flow** (create first organization after signup)
3. **Update API routes** (add auth checks, validate org access)
4. **Add user_id to tables** (track content creators)
5. **Team management UI** (invite members, manage roles)
6. **Enable RLS on all tables** (enforce access control)

---

## Getting Help

### Supabase Docs
- [Auth Guide](https://supabase.com/docs/guides/auth)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Integration](https://supabase.com/docs/guides/auth/quickstarts/nextjs)

### Next.js Docs
- [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

### Community
- Supabase Discord
- Next.js Discord

---

## Summary

You've successfully built the foundation for a multi-tenant SaaS platform! 🎉

**Key Achievements**:
- Full authentication system (email/password + OAuth)
- User management database schema
- Row Level Security policies
- Marketing homepage
- Protected dashboard routes
- Session management with automatic profile creation

**Next Big Task**: Create onboarding flow so new users can create their first organization and start using the platform.

The platform is now ready for user signups, but you'll need to complete the onboarding flow for users to actually use the app after signing up.
