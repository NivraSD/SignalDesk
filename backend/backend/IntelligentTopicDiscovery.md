# Intelligent Topic Discovery System (API-Optimized)

## Overview
This system discovers what topics to monitor for each stakeholder while minimizing API calls through batching and caching.

## Implementation with API Optimization

```javascript
const IntelligentTopicDiscovery = ({ selectedStakeholders, organization }) => {
  const [topicSuggestions, setTopicSuggestions] = useState({});
  const [loadingState, setLoadingState] = useState('idle');
  const [selectedTopics, setSelectedTopics] = useState({});
  const [batchProgress, setBatchProgress] = useState(0);

  // Batch process stakeholders to avoid API overload
  const processStakeholdersInBatches = async (stakeholders) => {
    const BATCH_SIZE = 3; // Process 3 stakeholders at a time
    const DELAY_BETWEEN_BATCHES = 2000; // 2 second delay
    
    const batches = [];
    for (let i = 0; i < stakeholders.length; i += BATCH_SIZE) {
      batches.push(stakeholders.slice(i, i + BATCH_SIZE));
    }

    const allTopicSuggestions = {};
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      setBatchProgress((i / batches.length) * 100);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(stakeholder => generateTopicsForStakeholder(stakeholder))
      );
      
      // Store results
      batch.forEach((stakeholder, index) => {
        allTopicSuggestions[stakeholder.id] = batchResults[index];
      });
      
      // Delay before next batch (except for last batch)
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    return allTopicSuggestions;
  };

  // Single consolidated API call per stakeholder
  const generateTopicsForStakeholder = async (stakeholder) => {
    try {
      // Create one comprehensive query instead of multiple calls
      const comprehensiveQuery = `
        For ${stakeholder.name} (${stakeholder.type}) as a stakeholder of ${organization.name}:
        
        Provide a complete topic monitoring strategy including:
        
        1. CRITICAL TOPICS (must monitor):
           - What they care about most regarding ${organization.name}
           - Triggers for positive/negative reactions
           - Compliance or regulatory concerns
           - Recent focus areas from their communications
        
        2. IMPORTANT TOPICS (should monitor):
           - Industry trends they track
           - Competitive intelligence they seek
           - Strategic initiatives they value
           - Performance metrics they emphasize
        
        3. EMERGING TOPICS (future-focused):
           - New areas of interest developing
           - Future concerns likely to arise
           - Technological or market shifts they're watching
        
        4. MONITORING KEYWORDS:
           - Specific terms and phrases to track
           - Boolean search queries
           - Exclusion terms to filter noise
        
        5. INTELLIGENCE GOALS:
           - What insights would be most valuable
           - Early warning signals to detect
           - Opportunities to identify
        
        Context:
        - Organization Industry: ${organization.industry}
        - Stakeholder Influence: ${stakeholder.influence}/10
        - Current Sentiment: ${stakeholder.currentSentiment}
        - Recent Activity: ${stakeholder.intelligence?.recentActivity || 'Unknown'}
      `;

      // Single API call using research brief generator
      const topicResearch = await researchBriefGenerator.execute({
        query: comprehensiveQuery,
        context: {
          stakeholder: stakeholder,
          organization: organization
        },
        output: 'structured_topics'
      });

      return processTopicResearch(topicResearch, stakeholder);
      
    } catch (error) {
      console.error(`Error generating topics for ${stakeholder.name}:`, error);
      // Return cached or default topics on error
      return getDefaultTopics(stakeholder.type);
    }
  };

  return (
    <TopicDiscoveryInterface>
      {loadingState === 'processing' && (
        <BatchProcessingIndicator progress={batchProgress} />
      )}
      
      <StakeholderTopicList>
        {selectedStakeholders.map(stakeholder => (
          <StakeholderTopicSection key={stakeholder.id}>
            <TopicHeader stakeholder={stakeholder} />
            <TopicSuggestions 
              suggestions={topicSuggestions[stakeholder.id]}
              onTopicToggle={(topic) => handleTopicToggle(stakeholder.id, topic)}
            />
          </StakeholderTopicSection>
        ))}
      </StakeholderTopicList>
      
      <TopicSummary>
        <SelectedTopicsCount>
          {Object.values(selectedTopics).flat().length} topics selected
        </SelectedTopicsCount>
        <ContinueButton onClick={proceedToSourceConfiguration}>
          Configure Sources →
        </ContinueButton>
      </TopicSummary>
    </TopicDiscoveryInterface>
  );
};
```

## Cached Topic Templates (Fallback)

