// Monitor Stage 1: Smart Prioritized Intelligence Collection with Claude Assessment
// PRIORITIZES curated RSS feeds from source registry, uses APIs to fill gaps
// ENHANCED: Uses Claude to intelligently evaluate articles against discovery targets
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Environment variables
const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY') || '44466831285e41dfa4c1fb4bf6f1a92f';
// Use service role key for internal service-to-service calls
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

// ==================== RSS FETCHERS ====================
async function fetchFromRSS(feedUrl: string, sourceName = 'RSS Feed', authToken: string) {
  try {
    const response = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/rss-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}` // Always use service role key for internal calls
      },
      body: JSON.stringify({
        url: feedUrl
      })
    });
    
    if (!response.ok) {
      console.log(`   ⚠️ RSS proxy returned ${response.status} for ${sourceName}`);
      return [];
    }
    
    const data = await response.json();
    const articles = data.articles || data.items || [];
    console.log(`   ✓ Fetched ${articles.length} articles from ${sourceName}`);
    
    return articles.map((item: any) => ({
      title: item.title,
      url: item.url || item.link,
      description: item.description || item.content || '',
      published_at: item.publishedAt || item.pubDate || new Date().toISOString(),
      source: sourceName,
      source_url: feedUrl
    }));
  } catch (error) {
    console.error(`   ❌ RSS error for ${sourceName}: ${error.message}`);
    return [];
  }
}

// ==================== CLAUDE-POWERED COVERAGE ASSESSMENT ====================
async function assessArticlesWithClaude(articles: any[], profile: any, orgName: string) {
  if (!ANTHROPIC_API_KEY) {
    console.log('⚠️ Claude assessment skipped - No API key set');
    return { articles, coverageReport: null };
  }
  
  if (articles.length === 0) {
    console.log('⚠️ Claude assessment skipped - No articles to assess');
    return { articles, coverageReport: null };
  }

  try {
    console.log(`🤖 Using Claude to create coverage report for ${articles.length} articles...`);
    
    // Prepare discovery targets from profile
    const discoveryTargets = {
      organization: orgName || profile?.organization_name || 'Tesla',
      competitors: [
        ...(profile?.competition?.direct_competitors || []),
        ...(profile?.competition?.indirect_competitors || []),
        ...(profile?.competition?.emerging_threats || [])
      ].filter(Boolean).slice(0, 15),
      stakeholders: [
        ...(profile?.stakeholders?.regulators || []),
        ...(profile?.stakeholders?.major_investors || []),
        ...(profile?.stakeholders?.executives || [])
      ].filter(Boolean).slice(0, 10),
      topics: [
        ...(profile?.monitoring_config?.keywords || []),
        ...(profile?.keywords || [])
      ].filter(Boolean).slice(0, 20)
    };

    // Process ALL 100 articles in ONE batch for speed
    const articleSummaries = articles.map((a, idx) => 
      `[${idx}] ${a.title?.substring(0, 100)} (${a.source})`
    ).join('\n');
      
    const prompt = `Quick task: Match news headlines to our intelligence targets for ${discoveryTargets.organization}.

TARGETS WE'RE TRACKING:
Competitors: ${discoveryTargets.competitors.join(', ')}
Stakeholders: ${discoveryTargets.stakeholders.join(', ')}
Topics: ${discoveryTargets.topics.join(', ')}

HEADLINES:
${articleSummaries}

Provide a JSON response with:
1. "coverage": For each target category, list which targets have articles (with article indices)
2. "gaps": List targets with NO coverage today
3. "priorities": Array of article indices [0-99] for the TOP 30 most important articles
4. "context_for_next_stage": Brief note about coverage quality

Example format:
{
  "coverage": {
    "competitors": {"Ford": [0,5,12], "GM": [3]},
    "stakeholders": {"SEC": [8]},
    "topics": {"EV": [0,1,2], "battery": [4,7]}
  },
  "gaps": {
    "competitors": ["Toyota", "VW"],
    "stakeholders": ["NHTSA"],
    "topics": ["autonomous"]
  },
  "priorities": [0,5,8,12,3,1,2,4,7],
  "context_for_next_stage": "Good competitor coverage, limited regulatory news today"
}

RESPOND WITH ONLY THE JSON.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      let content = data.content?.[0]?.text || '{}';
      
      // Remove markdown code blocks if present
      content = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      
      // Also try to extract JSON from the content if it's wrapped in other text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }
      
      try {
        // Parse the coverage report
        const report = JSON.parse(content);
        
        // Create coverage report for next stages
        const coverageReport = {
          found: report.coverage || {},
          gaps: report.gaps || {},
          context: report.context_for_next_stage || 'Coverage assessment completed',
          priorities: report.priorities || [],
          message_for_synthesis: `Today's coverage: ${report.context_for_next_stage}. Focus analysis on available content rather than noting gaps.`
        };
        
        // Mark priority articles
        const prioritySet = new Set(report.priorities || []);
        const assessedArticles = articles.map((article, idx) => ({
          ...article,
          claude_assessed: true,
          is_priority: prioritySet.has(idx),
          relevance_score: prioritySet.has(idx) ? 
            Math.max(article.relevance_score || 0, 70) : 
            (article.relevance_score || 50)
        }));
        
        // Sort by priority
        assessedArticles.sort((a, b) => {
          if (a.is_priority && !b.is_priority) return -1;
          if (!a.is_priority && b.is_priority) return 1;
          return (b.relevance_score || 0) - (a.relevance_score || 0);
        });
        
        console.log(`✅ Coverage assessment complete:`);
        console.log(`   Priority articles: ${report.priorities?.length || 0}`);
        console.log(`   Coverage gaps identified: ${JSON.stringify(report.gaps).substring(0, 100)}...`);
        console.log(`   Context: ${report.context_for_next_stage}`);
        
        return { articles: assessedArticles, coverageReport };
      } catch (parseError) {
        console.log('⚠️ Could not parse Claude coverage report:', parseError.message);
        console.log('   Raw content:', content.substring(0, 500));
        
        // Create a basic fallback coverage report so pipeline can continue
        const fallbackReport = {
          found: { 
            competitors: {},
            stakeholders: {},
            topics: {}
          },
          gaps: {
            competitors: [],
            stakeholders: [],
            topics: []
          },
          context: 'Coverage assessment failed - proceeding with all articles',
          priorities: articles.slice(0, 30).map((_, idx) => idx), // Just take first 30
          message_for_synthesis: 'Coverage assessment unavailable - analyze all available content'
        };
        
        // Still mark articles as assessed, just without Claude's priorities
        const assessedArticles = articles.map((article, idx) => ({
          ...article,
          claude_assessed: false,
          is_priority: idx < 30, // First 30 are priority
          relevance_score: article.relevance_score || 50
        }));
        
        return { articles: assessedArticles, coverageReport: fallbackReport };
      }
    } else {
      const errorText = await response.text();
      console.log(`⚠️ Claude API error: ${response.status}`);
      console.log(`   Error details: ${errorText.substring(0, 200)}`);
      return { articles, coverageReport: null };
    }
  } catch (error) {
    console.error('❌ Claude coverage assessment error:', error.message);
    return { articles, coverageReport: null };
  }
}

