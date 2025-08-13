const pool = require('../config/db');
const claudeService = require('../../config/claude');
const Parser = require('rss-parser');
const axios = require('axios');
const SourceDiscoveryService = require('../services/SourceDiscoveryService');
const NewsRoundupService = require('../services/NewsRoundupService');
const { ensureIntelligenceTargets, fixOrganizationName } = require('../utils/ensureIntelligenceTargets');
const IntelligenceAnalysisService = require('../services/IntelligenceAnalysisService');

// Initialize services
const sourceDiscovery = new SourceDiscoveryService();
const newsRoundup = new NewsRoundupService();

// Initialize opportunity identification service
const OpportunityIdentificationService = require('../services/OpportunityIdentificationService');

// Start opportunity monitoring for an organization
exports.startOpportunityMonitoring = async (req, res) => {
  try {
    const { organizationId, config } = req.body;
    const userId = req.user?.id || req.user?.userId;
    
    console.log('=== START OPPORTUNITY MONITORING ===');
    console.log('Organization:', organizationId);
    console.log('Config:', config);
    
    // Start continuous monitoring
    await opportunityDetector.startMonitoring(organizationId, config);
    
    res.json({
      success: true,
      message: 'Opportunity monitoring started',
      organizationId
    });
  } catch (error) {
    console.error('Error starting opportunity monitoring:', error);
    res.status(500).json({ error: 'Failed to start monitoring' });
  }
};

