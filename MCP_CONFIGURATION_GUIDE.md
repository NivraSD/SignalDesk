# SignalDesk MCP Configuration Guide

## Overview

This document provides comprehensive information about the SignalDesk Model Context Protocol (MCP) server configuration, including all 17 specialized MCPs plus the Playwright automation server. These MCPs work together to provide a complete PR intelligence and stakeholder management platform integrated with Claude Desktop.

## System Architecture

The SignalDesk platform consists of 17 specialized MCPs that communicate through an orchestrator for coordinated intelligence gathering, analysis, and response generation. Each MCP has a specific domain focus with specialized tools.

## Complete MCP List

### Core Intelligence MCPs

#### 1. **signaldesk-intelligence**
- **Purpose**: Market intelligence, competitor monitoring, and emerging topic detection
- **Key Tools**:
  - `gather_intelligence` - Collect market and competitive intelligence
  - `analyze_competitors` - Deep competitive analysis
  - `track_emerging_topics` - Identify trending topics and narratives
  - `monitor_market_changes` - Track market shifts and disruptions
- **Priority Weight**: 0.9 (Critical)

#### 2. **signaldesk-relationships**
- **Purpose**: Journalist tracking, relationship health monitoring, and influencer mapping
- **Key Tools**:
  - `track_journalist_relationships` - Monitor journalist interactions
  - `assess_relationship_health` - Evaluate relationship status
  - `map_influencer_network` - Identify and map key influencers
  - `predict_journalist_interest` - Forecast story interest
- **Priority Weight**: 0.7 (High)

#### 3. **signaldesk-analytics**
- **Purpose**: Media value calculation, sentiment analysis, and ROI measurement
- **Key Tools**:
  - `calculate_media_value` - Compute PR campaign value
  - `analyze_sentiment` - Multi-source sentiment analysis
  - `measure_roi` - Campaign ROI calculation
  - `benchmark_performance` - Industry benchmarking
- **Priority Weight**: 0.6 (Medium)

### Content & Campaign MCPs

#### 4. **signaldesk-content**
- **Purpose**: Content generation, crisis statements, and localization
- **Key Tools**:
  - `generate_content` - AI-powered content creation
  - `create_crisis_statement` - Emergency response content
  - `localize_content` - Multi-language adaptation
  - `optimize_messaging` - Message effectiveness optimization
- **Priority Weight**: 0.5 (Medium)

#### 5. **signaldesk-campaigns**
- **Purpose**: Campaign planning, task management, and orchestration
- **Key Tools**:
  - `plan_campaign` - Strategic campaign planning
  - `manage_tasks` - Task allocation and tracking
  - `coordinate_teams` - Team orchestration
  - `track_milestones` - Progress monitoring
- **Priority Weight**: 0.6 (Medium)

#### 6. **signaldesk-media**
- **Purpose**: Journalist discovery, pitch generation, and outreach tracking
- **Key Tools**:
  - `discover_journalists` - Find relevant media contacts
  - `generate_pitch` - Create personalized pitches
  - `track_outreach` - Monitor outreach effectiveness
  - `analyze_coverage` - Coverage quality assessment
- **Priority Weight**: 0.7 (High)

### Opportunity & Monitoring MCPs

#### 7. **signaldesk-opportunities**
- **Purpose**: Opportunity discovery, analysis, and pitch suggestions
- **Key Tools**:
  - `discover_opportunities` - Identify PR opportunities
  - `analyze_opportunity_value` - Assess opportunity potential
  - `generate_pitch_suggestions` - Create opportunity-specific pitches
  - `track_opportunity_outcomes` - Monitor results
- **Priority Weight**: 0.8 (High)

#### 8. **signaldesk-memory**
- **Purpose**: Knowledge management and context storage
- **Key Tools**:
  - `store_context` - Save important information
  - `retrieve_context` - Access stored knowledge
  - `update_knowledge_base` - Maintain institutional memory
  - `search_history` - Query past interactions
- **Priority Weight**: 0.5 (Medium)

#### 9. **signaldesk-monitor**
- **Purpose**: Real-time stakeholder monitoring and alert generation
- **Key Tools**:
  - `monitor_stakeholders` - Track stakeholder activities
  - `detect_signals` - Identify important changes
  - `generate_alerts` - Create priority notifications
  - `track_cascades` - Monitor information cascades
- **Priority Weight**: 0.9 (Critical)

#### 10. **signaldesk-scraper**
- **Purpose**: Web scraping and cascade prediction
- **Key Tools**:
  - `scrape_web` - Extract web content
  - `predict_cascade` - Forecast information spread
  - `monitor_sources` - Track multiple sources
  - `extract_entities` - Identify key entities
- **Database**: Uses Supabase for data persistence

### NEW Enhanced MCPs (Added in Latest Update)