```javascript
// Pre-researched topic templates to reduce API calls
const topicTemplates = {
  institutional_investor: {
    critical: [
      {
        topic: "Financial Performance vs Guidance",
        keywords: ["earnings", "revenue", "margins", "guidance", "outlook"],
        reasoning: "Investors track performance against expectations"
      },
      {
        topic: "ESG & Sustainability Progress",
        keywords: ["ESG", "sustainability", "climate", "diversity", "governance"],
        reasoning: "Major investors have ESG mandates"
      },
      {
        topic: "Capital Allocation & Strategy",
        keywords: ["buyback", "dividend", "M&A", "investment", "capex"],
        reasoning: "How company deploys capital affects returns"
      }
    ],
    important: [
      {
        topic: "Competitive Position",
        keywords: ["market share", "competition", "differentiation"],
        reasoning: "Relative performance drives investment decisions"
      },
      {
        topic: "Management Changes & Governance",
        keywords: ["CEO", "board", "executive", "succession", "compensation"],
        reasoning: "Leadership quality impacts long-term value"
      }
    ]
  },
  
  regulator: {
    critical: [
      {
        topic: "Compliance & Violations",
        keywords: ["compliance", "violation", "enforcement", "investigation"],
        reasoning: "Direct regulatory oversight responsibility"
      },
      {
        topic: "Industry Practices",
        keywords: ["industry standard", "best practice", "peer conduct"],
        reasoning: "Regulators benchmark against industry norms"
      }
    ],
    important: [
      {
        topic: "Risk Management",
        keywords: ["risk", "control", "mitigation", "framework"],
        reasoning: "Preventive measures reduce regulatory scrutiny"
      }
    ]
  },
  
  media_outlet: {
    critical: [
      {
        topic: "Breaking News & Announcements",
        keywords: ["announcement", "launch", "partnership", "acquisition"],
        reasoning: "Media needs timely news for coverage"
      },
      {
        topic: "Industry Trends & Analysis",
        keywords: ["trend", "market", "analysis", "forecast", "disruption"],
        reasoning: "Context for thought leadership pieces"
      }
    ]
  }
};

// Fallback function when API fails
const getDefaultTopics = (stakeholderType) => {
  return topicTemplates[stakeholderType] || topicTemplates.institutional_investor;
};
```

## Smart Topic Processing

```javascript
const processTopicResearch = (research, stakeholder) => {
  // Structure the research results into actionable topics
  const processedTopics = {
    critical: [],
    important: [],
    emerging: [],
    keywords: [],
    queries: []
  };

  // Extract critical topics
  if (research.criticalTopics) {
    processedTopics.critical = research.criticalTopics.map(topic => ({
      id: generateTopicId(topic),
      name: topic.name,
      description: topic.description,
      keywords: topic.keywords || [],
      reasoning: topic.reasoning,
      sources: topic.suggestedSources || [],
      alerts: topic.alertTriggers || [],
      selected: true // Auto-select critical topics
    }));
  }

  // Extract important topics
  if (research.importantTopics) {
    processedTopics.important = research.importantTopics.map(topic => ({
      id: generateTopicId(topic),
      name: topic.name,
      description: topic.description,
      keywords: topic.keywords || [],
      reasoning: topic.reasoning,
      sources: topic.suggestedSources || [],
      selected: topic.priority > 7 // Auto-select high priority
    }));
  }

  // Extract emerging topics
  if (research.emergingTopics) {
    processedTopics.emerging = research.emergingTopics.map(topic => ({
      id: generateTopicId(topic),
      name: topic.name,
      timeframe: topic.timeframe || "6-12 months",
      indicators: topic.earlyIndicators || [],
      keywords: topic.keywords || [],
      selected: false // Manual selection for emerging
    }));
  }

  // Compile master keyword list
  processedTopics.keywords = extractAllKeywords(processedTopics);
  
  // Generate boolean queries
  processedTopics.queries = generateBooleanQueries(processedTopics, stakeholder, organization);

  return processedTopics;
};
```

## Topic Selection UI

