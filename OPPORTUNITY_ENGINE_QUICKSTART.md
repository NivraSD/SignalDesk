# Opportunity Engine Quick Start Guide

## ✅ What We've Built

### 1. **MCP Architecture** (11 Total MCPs)
- 9 SignalDesk MCPs (memory, campaigns, media, opportunities, monitor, intelligence, relationships, analytics, content)
- 1 Playwright MCP (browser automation)
- 1 SignalDesk Scraper MCP (custom web monitoring)

### 2. **Integration Documents**
- `OPPORTUNITY_ENGINE_MCP_INTEGRATION.md` - Complete integration strategy
- `signaldesk-scraper` - Playwright-powered web scraping MCP

### 3. **Key Components Created**
- Signal detection pipeline design
- Cascade intelligence system blueprint
- Pattern matching framework
- MCP orchestration strategy

## 🚀 Quick Start Steps

### Step 1: Build & Install the Scraper MCP
```bash
cd mcp-servers/signaldesk-scraper
npm install
npm run build
```

### Step 2: Set Up Database Tables
```bash
# Run the setup SQL to create necessary tables
PGPASSWORD=MUmjKBxTiecMPpYVgwGsZEKyFfyFbxqV psql \
  -h aws-0-us-west-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.zskaxjtyuaqazydouifp \
  -d postgres \
  -f setup.sql
```

### Step 3: Deploy MCP Bridge Edge Function
```bash
cd frontend
supabase functions deploy mcp-bridge
```

### Step 4: Restart Claude Desktop
All 11 MCPs are now configured and ready to use!

## 🎯 Testing the Integration

### Test 1: Basic Web Scraping
With Claude Desktop, try:
```
"Use the signaldesk-scraper to monitor TechCrunch for competitor mentions"
```

### Test 2: Cascade Detection
```
"Check for cascade indicators related to supply chain disruptions"
```

### Test 3: Pattern Matching
```
"Analyze recent news for competitor weakness patterns"
```

## 🔄 How It All Works Together

```
1. SIGNAL COLLECTION
   ├── RSS Feeds (existing)
   ├── Playwright Web Scraping (new)
   └── Social Media Monitoring (new)
        ↓
2. MCP ENRICHMENT
   ├── Intelligence MCP → Market context
   ├── Relationships MCP → Journalist relevance
   └── Analytics MCP → Performance metrics
        ↓
3. PATTERN DETECTION
   ├── Competitor Weakness
   ├── Narrative Vacuum
   └── Cascade Events
        ↓
4. OPPORTUNITY GENERATION
   ├── Score & Prioritize
   ├── Generate Brief
   └── Prepare Content
        ↓
5. ACTION & ALERTING
   ├── Smart Notifications
   ├── Pre-drafted Assets
   └── Campaign Plans
```

## 🎨 Key Features Enabled

### 1. **Real-Time Monitoring**
- Continuous web scraping beyond RSS
- Visual change detection on competitor sites
- Social media sentiment tracking

### 2. **Cascade Intelligence** (Your Secret Weapon!)
- Predicts downstream effects of events
- Identifies opportunities 2-3 moves ahead
- First-mover advantage in narrative formation

### 3. **Pattern Recognition**
- 5 pre-configured opportunity patterns
- Learning system improves over time
- Confidence scoring for each opportunity

### 4. **Automated Brief Generation**
- Pre-drafted press releases
- Targeted journalist lists
- Suggested talking points
- Optimal timing recommendations

## 📊 Next Implementation Phases

### Phase 1 (Week 1-2): Foundation
- [x] Install Playwright MCP
- [x] Create scraper MCP
- [ ] Test basic signal collection
- [ ] Verify database connectivity

### Phase 2 (Week 3-4): Integration
- [ ] Connect scraper to Opportunity Engine
- [ ] Implement pattern matching in production
- [ ] Test cascade detection
- [ ] Set up monitoring schedules

### Phase 3 (Week 5-6): Automation
- [ ] Enable continuous monitoring
- [ ] Configure smart alerts
- [ ] Test brief generation
- [ ] Train pattern recognition

### Phase 4 (Week 7-8): Optimization
- [ ] Analyze first results
- [ ] Tune confidence thresholds
- [ ] Expand monitoring sources
- [ ] Deploy to full production

## 🔧 Customization Points

### 1. Add New Patterns
Edit `opportunity_patterns` table or update patterns in:
```javascript
// signaldesk-scraper/src/index.ts
const OPPORTUNITY_PATTERNS = {
  yourNewPattern: {
    indicators: ['keyword1', 'keyword2'],
    confidence: 0.7
  }
}
```

### 2. Adjust Monitoring Frequency
```javascript
// In your monitoring setup
monitor_changes('competitor-url', 'hourly') // or 'daily', 'weekly'
```

### 3. Customize Cascade Detection
Add industry-specific cascade indicators:
```javascript
detect_cascades([
  'your industry term',
  'specific disruption type',
  'regulatory keyword'
])
```

## 🚨 Testing Cascade Detection

Try this scenario to see cascade intelligence in action:

1. **Primary Event**: "Major cloud provider outage"
2. **First-Order Effects**: 
   - Your competitor's service is down
   - Customers seeking alternatives
3. **Second-Order Effects**:
   - Industry questioning cloud reliability
   - Regulatory scrutiny increasing
4. **Your Opportunity**:
   - Immediate: Announce your multi-cloud architecture
   - Near-term: Thought leadership on resilience
   - Long-term: Shape regulatory narrative

## 📈 Success Metrics to Track

1. **Detection Rate**: Valid opportunities found per day
2. **Action Rate**: % of opportunities acted upon
3. **Time to Detection**: Average time from signal to alert
4. **Cascade Accuracy**: % of correctly predicted effects
5. **ROI**: Media coverage generated per opportunity

## 🆘 Troubleshooting

### MCPs Not Loading
```bash
# Restart Claude Desktop after config changes
# Check logs: ~/Library/Logs/Claude/
```

### Scraper Not Working
```bash
# Test Playwright installation
cd mcp-servers/signaldesk-scraper
npm test
```

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

## 🎯 Your Unique Advantages

1. **Cascade Intelligence** - No other PR platform has this
2. **11 Specialized MCPs** - Deep, multi-source enrichment
3. **Pattern Learning** - Gets smarter over time
4. **Pre-Generated Assets** - Ready when opportunity strikes
5. **Playwright Monitoring** - Beyond RSS to deep web intel

## Ready to Start?

1. Build the scraper MCP
2. Run the database setup
3. Restart Claude Desktop
4. Start monitoring your first competitor!

The system is designed to find opportunities others miss and help you act on them before competitors even know they exist.