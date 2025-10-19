# Complete Supabase Integration Setup Guide

## Overview
This guide provides the complete setup for SignalDesk's Supabase integration with Claude AI and monitoring services.

## Current Status ✅
- **Supabase URL**: `https://zskaxjtyuaqazydouifp.supabase.co`
- **Edge Functions Created**:
  - `claude-chat` - Enhanced Claude AI integration
  - `monitor-intelligence` - Intelligence monitoring with MCP support
  - `niv-chat` - NIV PR strategist chat
- **Database Schema**: Complete migration file created
- **Frontend Services**: Updated to use Supabase Edge Functions

## Setup Steps

### 1. Install Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# npm
npm install -g supabase

# Or download from: https://github.com/supabase/cli/releases
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Link Your Project
```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/frontend
supabase link --project-ref zskaxjtyuaqazydouifp
```

### 4. Run Database Migrations
```bash
# Apply the complete setup migration
supabase db push --file supabase/migrations/001_complete_setup.sql
```

### 5. Set Environment Secrets
```bash
# Set your Anthropic API key (REQUIRED)
supabase secrets set ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Optional: Set MCP server URL if you have one
supabase secrets set MCP_SERVER_URL=http://your-mcp-server-url
supabase secrets set USE_MCP=true
```

### 6. Deploy Edge Functions
```bash
# Deploy all functions
supabase functions deploy claude-chat --no-verify-jwt
supabase functions deploy monitor-intelligence --no-verify-jwt
supabase functions deploy niv-chat --no-verify-jwt

# Or use the deployment script
chmod +x supabase/deploy-functions.sh
./supabase/deploy-functions.sh
```

### 7. Update Frontend Environment
Ensure your `.env` file has the correct values:
```env
REACT_APP_SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0
```

### 8. Test the Integration
Open the test file in your browser:
```bash
open /Users/jonathanliebowitz/Desktop/SignalDesk/frontend/test-supabase-functions.html
```

## Edge Function URLs
Once deployed, your functions will be available at:
- **Claude Chat**: `https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/claude-chat`
- **Monitor Intelligence**: `https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/monitor-intelligence`
- **NIV Chat**: `https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/niv-chat`

## Key Features

### Claude AI Integration
- Multiple model support (Opus, Sonnet, Haiku)
- Conversation history management
- Token usage tracking
- Error logging
- Organization-level usage analytics

### Intelligence Monitoring
- Real-time monitoring with MCP integration
- Multiple monitoring modes (quick, comprehensive, deep)
- Claude-powered fallback analysis
- Batch processing for large datasets
- Real-time notifications

### Database Features
- Complete schema with all necessary tables
- Row Level Security (RLS) policies
- Real-time subscriptions
- Automatic timestamp updates
- Performance indexes

## Frontend Integration

### Using Claude Service
```javascript
import claudeService from './services/claudeService';

// Send a message
const response = await claudeService.sendMessage('Your prompt here', {
  model: 'claude-3-haiku',
  maxTokens: 2000
});

// Generate content
const content = await claudeService.generateContent({
  type: 'blog post',
  context: 'AI trends',
  tone: 'professional'
});
```

### Using Monitoring Service
```javascript
import monitoringService from './services/monitoringService';

// Start monitoring
const result = await monitoringService.startMonitoring(organizationId, {
  mode: 'comprehensive',
  sources: ['web', 'social', 'news']
});

// Subscribe to real-time findings
monitoringService.subscribeToFindings(organizationId, (finding) => {
  console.log('New finding:', finding);
});
```

## Troubleshooting

### Authentication Issues
1. Ensure the anon key in `.env` matches your Supabase project
2. Check RLS policies are correctly set
3. Verify user has proper permissions

### Edge Function Errors
1. Check function logs: `supabase functions logs claude-chat`
2. Verify environment secrets are set
3. Ensure ANTHROPIC_API_KEY is valid

### Database Connection Issues
1. Check Supabase project status
2. Verify network connectivity
3. Review RLS policies

## Testing Checklist
- [ ] Authentication works (login/logout)
- [ ] Claude chat responds correctly
- [ ] Monitoring runs successfully
- [ ] Real-time subscriptions work
- [ ] Database operations succeed
- [ ] Error handling works properly

## Support Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Anthropic API Docs](https://docs.anthropic.com)

## Next Steps
1. Configure production environment variables
2. Set up monitoring alerts
3. Implement usage quotas
4. Add additional intelligence sources
5. Configure MCP servers for enhanced monitoring

## Security Notes
- Never commit API keys to version control
- Use environment variables for sensitive data
- Regularly rotate API keys
- Monitor usage for anomalies
- Implement rate limiting as needed

---

**Created**: 2025-08-14
**Status**: Ready for deployment
**Support**: Contact SignalDesk support for assistance