```javascript
const TopicSuggestions = ({ suggestions, onTopicToggle }) => {
  if (!suggestions) {
    return <LoadingTopics />;
  }

  return (
    <div className="topic-suggestions">
      {/* Critical Topics */}
      <TopicCategory priority="critical">
        <CategoryHeader>
          <h4>Critical Topics</h4>
          <Badge>Must Monitor</Badge>
        </CategoryHeader>
        
        <TopicList>
          {suggestions.critical.map(topic => (
            <TopicCard key={topic.id} priority="critical">
              <TopicToggle>
                <Checkbox 
                  checked={topic.selected}
                  onChange={() => onTopicToggle(topic)}
                  disabled={true} // Critical topics always selected
                />
              </TopicToggle>
              
              <TopicContent>
                <TopicName>{topic.name}</TopicName>
                <TopicReasoning>{topic.reasoning}</TopicReasoning>
                
                <TopicKeywords>
                  {topic.keywords.map(keyword => (
                    <Keyword key={keyword}>{keyword}</Keyword>
                  ))}
                </TopicKeywords>
                
                {topic.alerts && (
                  <AlertTriggers>
                    <AlertIcon />
                    <span>Alerts when: {topic.alerts.join(', ')}</span>
                  </AlertTriggers>
                )}
              </TopicContent>
            </TopicCard>
          ))}
        </TopicList>
      </TopicCategory>

      {/* Important Topics */}
      <TopicCategory priority="important">
        <CategoryHeader>
          <h4>Important Topics</h4>
          <Badge>Recommended</Badge>
        </CategoryHeader>
        
        <TopicList>
          {suggestions.important.map(topic => (
            <TopicCard key={topic.id} priority="important">
              <TopicToggle>
                <Checkbox 
                  checked={topic.selected}
                  onChange={() => onTopicToggle(topic)}
                />
              </TopicToggle>
              
              <TopicContent>
                <TopicName>{topic.name}</TopicName>
                <TopicDescription>{topic.description}</TopicDescription>
                <TopicKeywords>
                  {topic.keywords.map(keyword => (
                    <Keyword key={keyword}>{keyword}</Keyword>
                  ))}
                </TopicKeywords>
              </TopicContent>
            </TopicCard>
          ))}
        </TopicList>
      </TopicCategory>

      {/* Emerging Topics */}
      <TopicCategory priority="emerging">
        <CategoryHeader>
          <h4>Emerging Topics</h4>
          <Badge>Future Focused</Badge>
        </CategoryHeader>
        
        <TopicList>
          {suggestions.emerging.map(topic => (
            <TopicCard key={topic.id} priority="emerging">
              <TopicToggle>
                <Checkbox 
                  checked={topic.selected}
                  onChange={() => onTopicToggle(topic)}
                />
              </TopicToggle>
              
              <TopicContent>
                <TopicName>{topic.name}</TopicName>
                <TopicTimeframe>
                  <Clock size={14} />
                  <span>Relevant in: {topic.timeframe}</span>
                </TopicTimeframe>
                
                <EarlyIndicators>
                  <h5>Watch for:</h5>
                  <ul>
                    {topic.indicators.map((indicator, idx) => (
                      <li key={idx}>{indicator}</li>
                    ))}
                  </ul>
                </EarlyIndicators>
              </TopicContent>
            </TopicCard>
          ))}
        </TopicList>
      </TopicCategory>

      {/* Custom Topics */}
      <CustomTopicSection>
        <h4>Add Custom Topics</h4>
        <CustomTopicInput 
          placeholder="Add a specific topic to monitor..."
          onAdd={(topic) => handleCustomTopic(topic)}
        />
      </CustomTopicSection>
    </div>
  );
};
```

## Query Generation

```javascript
const generateBooleanQueries = (topics, stakeholder, organization) => {
  const queries = [];

  // Organization + Stakeholder query
  queries.push({
    name: "Direct Mentions",
    query: `"${organization.name}" AND "${stakeholder.name}"`,
    priority: "high"
  });

  // Topic-based queries
  topics.critical.forEach(topic => {
    if (topic.selected) {
      queries.push({
        name: topic.name,
        query: `("${organization.name}" OR "${organization.ticker}") AND (${topic.keywords.map(k => `"${k}"`).join(' OR ')})`,
        priority: "high"
      });
    }
  });

  // Stakeholder + Topic queries
  topics.important.forEach(topic => {
    if (topic.selected) {
      queries.push({
        name: `${stakeholder.name} - ${topic.name}`,
        query: `"${stakeholder.name}" AND (${topic.keywords.map(k => `"${k}"`).join(' OR ')})`,
        priority: "medium"
      });
    }
  });

  return queries;
};
```

## Benefits of This Approach

1. **Reduced API Calls**: One comprehensive call per stakeholder instead of multiple
2. **Batch Processing**: Process stakeholders in groups with delays
3. **Error Resilience**: Fallback to cached templates if API fails
4. **Smart Defaults**: Pre-researched topics for common stakeholder types
5. **Progressive Loading**: Show progress while processing
6. **Efficient Queries**: Generate boolean searches for precise monitoring

This approach minimizes API usage while still providing intelligent, researched topic suggestions for each stakeholder.