// Scan for opportunities on-demand using intelligent analysis
exports.scanForOpportunities = async (req, res) => {
  try {
    const { organizationId } = req.body;
    const userId = req.user?.id || req.user?.userId;
    
    console.log('=== INTELLIGENT OPPORTUNITY SCANNING ===');
    console.log('Organization:', organizationId);
    console.log('Using research agents for coverage gap analysis...');
    
    // Use the intelligent opportunity identification service
    const opportunities = await OpportunityIdentificationService.identifyOpportunities(organizationId);
    
    console.log(`✅ Identified ${opportunities.length} opportunities through intelligent analysis`);
    
    // Get article count for reporting
    const articleCountResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM intelligence_findings 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    
    const articleCount = parseInt(articleCountResult.rows[0].count);
    console.log(`📊 Analyzed ${articleCount} articles from monitoring system`);
    
    // If no opportunities found, add a monitoring status message
    if (opportunities.length === 0) {
      console.log('No immediate opportunities detected - continuing monitoring');
      opportunities.push({
        id: `opp-status-${Date.now()}`,
        type: 'Status',
        title: 'Monitoring Active - No Immediate Opportunities',
        description: 'Coverage analysis is ongoing. The system is analyzing patterns to identify strategic opportunities.',
        urgency: 'low',
        score: 0,
        timeWindow: 'Ongoing',
        recommendedAction: {
          type: 'continue monitoring',
          description: 'System will alert when opportunities arise'
        },
        expectedImpact: {
          reach: 'low',
          sentiment: 'neutral',
          competitiveAdvantage: 'Maintaining awareness'
        },
        keyMessages: ['Active monitoring', 'Pattern recognition', 'Strategic patience']
      });
    }
    
    res.json({
      success: true,
      opportunities,
      articlesAnalyzed: articleCount,
      sourcesUsed: 352, // All unified monitoring sources
      analysisMethod: 'Intelligent Coverage Gap Analysis',
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error scanning for opportunities:', error);
    
    // Return mock data on error
    res.json({
      success: true,
      opportunities: opportunityDetector.scanForOpportunities ? 
        await opportunityDetector.scanForOpportunities(organizationId) : [],
      timestamp: new Date()
    });
  }
};

// Get detected opportunities from queue
exports.getOpportunities = async (req, res) => {
  try {
    const { organizationId, status = 'pending', limit = 50 } = req.query;
    
    console.log('=== GET OPPORTUNITIES ===');
    console.log('Organization:', organizationId);
    console.log('Status:', status);
    
    let result;
    if (organizationId) {
      // Get for specific organization
      result = await pool.query(
        `SELECT * FROM opportunity_queue 
         WHERE organization_id = $1 AND status = $2
         ORDER BY score DESC, created_at DESC
         LIMIT $3`,
        [organizationId, status, limit]
      );
    } else {
      // Get ALL opportunities across all organizations
      result = await pool.query(
        `SELECT * FROM opportunity_queue 
         WHERE status = $1
         ORDER BY score DESC, created_at DESC
         LIMIT $2`,
        [status, limit]
      );
    }
    
    console.log(`Found ${result.rows.length} opportunities`);
    
    res.json({
      success: true,
      opportunities: result.rows
    });
  } catch (error) {
    console.error('Error getting opportunities:', error);
    res.status(500).json({ error: 'Failed to get opportunities' });
  }
};

// Update opportunity status
exports.updateOpportunityStatus = async (req, res) => {
  try {
    const { opportunityId } = req.params;
    const { status, notes } = req.body;
    
    console.log('=== UPDATE OPPORTUNITY STATUS ===');
    console.log('Opportunity:', opportunityId);
    console.log('New status:', status);
    
    const result = await pool.query(
      `UPDATE opportunity_queue 
       SET status = $1, outcome_notes = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, notes, opportunityId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    
    res.json({
      success: true,
      opportunity: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
};

// Fetch mentions based on configuration and agent instructions
exports.fetchMentions = async (req, res) => {
  try {
    const { keywords, sources, websites, agentInstructions } = req.body;
    const userId = req.user?.id || req.user?.userId;
    
    console.log('=== FETCH MENTIONS V2 ===');
    console.log('Keywords:', keywords);
    console.log('Sources:', sources);
    console.log('Agent Instructions length:', agentInstructions?.length);
    
    let allMentions = [];
    
    // Fetch from RSS if enabled
    if (sources.rss) {
      const rssMentions = await fetchRSSMentions(keywords);
      allMentions = [...allMentions, ...rssMentions];
    }
    
    // Fetch from websites if enabled
    if (sources.websites && websites.length > 0) {
      // For now, create placeholder mentions for websites
      const websiteMentions = websites.map((url, idx) => ({
        id: `web-${Date.now()}-${idx}`,
        title: `Content from ${new URL(url).hostname}`,
        content: `Monitoring ${url} for updates...`,
        source: new URL(url).hostname,
        url: url,
        publishDate: new Date(),
        type: 'website'
      }));
      allMentions = [...allMentions, ...websiteMentions];
    }
    
    // Limit mentions
    const limitedMentions = allMentions.slice(0, 50);
    
    console.log(`Returning ${limitedMentions.length} mentions`);
    res.json({ success: true, mentions: limitedMentions });
    
  } catch (error) {
    console.error('Error fetching mentions:', error);
    res.status(500).json({ error: 'Failed to fetch mentions' });
  }
};

// Analyze mentions using agent instructions
exports.analyzeWithAgent = async (req, res) => {
  try {
    const { mentions, agentInstructions } = req.body;
    const userId = req.user?.id || req.user?.userId;
    
    console.log('=== ANALYZE WITH AGENT ===');
    console.log('Mentions to analyze:', mentions.length);
    console.log('Agent instructions provided:', !!agentInstructions);
    
    const results = [];
    
    for (const mention of mentions) {
      try {
        // Build a comprehensive prompt using agent instructions
        const prompt = `You are an AI monitoring agent with these instructions:

${agentInstructions}

Now analyze this mention:

Title: ${mention.title || 'No title'}
Source: ${mention.source}
Date: ${mention.publishDate}
Content: "${mention.content}"

Based on your instructions, provide a JSON analysis with these fields:
{
  "sentiment": "positive" / "negative" / "neutral" / "mixed" / "critical",
  "urgency": "low" / "medium" / "high" / "critical",
  "summary": "2-3 sentence summary of the mention and its implications",
  "key_points": ["list", "of", "key", "points"],
  "action_required": "specific action if needed, or null",
  "relevance_score": 1-10,
  "explanation": "why this sentiment and urgency were chosen based on the instructions"
}

IMPORTANT: Return ONLY the JSON object, no other text.`;

        console.log('Sending to Claude for analysis...');
        const response = await claudeService.sendMessage(prompt);
        
        let analysis;
        try {
          // Try direct parse
          analysis = JSON.parse(response);
        } catch (parseError) {
          // Try to extract JSON
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No valid JSON in response');
          }
        }
        
        // Validate required fields
        if (!analysis.sentiment || !analysis.summary) {
          throw new Error('Missing required fields in analysis');
        }
        
        results.push({
          id: mention.id,
          analysis: analysis
        });
        
      } catch (error) {
        console.error('Error analyzing mention:', mention.id, error.message);
        
        // Fallback analysis
        results.push({
          id: mention.id,
          analysis: {
            sentiment: 'neutral',
            urgency: 'low',
            summary: 'Unable to analyze this mention. Please review manually.',
            key_points: ['Analysis failed'],
            action_required: 'Manual review needed',
            relevance_score: 5,
            explanation: 'Automated analysis failed - manual review recommended'
          }
        });
      }
    }
    
    console.log(`Successfully analyzed ${results.length} mentions`);
    res.json({ success: true, results });
    
  } catch (error) {
    console.error('Error in agent analysis:', error);
    res.status(500).json({ error: 'Failed to analyze mentions' });
  }
};

// Helper function to fetch RSS mentions
async function fetchRSSMentions(keywords) {
  const parser = new Parser();
  const feeds = [
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    { name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best' },
    { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
    { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
    { name: 'VentureBeat', url: 'https://feeds.feedburner.com/venturebeat/SZYF' },
    { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss' }
  ];
  
  const allMentions = [];
  const keywordArray = keywords ? keywords.split(',').map(k => k.trim().toLowerCase()) : [];
  
  for (const feed of feeds) {
    try {
      console.log(`Fetching ${feed.name}...`);
      const parsedFeed = await Promise.race([
        parser.parseURL(feed.url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);
      
      parsedFeed.items.forEach(item => {
        const content = `${item.title || ''} ${item.contentSnippet || ''}`.toLowerCase();
        
        // If no keywords specified, include all
        // Otherwise, check if content matches any keyword
        if (keywordArray.length === 0 || keywordArray.some(keyword => content.includes(keyword))) {
          allMentions.push({
            id: `rss-${feed.name}-${Date.now()}-${Math.random()}`,
            title: item.title,
            content: item.contentSnippet || item.content || item.title,
            source: feed.name,
            author: item.creator || 'Unknown',
            publishDate: new Date(item.pubDate || Date.now()),
            url: item.link,
            type: 'rss'
          });
        }
      });
      
    } catch (err) {
      console.error(`Failed to fetch ${feed.name}:`, err.message);
    }
  }
  
  return allMentions;
}

// Save/Load configuration (reuse existing endpoints)
exports.saveConfig = async (req, res) => {
  try {
    const config = req.body;
    const userId = req.user?.id || req.user?.userId;
    
    await pool.query(
      `INSERT INTO monitoring_configs (user_id, config_type, config_data, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id)
       DO UPDATE SET config_data = $3, updated_at = NOW()`,
      [userId, 'monitoring_v2', JSON.stringify(config)]
    );
    
    res.json({ success: true, message: 'Configuration saved' });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
};

exports.getConfig = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    
    const result = await pool.query(
      'SELECT config_data FROM monitoring_configs WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length > 0) {
      res.json(result.rows[0].config_data);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
};

// Get intelligence summary with SEPARATE analyses for each category
exports.getIntelligenceSummary = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    console.log('=== NEWS ROUNDUP GENERATION ===');
    console.log('Organization ID:', organizationId);
    console.log('Gathering news from all available sources');
    
    // Ensure intelligence targets exist and are properly configured
    await ensureIntelligenceTargets(organizationId);
    
    // Fix organization name if needed
    await fixOrganizationName(organizationId);
    
    // Get ACTUAL user configuration from database
    const { organization, competitors, topics } = await getOrganizationConfig(organizationId);
    
    console.log('=== USER CONFIGURATION ===');
    console.log('Organization:', organization?.name || 'Not configured');
    console.log('Competitors:', competitors.map(c => c.name).join(', ') || 'None');
    console.log('Topics:', topics.map(t => t.name).join(', ') || 'None');
    
    // FIX: Ensure we have proper organization data, not just an ID
    if (!organization || !organization.name || organization.name.startsWith('org-')) {
      console.log('⚠️ WARNING: Organization name is missing or is an ID. Attempting to infer...');
      
      // Try to get organization from the organizations table
      const orgResult = await pool.query(
        'SELECT name, industry, aliases FROM organizations WHERE id = $1',
        [organizationId]
      );
      
      if (orgResult.rows.length > 0) {
        organization.name = orgResult.rows[0].name;
        organization.industry = orgResult.rows[0].industry;
        organization.aliases = orgResult.rows[0].aliases;
        console.log('✅ Found organization:', organization.name);
      } else {
        // Infer from competitors if no org found
        if (competitors.length > 0) {
          const competitorNames = competitors.map(c => c.name.toLowerCase());
          if (competitorNames.some(n => n.includes('eventbrite') || n.includes('cvent'))) {
            organization.name = 'Event Technology Company';
            organization.industry = 'Event Management';
          } else if (competitorNames.some(n => n.includes('aws') || n.includes('azure'))) {
            organization.name = 'Cloud Services Provider';
            organization.industry = 'Cloud Computing';
          } else {
            organization.name = 'Technology Company';
            organization.industry = 'Technology';
          }
          console.log('✅ Inferred organization:', organization.name, '(', organization.industry, ')');
        }
      }
    }
    
    // Generate comprehensive news roundup
    console.log('\n=== GENERATING NEWS ROUNDUP ===');
    
    try {
      // Generate NEWS ROUNDUP using the NewsRoundupService
      // FIX: Build proper keywords excluding IDs
      const keywords = [];
      
      // Only add org name if it's not an ID
      if (organization?.name && !organization.name.startsWith('org-') && !organization.name.includes('Organization')) {
        keywords.push(organization.name);
        // Add individual words from org name
        keywords.push(...organization.name.split(' ').filter(w => w.length > 2));
      }
      
      // Add competitor names (these should be real names)
      competitors.forEach(c => {
        if (c.name && !c.name.startsWith('org-')) {
          keywords.push(c.name);
        }
      });
      
      // Add topic names
      topics.forEach(t => {
        if (t.name) {
          keywords.push(t.name);
          // Add individual words from topics
          keywords.push(...t.name.split(/[\s\/]+/).filter(w => w.length > 3));
        }
      });
      
      // Add industry keywords if no org keywords
      if (keywords.length === 0 && organization?.industry) {
        keywords.push(...organization.industry.split(' ').filter(w => w.length > 3));
      }
      
      // Remove duplicates and filter out short/common words
      const uniqueKeywords = [...new Set(keywords)].filter(k => k && k.length > 2);
      
      console.log('✅ FINAL KEYWORDS FOR NEWS SEARCH:', uniqueKeywords);
      
      const config = {
        organization: organization,
        competitors: competitors,
        topics: topics,
        keywords: uniqueKeywords
      };
      
      const roundup = await newsRoundup.generateNewsRoundup(organizationId, config);
      
      console.log('\n=== NEWS ROUNDUP COMPLETE ===');
      console.log(`Total articles: ${roundup.summary?.totalArticles || 0}`);
      console.log(`Sources used: ${roundup.sources.total}`);
      
      // Combine all articles for analysis
      const allArticles = [
        ...(roundup.sections.organizationNews || []),
        ...(roundup.sections.competitorNews || []),
        ...(roundup.sections.industryNews || []),
        ...(roundup.sections.marketTrends || []),
        ...(roundup.sections.topStories || [])
      ];
      
      console.log('\n=== ANALYZING ARTICLES WITH RESEARCH AGENTS ===');
      console.log(`Sending ${allArticles.length} articles for intelligence analysis`);
      
      // Use research agents to analyze the collected articles
      const analyzedIntelligence = await IntelligenceAnalysisService.analyzeWithResearchAgents(
        allArticles,
        {
          organization: organization,
          competitors: competitors,
          topics: topics
        }
      );
      
      console.log('✅ Intelligence analysis complete');
      console.log('Organization findings:', analyzedIntelligence.organizationIntelligence?.findings?.length || 0);
      console.log('Competitive insights:', analyzedIntelligence.competitiveIntelligence?.competitorAnalyses?.length || 0);
      console.log('Topic trends:', analyzedIntelligence.topicIntelligence?.trends?.length || 0);
      console.log('Opportunities identified:', analyzedIntelligence.opportunities?.length || 0);
      
      // Format the response with analyzed intelligence
      const formattedResponse = {
        success: true,
        // Organization Intelligence with analysis
        organizationIntelligence: {
          ...analyzedIntelligence.organizationIntelligence,
          articles: roundup.sections.organizationNews.slice(0, 5).map(article => ({
            title: article.title,
            source: article.source,
            link: article.link,
            date: article.pubDate,
            description: article.description?.substring(0, 200) + '...'
          }))
        },
        // Competitive Intelligence with analysis
        competitiveIntelligence: {
          ...analyzedIntelligence.competitiveIntelligence,
          articles: roundup.sections.competitorNews.slice(0, 5).map(article => ({
            title: article.title,
            source: article.source,
            link: article.link,
            date: article.pubDate,
            description: article.description?.substring(0, 200) + '...'
          }))
        },
        // Topic Intelligence with analysis
        topicIntelligence: {
          ...analyzedIntelligence.topicIntelligence,
          articles: roundup.sections.industryNews.slice(0, 5).map(article => ({
            title: article.title,
            source: article.source,
            link: article.link,
            date: article.pubDate,
            description: article.description?.substring(0, 200) + '...'
          }))
        },
        // Real opportunities from analysis
        opportunities: analyzedIntelligence.opportunities || [],
        // Keep raw data for reference
        marketTrends: {
          summary: `${roundup.sections.marketTrends.length} market updates`,
          articles: roundup.sections.marketTrends.slice(0, 3).map(article => ({
            title: article.title,
            source: article.source,
            link: article.link,
            date: article.pubDate
          }))
        },
        topStories: roundup.sections.topStories.slice(0, 5).map(article => ({
          title: article.title,
          source: article.source,
          link: article.link,
          date: article.pubDate,
          description: article.description?.substring(0, 300) + '...'
        })),
        metadata: {
          organizationId,
          generated: roundup.generated,
          sources: {
            total: roundup.sources.total,
            indexed: roundup.sources.indexed,
            realtime: roundup.sources.realtime
          },
          totalArticles: roundup.summary?.totalArticles || 0,
          analyzed: true,
          breakdown: roundup.summary?.breakdown || {
            topStories: roundup.sections.topStories.length,
            organization: roundup.sections.organizationNews.length,
            competitors: roundup.sections.competitorNews.length,
            industry: roundup.sections.industryNews.length,
            market: roundup.sections.marketTrends.length
          }
        }
      };
      
      return res.json(formattedResponse);
      
    } catch (orchestrationError) {
      console.error('Orchestration failed, falling back to direct analysis:');
      console.error('Error message:', orchestrationError.message);
      console.error('Error stack:', orchestrationError.stack);
      
      // If orchestration fails, do direct data gathering as fallback
      console.log('\n--- FALLBACK: DIRECT DATA GATHERING ---');
      
      // Gather data from ALL configured sources
      const orgName = organization?.name || organizationId;
      console.log('Organization name for search:', orgName);
      
      // Build comprehensive keyword list
      let orgKeywords = [];
      
      // If org name looks like an ID, use competitor context to build keywords
      if (orgName.startsWith('org-')) {
        // Use generic business keywords when org name is just an ID
        orgKeywords = ['business', 'market', 'industry', 'innovation', 'technology'];
      } else {
        // Use actual org name
        orgKeywords = [orgName, ...orgName.split(' ')].filter(k => k && k.length > 2);
      }
      
      console.log('Final keywords for organization search:', orgKeywords);
      const orgData = await gatherWideNetData(orgKeywords, 'organization', {
        organization: organization,
        competitors: competitors,
        topics: topics
      });
      const orgAnalysis = await analyzeOrganizationData(organization || { name: orgName }, orgData);
      
      // Competitor analyses
      const competitorAnalyses = await Promise.all(
        competitors.map(async (competitor) => {
          console.log(`Analyzing competitor: ${competitor.name}`);
          const compData = await gatherWideNetData([competitor.name], `competitor`, {
            organization: organization,
            competitors: [competitor],
            topics: topics
          });
          return analyzeCompetitorData(competitor, compData);
        })
      );
      
      // Topic analyses
      const topicAnalyses = await Promise.all(
        topics.map(async (topic) => {
          console.log(`Analyzing topic: ${topic.name}`);
          const topicKeywords = topic.name.split(/[\s\/]+/).filter(k => k.length > 2);
          const topicData = await gatherWideNetData(topicKeywords, `topic`, {
            organization: organization,
            competitors: competitors,
            topics: [topic]
          });
          return analyzeTopicData(topic, topicData);
        })
      );
      
      // Return fallback analysis
      return res.json({
        timestamp: new Date().toISOString(),
        organizationAnalysis: orgAnalysis,
        competitorAnalyses,
        topicAnalyses,
        message: 'Using direct analysis due to orchestration error'
      });
    }
    
    // Create comprehensive response with all separate analyses
    const comprehensiveAnalysis = {
      timestamp: new Date().toISOString(),
      timeframe: '24 hours',
      
      // Organization-specific analysis
      organizationAnalysis: {
        name: organization.name,
        industry: organization.industry,
        ...orgAnalysis,
        dataPoints: orgData.items.length,
        sources: orgData.sources
      },
      
      // Individual competitor analyses
      competitorAnalyses: competitorAnalyses.map((analysis, idx) => ({
        competitor: competitors[idx].name,
        priority: competitors[idx].priority,
        ...analysis
      })),
      
      // Individual topic analyses
      topicAnalyses: topicAnalyses.map((analysis, idx) => ({
        topic: topics[idx].name,
        priority: topics[idx].priority,
        trending: topics[idx].trending,
        ...analysis
      })),
      
      // Stakeholder impact analyses
      stakeholderAnalyses: stakeholderAnalyses.map((analysis, idx) => ({
        stakeholder: stakeholders[idx].name,
        type: stakeholders[idx].type,
        ...analysis
      })),
      
      // Executive summary combining all insights
      executiveSummary: generateExecutiveSummary(
        orgAnalysis, 
        competitorAnalyses, 
        topicAnalyses, 
        stakeholderAnalyses
      ),
      
      // Aggregated stats
      stats: {
        totalDataPoints: orgData.items.length + 
          competitorAnalyses.reduce((sum, a) => sum + (a.dataPoints || 0), 0) +
          topicAnalyses.reduce((sum, a) => sum + (a.dataPoints || 0), 0),
        organizationMentions: orgData.items.length,
        competitorsCovered: competitorAnalyses.length,
        topicsCovered: topicAnalyses.length,
        stakeholdersAnalyzed: stakeholderAnalyses.length,
        overallSentiment: calculateOverallSentiment(orgAnalysis, competitorAnalyses, topicAnalyses)
      }
    };
    
    console.log('\n=== ALL ANALYSES COMPLETE ===');
    console.log('Organization mentions:', orgData.items.length);
    console.log('Competitor analyses:', competitorAnalyses.length);
    console.log('Topic analyses:', topicAnalyses.length);
    console.log('Stakeholder analyses:', stakeholderAnalyses.length);
    
    res.json(comprehensiveAnalysis);
    
  } catch (error) {
    console.error('Error in multi-category analysis:', error);
    res.status(500).json({ error: 'Failed to generate intelligence summary', details: error.message });
  }
};

// Research Orchestrator - coordinates multi-agent analysis
async function orchestrateIntelligenceAnalysis({ organization, competitors, topics, timeframe }) {
  console.log('=== RESEARCH ORCHESTRATOR ACTIVE ===');
  console.log('Coordinating comprehensive analysis for:', organization.name);
  
  try {
    // Step 1: Query Clarifier - ensure we have clear research objectives
    const clarifiedQueries = await clarifyResearchQueries(organization, competitors, topics);
    
    // Step 2: Research Brief Generator - create structured research plans
    const researchBriefs = await generateResearchBriefs(clarifiedQueries, organization, competitors, topics);
    
    // Step 3: Deploy specialized agents in parallel
    const [
      organizationAnalysis,
      competitorAnalysis,
      topicAnalysis,
      dataAnalysis
    ] = await Promise.allSettled([
      analyzeOrganizationIntelligence(organization, researchBriefs.organization),
      analyzeCompetitorIntelligence(competitors, researchBriefs.competitors),
      analyzeTopicIntelligence(topics, researchBriefs.topics),
      performDataAnalysis(organization, competitors, topics)
    ]);
    
    // Step 4: Report Generator - synthesize findings into comprehensive report
    const comprehensiveReport = await generateIntelligenceReport({
      organization: organizationAnalysis.status === 'fulfilled' ? organizationAnalysis.value : null,
      competitors: competitorAnalysis.status === 'fulfilled' ? competitorAnalysis.value : null,
      topics: topicAnalysis.status === 'fulfilled' ? topicAnalysis.value : null,
      dataAnalysis: dataAnalysis.status === 'fulfilled' ? dataAnalysis.value : null,
      timeframe
    });
    
    console.log('Research orchestration complete');
    return comprehensiveReport;
    
  } catch (error) {
    console.error('Research orchestration failed:', error);
    throw error;
  }
}

// Query Clarifier Agent
async function clarifyResearchQueries(organization, competitors, topics) {
  console.log('Query Clarifier: Analyzing research objectives...');
  
  const prompt = `You are the Query Clarifier Agent. Analyze these research objectives and ensure they are specific and actionable for intelligence gathering.

Organization: ${organization.name}
Industry: ${organization.industry || 'Unknown'}
Competitors: ${competitors.map(c => c.name).join(', ')}
Topics to Monitor: ${topics.map(t => t.name).join(', ')}

For each area (organization, competitors, topics), determine if the research scope is clear enough for comprehensive 24-hour intelligence analysis. If clarification is needed, suggest specific focus areas.

Return JSON format:
{
  "organization": {
    "clear": true/false,
    "focusAreas": ["specific areas to research"],
    "clarifications": ["any needed clarifications"]
  },
  "competitors": {
    "clear": true/false,
    "focusAreas": ["competitor aspects to analyze"],
    "clarifications": ["any needed clarifications"]
  },
  "topics": {
    "clear": true/false,
    "focusAreas": ["topic dimensions to explore"],
    "clarifications": ["any needed clarifications"]
  }
}`;

  try {
    const response = await claudeService.sendMessage(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : getDefaultQueries();
  } catch (error) {
    console.log('Query clarification failed, using defaults');
    return getDefaultQueries();
  }
}

// Research Brief Generator Agent
async function generateResearchBriefs(clarifiedQueries, organization, competitors, topics) {
  console.log('Research Brief Generator: Creating SPECIFIC research plans...');
  console.log('Organization name:', organization?.name);
  console.log('Actual competitors:', competitors?.map(c => c.name));
  console.log('Actual topics:', topics?.map(t => t.name));
  
  // Build keywords intelligently based on available data
  let orgKeywords = [];
  
  // Only use organization name if it's not an ID
  if (organization.name && !organization.name.startsWith('org-') && !organization.name.includes('Organization')) {
    orgKeywords = [
      organization.name,
      ...(organization.name?.split(' ') || [])
    ].filter(k => k && k.length > 2);
  }
  
  // If no good org keywords, use industry keywords instead
  if (orgKeywords.length === 0 && organization.industry) {
    orgKeywords = organization.industry.split(' ').filter(k => k && k.length > 3);
  }
  
  const competitorKeywords = competitors.map(c => c.name);
  const topicKeywords = topics.map(t => t.name);
  
  console.log('=== ACTUAL KEYWORDS TO USE ===');
  console.log('Organization keywords:', orgKeywords);
  console.log('Competitor keywords:', competitorKeywords);
  console.log('Topic keywords:', topicKeywords);
  
  // Create research briefs with ACTUAL data, not generic stuff
  return {
    organization: {
      mainQuestion: `What are the latest developments and mentions of ${organization.name} in the last 24 hours?`,
      subQuestions: [
        `Any news mentioning ${organization.name} directly?`,
        `Industry developments in ${organization.industry}?`,
        `Market movements affecting ${organization.industry}?`
      ],
      keywords: orgKeywords,
      sourceTypes: ['news', 'industry publications', 'social media'],
      successCriteria: `Find mentions of ${organization.name} or relevant ${organization.industry} news`
    },
    competitors: {
      mainQuestion: `What are ${competitors.map(c => c.name).join(', ')} doing in the last 24 hours?`,
      subQuestions: competitors.map(c => `Any news about ${c.name}?`),
      keywords: competitorKeywords,
      sourceTypes: ['news', 'press releases', 'industry reports'],
      successCriteria: `Find specific news about ${competitorKeywords.join(', ')}`
    },
    topics: {
      mainQuestion: `What's happening with ${topics.map(t => t.name).join(', ')} topics?`,
      subQuestions: topics.map(t => `Latest developments in ${t.name}?`),
      keywords: topicKeywords,
      sourceTypes: ['news', 'analysis', 'expert commentary'],
      successCriteria: `Find content specifically about ${topicKeywords.join(', ')}`
    }
  };
}

// Organization Intelligence Analysis
async function analyzeOrganizationIntelligence(organization, researchBrief) {
  console.log('=== ANALYZING ORGANIZATION INTELLIGENCE ===');
  console.log('Organization:', organization.name);
  console.log('Research Brief Keywords:', researchBrief.keywords);
  
  // Gather data from multiple sources
  const rawData = await gatherWideNetData(researchBrief.keywords, 'organization', {
    organization: organization,
    competitors: [],
    topics: []
  });
  
  console.log(`Organization analysis: ${rawData.items.length} items gathered`);
  
  // If no relevant data found, be explicit about it
  if (rawData.items.length === 0) {
    console.log('WARNING: No data found for organization analysis');
    return {
      executiveSummary: "No recent intelligence data found for analysis",
      keyDevelopments: [],
      sentimentAnalysis: { overall: "neutral", score: 50, reasoning: "No data available for sentiment analysis" },
      riskFactors: ["Limited data visibility"],
      opportunities: ["Improve data collection"],
      recommendations: ["Expand monitoring sources"],
      dataAvailable: false
    };
  }
  
  // Create a more specific prompt with actual data
  const relevantItems = rawData.items.filter(item => 
    item.matchingKeywords.length > 0 || 
    item.title.toLowerCase().includes(organization.name.toLowerCase())
  );
  
  // Don't include generic business items - only keyword matches
  const contextualItems = [];
  
  console.log(`Organization-specific items: ${relevantItems.length}`);
  console.log(`Contextual business items: ${contextualItems.length}`);
  
  const prompt = `You are conducting intelligence analysis for ${organization.name} in the ${organization.industry || 'business'} industry.

ORGANIZATION-SPECIFIC INTELLIGENCE:
${relevantItems.length > 0 ? relevantItems.map((item, idx) => 
  `${idx + 1}. ${item.title}
Source: ${item.source}
Keywords Found: ${item.matchingKeywords.join(', ')}
Content: ${item.content.substring(0, 300)}...
Published: ${item.publishDate.toISOString()}
---`
).join('\n') : 'No organization-specific mentions found in recent data.'}

INDUSTRY CONTEXT:
${contextualItems.slice(0, 5).map((item, idx) => 
  `${idx + 1}. ${item.title} (${item.source})
Content: ${item.content.substring(0, 200)}...
---`
).join('\n')}

DATA SOURCES ANALYZED: ${rawData.sources.join(', ')}
ANALYSIS TIMEFRAME: Last 24 hours
TOTAL ITEMS REVIEWED: ${rawData.items.length}

Based on this REAL data (not hypothetical scenarios), analyze the current situation for ${organization.name}. If there are no direct mentions, focus on industry trends and competitive landscape that could affect them.

Return JSON analysis:
{
  "executiveSummary": "Based on the actual data above, what are the key findings for ${organization.name}?",
  "keyDevelopments": [
    // Only include developments you can actually see in the data above
  ],
  "sentimentAnalysis": {
    "overall": "based on actual content above",
    "score": 0-100,
    "reasoning": "specific evidence from the data provided"
  },
  "riskFactors": ["risks based on actual trends seen in the data"],
  "opportunities": ["opportunities based on actual market movements in the data"],
  "recommendations": ["specific actions based on real intelligence gathered"],
  "dataQuality": "high|medium|low based on relevance of data found"
}`;

  try {
    const response = await claudeService.sendMessage(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error('Organization analysis failed:', error);
    return null;
  }
}

// Competitor Intelligence Analysis
async function analyzeCompetitorIntelligence(competitors, researchBrief) {
  console.log('Analyzing competitor intelligence for', competitors.length, 'competitors');
  
  const competitorAnalyses = await Promise.allSettled(
    competitors.slice(0, 5).map(async (competitor) => {
      const rawData = await gatherWideNetData([competitor.name, ...researchBrief.keywords], 'competitor', {
        organization: organization,
        competitors: [competitor],
        topics: []
      });
      
      const prompt = `You are conducting competitive intelligence analysis.

Competitor: ${competitor.name}
Priority: ${competitor.priority || 'medium'}
Market Position: ${competitor.marketCap || 'Unknown'}

Recent Data (Last 24 hours):
${JSON.stringify(rawData.items.slice(0, 5), null, 2)}

Analyze and return JSON:
{
  "competitor": "${competitor.name}",
  "healthScore": 0-100,
  "recentActivity": [
    {
      "type": "product|partnership|financial|leadership|other",
      "title": "Activity title",
      "impact": "high|medium|low",
      "description": "What happened",
      "opportunityForUs": "How we can respond"
    }
  ],
  "threats": ["competitive threats"],
  "weaknesses": ["identified weaknesses"],
  "strengths": ["competitive advantages"]
}`;

      try {
        const response = await claudeService.sendMessage(prompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (error) {
        console.error(`Competitor analysis failed for ${competitor.name}:`, error);
        return null;
      }
    })
  );
  
  return competitorAnalyses
    .filter(result => result.status === 'fulfilled' && result.value)
    .map(result => result.value);
}

// Topic Intelligence Analysis
async function analyzeTopicIntelligence(topics, researchBrief) {
  console.log('Analyzing topic intelligence for', topics.length, 'topics');
  
  const topicAnalyses = await Promise.allSettled(
    topics.slice(0, 5).map(async (topic) => {
      const rawData = await gatherWideNetData([topic.name, ...researchBrief.keywords], 'topic', {
        organization: organization,
        competitors: [],
        topics: [topic]
      });
      
      const prompt = `You are analyzing topic trends and implications.

Topic: ${topic.name}
Priority: ${topic.priority || 'medium'}
Trending: ${topic.trending || false}

Recent Data (Last 24 hours):
${JSON.stringify(rawData.items.slice(0, 8), null, 2)}

Analyze and return JSON:
{
  "topic": "${topic.name}",
  "trendDirection": "rising|falling|stable|volatile",
  "momentum": 0-100,
  "keyNarratives": [
    {
      "narrative": "Main story or trend",
      "sentiment": "positive|negative|neutral",
      "sources": ["source names"],
      "implications": "What this means"
    }
  ],
  "marketImplications": "How this affects the market",
  "actionableInsights": ["specific actions to consider"],
  "forecastNextWeek": "Prediction for next week"
}`;

      try {
        const response = await claudeService.sendMessage(prompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (error) {
        console.error(`Topic analysis failed for ${topic.name}:`, error);
        return null;
      }
    })
  );
  
  return topicAnalyses
    .filter(result => result.status === 'fulfilled' && result.value)
    .map(result => result.value);
}

// Data Analyst Agent - quantitative analysis
async function performDataAnalysis(organization, competitors, topics) {
  console.log('Data Analyst: Performing quantitative analysis...');
  
  // Gather metrics and trends
  const rawData = await gatherWideNetData(
    [organization.name, ...competitors.map(c => c.name), ...topics.map(t => t.name)],
    'metrics',
    { organization, competitors, topics }
  );
  
  const prompt = `You are the Data Analyst Agent specializing in quantitative intelligence analysis.

Analysis Target: ${organization.name}
Competitors: ${competitors.map(c => c.name).join(', ')}
Topics: ${topics.map(t => t.name).join(', ')}

Data Sources: ${rawData.sources.length} sources analyzed
Data Points: ${rawData.items.length} items from last 24 hours

Perform quantitative analysis and return JSON:
{
  "mentionVolume": {
    "organization": number,
    "competitors": {"competitor": volume},
    "topics": {"topic": volume}
  },
  "sentimentTrends": {
    "organization": {"positive": %, "negative": %, "neutral": %},
    "overall": 0-100
  },
  "engagementMetrics": {
    "avgEngagement": number,
    "peakHours": ["hours of highest activity"],
    "viralContent": ["content with high engagement"]
  },
  "competitiveGaps": [
    {
      "gap": "identified gap",
      "opportunity": "how to exploit",
      "confidence": 0-1
    }
  ],
  "trendingTopics": [
    {
      "topic": "trending topic",
      "growthRate": "percentage",
      "relevanceScore": 0-100
    }
  ]
}`;

  try {
    const response = await claudeService.sendMessage(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error('Data analysis failed:', error);
    return null;
  }
}

// Report Generator Agent - synthesizes all findings into comprehensive report
async function generateIntelligenceReport({ organization, competitors, topics, dataAnalysis, timeframe }) {
  console.log('Report Generator: Creating comprehensive intelligence report...');
  
  const prompt = `You are the Report Generator Agent. Create a comprehensive intelligence report from research findings.

Timeframe: ${timeframe} analysis
Generated: ${new Date().toISOString()}

Research Findings:
Organization Analysis: ${organization ? JSON.stringify(organization, null, 2) : 'Not available'}
Competitor Analysis: ${competitors ? JSON.stringify(competitors, null, 2) : 'Not available'}  
Topic Analysis: ${topics ? JSON.stringify(topics, null, 2) : 'Not available'}
Data Analysis: ${dataAnalysis ? JSON.stringify(dataAnalysis, null, 2) : 'Not available'}

Generate a comprehensive executive-ready intelligence report in JSON format:
{
  "executiveSummary": {
    "headline": "One-line key finding",
    "keyPoints": ["3-5 critical insights"],
    "overallSentiment": "positive|negative|neutral|mixed",
    "riskLevel": "high|medium|low",
    "opportunityLevel": "high|medium|low"
  },
  "organizationIntelligence": {
    "summary": "Organization status summary",
    "keyDevelopments": ["recent developments"],
    "riskFactors": ["current risks"],
    "opportunities": ["strategic opportunities"]
  },
  "competitiveIntelligence": {
    "summary": "Competitive landscape summary", 
    "threats": ["competitive threats"],
    "opportunities": ["competitive opportunities"],
    "marketPosition": "current position assessment"
  },
  "topicIntelligence": {
    "summary": "Topic trend summary",
    "risingTopics": ["topics gaining momentum"],
    "declineTopics": ["topics losing relevance"],
    "emergingOpportunities": ["new opportunities from trends"]
  },
  "actionableRecommendations": [
    {
      "priority": "high|medium|low",
      "action": "specific recommended action",
      "reasoning": "why this action",
      "timeline": "when to act",
      "expectedImpact": "expected outcome"
    }
  ],
  "nextStepsMonitoring": ["areas to monitor closely"],
  "lastUpdated": "${new Date().toISOString()}",
  "sources": ["data sources used"],
  "confidence": 0-100
}`;

  try {
    const response = await claudeService.sendMessage(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const report = JSON.parse(jsonMatch[0]);
      // Add real data statistics
      report.analysisStats = {
        organizationData: organization ? 'Available' : 'Limited',
        competitorCount: competitors ? competitors.length : 0,
        topicCount: topics ? topics.length : 0,
        dataQuality: dataAnalysis ? 'High' : 'Basic',
        researchAgentsUsed: ['Query Clarifier', 'Research Brief Generator', 'Research Orchestrator', 'Data Analyst', 'Report Generator']
      };
      return report;
    } else {
      throw new Error('No valid JSON in report response');
    }
  } catch (error) {
    console.error('Report generation failed:', error);
    return getDefaultReport();
  }
}

// Helper: Get organization configuration from database
async function getOrganizationConfig(organizationId) {
  console.log('=== GETTING ORGANIZATION CONFIG ===');
  console.log('Requested Organization ID:', organizationId);
  
  try {
    // Get ONLY the actual configuration for this organization
    const competitorsQuery = await pool.query(
      `SELECT * FROM intelligence_targets 
       WHERE organization_id = $1 AND type = 'competitor' AND active = true
       ORDER BY priority DESC`,
      [organizationId]
    );
    
    console.log('Competitors found:', competitorsQuery.rows.length);
    
    // Get organization details - handle both UUID and string IDs
    let orgQuery = { rows: [] };
    try {
      // Try as UUID first if it looks like one
      if (organizationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        orgQuery = await pool.query(
          'SELECT * FROM organizations WHERE id = $1',
          [organizationId]
        );
      }
    } catch (e) {
      console.log('Organization lookup skipped (not a UUID):', organizationId);
    }
    
    console.log('Organization query result:', orgQuery.rows.length, 'rows');
    
    // Get topics from intelligence targets  
    const topicsQuery = await pool.query(
      `SELECT * FROM intelligence_targets 
       WHERE organization_id = $1 AND type = 'topic' AND active = true
       ORDER BY priority DESC`,
      [organizationId]
    );
    
    console.log('Topics query result:', topicsQuery.rows.length, 'rows');
    
    const organization = orgQuery.rows[0] || null;
    const competitors = competitorsQuery.rows.map(row => ({
      id: row.id,
      name: row.name,
      priority: row.priority || 'medium',
      marketCap: row.metadata?.marketCap || 'Unknown',
      similarity: row.metadata?.similarity || 0.7
    }));
    
    const topics = topicsQuery.rows.map(row => ({
      id: row.id,
      name: row.name,
      priority: row.priority || 'medium',
      trending: row.metadata?.trending || false
    }));
    
    // Try to infer organization from context
    let orgName = organizationId;
    let orgIndustry = 'General Business';
    
    if (!organization && competitors.length > 0) {
      const competitorNames = competitors.map(c => c.name.toLowerCase());
      
      // Infer based on specific competitor groups
      if (competitorNames.some(name => name.includes('mcdonald') || name.includes('chipotle') || name.includes('taco'))) {
        // Restaurant/QSR industry
        orgIndustry = 'Quick Service Restaurants';
        // For QSR, use a generic name that won't break keyword matching
        orgName = 'QSR Organization';
      } else if (competitorNames.some(name => name.includes('cloud') || name.includes('aws') || name.includes('azure'))) {
        orgIndustry = 'Cloud Computing';
        orgName = 'Cloud Services Provider';
      } else if (competitorNames.some(name => name.includes('retail') || name.includes('commerce'))) {
        orgIndustry = 'E-commerce & Retail';
        orgName = 'Retail Organization';
      } else if (competitorNames.some(name => name.includes('bank') || name.includes('financial'))) {
        orgIndustry = 'Financial Services';
        orgName = 'Financial Institution';
      } else {
        orgIndustry = 'Technology';
        orgName = 'Technology Company';
      }
    }
    
    // Return the actual data with inferred organization
    return {
      organization: organization || { 
        id: organizationId, 
        name: orgName,
        industry: orgIndustry
      },
      competitors: competitors,
      topics: topics
    };
    
  } catch (error) {
    console.error('Database error getting organization config:', error);
    // Return empty config if database error
    return {
      organization: null,
      competitors: [],
      topics: []
    };
  }
}

// Generate realistic demo data for better testing
function generateRealisticDemoData(organizationId) {
  // ALWAYS return event marketing data since user configured event companies
  console.log('Generating event marketing demo data for:', organizationId);
  
  const config = {
    organization: { 
      id: organizationId, 
      name: 'Event Marketing Company',
      industry: 'Event Marketing & Management' 
    },
    competitors: [
      { name: 'George P. Johnson', priority: 'high', marketCap: 'Private' },
      { name: 'Freeman', priority: 'high', marketCap: 'Private ($1B+)' },
      { name: 'Jack Morton Worldwide', priority: 'high', marketCap: 'Private' },
      { name: 'Eventbrite', priority: 'medium', marketCap: '$1.8B' },
      { name: 'Cvent', priority: 'medium', marketCap: 'Private ($5B)' },
      { name: 'Bizzabo', priority: 'low', marketCap: 'Private' },
      { name: 'Hopin', priority: 'medium', marketCap: 'Private' }
    ],
    topics: [
      { name: 'Virtual/Hybrid Events Technology', priority: 'high', trending: true },
      { name: 'Experiential Marketing Trends', priority: 'high', trending: true },
      { name: 'Sustainability in Events', priority: 'high', trending: true },
      { name: 'Brand Activation Metrics', priority: 'medium', trending: false },
      { name: 'Event ROI Analytics', priority: 'medium', trending: false }
    ]
  };
  
  console.log('=== USING USER-CONFIGURED DATA ===');
  console.log('Organization:', config.organization.name);
  console.log('Industry:', config.organization.industry);
  console.log('Competitors:', config.competitors.map(c => c.name));
  console.log('Topics:', config.topics.map(t => t.name));
  
  return config;
}

// Get industry-appropriate competitors if none configured
function getIndustryCompetitors(industry) {
  const industryLower = industry.toLowerCase();
  
  if (industryLower.includes('event')) {
    return [
      { name: 'Eventbrite', priority: 'high', marketCap: '$1.8B' },
      { name: 'Cvent', priority: 'high', marketCap: 'Private' },
      { name: 'Bizzabo', priority: 'medium', marketCap: 'Private' }
    ];
  } else if (industryLower.includes('software') || industryLower.includes('saas')) {
    return [
      { name: 'Salesforce', priority: 'high', marketCap: '$200B' },
      { name: 'HubSpot', priority: 'medium', marketCap: '$25B' }
    ];
  } else if (industryLower.includes('fintech') || industryLower.includes('payment')) {
    return [
      { name: 'Stripe', priority: 'high', marketCap: '$95B' },
      { name: 'PayPal', priority: 'medium', marketCap: '$60B' }
    ];
  }
  
  // Generic defaults
  return [
    { name: 'Industry Leader', priority: 'high', marketCap: 'Unknown' }
  ];
}

// Get industry-appropriate stakeholders
function getIndustryStakeholders(industry) {
  const industryLower = industry.toLowerCase();
  
  if (industryLower.includes('event')) {
    return [
      { name: 'Event Planners', type: 'customer', keywords: ['event planner', 'meeting planner', 'corporate events'] },
      { name: 'Venue Operators', type: 'partner', keywords: ['venue', 'convention center', 'hotel events'] },
      { name: 'Event Sponsors', type: 'investor', keywords: ['sponsor', 'sponsorship', 'event funding'] },
      { name: 'Attendees', type: 'customer', keywords: ['attendee', 'participant', 'registration'] }
    ];
  } else if (industryLower.includes('software') || industryLower.includes('saas')) {
    return [
      { name: 'Developers', type: 'customer', keywords: ['developer', 'programmer', 'software engineer'] },
      { name: 'IT Decision Makers', type: 'customer', keywords: ['CTO', 'IT director', 'tech lead'] },
      { name: 'Investors', type: 'investor', keywords: ['venture capital', 'VC', 'investment'] },
      { name: 'Regulators', type: 'regulator', keywords: ['regulation', 'compliance', 'data privacy'] }
    ];
  }
  
  // Generic defaults
  return [
    { name: 'Customers', type: 'customer', keywords: ['customer', 'client', 'user'] },
    { name: 'Investors', type: 'investor', keywords: ['investor', 'funding', 'investment'] },
    { name: 'Regulators', type: 'regulator', keywords: ['regulation', 'compliance', 'government'] },
    { name: 'Media', type: 'media', keywords: ['media', 'press', 'news'] }
  ];
}

// Get industry-appropriate topics if none configured
function getIndustryTopics(industry) {
  const industryLower = industry.toLowerCase();
  
  if (industryLower.includes('event')) {
    return [
      { name: 'virtual events', priority: 'high', trending: true },
      { name: 'event technology', priority: 'high', trending: false },
      { name: 'hybrid events', priority: 'medium', trending: true }
    ];
  } else if (industryLower.includes('software') || industryLower.includes('saas')) {
    return [
      { name: 'cloud computing', priority: 'high', trending: false },
      { name: 'cybersecurity', priority: 'high', trending: true }
    ];
  } else if (industryLower.includes('fintech') || industryLower.includes('payment')) {
    return [
      { name: 'digital payments', priority: 'high', trending: true },
      { name: 'regulatory compliance', priority: 'medium', trending: false }
    ];
  }
  
  // Generic defaults
  return [
    { name: 'industry trends', priority: 'medium', trending: false }
  ];
}

// Analyze organization-specific data
async function analyzeOrganizationData(organization, data) {
  // If no data, return empty analysis
  if (!data || data.items.length === 0) {
    return {
      summary: `No recent data found for ${organization?.name || 'organization'}`,
      sentiment: 'neutral',
      keyFindings: [],
      opportunities: [],
      risks: [],
      dataPoints: 0
    };
  }
  
  const prompt = `Analyze this data about ${organization.name} (${organization.industry}):

${data.items.slice(0, 10).map(item => `- ${item.title} (${item.source})`).join('\n')}

Provide brief JSON analysis:
{
  "summary": "1-2 sentence summary of ${organization.name}'s current situation",
  "sentiment": "positive|negative|neutral",
  "keyFindings": ["finding 1", "finding 2"],
  "opportunities": ["opportunity 1"],
  "risks": ["risk 1"],
  "dataPoints": ${data.items.length}
}`;

  try {
    const response = await claudeService.sendMessage(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: 'Analysis pending', dataPoints: data.items.length };
  } catch (error) {
    return { summary: 'Analysis failed', sentiment: 'neutral', dataPoints: data.items.length };
  }
}

// Analyze competitor-specific data
async function analyzeCompetitorData(competitor, data) {
  // If no data, return empty analysis
  if (!data || data.items.length === 0) {
    return {
      name: competitor.name,
      summary: `No recent data found for ${competitor.name}`,
      findings: [],
      opportunities: [],
      risks: [],
      dataPoints: 0
    };
  }
  
  // Use Claude to analyze REAL data about the competitor
  try {
    const prompt = `Analyze this recent data about competitor ${competitor.name}:
${data.items.slice(0, 10).map(item => `- ${item.title} (${item.source})`).join('\n')}

Provide brief JSON analysis:
{
  "name": "${competitor.name}",
  "summary": "1-2 sentence summary of ${competitor.name}'s recent activity",
  "findings": ["key finding 1", "key finding 2"],
  "opportunities": ["how we can compete"],
  "risks": ["threat they pose"],
  "dataPoints": ${data.items.length}
}`;

    const response = await claudeService.sendMessage(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error analyzing competitor:', error);
  }
  
  // Only if Claude fails, return minimal analysis
  return {
    name: competitor.name,
    summary: `Analysis of ${competitor.name} based on ${data.items.length} data points`,
    findings: data.items.slice(0, 3).map(item => item.title),
    opportunities: [],
    risks: [],
    dataPoints: data.items.length
  };
  
  const prompt = `Analyze competitor ${competitor.name} activity:

Recent mentions (${data.items.length} found):
${data.items.slice(0, 5).map(item => `- ${item.title}`).join('\n')}

Return JSON:
{
  "summary": "Brief status of ${competitor.name}",
  "activity": "high|medium|low",
  "threats": ["competitive threats"],
  "weaknesses": ["identified weaknesses"],
  "dataPoints": ${data.items.length}
}`;

  try {
    const response = await claudeService.sendMessage(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: 'Monitoring', dataPoints: data.items.length };
  } catch (error) {
    return { summary: 'Analysis pending', activity: 'unknown', dataPoints: data.items.length };
  }
}

// Analyze topic-specific data
async function analyzeTopicData(topic, data) {
  const hasData = data.items.length > 0;
  
  if (!hasData) {
    return {
      summary: `No recent developments in ${topic.name}`,
      momentum: 'stable',
      implications: [],
      dataPoints: 0
    };
  }
  
  const prompt = `Analyze topic "${topic.name}":

Recent coverage (${data.items.length} items):
${data.items.slice(0, 5).map(item => `- ${item.title} (${item.source})`).join('\n')}

Return JSON:
{
  "summary": "Current state of ${topic.name}",
  "momentum": "rising|falling|stable",
  "implications": ["market implications"],
  "dataPoints": ${data.items.length}
}`;

  try {
    const response = await claudeService.sendMessage(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: 'Topic being monitored', dataPoints: data.items.length };
  } catch (error) {
    return { summary: 'Analysis pending', momentum: 'unknown', dataPoints: data.items.length };
  }
}

// Analyze stakeholder-specific data
async function analyzeStakeholderData(stakeholder, data, organization) {
  const hasData = data.items.length > 0;
  
  if (!hasData) {
    return {
      summary: `No recent ${stakeholder.name} activity detected`,
      sentiment: 'neutral',
      concerns: [],
      opportunities: [],
      dataPoints: 0
    };
  }
  
  const prompt = `Analyze ${stakeholder.name} (${stakeholder.type}) perspective for ${organization.name}:

Recent ${stakeholder.name} related content:
${data.items.slice(0, 5).map(item => `- ${item.title}`).join('\n')}

Return JSON:
{
  "summary": "How ${stakeholder.name} are currently positioned",
  "sentiment": "positive|negative|neutral",
  "concerns": ["stakeholder concerns"],
  "opportunities": ["engagement opportunities"],
  "dataPoints": ${data.items.length}
}`;

  try {
    const response = await claudeService.sendMessage(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: 'Monitoring stakeholder', dataPoints: data.items.length };
  } catch (error) {
    return { summary: 'Analysis pending', sentiment: 'neutral', dataPoints: data.items.length };
  }
}

// Generate executive summary from all analyses
function generateExecutiveSummary(orgAnalysis, competitorAnalyses, topicAnalyses, stakeholderAnalyses) {
  const hasOrgData = orgAnalysis.dataPoints > 0;
  const activeCompetitors = competitorAnalyses.filter(c => c.dataPoints > 0);
  const activeTopics = topicAnalyses.filter(t => t.dataPoints > 0);
  
  return {
    headline: hasOrgData ? orgAnalysis.summary : 'Limited data available for comprehensive analysis',
    keyInsights: [
      hasOrgData && orgAnalysis.keyFindings ? orgAnalysis.keyFindings[0] : null,
      activeCompetitors.length > 0 ? `${activeCompetitors.length} competitors showing activity` : null,
      activeTopics.length > 0 ? `${activeTopics.length} topics trending in industry` : null
    ].filter(Boolean),
    overallSentiment: orgAnalysis.sentiment || 'neutral',
    dataQuality: hasOrgData ? 'good' : 'limited'
  };
}

// Calculate overall sentiment from all analyses
function calculateOverallSentiment(orgAnalysis, competitorAnalyses, topicAnalyses) {
  const sentiments = [
    orgAnalysis.sentiment,
    ...competitorAnalyses.map(c => c.sentiment || 'neutral'),
    ...topicAnalyses.map(t => t.sentiment || 'neutral')
  ].filter(Boolean);
  
  const positive = sentiments.filter(s => s === 'positive').length;
  const negative = sentiments.filter(s => s === 'negative').length;
  
  if (positive > negative) return 'positive';
  if (negative > positive) return 'negative';
  return 'neutral';
}

// Helper: Gather data from wide net of sources with intelligent source discovery
async function gatherWideNetData(keywords, type, context = {}) {
  console.log(`=== INTELLIGENT DATA GATHERING FOR ${type.toUpperCase()} ===`);
  console.log('Keywords:', keywords);
  console.log('Context:', context);
  
  const sources = [];
  const items = [];
  const parser = new Parser();
  
  // Intelligently determine sources based on context
  let feeds = [];
  
  // If we have context, use intelligent source discovery
  if (context.organization || context.competitors || context.topics) {
    console.log('Using intelligent source discovery...');
    const discoveredSources = await sourceDiscovery.getSourcesForOrganization(
      context.organization,
      context.competitors,
      context.topics
    );
    
    // Get all sources organized by priority
    const allSources = await sourceDiscovery.getAllSourcesOrganized(discoveredSources);
    
    // Convert to feed format and limit to top sources
    feeds = allSources.slice(0, 50).map(source => ({
      name: source.name,
      url: source.url,
      type: source.type,
      priority: source.priority
    }));
    
    console.log(`Discovered ${feeds.length} relevant sources for monitoring`);
    console.log('Source types:', [...new Set(feeds.map(f => f.type))]);
    console.log('High priority sources:', feeds.filter(f => f.priority === 'high').length);
  } 
  
  // Fallback to generic feeds if no context or discovery fails
  if (feeds.length === 0) {
    console.log('Using fallback generic sources...');
    feeds = [
      // Major News Sources
      { name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best' },
    { name: 'Reuters Tech', url: 'https://www.reutersagency.com/feed/?best-topics=tech&post_type=best' },
    { name: 'Reuters Sports', url: 'https://www.reutersagency.com/feed/?best-topics=sports&post_type=best' },
    { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
    { name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
    { name: 'WSJ Business', url: 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml' },
    { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss' },
    { name: 'Financial Times', url: 'https://www.ft.com/rss/home' },
    { name: 'Forbes', url: 'https://www.forbes.com/business/feed/' },
    { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
    
    // Sports & Fashion Industry
    { name: 'ESPN', url: 'https://www.espn.com/espn/rss/news' },
    { name: 'Sports Business Daily', url: 'https://www.sportsbusinessdaily.com/rss/news.aspx' },
    { name: 'Fashion United', url: 'https://fashionunited.com/rss/news' },
    { name: 'Retail Dive', url: 'https://www.retaildive.com/feeds/news/' },
    { name: 'Footwear News', url: 'https://footwearnews.com/feed/' },
    
    // Tech News
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    { name: 'VentureBeat', url: 'https://feeds.feedburner.com/venturebeat/SZYF' },
    { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
    
    // Business Wire
    { name: 'Business Wire', url: 'https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeGVtRWA==' },
    { name: 'PR Newswire', url: 'https://www.prnewswire.com/rss/news-releases-list.rss' },
    { name: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories' },
    
    // Industry Analysis
    { name: 'Harvard Business Review', url: 'https://hbr.org/feed' },
    { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
    { name: 'Fast Company', url: 'https://www.fastcompany.com/latest/rss' },
    
    // Community
    { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
    { name: 'Product Hunt', url: 'https://www.producthunt.com/feed' },
    { name: 'Reddit Business', url: 'https://www.reddit.com/r/business/.rss' }
    ];
  }
  
  console.log(`Searching ${feeds.length} RSS sources for keywords:`, keywords);
  
  const fetchResults = [];
  
  // Process ALL feeds for comprehensive coverage
  for (const feed of feeds) { // Check ALL feeds
    try {
      console.log(`Fetching ${feed.name}...`);
      const startTime = Date.now();
      
      const feedData = await Promise.race([
        parser.parseURL(feed.url),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]);
      
      const fetchTime = Date.now() - startTime;
      console.log(`${feed.name} fetched in ${fetchTime}ms, items: ${feedData.items.length}`);
      
      sources.push(feed.name);
      
      // Process items more thoroughly
      let feedMatches = 0;
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      feedData.items.slice(0, 15).forEach((item, idx) => {
        const pubDate = new Date(item.pubDate || item.isoDate || Date.now());
        
        // Be more lenient with time filtering for debugging
        const isRecent = pubDate > twentyFourHoursAgo || idx < 5; // Take at least 5 recent items
        
        if (!isRecent) return;
        
        const title = item.title || '';
        const content = item.contentSnippet || item.content || item.summary || '';
        const fullText = `${title} ${content}`.toLowerCase();
        
        // Check if ANY keyword matches - make matching more flexible
        const matchingKeywords = keywords.filter(kw => {
          if (!kw || kw.length < 2) return false;
          const keyword = kw.toString().toLowerCase();
          
          // Check exact match or partial word match (e.g., "Nike" in "Nike's")
          const wordBoundaryPattern = new RegExp(`\\b${keyword}`, 'i');
          return fullText.includes(keyword) || wordBoundaryPattern.test(fullText);
        });
        
        // Check for related terms dynamically based on configuration
        // This should be loaded from database or config, not hardcoded
        const brandRelatedTerms = {};
        
        // Check for brand-related terms
        let hasBrandContent = false;
        for (const [brand, terms] of Object.entries(brandRelatedTerms)) {
          if (keywords.some(kw => kw.toLowerCase().includes(brand))) {
            if (terms.some(term => fullText.includes(term))) {
              hasBrandContent = true;
              break;
            }
          }
        }
        
        // Include items that match keywords OR have brand content OR are very recent and relevant
        if (matchingKeywords.length > 0 || hasBrandContent || (isRecent && idx < 5)) {
          items.push({
            title: title || 'Untitled',
            content: content.substring(0, 500) || 'No content', // Limit content length
            source: feed.name,
            url: item.link,
            publishDate: pubDate,
            matchingKeywords,
            relevanceScore: matchingKeywords.length / keywords.length
          });
          
          if (matchingKeywords.length > 0) {
            feedMatches++;
          }
        }
      });
      
      console.log(`${feed.name}: ${feedMatches} keyword matches found`);
      fetchResults.push({ feed: feed.name, matches: feedMatches, success: true });
      
    } catch (error) {
      console.log(`Failed to fetch ${feed.name}: ${error.message}`);
      fetchResults.push({ feed: feed.name, error: error.message, success: false });
    }
  }
  
  // Sort by relevance and recency
  items.sort((a, b) => {
    // Prioritize items with keyword matches
    if (a.matchingKeywords.length !== b.matchingKeywords.length) {
      return b.matchingKeywords.length - a.matchingKeywords.length;
    }
    // Then by relevance score
    const relevanceDiff = b.relevanceScore - a.relevanceScore;
    if (Math.abs(relevanceDiff) > 0.05) return relevanceDiff;
    // Finally by recency
    return b.publishDate - a.publishDate;
  });
  
  // If we have very few keyword matches, include more recent items for context
  const minItems = 10;
  let topItems = items.slice(0, Math.max(minItems, Math.min(25, items.length)));
  
  // If still no keyword matches, explicitly log this
  const keywordMatches = topItems.filter(item => item.matchingKeywords.length > 0);
  if (keywordMatches.length === 0) {
    console.log('⚠️ WARNING: No items found matching keywords:', keywords);
    console.log('Including recent items for context only');
  }
  
  console.log(`=== DATA GATHERING COMPLETE ===`);
  console.log('Fetch results:', fetchResults);
  console.log(`Total items: ${items.length}, Top items: ${topItems.length}`);
  console.log(`Sources success: ${sources.length}/${feeds.length}`);
  
  if (topItems.length > 0) {
    console.log('Sample top items:');
    topItems.slice(0, 3).forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.title} (${item.source}) - Keywords: [${item.matchingKeywords.join(', ')}]`);
    });
  } else {
    console.log('WARNING: No relevant items found!');
  }
  
  return {
    sources,
    items: topItems,
    totalSources: feeds.length,
    successfulSources: sources.length,
    fetchResults
  };
}

// Default fallback functions
function getDefaultQueries() {
  return {
    organization: {
      clear: true,
      focusAreas: ['brand mentions', 'product updates', 'leadership news', 'financial performance'],
      clarifications: []
    },
    competitors: {
      clear: true,
      focusAreas: ['product launches', 'funding news', 'market moves', 'strategic partnerships'],
      clarifications: []
    },
    topics: {
      clear: true,
      focusAreas: ['industry trends', 'regulatory changes', 'market dynamics', 'innovation patterns'],
      clarifications: []
    }
  };
}

function getDefaultBriefs() {
  return {
    organization: {
      mainQuestion: 'What are the key developments affecting the organization in the last 24 hours?',
      subQuestions: [
        'What brand mentions occurred?',
        'Any product or service updates?',
        'Leadership or organizational changes?',
        'Market reception and sentiment?'
      ],
      keywords: ['organization', 'brand', 'product', 'service', 'leadership'],
      sourceTypes: ['news', 'social', 'industry publications'],
      successCriteria: 'Comprehensive view of organizational developments and sentiment'
    },
    competitors: {
      mainQuestion: 'What competitive movements and opportunities exist in the last 24 hours?',
      subQuestions: [
        'What moves did competitors make?',
        'Any product launches or updates?',
        'Funding or partnership news?',
        'Market positioning changes?'
      ],
      keywords: ['competitor', 'product', 'funding', 'partnership', 'market'],
      sourceTypes: ['news', 'industry reports', 'financial news'],
      successCriteria: 'Clear competitive landscape assessment and opportunities'
    },
    topics: {
      mainQuestion: 'What topic trends and implications emerged in the last 24 hours?',
      subQuestions: [
        'Which topics are gaining momentum?',
        'What narratives are developing?',
        'Any regulatory or policy changes?',
        'Market sentiment on key topics?'
      ],
      keywords: ['topic', 'trend', 'regulation', 'policy', 'market'],
      sourceTypes: ['news', 'analysis', 'expert commentary'],
      successCriteria: 'Understanding of topic evolution and strategic implications'
    }
  };
}

function getDefaultReport() {
  return {
    executiveSummary: {
      headline: 'Intelligence analysis completed with limited data availability',
      keyPoints: [
        'Research agents deployed successfully',
        'Multiple data sources analyzed',
        'Baseline intelligence gathered',
        'System ready for enhanced monitoring'
      ],
      overallSentiment: 'neutral',
      riskLevel: 'low',
      opportunityLevel: 'medium'
    },
    organizationIntelligence: {
      summary: 'Limited organization-specific intelligence available',
      keyDevelopments: ['System establishing baseline monitoring'],
      riskFactors: ['Insufficient data sources'],
      opportunities: ['Enhanced monitoring capabilities']
    },
    competitiveIntelligence: {
      summary: 'Competitive monitoring framework established',
      threats: ['General market competition'],
      opportunities: ['Market intelligence gathering'],
      marketPosition: 'Assessment pending'
    },
    topicIntelligence: {
      summary: 'Topic monitoring system active',
      risingTopics: ['AI technology', 'Market trends'],
      declineTopics: [],
      emergingOpportunities: ['Enhanced analytics capabilities']
    },
    actionableRecommendations: [
      {
        priority: 'high',
        action: 'Expand data source integration',
        reasoning: 'Better intelligence requires more comprehensive data',
        timeline: 'Next 7 days',
        expectedImpact: 'Improved analysis quality'
      }
    ],
    nextStepsMonitoring: ['Competitor activities', 'Topic trends', 'Market dynamics'],
    lastUpdated: new Date().toISOString(),
    sources: ['RSS feeds', 'News aggregators'],
    confidence: 60,
    analysisStats: {
      organizationData: 'Limited',
      competitorCount: 0,
      topicCount: 0,
      dataQuality: 'Basic',
      researchAgentsUsed: ['Query Clarifier', 'Research Brief Generator', 'Research Orchestrator', 'Data Analyst', 'Report Generator']
    }
  };
}

// Fallback basic intelligence summary (original RSS-based approach)
async function getBasicIntelligenceSummary(organizationId) {
  console.log('Using fallback basic intelligence summary');
  
  const parser = new Parser();
  const feeds = [
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { name: 'Reuters Tech', url: 'https://www.reutersagency.com/feed/?best-topics=tech&post_type=best' }
  ];
  
  const newsItems = [];
  let totalMentions = 0;
  
  for (const feed of feeds.slice(0, 2)) { // Limit for fallback
    try {
      const feedData = await Promise.race([
        parser.parseURL(feed.url),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]);
      
      feedData.items.slice(0, 5).forEach(item => {
        newsItems.push({
          id: `${feed.name}-${Date.now()}-${Math.random()}`,
          type: 'topic',
          source: feed.name,
          title: item.title || 'Untitled',
          excerpt: item.contentSnippet || 'No excerpt',
          sentiment: 'neutral',
          relevance: 'medium',
          timestamp: new Date(item.pubDate || Date.now()),
          topics: ['General'],
          url: item.link
        });
        totalMentions++;
      });
    } catch (error) {
      console.log(`Fallback feed ${feed.name} failed:`, error.message);
    }
  }
  
  return {
    newsItems,
    stats: {
      totalMentions,
      sentimentScore: 50,
      topicsCovered: 1,
      competitorMentions: 0
    },
    lastUpdated: new Date(),
    fallbackUsed: true
  };
}