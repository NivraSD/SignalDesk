# Supabase Auth Schema Fix Guide

## Problem Description
You're experiencing a "Database error querying schema" (500 error) when trying to authenticate with Supabase. This indicates structural issues with the auth schema in your database.

## Files Created
1. **fix_auth_schema.sql** - Comprehensive SQL script to diagnose and repair auth schema
2. **test_supabase_auth.js** - Node.js script to test authentication after fixes
3. **SUPABASE_AUTH_FIX_GUIDE.md** - This guide

## Step-by-Step Fix Process

### Step 1: Run Diagnostic Queries
1. Open your Supabase Dashboard: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Copy and run **SECTION 1** from `fix_auth_schema.sql`
4. Check the output for:
   - Missing auth schema
   - Missing extensions (uuid-ossp, pgcrypto)
   - Missing tables or columns
   - Permission issues

### Step 2: Apply Progressive Fixes
Run sections 2-11 from the SQL script **one at a time**:

1. **Section 2**: Install missing extensions
2. **Section 3**: Fix schema permissions
3. **Section 4**: Recreate critical auth functions (uid, role, email)
4. **Section 5**: Fix auth.users table structure
5. **Section 6**: Fix table permissions
6. **Section 7**: Recreate views
7. **Section 8**: Fix existing user data
8. **Section 9**: Check and fix constraints
9. **Section 10**: Reset database search path
10. **Section 11**: Final verification

### Step 3: Test Authentication
After running the SQL fixes:

1. Get your Supabase anon key from Dashboard > Settings > API
2. Run the test script:
```bash
# Set your anon key
export SUPABASE_ANON_KEY="your-anon-key-here"

# Run the test
node test_supabase_auth.js
```

### Step 4: If Standard Fixes Don't Work (Emergency Reset)
**WARNING: This will delete all existing users!**

If the above steps don't resolve the issue:
1. Uncomment **Section 12** in the SQL script
2. Run it to completely reset the auth schema
3. This will create a fresh auth.users table with the admin user

## Common Issues and Solutions

### Issue 1: Missing Extensions
**Error**: Functions like `uuid_generate_v4()` or `crypt()` not found
**Solution**: Run Section 2 to install extensions

### Issue 2: Permission Denied
**Error**: Permission denied for schema auth
**Solution**: Run Sections 3 and 6 to fix permissions

### Issue 3: Missing Columns
**Error**: Column not found in auth.users
**Solution**: Run Section 5 to add missing columns

### Issue 4: Invalid Password
**Error**: Authentication fails even with correct password
**Solution**: Run Section 8 to reset the password with proper encryption

## Verification Checklist
After running the fixes, verify:

- [ ] Auth schema exists
- [ ] Required extensions are installed (uuid-ossp, pgcrypto)
- [ ] auth.users table has all required columns
- [ ] Auth functions (uid, role, email) exist
- [ ] Permissions are correctly set for authenticator, anon, and authenticated roles
- [ ] Admin user exists with encrypted password
- [ ] Test script shows successful authentication

## Root Causes
This issue typically occurs due to:

1. **Incomplete Migration**: When migrating from another system or restoring from backup
2. **Manual Schema Modifications**: Direct modifications that broke auth dependencies
3. **Extension Issues**: Missing or incorrectly installed PostgreSQL extensions
4. **Permission Problems**: Incorrect role permissions after database changes
5. **Trigger/Function Conflicts**: Custom triggers interfering with auth operations

## Prevention
To prevent this issue in the future:

1. Always use Supabase migrations for schema changes
2. Don't modify the auth schema directly
3. Test authentication after any database changes
4. Keep backups before major modifications
5. Use RLS policies instead of triggers for access control

## Additional Resources
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [PostgreSQL RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/sql-editor)

## Support
If issues persist after following this guide:
1. Check Supabase service status
2. Contact Supabase support with the diagnostic output from Section 1
3. Consider restoring from a known good backup