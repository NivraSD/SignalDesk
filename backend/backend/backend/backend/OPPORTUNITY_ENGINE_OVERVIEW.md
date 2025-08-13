# Opportunity Engine - Complete System Overview

## Executive Summary
The Opportunity Engine is SignalDesk's core value creation system that transforms competitive intelligence into actionable PR opportunities. It bridges the gap between "what's happening" (intelligence) and "what to do about it" (strategic action).

---

## Frontend Architecture

### Core Component Structure

```
/frontend/src/
├── components/
│   └── Intelligence/
│       └── OpportunityExecution.js    # Main opportunity engine UI
├── context/
│   ├── OpportunityContext.js          # State management
│   └── IntelligenceContext.js         # Shared intelligence data
├── services/
│   ├── apiService.js                  # API communication layer
│   └── claudeService.js               # AI integration
└── components/StakeholderIntelligence/
    └── StakeholderIntelligenceHub.js  # Parent component
```

### Component: OpportunityExecution.js

#### Purpose
Three-step wizard that guides users from analysis to execution-ready PR campaigns.

#### Key Features
1. **Automatic Analysis Triggering**
   - Loads intelligence data on mount
   - Auto-analyzes when data is available
   - Detects stale data (>1 hour old)

2. **Three-Step Workflow**
   ```javascript
   const steps = [
     { id: 'analysis', name: 'Position Analysis', icon: BarChart3 },
     { id: 'concepts', name: 'Concept Selection', icon: Lightbulb },
     { id: 'execution', name: 'Execution Plan', icon: Rocket }
   ];
   ```

3. **Creative Angles Generation**
   - Takes primary topic opportunity
   - Generates 3 creative angles:
     - The Contrarian View
     - The Future Vision
     - The Practical Playbook

#### State Management
```javascript
// Core states managed
- organizationAnalysis    // Position analysis results
- opportunityConcepts     // Generated PR concepts
- selectedConcept        // User-selected concept
- executionPlan          // Final execution blueprint
- currentStep            // Workflow navigation
```

#### UI Components
- **Step Progress Indicator**: Visual workflow tracker
- **Analysis Display**: Shows CRS score and strategic position
- **Concept Cards**: Interactive selection of opportunities
- **Execution Plan View**: Detailed campaign blueprint

### Context: OpportunityContext.js

#### Purpose
Centralized state management for the entire Opportunity Engine system.

#### Key Features

1. **State Structure**
```javascript
opportunityData: {
  organizationId,
  organizationName,
  analysis,
  concepts,
  selectedConcept,
  executionPlan,
  competitors,
  topics,
  currentStep,
  isStale
}
```

2. **Caching System**
```javascript
cache: {
  analyses: {},    // Keyed by organizationId
  concepts: {},    // Keyed by analysisId
  plans: {}       // Keyed by conceptId
}
```

3. **Smart Features**
- Target change detection via fingerprinting
- Automatic staleness checking (1-hour threshold)
- Organization change handling
- Navigation state management

### API Service Integration

#### Key Endpoints Used
```javascript
// Analysis endpoints
apiService.getOrganizationTargets(organizationId)
apiService.analyzeCompetitor(competitorData)
apiService.analyzeTopic(topicData)
apiService.analyzeOpportunityPosition(positionData)

// Intelligence endpoints
apiService.getUnifiedAnalysis(organizationId)
apiService.getTopicMomentum(organizationId)
```

---

## Backend Architecture

### API Endpoints

#### 1. Position Analysis
**Endpoint**: `POST /api/opportunity/analyze-position`

**Request**:
```json
{
  "organizationId": "org-123",
  "organizationName": "Acme Corp",
  "competitors": [...],
  "topics": [...],
  "useCreativeAgent": true
}
```

**Response**:
```json
{
  "success": true,
  "analysis": {
    "crsScore": 78,
    "strengths": [...],
    "opportunities": [...],
    "risks": [...],
    "readiness": {
      "successFactors": [...],
      "challenges": [...]
    }
  }
}
```