#### 11. **signaldesk-entities** 🆕
- **Purpose**: Entity management and recognition
- **Key Tools** (10 total):
  - `recognize_entities` - Extract entities from text
  - `enrich_entity_profile` - Build comprehensive profiles
  - `track_entity_evolution` - Monitor changes over time
  - `find_entity_connections` - Discover relationships
  - `match_entities_to_org` - Auto-match to organizations
  - `update_entity_intelligence` - Update profiles
  - `predict_entity_behavior` - Behavior prediction
  - `classify_industry` - Industry categorization
  - `map_organization_network` - Network visualization
  - `calculate_influence_score` - Influence metrics
- **Priority Weight**: 0.8 (High)

#### 12. **signaldesk-crisis** 🆕
- **Purpose**: Crisis management and response coordination
- **Key Tools** (7 total):
  - `detect_crisis_signals` - Early warning detection
  - `assess_crisis_severity` - Threat level evaluation
  - `generate_crisis_response` - Response plan creation
  - `coordinate_war_room` - Team coordination
  - `monitor_crisis_evolution` - Track progression
  - `predict_crisis_cascade` - Cascade forecasting
  - `generate_holding_statement` - Immediate statements
- **Priority Weight**: 1.0 (Maximum)

#### 13. **signaldesk-social** 🆕
- **Purpose**: Social media monitoring and management
- **Key Tools** (7 total):
  - `monitor_social_sentiment` - Real-time sentiment tracking
  - `detect_viral_moments` - Virality detection
  - `track_influencer_activity` - Influencer monitoring
  - `generate_social_content` - Platform-specific content
  - `schedule_social_posts` - Content scheduling
  - `analyze_social_engagement` - Engagement metrics
  - `detect_social_crises` - Crisis detection
- **Priority Weight**: 0.8 (High)

#### 14. **signaldesk-stakeholder-groups** 🆕
- **Purpose**: Coalition tracking and group dynamics analysis
- **Key Tools** (7 total):
  - `detect_coalition_formation` - Identify forming groups
  - `track_coalition_evolution` - Monitor dynamics
  - `predict_group_actions` - Action prediction
  - `analyze_group_influence` - Influence calculation
  - `map_stakeholder_networks` - Network analysis
  - `identify_group_leaders` - Leadership identification
  - `monitor_group_messaging` - Message tracking
- **Priority Weight**: 0.7 (High)

#### 15. **signaldesk-narratives** 🆕
- **Purpose**: Narrative management and control
- **Key Tools** (7 total):
  - `track_narrative_evolution` - Evolution monitoring
  - `detect_narrative_vacuum` - Gap identification
  - `measure_narrative_strength` - Strength quantification
  - `predict_narrative_spread` - Spread forecasting
  - `identify_narrative_drivers` - Driver identification
  - `create_counter_narrative` - Response creation
  - `track_narrative_adoption` - Adoption monitoring
- **Priority Weight**: 0.8 (High)

#### 16. **signaldesk-regulatory** 🆕
- **Purpose**: Regulatory intelligence and compliance
- **Key Tools** (7 total):
  - `monitor_regulatory_changes` - Change tracking
  - `predict_regulatory_trends` - Trend forecasting
  - `analyze_compliance_impact` - Impact assessment
  - `track_lobbying_activity` - Lobbying monitoring
  - `identify_regulatory_allies` - Alliance identification
  - `generate_regulatory_response` - Response creation
  - `monitor_enforcement_actions` - Enforcement tracking
- **Priority Weight**: 0.9 (Critical)

#### 17. **signaldesk-orchestrator** 🆕
- **Purpose**: Cross-MCP intelligence sharing and coordination
- **Key Tools** (10 total):
  - `share_intelligence` - Broadcast between MCPs
  - `coordinated_analysis` - Multi-perspective analysis
  - `assess_urgency` - Priority determination
  - `coordinate_response` - Response orchestration
  - `allocate_resources` - Resource management
  - `escalate_critical` - Crisis escalation
  - `record_outcome` - Learning capture
  - `update_patterns` - Pattern learning
  - `improve_predictions` - Model refinement
  - `share_learnings` - Knowledge distribution
- **Priority Weight**: Central coordinator (all priorities)

### Automation MCP

#### 18. **playwright-mcp-server**
- **Purpose**: Browser automation and web interaction
- **Key Capabilities**:
  - Browser automation (Chrome, Firefox, Safari, Edge)
  - Web page interaction and navigation
  - Screenshot capture
  - JavaScript execution in browser context
  - Web scraping with visual verification
  - Form filling and button clicking
- **Location**: `/Users/jonathanliebowitz/Desktop/playwright-mcp-server`

## Database Configuration

All MCPs use Supabase for data persistence:
- **URL**: `https://zskaxjtyuaqazydouifp.supabase.co`
- **Database**: PostgreSQL via Supabase
- **Connection**: Pooled connection for performance

## Integration Features

### 1. Cross-MCP Intelligence Sharing
The orchestrator enables all MCPs to share intelligence in real-time:
- Automatic broadcasting of critical signals
- Relevance-based MCP selection
- Priority-weighted distribution

### 2. Feedback Loop System
Continuous learning and improvement:
- Outcome recording for all predictions
- Pattern extraction from results
- Model accuracy tracking
- Shared learning distribution

