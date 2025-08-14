# Supabase Integration Optimization Guide

## Current Status Summary

### Implemented Features
- **Singleton Pattern**: Single Supabase client instance enforced globally
- **Auth Integration**: Clean AuthContext with session management
- **Error Handling**: Graceful schema error handling for production
- **Real-time Subscriptions**: Channels for monitoring updates
- **Edge Functions**: Monitor-intelligence function for async processing
- **Security**: PKCE flow enabled for enhanced security

### Issues Requiring Attention

#### 1. RLS Policy Fixes (Critical)
Current policies use `current_setting('app.current_organization')` which doesn't work with Supabase Auth.

**Action Required**: Run the migration file `/supabase-migration/05-fix-rls-policies.sql` in your Supabase SQL editor.

#### 2. Environment Variables
Ensure these are set in all environments:
- `REACT_APP_SUPABASE_URL` 
- `REACT_APP_SUPABASE_ANON_KEY`

For Edge Functions, set in Supabase Dashboard:
- `ANTHROPIC_API_KEY` (for AI analysis)

#### 3. Database Schema Optimization
Consider adding these indexes for better performance:

```sql
-- Add composite indexes for common queries
CREATE INDEX idx_findings_org_created ON intelligence_findings(organization_id, created_at DESC);
CREATE INDEX idx_targets_org_active ON intelligence_targets(organization_id, active);
CREATE INDEX idx_opportunities_org_status ON opportunity_queue(organization_id, status);

-- Add GIN index for JSONB columns
CREATE INDEX idx_targets_sources_gin ON intelligence_targets USING gin(sources);
CREATE INDEX idx_findings_metadata_gin ON intelligence_findings USING gin(metadata);
```

## Production Deployment Checklist

### Pre-Deployment
- [ ] Run RLS policy migration (`05-fix-rls-policies.sql`)
- [ ] Verify environment variables in production
- [ ] Test authentication flow with a test user
- [ ] Verify Edge Function deployment

### Database Setup
1. **Run migrations in order**:
   ```sql
   -- Run in Supabase SQL editor
   1. 01-schema-setup-SAFE.sql
   2. 02-demo-data.sql (optional for testing)
   3. 05-fix-rls-policies.sql
   ```

2. **Create initial user**:
   ```sql
   -- Create a test user via Supabase Auth UI or:
   -- Use the Supabase Dashboard Auth section to create users
   ```

3. **Verify RLS policies**:
   ```sql
   -- Check policies are active
   SELECT schemaname, tablename, policyname, permissive, roles, cmd 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

### Edge Functions Deployment
1. **Deploy monitor-intelligence function**:
   ```bash
   supabase functions deploy monitor-intelligence
   ```

2. **Set secrets**:
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=your-api-key
   ```

3. **Test function**:
   ```bash
   supabase functions invoke monitor-intelligence --body '{"organizationId":"default-org"}'
   ```

## Performance Optimizations

### 1. Connection Pooling
The current configuration is good, but consider these enhancements:

```javascript
// Enhanced Supabase client config
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: window.localStorage,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'signaldesk-frontend'
    }
  }
})
```

### 2. Query Optimization
Use select with specific columns instead of '*':

```javascript
// Instead of
.select('*')

// Use
.select('id, title, content, created_at')
```

### 3. Batch Operations
For multiple inserts/updates, use batch operations:

```javascript
// Batch insert
const { data, error } = await supabase
  .from('intelligence_findings')
  .insert(findingsArray) // Array of findings
  .select()
```

### 4. Real-time Subscription Management
Properly unsubscribe from channels:

```javascript
useEffect(() => {
  const channel = supabase
    .channel('custom-channel')
    .on('postgres_changes', { /* ... */ }, callback)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

## Security Best Practices

### 1. Never Expose Service Role Key
The service role key should only be used in Edge Functions, never in frontend code.

### 2. Validate Input Data
Always validate data before database operations:

```javascript
const validateAndSanitize = (input) => {
  // Remove any SQL injection attempts
  return input.replace(/[;'"\\]/g, '')
}
```

### 3. Use Prepared Statements
Supabase client already uses prepared statements, but when writing raw SQL:

```sql
-- Use parameterized queries
EXECUTE format('SELECT * FROM users WHERE email = %L', email_param);
```

### 4. Rate Limiting
Implement rate limiting for sensitive operations:

```javascript
// Use a rate limiter library or implement custom logic
const rateLimiter = new Map()

const checkRateLimit = (userId, action) => {
  const key = `${userId}-${action}`
  const now = Date.now()
  const limit = rateLimiter.get(key)
  
  if (limit && now - limit < 60000) { // 1 minute
    throw new Error('Rate limit exceeded')
  }
  
  rateLimiter.set(key, now)
}
```

## Monitoring & Debugging

### 1. Enable Supabase Logging
```javascript
if (process.env.NODE_ENV === 'development') {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event)
    console.log('Session:', session)
  })
}
```

### 2. Database Query Monitoring
Monitor slow queries in Supabase Dashboard under Database > Query Performance.

### 3. Error Tracking
Implement comprehensive error tracking:

```javascript
window.addEventListener('unhandledrejection', event => {
  if (event.reason?.message?.includes('supabase')) {
    console.error('Supabase error:', event.reason)
    // Send to error tracking service
  }
})
```

## Next Steps

1. **Immediate Actions**:
   - Run RLS policy migration
   - Test authentication flow
   - Verify Edge Function deployment

2. **Short-term Improvements**:
   - Add performance indexes
   - Implement query optimizations
   - Set up monitoring

3. **Long-term Enhancements**:
   - Implement Vector search for AI features
   - Add database backup automation
   - Set up staging environment

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Performance Tuning](https://supabase.com/docs/guides/platform/performance)

## File References

### Core Configuration Files
- `/frontend/src/config/supabase.js` - Singleton Supabase client
- `/frontend/src/contexts/AuthContext.js` - Authentication context
- `/frontend/.env` - Environment variables

### Migration Files
- `/supabase-migration/01-schema-setup-SAFE.sql` - Base schema
- `/supabase-migration/05-fix-rls-policies.sql` - RLS fixes

### Edge Functions
- `/supabase/functions/monitor-intelligence/index.ts` - Monitoring function

### Validation Utilities
- `/frontend/src/utils/supabaseValidation.js` - Client validation