#### 2. Concept Generation
**Process**: Handled via Claude API integration
- Input: Position analysis + market context
- Output: 3-5 opportunity concepts with NVS scores

#### 3. Execution Planning
**Process**: AI-generated detailed campaign blueprint
- Content strategy
- Media targeting
- Timeline and milestones
- Resource requirements

### Data Models

#### Opportunity Analysis
```javascript
{
  id: String,
  organizationId: String,
  timestamp: Date,
  crsScore: Number (0-100),
  strengths: Array<String>,
  opportunities: Array<{
    name: String,
    rationale: String,
    impact: String,
    approach: String,
    timing: String,
    contentIdeas: Array
  }>,
  risks: Array<String>,
  readiness: {
    successFactors: Array,
    challenges: Array
  }
}
```

#### Opportunity Concept
```javascript
{
  id: String,
  name: String,
  type: String, // 'thought_leadership' | 'news_hijacking' | 'differentiation'
  nvsScore: Number (0-100),
  description: String,
  keyMessage: String,
  targetAudience: String | Object,
  contentPlan: String | Object,
  timeSensitivity: String,
  resourceRequirement: String,
  expectedOutcome: String | Object
}
```

#### Execution Plan
```javascript
{
  concept: Object,
  plan: String | Object,
  timeline: Array<{
    phase: String,
    duration: String,
    deliverables: Array
  }>,
  resources: {
    budget: String,
    team: Array,
    tools: Array
  },
  success_metrics: Array,
  timestamp: Date
}
```

### Intelligence Integration

The Opportunity Engine leverages existing intelligence data:

1. **Competitor Analysis**
   - Health scores
   - Strategic positioning
   - Recent activities

2. **Topic Momentum**
   - Trending themes
   - Market gaps
   - Timing opportunities

3. **Target Intelligence**
   - Stakeholder mapping
   - Media preferences
   - Influence patterns

---

## Key Algorithms & Scoring

### Client Reality Score (CRS)
```javascript
// 0-100 score based on four pillars (each 0-25)
CRS = ExecutionVelocity + MessageCredibility + MarketPosition + ResourceReadiness

// Thresholds
80-100: Ready for aggressive campaigns
60-79: Solid foundation, needs optimization
40-59: Requires strategic improvements
0-39: Focus on foundational capabilities
```

### Narrative Vacuum Score (NVS)
```javascript
// 0-100 score measuring opportunity potential
NVS = MarketGap + TimingRelevance + CompetitiveAdvantage + AudienceResonance

// Higher scores indicate bigger opportunities
```

### Target Change Detection
```javascript
// Fingerprinting system
fingerprint = JSON.stringify({
  competitors: competitors.map(c => c.id),
  topics: topics.map(t => t.id)
});

// Detect changes
if (oldFingerprint !== newFingerprint) {
  markAnalysisAsStale();
  promptNewAnalysis();
}
```

---

## User Flow

### Standard Workflow
1. **Entry Point**: User navigates to Opportunity Execution tab
2. **Auto-Load**: System loads intelligence targets and analyses
3. **Auto-Analyze**: Position analysis starts automatically
4. **Review Analysis**: User sees CRS score and strategic position
5. **View Concepts**: 3 creative angles on top opportunity presented
6. **Select Approach**: User chooses preferred angle
7. **Generate Plan**: Detailed execution plan created
8. **Export/Execute**: User implements via SignalDesk tools

### Alternative Flows
- **Cached Data**: Skip analysis if recent (<1 hour)
- **Manual Trigger**: User can force new analysis
- **Target Changes**: System detects and prompts re-analysis

---

## Integration Points

### With Intelligence Dashboard
- Pulls competitor analyses
- Uses topic momentum data
- Leverages target intelligence

### With Campaign Intelligence
- Feeds into campaign creation
- Provides strategic foundation
- Supplies content ideas

### With Media List Builder
- Identifies target journalists
- Suggests media outlets
- Provides pitch angles

