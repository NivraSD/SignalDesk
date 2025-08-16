# SignalDesk Supabase Deployment Guide

## Complete Migration from Railway to Supabase

### Prerequisites
- Supabase account and project (you have: zskaxjtyuaqazydouifp)
- Vercel account for frontend hosting
- Node.js 18+ installed locally

### Step 1: Database Setup

1. **Run the database schema setup:**
   ```bash
   ./setup-supabase.sh
   ```

2. **Get your database connection string:**
   - Go to https://app.supabase.com
   - Navigate to Settings > Database
   - Copy the "Connection string" (URI format)
   - It should look like: `postgresql://postgres.[ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`

3. **Get your service role key (for admin operations):**
   - Go to Settings > API
   - Copy the "service_role" key (keep this secret!)

### Step 2: Environment Configuration

1. **Update backend/.env:**
   ```env
   # Supabase Configuration
   DATABASE_URL=your_connection_string_here
   SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_KEY=your_service_key_here
   
   # Other configs
   ANTHROPIC_API_KEY=your_anthropic_key
   JWT_SECRET=your_jwt_secret
   PORT=3001
   ```

2. **Update frontend/.env.local:**
   ```env
   REACT_APP_SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
   REACT_APP_API_URL=https://your-backend-url.vercel.app/api
   ```

### Step 3: MCP Configuration

1. **Update Claude Desktop config** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
   - Ensure all MCPs use the correct DATABASE_URL
   - All MCPs should have SUPABASE_URL and SUPABASE_ANON_KEY

### Step 4: Deploy Backend to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy backend:**
   ```bash
   cd backend
   vercel --prod
   ```

3. **Set environment variables in Vercel:**
   ```bash
   vercel env add DATABASE_URL
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_KEY
   vercel env add ANTHROPIC_API_KEY
   vercel env add JWT_SECRET
   ```

### Step 5: Deploy Frontend to Vercel

1. **Deploy frontend:**
   ```bash
   cd frontend
   vercel --prod
   ```

2. **Set environment variables:**
   ```bash
   vercel env add REACT_APP_SUPABASE_URL
   vercel env add REACT_APP_SUPABASE_ANON_KEY
   vercel env add REACT_APP_API_URL
   ```

### Step 6: Configure Supabase Realtime (Optional)

1. **Enable Realtime for tables:**
   - Go to Supabase Dashboard > Database > Replication
   - Enable replication for tables that need real-time updates:
     - opportunities
     - monitoring_alerts
     - cascade_predictions

### Step 7: Set up Edge Functions (Optional)

For advanced MCP operations, you can use Supabase Edge Functions:

1. **Install Supabase CLI:**
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Create edge functions:**
   ```bash
   supabase functions new opportunity-detector
   supabase functions new cascade-predictor
   ```

3. **Deploy functions:**
   ```bash
   supabase functions deploy
   ```

### Step 8: Verify Deployment

1. **Test database connection:**
   ```bash
   node -e "
   const { createClient } = require('@supabase/supabase-js');
   const supabase = createClient(
     'https://zskaxjtyuaqazydouifp.supabase.co',
     'your_anon_key'
   );
   supabase.from('opportunities').select('*').limit(1)
     .then(({ data, error }) => {
       if (error) console.error('Error:', error);
       else console.log('Success! Connected to Supabase');
     });
   "
   ```

2. **Test MCPs:**
   - Restart Claude Desktop
   - Check that all MCPs show as "running"

3. **Test frontend:**
   - Visit your Vercel URL
   - Login and verify all features work

### Database Connection Strings

Supabase provides different connection strings for different use cases:

- **Direct connection:** For server-side Node.js apps
  ```
  postgresql://postgres:[password]@db.zskaxjtyuaqazydouifp.supabase.co:5432/postgres
  ```

- **Connection pooling (recommended):** For serverless/edge functions
  ```
  postgresql://postgres.[ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
  ```

- **Transaction pooling:** For high-volume apps
  ```
  postgresql://postgres.[ref]:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true
  ```

### Troubleshooting

1. **"Tenant or user not found" error:**
   - Check that you're using the correct password
   - Try using the direct connection string instead of pooler

2. **MCPs not connecting:**
   - Ensure DATABASE_URL is set in Claude Desktop config
   - Check that the connection string includes SSL mode

3. **Frontend can't reach backend:**
   - Verify REACT_APP_API_URL points to your Vercel backend
   - Check CORS settings in backend

### Monitoring

1. **Database metrics:**
   - Supabase Dashboard > Reports
   - Monitor query performance and connections

2. **API metrics:**
   - Supabase Dashboard > API
   - Track request counts and latency

3. **Logs:**
   - Supabase Dashboard > Logs
   - View database and function logs

### Security Best Practices

1. **Never commit secrets to git**
2. **Use environment variables for all sensitive data**
3. **Enable Row Level Security (RLS) on all tables**
4. **Use service_role key only on backend, never in frontend**
5. **Regularly rotate API keys**

### Next Steps

1. Set up CI/CD with GitHub Actions
2. Configure custom domain
3. Set up monitoring and alerts
4. Implement backup strategy

### Support

- Supabase Documentation: https://supabase.com/docs
- Vercel Documentation: https://vercel.com/docs
- SignalDesk Issues: Create an issue in your repository

---

## Migration Complete! 🎉

Your SignalDesk platform is now fully migrated to Supabase and ready for production deployment.