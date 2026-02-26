Multi-Tenant Platform Transformation Plan

Current State Summary

- No authentication system (Supabase Auth installed but not configured)
- Organization-scoped data but no user ownership
- Direct-to-app access (no login/signup flow)
- Security gaps: Service role keys bypass all permissions, no API validation

---

Phase 1: Foundation - Authentication & User Management (2-3 weeks)

1.1 Implement Supabase Authentication

- Sign up / Sign in pages (/auth/signup, /auth/login)
- Email/password + OAuth providers (Google, Microsoft for B2B)
- Email verification flow
- Password reset flow
- Session management (middleware to protect routes)

  1.2 User Database Schema

-- users table (managed by Supabase Auth)
-- user_profiles table
CREATE TABLE user_profiles (
id UUID PRIMARY KEY REFERENCES auth.users,
email TEXT NOT NULL,
full_name TEXT,
avatar_url TEXT,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- org_users junction table (team management)
CREATE TABLE org_users (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
organization_id UUID REFERENCES organizations,
user_id UUID REFERENCES auth.users,
role TEXT CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
created_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE(organization_id, user_id)
);

1.3 Row Level Security (RLS)

- Enable RLS on ALL tables
- Policies based on user_id in org_users junction table
- Service role key ONLY for Edge Functions, not frontend

---

Phase 2: Multi-Tenant Data Isolation (1-2 weeks)

2.1 Add user_id to Content Tables

Tables that need user_id (creator/owner):

- intelligence_targets
- monitoring_alerts
- crisis_alerts
- content_library
- campaigns
- memory_vault
- niv_conversations
- proposals
- playbooks

  2.2 Migration Strategy

-- Add user_id column
ALTER TABLE intelligence_targets ADD COLUMN user_id UUID REFERENCES auth.users;

-- Backfill existing data (assign to first org owner)
UPDATE intelligence_targets t
SET user_id = (
SELECT user_id FROM org_users
WHERE organization_id = t.organization_id
AND role = 'owner'
LIMIT 1
);

-- Make NOT NULL after backfill
ALTER TABLE intelligence_targets ALTER COLUMN user_id SET NOT NULL;

2.3 API Updates

- All API routes validate user session
- Use anon key + RLS instead of service role key
- Middleware to inject user_id from session

---

Phase 3: Homepage & Onboarding (1-2 weeks)

3.1 Marketing Homepage (/)

- Hero section: Value proposition, key benefits
- Features showcase: Intelligence monitoring, GEO tracking, crisis alerts
- Use cases: PR teams, comms professionals, crisis management
- Pricing section (even if just "Contact Us" initially)
- CTA buttons: Sign Up, Book Demo, View Docs

  3.2 Onboarding Flow (Post-Signup)

Step 1: Welcome screen
Step 2: Create first organization
Step 3: Organization setup wizard:

- Company name
- Industry/category
- Upload logo
- Set profile (mission, about)

Step 4: Create first intelligence target (guided tour)
Step 5: Optional: Import existing data or connect integrations

3.3 Empty States

- Dashboard with no organizations → prompt to create one
- Organization with no targets → guided setup
- No alerts/content → educational tooltips

---

Phase 4: Team Management & Permissions (1 week)

4.1 Team Pages

- /settings/team - Invite members, manage roles
- Email invitations with magic links
- Role-based permissions:

  - Owner: Full access, billing, delete org
  - Admin: Manage targets, alerts, team (except owner actions)
  - Member: Create/edit content, view intelligence
  - Viewer: Read-only access

  4.2 Invitation System

CREATE TABLE org_invitations (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
organization_id UUID REFERENCES organizations,
email TEXT NOT NULL,
role TEXT NOT NULL,
invited_by UUID REFERENCES auth.users,
token TEXT UNIQUE NOT NULL,
expires_at TIMESTAMPTZ NOT NULL,
accepted_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW()
);

---

Phase 5: Platform Documentation & Help System (1-2 weeks)

5.1 In-App Documentation

Option A: Contextual Help

- Tooltip system for complex features
- Info icons with popovers
- "Learn more" links to docs

Option B: Help Center (/help or subdomain)

- Getting Started Guide
- Feature documentation
- Video tutorials
- FAQ section
- Search functionality

Option C: Interactive Onboarding

- Product tour library (e.g., Intro.js, Shepherd.js)
- Step-by-step walkthroughs for key features
- Progress tracking

  5.2 Feature Explanations

Create documentation for:

- Intelligence Monitoring: What it is, how to create targets, understanding alerts
- GEO Tracking: Geographic intelligence, content selection
- Crisis Management: Alert thresholds, response workflows
- Memory Vault: Knowledge management, semantic search
- Strategic Planning: Frameworks, NIV methodology
- Content Generation: Visual assets, proposals, social media

  5.3 Status/Changelog Page (/changelog)

- Release notes for new features
- Bug fixes
- Known issues
- Upcoming features roadmap

---

Phase 6: Platform Updates & Deployment Strategy (Ongoing)

6.1 Development Workflow

Current: Single environment, direct updates
Target: Multi-environment setup

1. Local Development (localhost:3000)


    - Feature branches in Git
    - Local Supabase instance (optional)

2. Staging Environment (staging.signaldesk.com)


    - Test updates before production
    - Mirrors production database structure
    - Use Supabase branching (if available)

3. Production Environment (app.signaldesk.com)


    - Stable, user-facing
    - Database migrations via Supabase CLI

6.2 Database Migration Strategy

How Updates Work:

# 1. Create migration file locally

supabase migration new add_feature_x

# 2. Write SQL changes

# supabase/migrations/20250107_add_feature_x.sql

# 3. Test locally

supabase db reset

# 4. Push to production (applies automatically)

supabase db push

Critical: Backward-Compatible Migrations

- Never drop columns immediately (deprecate first)
- Add new columns as nullable, backfill, then make NOT NULL
- Use transactions for complex changes

Example Migration:
-- SAFE: Add column, backfill, then constrain
BEGIN;
ALTER TABLE intelligence_targets ADD COLUMN priority TEXT;
UPDATE intelligence_targets SET priority = 'medium' WHERE priority IS NULL;
ALTER TABLE intelligence_targets ALTER COLUMN priority SET NOT NULL;
COMMIT;

6.3 Frontend Deployment (Vercel/Similar)

Zero-Downtime Deployments:

- Push to main branch → auto-deploys
- Build errors block deployment
- Vercel preview URLs for PR testing

Environment Variables:

- NEXT_PUBLIC_SUPABASE_URL (public)
- NEXT_PUBLIC_SUPABASE_ANON_KEY (public)
- SUPABASE_SERVICE_ROLE_KEY (secret, only for Edge Functions)

  6.4 Edge Function Updates

# Deploy individual function

supabase functions deploy function-name

# Deploy all functions

supabase functions deploy --all

6.5 Feature Flags (Optional but Recommended)

Use environment variables or a service like LaunchDarkly:
// Enable beta features for specific users
const BETA_USERS = ['user1@example.com'];
const isBetaUser = BETA_USERS.includes(user.email);

---

Phase 7: Billing & Subscription Management (2-3 weeks)

7.1 Stripe Integration

- Subscription plans (Starter, Professional, Enterprise)
- Usage-based billing (# of targets, alerts)
- Payment method management
- Invoices & receipts

  7.2 Database Schema

CREATE TABLE subscriptions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
organization_id UUID REFERENCES organizations,
stripe_customer_id TEXT UNIQUE,
stripe_subscription_id TEXT UNIQUE,
plan_type TEXT NOT NULL,
status TEXT NOT NULL, -- active, canceled, past_due
current_period_end TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usage_logs (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
organization_id UUID REFERENCES organizations,
resource_type TEXT NOT NULL, -- 'target', 'alert', 'api_call'
count INTEGER NOT NULL,
period_start TIMESTAMPTZ NOT NULL,
period_end TIMESTAMPTZ NOT NULL
);

7.3 Limits Enforcement

// Middleware to check subscription limits
if (orgTargets.length >= subscription.limits.targets) {
throw new Error('Target limit reached. Upgrade plan.');
}

---

Additional Considerations You May Be Missing

1. Analytics & Monitoring

- Application monitoring: Sentry, LogRocket for error tracking
- Performance monitoring: Vercel Analytics, Posthog
- User analytics: Track feature usage, onboarding completion
- Database monitoring: Supabase dashboard for slow queries

2. Email System

- Transactional emails: Resend, SendGrid (verification, password reset)
- Marketing emails: Announcements, feature updates (optional)
- Alert notifications: Email summaries of crisis alerts

3. Security Enhancements

- Rate limiting: API routes (e.g., 100 req/min per user)
- CORS configuration: Restrict to your domain
- CSP headers: Content Security Policy
- Audit logs: Track who did what (esp. for compliance)

4. Legal & Compliance

- Terms of Service (/terms)
- Privacy Policy (/privacy)
- Cookie consent banner (GDPR)
- Data export (GDPR right to data portability)
- Account deletion (GDPR right to erasure)

5. Customer Support

- Support widget: Intercom, Crisp, or plain email
- Knowledge base: Help articles
- Feedback system: User suggestions, bug reports

6. Testing Strategy

- Unit tests: Critical business logic
- Integration tests: API routes with auth
- E2E tests: Playwright for auth flows, core features
- Load testing: Can your DB handle 100 concurrent users?

7. Backup & Disaster Recovery

- Supabase automatic backups: Daily (check your plan)
- Point-in-time recovery: Supabase Pro feature
- Data export scripts: Backup critical tables weekly

8. Internationalization (i18n)

- If targeting international markets, plan for:
  - Multi-language support
  - Timezone handling (already using TIMESTAMPTZ, good!)
  - Currency for billing

---

Recommended Implementation Order

1. Week 1-2: Authentication + User tables + Homepage
2. Week 3-4: RLS policies + API validation + Team management
3. Week 5-6: Add user_id to tables + Migration + Onboarding flow
4. Week 7-8: Documentation system + Help center + Platform explanations
5. Week 9-10: Billing (if needed) + Analytics + Legal pages
6. Week 11-12: Testing + Security audit + Soft launch

---

Quick Wins (Do These First)

1. Create homepage with value prop + CTA
2. Add signup/login pages (Supabase Auth tutorial: 1-2 days)
3. Protect / route with middleware (redirect to /login if no session)
4. Create users table + org_users junction
5. Update one table (e.g., intelligence_targets) with RLS as proof of concept

---

Resources & Tools

Authentication:

- https://supabase.com/docs/guides/auth
- https://github.com/vercel/next.js/tree/canary/examples/with-supabase

Onboarding:

- https://introjs.com/ - Product tours
- https://shepherdjs.dev/ - Guided tours

Team Management:

- https://casl.js.org/ - Permission management library

Analytics:

- https://posthog.com/ - Open-source analytics
- https://plausible.io/ - Privacy-friendly analytics

Documentation:

- https://mintlify.com/ - Beautiful docs platform
- https://fumadocs.vercel.app/ - Next.js docs template