### With Content Generator
- Supplies key messages
- Provides content templates
- Defines tone and approach

---

## Performance Optimizations

### Frontend
1. **Lazy Loading**: Components load on-demand
2. **Caching**: Reduces API calls for recent data
3. **Debouncing**: Prevents excessive analysis triggers
4. **Progressive Rendering**: Shows UI before data loads

### Backend
1. **Response Caching**: 15-minute cache for analyses
2. **Parallel Processing**: Concurrent API calls
3. **Fingerprinting**: Efficient change detection
4. **Batch Operations**: Groups related API calls

---

## Error Handling

### Common Scenarios
1. **Stale Data**: Automatic detection and user notification
2. **API Failures**: Graceful degradation with cached data
3. **Invalid Concepts**: Fallback to default templates
4. **Target Changes**: Prompt for re-analysis

### User Messaging
```javascript
// Examples
"Intelligence targets have changed. Please run a new analysis."
"Using cached analysis from [timestamp]"
"Failed to generate concepts. Please try again."
```

---

## Future Enhancements

### Planned Features
1. **Multi-Concept Execution**: Run multiple campaigns simultaneously
2. **A/B Testing**: Compare different angles
3. **Historical Performance**: Track past campaign success
4. **Team Collaboration**: Share and assign opportunities
5. **Automated Execution**: Direct integration with PR tools

### Technical Improvements
1. **WebSocket Updates**: Real-time analysis updates
2. **Background Processing**: Queue-based analysis
3. **Machine Learning**: Improve concept relevance over time
4. **Advanced Caching**: Predictive pre-loading

---

## Configuration

### Environment Variables
```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_CLAUDE_API_KEY=your-key-here
REACT_APP_CACHE_DURATION=3600000  # 1 hour in ms
```

### Feature Flags
```javascript
const FEATURES = {
  AUTO_ANALYZE: true,
  CACHE_ENABLED: true,
  CREATIVE_ANGLES: true,
  EXPORT_PLANS: false  // Coming soon
};
```

---

## Troubleshooting

### Common Issues

1. **")} displays on load**
   - Cause: JSX structure issue
   - Solution: Fixed in latest version

2. **Slow initial load**
   - Cause: Immediate analysis trigger
   - Solution: Added 500ms delay for UI render

3. **Object rendering errors**
   - Cause: Complex objects in JSX
   - Solution: Type checking and extraction

4. **Stale data warnings**
   - Cause: Targets changed after analysis
   - Solution: Fingerprinting system detects changes

---

## Development Guide

### Adding New Features
1. Update `OpportunityContext.js` for state
2. Modify `OpportunityExecution.js` for UI
3. Extend API endpoints as needed
4. Update caching logic if required

### Testing Checklist
- [ ] Analysis triggers correctly
- [ ] Concepts generate properly
- [ ] Plan creation works
- [ ] Cache functions correctly
- [ ] Target changes detected
- [ ] Error states handled
- [ ] UI responsive and clear

---

## Metrics & Analytics

### Key Performance Indicators
- Time to first analysis
- Concept selection rate
- Plan completion rate
- Cache hit ratio
- Error frequency

### User Engagement
- Average session duration
- Steps completed per session
- Concept selection patterns
- Feature utilization rates

---

## Security Considerations

### Data Protection
- Organization data isolation
- Secure API communication
- No sensitive data in cache
- User permission validation

### Rate Limiting
- Analysis: 10 per hour
- Concept generation: 20 per hour
- Plan creation: 15 per hour

---

## Support & Maintenance

### Logging
```javascript
console.log('Starting concept generation...');
console.log('Analysis response:', response);
console.error('Error analyzing position:', err);
```

### Debug Mode
Enable verbose logging:
```javascript
const DEBUG = process.env.REACT_APP_DEBUG === 'true';
if (DEBUG) console.log('Detailed state:', opportunityData);
```

### Health Checks
- API connectivity
- Claude service availability
- Cache storage capacity
- Response time monitoring

---

*Last Updated: January 2025*
*Version: 2.0*