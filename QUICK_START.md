# SignalDesk Multi-Tenant - Quick Start Guide

## What Just Happened?

Your SignalDesk platform has been transformed from a single-user app into a **multi-tenant SaaS platform** with full authentication! 🚀

## Immediate Next Steps (5 minutes)

### 1. Apply the Database Migration

Open Supabase Dashboard → SQL Editor:
https://supabase.com/dashboard/project/YOUR_PROJECT/sql

Copy and paste the contents of `apply-auth-migration.sql` and click **Run**.

This creates:
- `user_profiles` table
- `org_users` table (team management)
- `org_invitations` table
- All RLS policies
- Auto-profile creation trigger

### 2. Configure OAuth Providers (Optional)

If you want Google/GitHub sign-in:

**Supabase Dashboard → Authentication → Providers**

1. **Google**:
   - Enable provider
   - Add OAuth credentials from Google Cloud Console
   - Authorized redirect: `https://your-project.supabase.co/auth/v1/callback`

2. **GitHub**:
   - Enable provider
   - Add OAuth app from GitHub Settings
   - Callback URL: `https://your-project.supabase.co/auth/v1/callback`

### 3. Test Authentication

```bash
npm run dev
```

Visit: http://localhost:3000

1. Click "Sign Up"
2. Create account
3. Check email for verification (or check Supabase Dashboard → Auth → Users)
4. Verify email
5. Get redirected to dashboard

**Note**: You'll see an error about "no organization" - that's expected! Next step is onboarding.

---

## Critical Missing Piece: Onboarding

**Problem**: New users have no organizations, so the dashboard breaks.

**Solution**: Create an onboarding flow after signup that:
1. Prompts user to create first organization
2. Collects org name, industry, logo
3. Creates organization in DB
4. Creates org_users entry (user as owner)
5. Redirects to dashboard

**Where to implement**:
- Create `/src/app/onboarding/page.tsx`
- Update `AuthForm.tsx` signup success to redirect to `/onboarding` instead of `/dashboard`

---

## File Structure Overview

```
src/
├── app/
│   ├── auth/                     # All authentication pages
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── update-password/page.tsx
│   │   ├── callback/route.ts
│   │   └── error/page.tsx
│   ├── dashboard/page.tsx        # Main app (moved from /)
│   ├── page.tsx                  # Marketing homepage (NEW)
│   └── layout.tsx                # Wrapped with AuthProvider
├── components/
│   └── auth/
│       ├── AuthForm.tsx          # Reusable auth form
│       └── AuthProvider.tsx      # Auth context
├── lib/
│   └── supabase/
│       ├── auth-client.ts        # Browser Supabase client
│       ├── server.ts             # SSR Supabase client + service role
│       └── client.ts             # Old client (still works)
└── middleware.ts                 # Route protection

supabase/
└── migrations/
    └── 20251107170317_create_user_management.sql

apply-auth-migration.sql          # Manual migration script
```

---

## How Authentication Works

```
Homepage (/)
  → Not authenticated → Shows marketing page
  → Authenticated → Redirects to /dashboard

/auth/login or /auth/signup
  → User enters credentials
  → Supabase Auth creates session
  → Redirects to /auth/callback
  → Callback exchanges code for session
  → Middleware validates session
  → Redirects to /dashboard

/dashboard (protected)
  → Middleware checks session
  → No session → Redirect to /auth/login
  → Has session → Render dashboard
```

---

## Key Components

### AuthProvider
Wraps your app and provides `useAuth()` hook:

```typescript
import { useAuth } from '@/components/auth/AuthProvider'

function MyComponent() {
  const { user, loading, signOut } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not signed in</div>

  return (
    <div>
      <p>Welcome {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### useAppStore
Now automatically syncs with authenticated user:

```typescript
import { useAppStore } from '@/stores/useAppStore'

function MyComponent() {
  const { user, organization } = useAppStore()

  return <div>{user?.name || 'Loading...'}</div>
}
```

---

## Database Schema

### user_profiles
- Links to `auth.users`
- Stores full_name, avatar_url

### org_users
- Junction table: users ↔ organizations
- Roles: owner, admin, member, viewer
- One user can belong to multiple organizations

### org_invitations
- Pending invitations
- Token-based (unique, expires in 7 days)
- Email + role

---

## What Changed vs. Before

| Before | After |
|--------|-------|
| No login required | Authentication required |
| Homepage = Dashboard | Homepage = Marketing site |
| Service role key everywhere | Middleware + RLS |
| Hardcoded user "John Doe" | Real authenticated users |
| Single organization | Multi-tenant (users can have multiple orgs) |
| Direct API access | API validation (coming in Phase 2) |

---

## Environment Variables

Make sure you have:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For Edge Functions only
```

---

## Troubleshooting

### "No session" error
- Check if cookies are enabled
- Check if Supabase URL/keys are correct
- Clear cookies and try again

### "Organization not found" error
- Expected! User needs to create an organization first
- Implement onboarding flow (see above)

### OAuth not working
- Check OAuth provider configuration in Supabase
- Verify redirect URLs match
- Check browser console for errors

### Migration errors
- Use `apply-auth-migration.sql` via Supabase Dashboard SQL Editor
- Check if tables already exist (safe to re-run with IF NOT EXISTS)

---

## Next Phase Priorities

1. **Onboarding Flow** (CRITICAL) - Users need orgs to use the app
2. **API Auth Validation** - Protect API routes
3. **Add user_id to Tables** - Track content creators
4. **Team Management UI** - Invite members, manage roles
5. **RLS on Existing Tables** - Enforce org-level access control

---

## Quick Commands

```bash
# Start dev server
npm run dev

# Apply migrations (if CLI works)
supabase db push

# Check auth status
# Visit: http://localhost:3000/auth/login

# View Supabase logs
supabase functions logs --tail

# Deploy to production (Vercel)
git push origin main  # Auto-deploys if connected
```

---

## Resources

- **Full docs**: See `MULTI_TENANT_SETUP.md`
- **Migration script**: See `apply-auth-migration.sql`
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Auth docs**: https://supabase.com/docs/guides/auth

---

## Summary

✅ Authentication system complete
✅ Marketing homepage live
✅ Dashboard protected
✅ User management schema ready
✅ RLS policies configured

⚠️ **Next**: Create onboarding flow so users can create their first organization after signup.

You're 80% of the way to a production-ready SaaS platform! 🎉