// ==================== GAP-FILLING API SEARCHES ====================
async function searchGoogleNews(query: string, authToken: string) {
  const encodedQuery = encodeURIComponent(query);
  const googleNewsUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
  const articles = await fetchFromRSS(googleNewsUrl, 'Google News Search', authToken);
  return articles.map((a: any) => ({
    ...a,
    api_source: 'google_news',
    search_query: query
  }));
}

async function searchNewsAPI(query: string, limit = 10) {
  if (!NEWS_API_KEY) return [];
  
  try {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 2); // Changed from 7 days to 2 days (48 hours)
    const from = fromDate.toISOString().split('T')[0];
    
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${from}&sortBy=relevancy&pageSize=${limit}&language=en`;
    
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': NEWS_API_KEY
      }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.articles || []).slice(0, limit).map((article: any) => ({
      title: article.title,
      url: article.url,
      description: article.description || article.content || '',
      published_at: article.publishedAt || new Date().toISOString(),
      source: article.source?.name || 'NewsAPI',
      api_source: 'news_api',
      search_query: query
    }));
  } catch (error) {
    return [];
  }
}

async function searchHackerNews(query: string, limit = 5) {
  try {
    const response = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${limit}`);
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.hits || []).slice(0, limit).map((hit: any) => ({
      title: hit.title,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      description: `${hit.points} points | ${hit.num_comments} comments`,
      published_at: hit.created_at || new Date().toISOString(),
      source: 'Hacker News',
      api_source: 'hacker_news',
      search_query: query
    }));
  } catch (error) {
    return [];
  }
}

