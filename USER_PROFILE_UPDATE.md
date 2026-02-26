# User Profile Management - Added

## What Was Added

Since you already have organization onboarding in place, I've added **user profile management** so users can update their name and avatar.

## New Features

### 1. User Profile Settings Page
**Route**: `/settings`

**Features**:
- View and edit full name
- View and edit avatar URL
- View email (read-only)
- Link to change password
- Save changes to both `user_profiles` table and auth metadata

### 2. Updated Dashboard
**User Menu** (top-right profile icon):
- Now shows actual user's name and email from Supabase Auth
- "Profile Settings" button → links to `/settings`
- "Sign Out" button → signs out and redirects to homepage

### 3. Components Created

**`/src/components/settings/UserProfileSettings.tsx`**
- Form to edit user profile
- Saves to `user_profiles` table
- Updates auth user metadata
- Success/error messages

**`/src/app/settings/page.tsx`**
- Settings page wrapper
- "Back to Dashboard" button
- Clean layout

## How It Works

### Initial Setup
1. User signs up → `user_profiles` entry auto-created (via database trigger)
2. User's name comes from signup form → stored in `auth.users.raw_user_meta_data`
3. User profile settings page loads this data

### Updating Profile
1. User clicks profile icon → "Profile Settings"
2. Edit name and/or avatar URL
3. Click "Save Changes"
4. Updates both:
   - `user_profiles` table (for database queries)
   - `auth.users.raw_user_meta_data` (for Supabase Auth)

### Data Sync
The `AuthProvider` automatically syncs user data to `useAppStore`, so components can access user info via:
```typescript
const { user } = useAuth()
// OR
const { user } = useAppStore()
```

## Testing

1. **Sign up a new account**:
   - Go to http://localhost:3000/auth/signup
   - Enter name, email, password
   - Verify email (check Supabase Dashboard)

2. **View profile in dashboard**:
   - Profile icon should show your name and email

3. **Edit profile**:
   - Click profile icon → "Profile Settings"
   - Update your name
   - Add an avatar URL (e.g., `https://i.pravatar.cc/150?img=1`)
   - Click "Save Changes"

4. **Verify changes**:
   - Go back to dashboard
   - Profile menu should show updated name

5. **Sign out**:
   - Click profile icon → "Sign Out"
   - Should redirect to homepage

## Database Migration Required

Before this works, you need to apply the database migration:

1. Go to Supabase Dashboard → SQL Editor
2. Copy/paste contents of `/apply-auth-migration.sql`
3. Click "Run"

This creates the `user_profiles` table and trigger.

## What's Still Needed (Optional Enhancements)

### 1. Avatar Upload
Currently users paste image URLs. You could add file upload:
- Use Supabase Storage
- Upload image → get URL → save to profile

### 2. Profile Completeness Check
Show a banner if profile is incomplete (no name set):
```typescript
if (!user?.user_metadata?.full_name) {
  return <ProfileIncompleteBanner />
}
```

### 3. Email Change Flow
Currently email is read-only. To allow changes:
- Use `supabase.auth.updateUser({ email: newEmail })`
- Requires re-verification

### 4. User Preferences
Add a preferences table for:
- Theme (light/dark)
- Notification settings
- Default organization

### 5. Two-Factor Authentication
Supabase supports TOTP 2FA:
```typescript
await supabase.auth.mfa.enroll({
  factorType: 'totp'
})
```

## Integration with Existing Features

The user profile system integrates seamlessly with your existing:
- ✅ Organization onboarding
- ✅ Organization management dashboard
- ✅ Team management (when implemented, user names will show in team lists)
- ✅ All modules (user context available everywhere)

## Summary

You now have:
1. ✅ Full authentication system
2. ✅ User profile management
3. ✅ Organization onboarding (already had this)
4. ✅ Multi-tenant data model

**Missing for full multi-tenant**:
- Apply RLS policies to existing tables (intelligence_targets, etc.)
- Update API routes to validate user/org access
- Add `user_id` to content tables (for tracking creators)

See `MULTI_TENANT_SETUP.md` for complete roadmap.
