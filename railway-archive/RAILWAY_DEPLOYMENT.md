# Railway Deployment Guide for SignalDesk

## 🚨 Current Issues & Solutions

### 1. **No Article Content (CRITICAL)**
**Problem**: Articles only have titles, not actual content
**Impact**: Opportunity detection can't find patterns in empty content
**Solution**: 
- Add ContentExtractionService to fetch full article text
- Use Cheerio to parse HTML and extract article body
- Fallback to description if extraction fails

### 2. **Service Crashes**
**Problem**: UnifiedMonitoringService dies frequently
**Solution**: 
- Railway's auto-restart policy
- Proper error handling
- Health checks

### 3. **Database Issues**
**Problem**: Local PostgreSQL with hardcoded passwords
**Solution**:
- Railway PostgreSQL addon
- Environment variables for credentials
- Connection pooling

## 📦 Railway Setup Steps

### 1. Create Railway Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project in backend directory
cd backend
railway init
```

### 2. Add PostgreSQL Database
```bash
railway add postgresql
```

### 3. Set Environment Variables
```bash
# Required variables
railway variables set CLAUDE_API_KEY="your-key"
railway variables set JWT_SECRET="your-secret"
railway variables set NODE_ENV="production"
railway variables set MONITORING_INTERVAL="300000"
railway variables set RSS_TIMEOUT="15000"
```

### 4. Deploy Services
```bash
# Deploy backend
railway up

# The Procfile will handle both web and worker processes
```

## 🔧 Optimization Checklist

### Before Railway Deploy:
- [ ] Install cheerio for content extraction: `npm install cheerio`
- [ ] Add retry logic to RSS feeds
- [ ] Implement article deduplication
- [ ] Add logging service (Winston/Morgan)
- [ ] Create database indexes for performance

### After Railway Deploy:
- [ ] Monitor logs for errors
- [ ] Check monitoring service is running
- [ ] Verify articles have full content
- [ ] Test opportunity detection accuracy
- [ ] Set up alerts for failures

## 📊 Expected Improvements

### With Railway:
- **Uptime**: 99.9% (vs current ~50%)
- **Articles Stored**: 100,000+/day (vs 3,000)
- **Content Quality**: Full text (vs titles only)
- **Opportunities**: 100+/day (vs 20)
- **Response Time**: <500ms (vs 2-3s)

### Cost Estimate:
- **Hobby Plan**: $5/month
- **PostgreSQL**: $5/month
- **Total**: ~$10/month

## 🚀 Performance Optimizations

### 1. Database Optimizations
```sql
-- Add indexes for faster queries
CREATE INDEX idx_findings_created ON intelligence_findings(created_at DESC);
CREATE INDEX idx_findings_org_created ON intelligence_findings(organization_id, created_at DESC);
CREATE INDEX idx_opportunities_status ON opportunity_queue(status, created_at DESC);
```

### 2. Caching Strategy
- Cache RSS feed results for 5 minutes
- Cache opportunity patterns for 1 hour
- Use Redis for session management

### 3. Content Extraction
- Run extraction in parallel (5 concurrent)
- Cache extracted content for 24 hours
- Skip extraction for known news aggregators

### 4. Monitoring Improvements
- Batch database inserts (100 at a time)
- Use connection pooling (max 20 connections)
- Implement circuit breaker for failing feeds

## 📈 Monitoring Dashboard

Create these endpoints for Railway metrics:

```javascript
// /api/monitoring/stats
{
  "articlesLast24h": 95000,
  "opportunitiesDetected": 127,
  "activeFeeds": 154,
  "failedFeeds": 12,
  "avgResponseTime": "420ms",
  "contentExtractionRate": "87%"
}

// /api/monitoring/health
{
  "database": "healthy",
  "monitoring": "running",
  "lastCycle": "2025-08-07T14:30:00Z",
  "nextCycle": "2025-08-07T14:35:00Z",
  "queueSize": 1823
}
```

## 🔴 Critical Path

1. **Deploy basic backend first** (without monitoring)
2. **Verify database connection**
3. **Test opportunity endpoint**
4. **Add monitoring service**
5. **Implement content extraction**
6. **Scale up gradually**

## 🎯 Success Metrics

You'll know it's working when:
- Articles have 500+ characters of content (not just titles)
- Opportunity detection finds 50+ opportunities/day
- Monitoring runs every 5 minutes without crashing
- Frontend shows real-time opportunities with confidence scores
- Database has 100,000+ articles after 24 hours

## 🆘 Troubleshooting

### If monitoring isn't running:
```bash
railway logs -n 100 | grep "MONITORING"
railway restart
```

### If opportunities are empty:
1. Check articles have content: `SELECT LENGTH(content) FROM intelligence_findings LIMIT 10;`
2. Check patterns are matching: Lower confidence thresholds
3. Check monitoring is running: `railway ps`

### If database is slow:
1. Add indexes (see above)
2. Increase connection pool
3. Use read replicas

## 💡 Next Steps After Railway

1. **Add Elasticsearch** for better search
2. **Implement ML scoring** for opportunities
3. **Add webhook notifications** for critical opportunities
4. **Create opportunity API** for external integrations
5. **Build analytics dashboard** for tracking performance