// Get industry sources from registry
async function getIndustrySources(industry: string, authToken: string) {
  try {
    console.log(`📚 Fetching sources for industry: ${industry}`);
    const response = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/master-source-registry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}` // Use service role key for internal calls
      },
      body: JSON.stringify({
        industry: industry
      })
    });
    
    if (!response.ok) {
      console.log('   ⚠️ Source registry unavailable, using fallback sources');
      return getFallbackSources(industry);
    }
    
    const result = await response.json();
    // The response has sources in a 'data' field
    const sources = result.data || result;
    console.log(`   ✓ Got ${sources.competitive?.length || 0} competitive, ${sources.market?.length || 0} market, ${sources.regulatory?.length || 0} regulatory, ${sources.media?.length || 0} media sources`);
    return sources;
  } catch (error) {
    console.error('   ❌ Registry error:', error.message);
    return getFallbackSources(industry);
  }
}

// Fallback sources if registry fails
function getFallbackSources(industry: string) {
  return {
    competitive: [],
    market: [
      { name: 'Wall Street Journal', url: 'https://feeds.wsj.com/wsj/xml/rss/3_7014.xml', priority: 'critical' },
      { name: 'Financial Times', url: 'https://www.ft.com/stream/7e37c19e-8fa3-439f-a870-b33f0520bcc0/format/rss', priority: 'critical' }
    ],
    regulatory: [
      { name: 'SEC Filings', url: 'https://www.sec.gov/news/pressreleases.rss', priority: 'high' }
    ],
    media: [
      { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', priority: 'high' }
    ]
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    const { organization_name, profile } = await req.json();
    const authToken = req.headers.get('Authorization') || '';
    
    console.log('\n===========================================');
    console.log('🚀 MONITOR STAGE 1: SMART ARTICLE COLLECTION');
    console.log('===========================================');
    console.log(`📌 Organization: ${organization_name || profile?.organization_name || 'Unknown'}`);
    console.log(`🏭 Industry: ${profile?.industry || 'Unknown'}`);
    
    // FIXED: Better extraction of profile data
    const orgName = organization_name || profile?.organization_name || profile?.organization || '';
    const orgNames = [orgName].filter(Boolean);
    
    // Extract competitors from various possible structures
    const competitors = [
      ...(profile?.competition?.direct_competitors || []),
      ...(profile?.competition?.indirect_competitors || []),
      ...(profile?.competition?.emerging_threats || []),
      ...(profile?.competitors?.direct || []),
      ...(profile?.competitors?.indirect || []),
      ...(Array.isArray(profile?.competitors) ? profile.competitors : [])
    ].filter(Boolean);
    
    // Extract keywords from monitoring config or keywords field
    const keywords = [
      ...(profile?.monitoring_config?.keywords || []),
      ...(profile?.keywords || []),
      orgName,
      ...competitors.slice(0, 5) // Add first 5 competitors as keywords
    ].filter(Boolean);
    
    // Extract stakeholders
    const stakeholders = [
      ...(profile?.stakeholders?.regulators || []),
      ...(profile?.stakeholders?.major_investors || []),
      ...(profile?.stakeholders?.executives || []),
      ...(Array.isArray(profile?.stakeholders) ? profile.stakeholders : [])
    ].filter(Boolean);
    
    console.log(`🎯 Tracking: ${orgNames.join(', ')}`);
    console.log(`⚔️ Competitors: ${competitors.slice(0, 5).join(', ')}${competitors.length > 5 ? ` +${competitors.length - 5} more` : ''}`);
    console.log(`🔑 Keywords: ${keywords.slice(0, 5).join(', ')}${keywords.length > 5 ? ` +${keywords.length - 5} more` : ''}`);
    
    // IMPROVED: Relevance filtering function
    function isRelevantArticle(article: any, profile: any, sourceType: string) {
      const text = `${article.title || ''} ${article.description || ''} ${article.content || ''}`.toLowerCase();
      const titleText = (article.title || '').toLowerCase();
      
      // Crisis and opportunity keywords
      const crisisKeywords = ['scandal', 'lawsuit', 'investigation', 'recall', 'bankruptcy', 'fraud', 'violation', 'breach', 'leak', 'controversy', 'backlash', 'boycott', 'protest', 'fine', 'penalty', 'regulatory action', 'whistleblower', 'complaint'];
      const opportunityKeywords = ['partnership', 'acquisition', 'funding', 'investment', 'launch', 'announcement', 'award', 'recognition', 'expansion', 'milestone', 'breakthrough', 'innovation', 'first', 'leading', 'pioneer'];
      const dealKeywords = ['merger', 'ipo', 'joint venture', 'billion', 'million'];
      
      // Check org mentions
      const orgMentioned = orgNames.some(name => name && text.includes(name.toLowerCase()));
      const orgInTitle = orgNames.some(name => name && titleText.includes(name.toLowerCase()));
      
      // Check competitor mentions  
      const competitorMentioned = competitors.some(comp => comp && text.includes(comp.toLowerCase()));
      const competitorInTitle = competitors.some(comp => comp && titleText.includes(comp.toLowerCase()));
      
      // Check keyword mentions (IMPROVED)
      const keywordMentioned = keywords.some(kw => kw && text.includes(kw.toLowerCase()));
      const keywordInTitle = keywords.some(kw => kw && titleText.includes(kw.toLowerCase()));
      
      // Check stakeholder mentions
      const stakeholderMentioned = stakeholders.some(sh => sh && text.includes(sh.toLowerCase()));
      
      // PRIORITY 1: Organization crisis/opportunity in headline
      if (orgInTitle) {
        const hasCrisis = crisisKeywords.some(kw => titleText.includes(kw));
        const hasOpp = opportunityKeywords.some(kw => titleText.includes(kw));
        if (hasCrisis || hasOpp) {
          return { relevant: true, category: 'competitive', score: 100 };
        }
        return { relevant: true, category: 'competitive', score: 90 };
      }
      
      // PRIORITY 2: Competitor crisis/opportunity in headline
      if (competitorInTitle) {
        const hasCrisis = crisisKeywords.some(kw => titleText.includes(kw));
        const hasOpp = opportunityKeywords.some(kw => titleText.includes(kw));
        if (hasCrisis || hasOpp) {
          return { relevant: true, category: 'competitive', score: 85 };
        }
        return { relevant: true, category: 'competitive', score: 75 };
      }
      
      // PRIORITY 3: Keywords in title (IMPROVED)
      if (keywordInTitle) {
        return { relevant: true, category: 'market', score: 70 };
      }
      
      // PRIORITY 4: Stakeholder news with org/competitor mention
      if (stakeholderMentioned && (orgMentioned || competitorMentioned)) {
        return { relevant: true, category: 'regulatory', score: 65 };
      }
      
      // PRIORITY 5: Major deals/funding
      const hasDeal = dealKeywords.some(kw => text.includes(kw));
      if (hasDeal && (orgMentioned || competitorMentioned || keywordMentioned)) {
        return { relevant: true, category: 'market', score: 60 };
      }
      
      // PRIORITY 6: Industry keywords in content (IMPROVED)
      if (keywordMentioned && (orgMentioned || competitorMentioned)) {
        return { relevant: true, category: 'market', score: 55 };
      }
      
      // PRIORITY 7: Industry trends (more lenient for RSS)
      if (sourceType === 'rss_primary' || sourceType === 'rss') {
        // Check for industry-specific terms based on profile
        const industryTerms = profile?.industry?.toLowerCase().split(' ') || [];
        const hasIndustryTerm = industryTerms.some(term => term.length > 3 && text.includes(term));
        
        if (hasIndustryTerm && keywordMentioned) {
          return { relevant: true, category: 'media', score: 45 };
        }
        
        // If we have very few articles, be more lenient
        if (articlesMap.size < 20 && keywordMentioned) {
          return { relevant: true, category: 'media', score: 40 };
        }
      }
      
      return { relevant: false, category: null, score: 0 };
    }
    
    // Normalize title for duplicate detection
    function normalizeTitle(title: string) {
      return title?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    }
    
    // Track articles with Map to prevent duplicates
    const articlesMap = new Map();
    const titleMap = new Map();
    const entityCoverage = new Map(); // Track articles per entity for variety
    
    // ==================== PHASE 1: RSS FEEDS (PRIORITIZED) ====================
    console.log('\n📡 PHASE 1: CURATED RSS FEEDS');
    console.log('='.repeat(50));
    
    // Get ALL RSS sources from both profile AND master-source-registry
    let allRssSources = [];
    
    // 1. Get sources from profile's monitoring_config
    const profileSources = profile?.monitoring_config?.all_sources || [];
    const profileRssSources = profileSources.filter((s: any) => s.type === 'rss' || !s.type);
    console.log(`📚 Found ${profileRssSources.length} RSS sources in profile`);
    allRssSources.push(...profileRssSources);
    
    // 2. ALWAYS get sources from master-source-registry
    console.log('📚 Fetching industry sources from master registry...');
    const industrySources = await getIndustrySources(profile?.industry || 'general', authToken);
    
    // Combine all RSS sources from registry
    const registrySources = [
      ...(industrySources.competitive || []),
      ...(industrySources.market || []),
      ...(industrySources.regulatory || []),
      ...(industrySources.media || []),
      ...(industrySources.forward || []),
      ...(industrySources.specialized || [])
    ];
    console.log(`📚 Found ${registrySources.length} RSS sources from registry`);
    
    // Add registry sources that aren't already in profile sources
    const existingUrls = new Set(allRssSources.map(s => s.url));
    registrySources.forEach(source => {
      if (!existingUrls.has(source.url)) {
        allRssSources.push(source);
      }
    });
    
    console.log(`📚 Total unique RSS sources to process: ${allRssSources.length}`);
    
    // Process ALL RSS feeds with priority ordering
    if (allRssSources.length > 0) {
      console.log('\n📰 Processing ALL RSS feeds:');
      
      // Sort by priority but process ALL
      const criticalSources = allRssSources.filter((s: any) => s.priority === 'critical');
      const highSources = allRssSources.filter((s: any) => s.priority === 'high');
      const mediumSources = allRssSources.filter((s: any) => s.priority === 'medium' || !s.priority);
      const lowSources = allRssSources.filter((s: any) => s.priority === 'low');
      
      const sourcesToProcess = [...criticalSources, ...highSources, ...mediumSources, ...lowSources];
      
      console.log(`   Processing: ${criticalSources.length} critical, ${highSources.length} high, ${mediumSources.length} medium, ${lowSources.length} low priority sources`);
      
      // Process ALL sources IN PARALLEL for speed
      console.log(`   ⚡ Fetching from ${sourcesToProcess.length} sources in parallel...`);
      
      const fetchPromises = sourcesToProcess.map(source => 
        fetchFromRSS(source.url, source.name, authToken)
          .then(articles => ({ source, articles }))
          .catch(err => {
            console.log(`   ❌ Failed to fetch ${source.name}: ${err.message}`);
            return { source, articles: [] };
          })
      );
      
      const results = await Promise.all(fetchPromises);
      
      for (const { source, articles } of results) {
        console.log(`   📰 ${source.name}: ${articles.length} articles`);
        
        // Take ALL articles from each source (no limit)
        articles.forEach((article: any) => {
          // Skip duplicates
          if (article.url && articlesMap.has(article.url)) return;
          
          const normalizedTitle = normalizeTitle(article.title);
          if (titleMap.has(normalizedTitle)) return;
          
          // Clean HTML from description if it's from Google News
          if (article.source === 'Google News' || article.source_url?.includes('google.com')) {
            // Strip HTML tags from description
            article.description = (article.description || '').replace(/<[^>]*>/g, '').substring(0, 500);
          }
          
          // Calculate relevance for categorization but don't reject
          const relevanceCheck = isRelevantArticle(article, profile, 'rss_primary');
          
          // Track entity coverage
          competitors.forEach(comp => {
            const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
            if (comp && text.includes(comp.toLowerCase())) {
              entityCoverage.set(comp, (entityCoverage.get(comp) || 0) + 1);
            }
          });
          
          articlesMap.set(article.url, {
            ...article,
            source_tier: source.priority || 'medium',
            source_category: relevanceCheck.category || source.category || 'competitive',
            source_type: 'rss_primary',
            relevance_score: relevanceCheck.score
          });
          titleMap.set(normalizedTitle, article.url);
        });
      }
    } else {
      console.log('⚠️ No RSS sources available, will rely on API searches');
    }
    
    console.log(`\n✅ Phase 1 Complete: ${articlesMap.size} articles from RSS feeds`);
    
    // ==================== PHASE 2: GAP FILLING WITH TARGETED SEARCHES ====================
    console.log('\n🔍 PHASE 2: TARGETED GAP FILLING');
    console.log('='.repeat(50));
    
    // ONLY do API searches if we have very few RSS articles
    if (articlesMap.size < 30) {
      console.log(`⚠️ Only ${articlesMap.size} RSS articles found, using API for gap filling`);
      // Search for org specifically (LIMITED)
      if (orgName && articlesMap.size < 10) {
        console.log(`\n🔎 Searching for: "${orgName}" (limited to 10 articles)`);
        const orgArticles = await searchGoogleNews(orgName, authToken);
        orgArticles.slice(0, 10).forEach((article: any) => {
          if (article.url && !articlesMap.has(article.url)) {
            // Clean HTML from Google News descriptions
            article.description = (article.description || '').replace(/<[^>]*>/g, '').substring(0, 500);
            
            articlesMap.set(article.url, {
              ...article,
              source_category: 'competitive',
              source_type: 'api_search'
            });
          }
        });
      }
      
      // Search for completely uncovered competitors (VERY LIMITED)
      const uncoveredCompetitors = competitors.filter(comp => 
        !entityCoverage.has(comp) || entityCoverage.get(comp) === 0
      ).slice(0, 3);
      
      for (const competitor of uncoveredCompetitors) {
        console.log(`\n🔎 Gap-filling for competitor: "${competitor}" (limited to 3 articles)`);
        const compArticles = await searchGoogleNews(competitor, authToken);
        compArticles.slice(0, 3).forEach((article: any) => {
          if (article.url && !articlesMap.has(article.url)) {
            // Clean HTML from Google News descriptions
            article.description = (article.description || '').replace(/<[^>]*>/g, '').substring(0, 500);
            
            articlesMap.set(article.url, {
              ...article,
              source_category: 'competitive',
              source_type: 'api_search'
            });
            entityCoverage.set(competitor, (entityCoverage.get(competitor) || 0) + 1);
          }
        });
      }
      
      // Search for important keywords if still VERY low
      if (articlesMap.size < 15) {
        const importantKeywords = keywords.slice(0, 2);
        for (const keyword of importantKeywords) {
          console.log(`\n🔎 Keyword search: "${keyword}" (limited to 3 articles)`);
          const kwArticles = await searchNewsAPI(keyword, 3);
          kwArticles.forEach((article: any) => {
            if (article.url && !articlesMap.has(article.url)) {
              // Clean any potential HTML
              article.description = (article.description || '').replace(/<[^>]*>/g, '').substring(0, 500);
              
              articlesMap.set(article.url, {
                ...article,
                source_category: 'market',
                source_type: 'api_search'
              });
            }
          });
        }
      }
    }
    
    // ==================== PHASE 3: WEB SCRAPING ====================
    if (profile?.monitoring_config?.track_urls?.length > 0) {
      console.log('\n🌐 PHASE 3: DIRECT WEB SCRAPING');
      console.log('='.repeat(50));
      
      const urlsToScrape = profile.monitoring_config.track_urls.slice(0, 10);
      console.log(`📎 Scraping ${urlsToScrape.length} competitor/stakeholder sites...`);
      
      for (const url of urlsToScrape) {
        try {
          // Call mcp-scraper or web-scraper function
          const scraperResponse = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/mcp-scraper', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({ url })
          });
          
          if (scraperResponse.ok) {
            const scrapedData = await scraperResponse.json();
            if (scrapedData.content) {
              articlesMap.set(url, {
                title: scrapedData.title || `Content from ${new URL(url).hostname}`,
                url: url,
                description: scrapedData.description || scrapedData.content?.substring(0, 500),
                published_at: new Date().toISOString(),
                source: new URL(url).hostname,
                source_category: 'competitive',
                source_type: 'scraped',
                relevance_score: 80 // Scraped content is usually highly relevant
              });
            }
          }
        } catch (error) {
          console.log(`   ⚠️ Failed to scrape ${url}: ${error.message}`);
        }
      }
      
      console.log(`✅ Phase 3 Complete: Scraped ${urlsToScrape.length} sites`);
    }
    
    // Convert map to array for Claude assessment
    let allArticlesArray = Array.from(articlesMap.values());

    // Filter to only keep articles from last 48 hours
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const beforeFilter = allArticlesArray.length;
    allArticlesArray = allArticlesArray.filter(article => {
      const articleDate = new Date(article.published_at || article.publishedAt || 0);
      return articleDate > twoDaysAgo;
    });

    console.log(`🕐 Filtered articles by date: ${beforeFilter} → ${allArticlesArray.length} (kept last 48 hours only)`);

    // Use Claude to create coverage assessment
    console.log('\n🤖 PHASE 3: COVERAGE ASSESSMENT');
    console.log('='.repeat(50));
    console.log(`📊 Articles to assess: ${allArticlesArray.length}`);
    const assessmentResult = await assessArticlesWithClaude(allArticlesArray, profile, orgName);
    allArticlesArray = assessmentResult.articles;
    const coverageReport = assessmentResult.coverageReport;
    
    // Categorize articles based on discovery targets and Claude assessment
    const categorizedArticles = {
      competitors: [],
      stakeholders: [],
      market: [],
      trending: [],
      regulatory: [],
      opportunities: []
    };
    
    // Track which discovery targets are covered
    const discoveryTargets = {
      competitors: new Set(competitors),
      stakeholders: new Set(stakeholders),
      topics: new Set([...(profile?.trending?.hot_topics || []), ...(profile?.trending?.emerging_technologies || [])]),
      keywords: new Set(keywords)
    };
    
    // Categorize each article based on what it covers
    allArticlesArray.forEach(article => {
      const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
      
      // Check for competitor coverage
      const coveredCompetitors = competitors.filter(comp => 
        comp && text.includes(comp.toLowerCase())
      );
      
      // Check for stakeholder coverage
      const coveredStakeholders = stakeholders.filter(sh => 
        sh && text.includes(sh.toLowerCase())
      );
      
      // Check for trending topics
      const coveredTopics = [...(profile?.trending?.hot_topics || [])].filter(topic =>
        topic && text.includes(topic.toLowerCase())
      );
      
      // Enhanced categorization with discovery coverage
      article.discovery_coverage = {
        competitors: coveredCompetitors,
        stakeholders: coveredStakeholders,
        topics: coveredTopics,
        score: (coveredCompetitors.length * 3) + (coveredStakeholders.length * 2) + coveredTopics.length
      };
      
      // Place in appropriate category based on primary coverage
      if (coveredCompetitors.length > 0) {
        categorizedArticles.competitors.push(article);
      } else if (coveredStakeholders.length > 0) {
        categorizedArticles.stakeholders.push(article);
      } else if (text.includes('regulation') || text.includes('regulatory') || text.includes('compliance')) {
        categorizedArticles.regulatory.push(article);
      } else if (text.includes('market') || text.includes('industry') || text.includes('forecast')) {
        categorizedArticles.market.push(article);
      } else if (coveredTopics.length > 0) {
        categorizedArticles.trending.push(article);
      } else if (text.includes('opportunity') || text.includes('partnership') || text.includes('acquisition')) {
        categorizedArticles.opportunities.push(article);
      } else {
        categorizedArticles.market.push(article); // Default category
      }
    });
    
    // Sort each category by relevance and discovery coverage
    Object.keys(categorizedArticles).forEach(category => {
      categorizedArticles[category].sort((a, b) => {
        // First by discovery coverage score
        const coverageDiff = (b.discovery_coverage?.score || 0) - (a.discovery_coverage?.score || 0);
        if (coverageDiff !== 0) return coverageDiff;
        // Then by relevance score
        return (b.relevance_score || 0) - (a.relevance_score || 0);
      });
    });
    
    // Build final article list with balanced representation
    const allArticles = [];
    const targetPerCategory = Math.ceil(100 / 6); // ~17 articles per category
    
    // Add articles from each category
    Object.entries(categorizedArticles).forEach(([category, articles]) => {
      const articlesToAdd = articles.slice(0, targetPerCategory);
      articlesToAdd.forEach(article => {
        article.primary_category = category;
      });
      allArticles.push(...articlesToAdd);
    });
    
    // Fill remaining slots with highest scoring articles
    if (allArticles.length < 100) {
      const remaining = allArticlesArray
        .filter(a => !allArticles.includes(a))
        .sort((a, b) => {
          const coverageDiff = (b.discovery_coverage?.score || 0) - (a.discovery_coverage?.score || 0);
          if (coverageDiff !== 0) return coverageDiff;
          return (b.relevance_score || 0) - (a.relevance_score || 0);
        })
        .slice(0, 100 - allArticles.length);
      allArticles.push(...remaining);
    }
    
    // Filter to last 48 hours BEFORE limiting to 100
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentArticles = allArticles.filter(article => {
      const articleDate = new Date(article.published_at || article.publishedAt || 0);
      return articleDate > twoDaysAgo;
    });

    console.log(`🕒 Date filtering: ${allArticles.length} articles → ${recentArticles.length} articles (last 48 hours)`);

    // Limit to 100 articles AFTER date filtering
    const finalArticles = recentArticles.slice(0, 100);
    
    // Category breakdown
    const categoryBreakdown = finalArticles.reduce((acc, article) => {
      const cat = article.primary_category || article.source_category || 'unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Discovery coverage summary
    const discoveryCoverage = {
      competitors_covered: new Set(finalArticles.flatMap(a => a.discovery_coverage?.competitors || [])).size,
      stakeholders_covered: new Set(finalArticles.flatMap(a => a.discovery_coverage?.stakeholders || [])).size,
      topics_covered: new Set(finalArticles.flatMap(a => a.discovery_coverage?.topics || [])).size,
      total_competitors: competitors.length,
      total_stakeholders: stakeholders.length,
      total_topics: (profile?.trending?.hot_topics || []).length
    };
    
    console.log('\n📊 FINAL RESULTS:');
    console.log('='.repeat(50));
    console.log(`✅ Total articles collected: ${finalArticles.length}`);

    // Log article date distribution
    if (finalArticles.length > 0) {
      const sortedByDate = [...finalArticles].sort((a, b) =>
        new Date(b.published_at || b.publishedAt || 0).getTime() -
        new Date(a.published_at || a.publishedAt || 0).getTime()
      );

      const newest = sortedByDate[0];
      const oldest = sortedByDate[sortedByDate.length - 1];

      console.log('📅 ARTICLE TIMEFRAME IN MONITOR-STAGE-1:');
      console.log(`  - Newest article: ${newest.published_at || newest.publishedAt} - "${newest.title?.substring(0, 50)}..."`);
      console.log(`  - Oldest article: ${oldest.published_at || oldest.publishedAt} - "${oldest.title?.substring(0, 50)}..."`);

      // Check for date distribution
      const today = new Date();
      const oneHourAgo = new Date(today.getTime() - 60 * 60 * 1000);
      const sixHoursAgo = new Date(today.getTime() - 6 * 60 * 60 * 1000);
      const twelveHoursAgo = new Date(today.getTime() - 12 * 60 * 60 * 1000);
      const oneDayAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(today.getTime() - 48 * 60 * 60 * 1000);

      const last1h = finalArticles.filter(a => new Date(a.published_at || a.publishedAt || 0) > oneHourAgo).length;
      const last6h = finalArticles.filter(a => new Date(a.published_at || a.publishedAt || 0) > sixHoursAgo).length;
      const last12h = finalArticles.filter(a => new Date(a.published_at || a.publishedAt || 0) > twelveHoursAgo).length;
      const last24h = finalArticles.filter(a => new Date(a.published_at || a.publishedAt || 0) > oneDayAgo).length;
      const last48h = finalArticles.filter(a => new Date(a.published_at || a.publishedAt || 0) > twoDaysAgo).length;

      console.log('📊 ARTICLE AGE DISTRIBUTION IN STAGE-1 (48-HOUR WINDOW):');
      console.log(`  - Last 1 hour: ${last1h} articles`);
      console.log(`  - Last 6 hours: ${last6h} articles`);
      console.log(`  - Last 12 hours: ${last12h} articles`);
      console.log(`  - Last 24 hours: ${last24h} articles`);
      console.log(`  - Last 48 hours: ${last48h} articles`);
      console.log(`  - Older than 48 hours: ${finalArticles.length - last48h} articles (should be 0)`);
    }

    console.log(`🤖 Claude assessed: ${finalArticles.filter(a => a.claude_assessed).length}`);
    console.log(`📂 Category breakdown:`, categoryBreakdown);
    console.log(`🎯 Entity coverage:`, Object.fromEntries(entityCoverage));
    console.log(`📈 Discovery coverage:`, discoveryCoverage);
    console.log(`⚡ Priority distribution:`);
    console.log(`   - Critical: ${finalArticles.filter(a => a.priority === 'critical').length}`);
    console.log(`   - High: ${finalArticles.filter(a => a.priority === 'high').length}`);
    console.log(`   - Medium: ${finalArticles.filter(a => a.priority === 'medium').length}`);
    console.log(`   - Low: ${finalArticles.filter(a => a.priority === 'low').length}`);

    // ==================== PHASE 4: SOCIAL INTELLIGENCE ====================
    console.log('\n📱 PHASE 4: SOCIAL INTELLIGENCE');
    console.log('='.repeat(50));

    let socialSignals = [];
    let socialSentiment = null;

    try {
      console.log(`🔍 Collecting social signals for ${orgName}...`);

      const socialResponse = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/mcp-social-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          tool: 'monitor_all_platforms',
          arguments: {
            organization_id: orgName,
            time_range: '24h',
            platforms: ['twitter', 'reddit'],
            include_sentiment: true
          }
        })
      });

      if (socialResponse.ok) {
        const socialData = await socialResponse.json();
        socialSignals = socialData.results?.signals || [];
        socialSentiment = socialData.results?.sentiment_analysis || null;

        console.log(`✅ Collected ${socialSignals.length} social signals`);
        if (socialData.results?.platform_breakdown) {
          console.log(`📊 Platform breakdown:`, socialData.results.platform_breakdown);
        }
        if (socialSentiment) {
          console.log(`💭 Sentiment: ${socialSentiment.overall_sentiment} (${socialSentiment.positive_percentage}% positive, ${socialSentiment.negative_percentage}% negative)`);
        }
      } else {
        console.log(`⚠️ Social intelligence unavailable: ${socialResponse.status}`);
      }
    } catch (error) {
      console.log(`⚠️ Social intelligence error: ${error.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      stage: 1,
      articles: finalArticles,
      total_articles: finalArticles.length,
      social_signals: socialSignals,
      social_sentiment: socialSentiment,
      metadata: {
        organization: orgName,
        competitors_tracked: competitors.length,
        keywords_used: keywords.length,
        claude_assessed: finalArticles.filter(a => a.claude_assessed).length,
        category_breakdown: categoryBreakdown,
        entity_coverage: Object.fromEntries(entityCoverage),
        discovery_coverage: discoveryCoverage,
        discovery_targets: {
          competitors: Array.from(discoveryTargets.competitors),
          stakeholders: Array.from(discoveryTargets.stakeholders),
          topics: Array.from(discoveryTargets.topics)
        },
        sources_used: {
          rss: finalArticles.filter(a => a.source_type === 'rss_primary').length,
          api: finalArticles.filter(a => a.source_type === 'api_search').length,
          scraped: finalArticles.filter(a => a.source_type === 'scraped').length
        },
        social_signals_count: socialSignals.length,
        // Include coverage report for next stages
        coverage_report: coverageReport || {
          context: 'Coverage assessment not performed',
          gaps: {},
          found: {},
          message_for_synthesis: 'Analyze available content without noting gaps'
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Monitor Stage 1 Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stage: 1
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});