### 3. Priority Coordination
Intelligent resource allocation based on urgency:
- **Critical** (0.9-1.0): Immediate response, all resources
- **High** (0.7-0.9): Rapid response, priority allocation
- **Medium** (0.5-0.7): Standard response, balanced allocation
- **Low** (0.3-0.5): Routine handling, minimal resources

### 4. Cascade Detection & Prediction
Advanced information cascade modeling:
- Multi-source signal correlation
- Stakeholder reaction prediction
- Timeline estimation
- Mitigation strategy generation

## File Locations

### MCP Installation Directory
```
/Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/
├── signaldesk-intelligence/
├── signaldesk-relationships/
├── signaldesk-analytics/
├── signaldesk-content/
├── signaldesk-campaigns/
├── signaldesk-media/
├── signaldesk-opportunities/
├── signaldesk-memory/
├── signaldesk-monitor/
├── signaldesk-scraper/
├── signaldesk-entities/         # NEW
├── signaldesk-crisis/           # NEW
├── signaldesk-social/           # NEW
├── signaldesk-stakeholder-groups/ # NEW
├── signaldesk-narratives/       # NEW
├── signaldesk-regulatory/       # NEW
└── signaldesk-orchestrator/     # NEW
```

### Configuration Files
- **Active Config**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Enhanced Config Backup**: `/Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/claude-desktop-config-enhanced.json`

## How to Update Configuration

1. **Edit Configuration**:
   ```bash
   nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Add New MCP**:
   ```json
   "new-mcp-name": {
     "command": "node",
     "args": ["/path/to/mcp/dist/index.js"]
   }
   ```

3. **Restart Claude Desktop** for changes to take effect

## Building and Maintaining MCPs

### Build All MCPs
```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers
for mcp in signaldesk-*; do
  echo "Building $mcp..."
  cd $mcp && npm install && npm run build && cd ..
done
```

### Build Individual MCP
```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-[name]
npm install
npm run build
```

### Check MCP Status
```bash
# List all built MCPs
ls -la /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/*/dist/index.js
```

## Troubleshooting

### MCP Failed to Connect
1. Check if the MCP is built: `ls -la [mcp-path]/dist/index.js`
2. Rebuild if necessary: `cd [mcp-path] && npm run build`
3. Check for TypeScript errors: `cd [mcp-path] && npx tsc --noEmit`
4. Verify path in config file matches actual location

### Server Disconnected Error
1. Check Claude Desktop logs
2. Verify Node.js is installed: `node --version`
3. Check for port conflicts
4. Ensure all dependencies are installed

### Database Connection Issues
1. Verify Supabase credentials
2. Check network connectivity
3. Ensure database tables exist
4. Review connection pooling settings

## Key Capabilities by Use Case

### Crisis Management
- **Primary MCPs**: crisis, monitor, content, media
- **Support MCPs**: social, narratives, orchestrator
- **Response Time**: Immediate (< 15 minutes)

### Stakeholder Analysis
- **Primary MCPs**: stakeholder-groups, entities, relationships
- **Support MCPs**: analytics, intelligence
- **Update Frequency**: Real-time monitoring

### Regulatory Compliance
- **Primary MCPs**: regulatory, monitor
- **Support MCPs**: entities, orchestrator
- **Alert Threshold**: High priority for changes

### Campaign Management
- **Primary MCPs**: campaigns, media, content
- **Support MCPs**: opportunities, analytics
- **Coordination**: Via orchestrator

## Performance Optimization

### Caching Strategy
- Organization profiles cached in memory
- 15-minute cache for web fetches
- Pattern database for learned behaviors

### Resource Allocation
- Priority-based MCP activation
- Parallel processing for independent tasks
- Queue management for sequential operations

### Monitoring
- Real-time status tracking
- Performance metrics collection
- Error logging and recovery

## Security Considerations

- All MCPs run locally on your machine
- Database connections use secure Supabase pooling
- No external API calls without explicit configuration
- Sensitive data remains within your Supabase instance

## Future Enhancements

### Planned Features
- Advanced ML models for prediction
- Enhanced visualization capabilities
- Mobile monitoring interface
- API gateway for external integrations

### Expansion Opportunities
- Industry-specific MCP modules
- Multi-language support expansion
- Advanced automation workflows
- Custom dashboard creation

## Support and Maintenance

### Regular Maintenance Tasks
1. Update dependencies monthly: `npm update`
2. Review and archive old data quarterly
3. Optimize database indexes based on usage
4. Update TypeScript definitions

### Getting Help
- Check individual MCP README files
- Review TypeScript compilation errors
- Monitor Claude Desktop console logs
- Test MCPs individually before integration

## Version Information

- **Creation Date**: August 18, 2025
- **Last Updated**: August 18, 2025
- **Platform Version**: SignalDesk v2.0
- **MCP SDK Version**: 1.0.0
- **Node.js Required**: v18.0.0 or higher

---

*This configuration represents a complete PR intelligence platform with 17 specialized MCPs plus browser automation, providing comprehensive stakeholder management, crisis response, and strategic communication capabilities.*