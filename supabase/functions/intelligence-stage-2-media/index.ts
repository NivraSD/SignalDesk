import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { analyzeWithClaudeMedia } from './claude-analyst.ts';

/**
 * Stage 2: Deep Media Landscape Analysis with Claude AI
 * Uses Claude Media Analyst for comprehensive PR intelligence
 */

// API Keys (set these as environment variables in Supabase)
const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY') || '';
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { organization, previousResults } = await req.json();
    console.log(`📰 Stage 2: Deep Media Analysis for ${organization.name}`);
    
    const startTime = Date.now();
    
    // Extract competitive context from Stage 1
    const competitiveContext = previousResults?.competitors || {};
    
    // Fetch monitoring data from database
    let monitoringData = {};
    try {
      const findingsResponse = await fetch(
        'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            action: 'retrieve',
            organization_name: organization.name,
            limit: 100
          })
        }
      );
      
      if (findingsResponse.ok) {
        const findingsData = await findingsResponse.json();
        if (findingsData.success && findingsData.data) {
          monitoringData = {
            findings: findingsData.data.findings || [],
            stage_data: findingsData.data.stage_data || [],
            raw_count: findingsData.data.findings?.length || 0,
            competitive_context: competitiveContext,
            previous_results: previousResults
          };
          console.log(`✅ Retrieved ${monitoringData.raw_count} monitoring findings for media analysis`);
        }
      }
    } catch (e) {
      console.log('Could not retrieve monitoring data:', e);
    }
    
    // Use Claude Media Analyst for comprehensive analysis
    const results = await analyzeWithClaudeMedia(
      organization,
      monitoringData,
      {
        // Basic structure as fallback if Claude fails
        media_landscape: { outlets: [], priority_targets: [] },
        journalists: [],
        coverage_analysis: {},
        sentiment_analysis: {},
        opportunities: [],
        risks: [],
        metadata: {
          stage: 2,
          duration: 0,
          data_source: 'claude_media_analyst',
          analysis_timestamp: new Date().toISOString()
        }
      }
    );

    results.metadata.duration = Date.now() - startTime;
    results.metadata.outlets_analyzed = results.media_landscape?.outlets?.length || 0;
    results.metadata.journalists_identified = results.journalists?.length || 0;
    
    console.log(`✅ Stage 2 complete in ${results.metadata.duration}ms`);
    console.log(`📊 Analyzed ${results.metadata.outlets_analyzed} outlets, ${results.metadata.journalists_identified} journalists`);

    // SAVE results to database for next stages
    try {
      await fetch(
        'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            action: 'save',
            organization_id: organization.name,
            organization_name: organization.name,
            stage: 'media_analysis',
            data_type: 'media_insights',
            content: results,
            metadata: {
              stage: 2,
              outlets_analyzed: results.metadata.outlets_analyzed,
              journalists_identified: results.metadata.journalists_identified,
              timestamp: new Date().toISOString()
            }
          })
        }
      );
      console.log('💾 Media analysis results saved to database');
    } catch (saveError) {
      console.error('Failed to save media results:', saveError);
    }

    return new Response(JSON.stringify({
      success: true,
      stage: 'media_analysis',
      data: results,
      intelligence: monitoringData // Pass through monitoring data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Stage 2 Error:', error);
    return new Response(JSON.stringify({
      success: false,
      stage: 'media_analysis',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Fetch real news articles from NewsAPI
 */
async function fetchNewsAPIArticles(query: string, sortBy: string = 'relevancy') {
  if (!NEWS_API_KEY) {
    console.warn('NewsAPI key not configured, using Google News RSS');
    return await fetchGoogleNewsArticles(query);
  }

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=${sortBy}&language=en&pageSize=20`;
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': NEWS_API_KEY
      }
    });

    if (!response.ok) {
      console.warn(`NewsAPI failed: ${response.status}, falling back to Google News`);
      return await fetchGoogleNewsArticles(query);
    }

    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error('NewsAPI error:', error);
    return await fetchGoogleNewsArticles(query);
  }
}

/**
 * Fetch articles from Google News RSS (no API key required)
 */
async function fetchGoogleNewsArticles(query: string) {
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const response = await fetch(rssUrl);
    
    if (!response.ok) {
      console.warn(`Google News RSS failed: ${response.status}`);
      return [];
    }

    const text = await response.text();
    
    // Parse RSS XML
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
    const articles = items.slice(0, 20).map(item => {
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || [])[1] || '';
      const link = (item.match(/<link>(.*?)<\/link>/) || [])[1] || '';
      const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
      const source = (item.match(/<source.*?>(.*?)<\/source>/) || [])[1] || '';
      
      return {
        title: title,
        url: link,
        publishedAt: pubDate,
        source: { name: source || 'Google News' },
        description: title,
        author: source
      };
    });

    return articles;
  } catch (error) {
    console.error('Google News RSS error:', error);
    return [];
  }
}

/**
 * Analyze real media landscape with actual data
 */
async function analyzeRealMediaLandscape(org: any) {
  console.log(`📡 Mapping real media landscape for ${org.name}...`);
  
  const outlets = {
    tier1: [] as any[],
    trade: [] as any[],
    regional: [] as any[],
    digital: [] as any[],
    broadcast: [] as any[]
  };

  // Search for actual news coverage about the organization
  const [orgArticles, industryArticles] = await Promise.all([
    fetchNewsAPIArticles(`"${org.name}"`),
    fetchNewsAPIArticles(org.industry || 'technology')
  ]);

  // Extract unique outlets from real articles
  const seenOutlets = new Set<string>();
  const allArticles = [...orgArticles, ...industryArticles];
  
  allArticles.forEach(article => {
    if (article.source?.name && !seenOutlets.has(article.source.name)) {
      seenOutlets.add(article.source.name);
      
      const outlet = {
        name: article.source.name,
        type: categorizeOutlet(article.source.name),
        focus: determineFocus(article),
        reach: determineReach(article.source.name),
        last_coverage: article.publishedAt,
        article_count: 1
      };

      // Categorize into tiers
      if (isTier1Outlet(article.source.name)) {
        outlets.tier1.push(outlet);
      } else if (isTradeOutlet(article.source.name, org.industry)) {
        outlets.trade.push(outlet);
      } else if (isDigitalOutlet(article.source.name)) {
        outlets.digital.push(outlet);
      } else if (isBroadcastOutlet(article.source.name)) {
        outlets.broadcast.push(outlet);
      } else {
        outlets.regional.push(outlet);
      }
    }
  });

  // Add known major outlets even if they haven't covered recently
  addKnownOutlets(outlets, org.industry);

  const allOutlets = [
    ...outlets.tier1,
    ...outlets.trade,
    ...outlets.regional,
    ...outlets.digital,
    ...outlets.broadcast
  ];

  return {
    outlets: allOutlets,
    by_tier: outlets,
    total_count: allOutlets.length,
    priority_targets: outlets.tier1.concat(outlets.trade.slice(0, 3)),
    coverage_frequency: calculateCoverageFrequency(allArticles, org.name)
  };
}

function categorizeOutlet(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('tv') || lowerName.includes('cnn') || lowerName.includes('fox') || lowerName.includes('msnbc')) {
    return 'broadcast';
  }
  if (lowerName.includes('journal') || lowerName.includes('times') || lowerName.includes('post')) {
    return 'newspaper';
  }
  if (lowerName.includes('tech') || lowerName.includes('venture') || lowerName.includes('digital')) {
    return 'digital';
  }
  return 'online';
}

function determineFocus(article: any): string {
  const title = (article.title || '').toLowerCase();
  if (title.includes('product') || title.includes('launch')) return 'products';
  if (title.includes('earning') || title.includes('revenue') || title.includes('profit')) return 'finance';
  if (title.includes('ceo') || title.includes('executive') || title.includes('leadership')) return 'leadership';
  if (title.includes('ai') || title.includes('tech')) return 'technology';
  return 'general';
}

function determineReach(name: string): string {
  const highReachOutlets = ['Wall Street Journal', 'New York Times', 'CNN', 'BBC', 'Reuters', 'Bloomberg', 'Financial Times', 'Forbes', 'TechCrunch'];
  const mediumReachOutlets = ['The Verge', 'Wired', 'VentureBeat', 'Business Insider', 'CNBC', 'The Information'];
  
  if (highReachOutlets.some(outlet => name.includes(outlet))) return 'high';
  if (mediumReachOutlets.some(outlet => name.includes(outlet))) return 'medium';
  return 'niche';
}

function isTier1Outlet(name: string): boolean {
  const tier1 = ['Wall Street Journal', 'New York Times', 'Financial Times', 'Washington Post', 'Bloomberg', 'Reuters'];
  return tier1.some(outlet => name.includes(outlet));
}

function isTradeOutlet(name: string, industry: string): boolean {
  const techTrade = ['TechCrunch', 'The Verge', 'Wired', 'Ars Technica', 'VentureBeat', 'The Information'];
  const financeTrade = ['American Banker', 'The Banker', 'Institutional Investor'];
  
  if (industry === 'technology' || industry === 'tech') {
    return techTrade.some(outlet => name.includes(outlet));
  }
  if (industry === 'finance' || industry === 'fintech') {
    return financeTrade.some(outlet => name.includes(outlet));
  }
  return false;
}

function isDigitalOutlet(name: string): boolean {
  const digital = ['Axios', 'Politico', 'Business Insider', 'BuzzFeed', 'Vox', 'Quartz'];
  return digital.some(outlet => name.includes(outlet));
}

function isBroadcastOutlet(name: string): boolean {
  const broadcast = ['CNN', 'Fox', 'MSNBC', 'NBC', 'ABC', 'CBS', 'BBC', 'CNBC', 'Bloomberg TV'];
  return broadcast.some(outlet => name.includes(outlet));
}

function addKnownOutlets(outlets: any, industry: string) {
  // Ensure key outlets are included
  const knownTier1 = [
    { name: 'Wall Street Journal', type: 'national', focus: 'business', reach: 'high' },
    { name: 'New York Times', type: 'national', focus: 'general', reach: 'high' }
  ];
  
  knownTier1.forEach(known => {
    if (!outlets.tier1.find((o: any) => o.name === known.name)) {
      outlets.tier1.push(known);
    }
  });

  if (industry === 'technology' || industry === 'tech') {
    const knownTech = [
      { name: 'TechCrunch', type: 'digital', focus: 'startups', reach: 'high' },
      { name: 'The Verge', type: 'digital', focus: 'consumer tech', reach: 'high' }
    ];
    knownTech.forEach(known => {
      if (!outlets.trade.find((o: any) => o.name === known.name)) {
        outlets.trade.push(known);
      }
    });
  }
}

function calculateCoverageFrequency(articles: any[], orgName: string): any {
  const orgArticles = articles.filter(a => 
    (a.title || '').toLowerCase().includes(orgName.toLowerCase()) ||
    (a.description || '').toLowerCase().includes(orgName.toLowerCase())
  );
  
  return {
    total_mentions: orgArticles.length,
    last_30_days: orgArticles.filter(a => {
      const pubDate = new Date(a.publishedAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return pubDate > thirtyDaysAgo;
    }).length,
    trending: orgArticles.length > 5 ? 'increasing' : 'stable'
  };
}

/**
 * Identify real journalists from actual articles
 */
async function identifyRealKeyJournalists(org: any, competitiveContext: any) {
  console.log(`👥 Identifying real journalists covering ${org.name}...`);
  
  const journalists = [];
  const seenJournalists = new Set<string>();
  
  // Fetch articles about the organization
  const articles = await fetchNewsAPIArticles(`"${org.name}" OR "${org.industry}"`);
  
  articles.forEach(article => {
    if (article.author && !seenJournalists.has(article.author)) {
      seenJournalists.add(article.author);
      
      // Extract journalist info from real articles
      journalists.push({
        name: article.author,
        outlet: article.source?.name || 'Unknown',
        beat: determineBeat(article),
        recent_articles: [{
          title: article.title,
          date: article.publishedAt,
          url: article.url
        }],
        sentiment: analyzeTone(article),
        engagement_level: 'medium',
        topics_of_interest: extractTopics(article),
        contact_priority: determineJournalistPriority(article, org)
      });
    }
  });

  // If we have competitors, check for journalists covering them
  if (competitiveContext.competitors?.direct) {
    for (const competitor of competitiveContext.competitors.direct.slice(0, 2)) {
      const compArticles = await fetchNewsAPIArticles(`"${competitor.name}"`);
      
      compArticles.forEach(article => {
        if (article.author && !seenJournalists.has(article.author)) {
          seenJournalists.add(article.author);
          
          journalists.push({
            name: article.author,
            outlet: article.source?.name || 'Unknown',
            beat: determineBeat(article),
            recent_articles: [{
              title: article.title,
              date: article.publishedAt,
              url: article.url
            }],
            sentiment: analyzeTone(article),
            engagement_level: 'medium',
            topics_of_interest: extractTopics(article),
            contact_priority: 'medium',
            competitor_coverage: [{
              competitor: competitor.name,
              coverage_type: analyzeTone(article),
              last_article: article.publishedAt
            }]
          });
        }
      });
    }
  }

  // Limit to top journalists
  return journalists.slice(0, 10);
}

function determineBeat(article: any): string {
  const title = (article.title || '').toLowerCase();
  const desc = (article.description || '').toLowerCase();
  const combined = title + ' ' + desc;
  
  if (combined.includes('tech') || combined.includes('software') || combined.includes('ai')) return 'Technology';
  if (combined.includes('earning') || combined.includes('revenue') || combined.includes('stock')) return 'Finance';
  if (combined.includes('ceo') || combined.includes('executive')) return 'Leadership';
  if (combined.includes('product') || combined.includes('launch')) return 'Products';
  if (combined.includes('policy') || combined.includes('regulat')) return 'Policy';
  return 'General Business';
}

function analyzeTone(article: any): string {
  const title = (article.title || '').toLowerCase();
  const desc = (article.description || '').toLowerCase();
  
  // Simple sentiment analysis based on keywords
  const positive = ['success', 'growth', 'innovation', 'leading', 'breakthrough', 'wins', 'surges'];
  const negative = ['fail', 'loss', 'problem', 'issue', 'concern', 'drops', 'falls', 'criticism'];
  
  let posCount = 0;
  let negCount = 0;
  
  positive.forEach(word => {
    if (title.includes(word) || desc.includes(word)) posCount++;
  });
  
  negative.forEach(word => {
    if (title.includes(word) || desc.includes(word)) negCount++;
  });
  
  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'critical';
  return 'neutral';
}

function extractTopics(article: any): string[] {
  const topics = [];
  const combined = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
  
  if (combined.includes('ai') || combined.includes('artificial intelligence')) topics.push('AI');
  if (combined.includes('cloud')) topics.push('Cloud Computing');
  if (combined.includes('security') || combined.includes('privacy')) topics.push('Security');
  if (combined.includes('earning') || combined.includes('revenue')) topics.push('Financial Performance');
  if (combined.includes('product')) topics.push('Product Development');
  if (combined.includes('compete') || combined.includes('rival')) topics.push('Competition');
  
  return topics.length > 0 ? topics : ['Industry News'];
}

function determineJournalistPriority(article: any, org: any): string {
  // High priority if they've written about the org directly
  if ((article.title || '').includes(org.name) || (article.description || '').includes(org.name)) {
    return 'high';
  }
  
  // Medium priority if they cover the industry
  if ((article.title || '').toLowerCase().includes(org.industry?.toLowerCase())) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Analyze real coverage patterns from actual articles
 */
async function analyzeRealCoveragePatterns(org: any, competitiveContext: any) {
  console.log(`📊 Analyzing real coverage patterns for ${org.name}...`);
  
  // Fetch articles about org and competitors
  const [orgArticles, industryArticles] = await Promise.all([
    fetchNewsAPIArticles(`"${org.name}"`),
    fetchNewsAPIArticles(org.industry || 'technology')
  ]);

  const coverage = {
    your_organization: {
      volume: orgArticles.length,
      sentiment: calculateOverallSentiment(orgArticles),
      topics: extractAllTopics(orgArticles),
      recent_mentions: orgArticles.slice(0, 5).map(formatMention),
      share_of_voice: 0,
      trending_topics: identifyTrendingTopics(orgArticles)
    },
    competitors: {} as any,
    gaps: [] as any[],
    opportunities: [] as any[]
  };

  // Analyze competitor coverage
  if (competitiveContext.competitors?.direct) {
    let totalCompetitorArticles = 0;
    
    for (const comp of competitiveContext.competitors.direct.slice(0, 3)) {
      const compArticles = await fetchNewsAPIArticles(`"${comp.name}"`);
      totalCompetitorArticles += compArticles.length;
      
      coverage.competitors[comp.name] = {
        volume: compArticles.length,
        sentiment: calculateOverallSentiment(compArticles),
        topics: extractAllTopics(compArticles),
        share_of_voice: 0
      };
    }
    
    // Calculate share of voice
    const totalArticles = orgArticles.length + totalCompetitorArticles;
    if (totalArticles > 0) {
      coverage.your_organization.share_of_voice = Math.round((orgArticles.length / totalArticles) * 100);
      
      Object.keys(coverage.competitors).forEach(compName => {
        coverage.competitors[compName].share_of_voice = 
          Math.round((coverage.competitors[compName].volume / totalArticles) * 100);
      });
    }
  }

  // Identify coverage gaps based on real data
  coverage.gaps = identifyRealCoverageGaps(coverage, org, industryArticles);
  
  // Identify opportunities based on real patterns
  coverage.opportunities = identifyRealCoverageOpportunities(coverage, org, industryArticles);

  return coverage;
}

function calculateOverallSentiment(articles: any[]): string {
  if (articles.length === 0) return 'neutral';
  
  let positive = 0;
  let negative = 0;
  let neutral = 0;
  
  articles.forEach(article => {
    const tone = analyzeTone(article);
    if (tone === 'positive') positive++;
    else if (tone === 'critical') negative++;
    else neutral++;
  });
  
  if (positive > negative && positive > neutral) return 'positive';
  if (negative > positive && negative > neutral) return 'negative';
  return 'neutral';
}

function extractAllTopics(articles: any[]): string[] {
  const topicCount = new Map<string, number>();
  
  articles.forEach(article => {
    const topics = extractTopics(article);
    topics.forEach(topic => {
      topicCount.set(topic, (topicCount.get(topic) || 0) + 1);
    });
  });
  
  // Sort by frequency and return top topics
  return Array.from(topicCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);
}

function formatMention(article: any): any {
  return {
    outlet: article.source?.name || 'Unknown',
    headline: article.title,
    date: article.publishedAt,
    sentiment: analyzeTone(article),
    reach: determineReach(article.source?.name || ''),
    url: article.url
  };
}

function identifyTrendingTopics(articles: any[]): string[] {
  // Get recent articles (last 7 days)
  const recentArticles = articles.filter(a => {
    const pubDate = new Date(a.publishedAt);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return pubDate > sevenDaysAgo;
  });
  
  return extractAllTopics(recentArticles);
}

function identifyRealCoverageGaps(coverage: any, org: any, industryArticles: any[]): any[] {
  const gaps = [];
  
  // Volume gap
  if (coverage.your_organization.volume < 5) {
    gaps.push({
      type: 'low_visibility',
      description: 'Limited media coverage compared to industry average',
      severity: 'high',
      action_required: 'Increase proactive media outreach'
    });
  }
  
  // Share of voice gap
  if (coverage.your_organization.share_of_voice < 25 && Object.keys(coverage.competitors).length > 0) {
    gaps.push({
      type: 'competitive_disadvantage',
      description: 'Competitors dominating media narrative',
      severity: 'high',
      action_required: 'Develop distinctive messaging and increase media engagement'
    });
  }
  
  // Topic gaps - what industry is talking about that org isn't
  const industryTopics = extractAllTopics(industryArticles);
  const orgTopics = coverage.your_organization.topics;
  
  industryTopics.forEach(topic => {
    if (!orgTopics.includes(topic)) {
      gaps.push({
        type: 'narrative_gap',
        description: `Not participating in ${topic} conversation`,
        severity: 'medium',
        action_required: `Develop perspective on ${topic}`
      });
    }
  });
  
  return gaps;
}

function identifyRealCoverageOpportunities(coverage: any, org: any, industryArticles: any[]): any[] {
  const opportunities = [];
  
  // Positive momentum opportunity
  if (coverage.your_organization.sentiment === 'positive') {
    opportunities.push({
      type: 'momentum_amplification',
      description: 'Leverage positive sentiment with follow-up stories',
      journalists_interested: 'Business and tech reporters',
      timing: 'immediate'
    });
  }
  
  // Low competition opportunity
  if (coverage.your_organization.share_of_voice > 40) {
    opportunities.push({
      type: 'thought_leadership',
      description: 'Dominate narrative with exclusive insights',
      journalists_interested: 'Industry analysts',
      timing: 'next_2_weeks'
    });
  }
  
  // Trending topic opportunity
  const trending = coverage.your_organization.trending_topics;
  if (trending && trending.length > 0) {
    opportunities.push({
      type: 'trend_leadership',
      description: `Lead conversation on ${trending[0]}`,
      journalists_interested: 'Beat reporters',
      timing: 'immediate'
    });
  }
  
  return opportunities;
}

/**
 * Analyze real sentiment from actual coverage
 */
async function analyzeRealSentiment(org: any) {
  console.log(`💭 Analyzing real media sentiment for ${org.name}...`);
  
  const articles = await fetchNewsAPIArticles(`"${org.name}"`);
  
  const sentimentByOutlet = new Map<string, string>();
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  
  articles.forEach(article => {
    const outlet = article.source?.name;
    const sentiment = analyzeTone(article);
    
    if (outlet) {
      sentimentByOutlet.set(outlet, sentiment);
    }
    
    if (sentiment === 'positive') sentimentCounts.positive++;
    else if (sentiment === 'critical') sentimentCounts.negative++;
    else sentimentCounts.neutral++;
  });
  
  // Determine overall sentiment
  let overall = 'neutral';
  if (sentimentCounts.positive > sentimentCounts.negative * 2) overall = 'positive';
  else if (sentimentCounts.negative > sentimentCounts.positive * 2) overall = 'negative';
  else if (sentimentCounts.positive > sentimentCounts.negative) overall = 'slightly positive';
  else if (sentimentCounts.negative > sentimentCounts.positive) overall = 'slightly negative';
  
  // Determine trend
  const recentArticles = articles.filter(a => {
    const pubDate = new Date(a.publishedAt);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return pubDate > sevenDaysAgo;
  });
  
  const recentSentiment = calculateOverallSentiment(recentArticles);
  const olderSentiment = calculateOverallSentiment(articles.filter(a => !recentArticles.includes(a)));
  
  let trend = 'stable';
  if (recentSentiment === 'positive' && olderSentiment !== 'positive') trend = 'improving';
  else if (recentSentiment === 'negative' && olderSentiment !== 'negative') trend = 'declining';
  
  return {
    overall,
    by_outlet: Object.fromEntries(sentimentByOutlet),
    breakdown: sentimentCounts,
    trend,
    drivers: identifySentimentDrivers(articles),
    sample_size: articles.length
  };
}

function identifySentimentDrivers(articles: any[]): string[] {
  const drivers = [];
  const topics = extractAllTopics(articles);
  
  // Identify what's driving sentiment based on topics
  if (topics.includes('Product Development')) drivers.push('Product announcements');
  if (topics.includes('Financial Performance')) drivers.push('Financial results');
  if (topics.includes('Leadership')) drivers.push('Executive actions');
  if (topics.includes('AI')) drivers.push('AI strategy');
  
  if (drivers.length === 0) drivers.push('General industry coverage');
  
  return drivers;
}

/**
 * Identify real media opportunities based on actual data
 */
async function identifyRealMediaOpportunities(org: any, competitiveContext: any) {
  console.log(`💡 Identifying real media opportunities for ${org.name}...`);
  
  const opportunities = [];
  
  // Analyze current media landscape
  const [orgArticles, industryArticles] = await Promise.all([
    fetchNewsAPIArticles(`"${org.name}"`),
    fetchNewsAPIArticles(org.industry || 'technology')
  ]);
  
  // Identify gaps in coverage
  const industryTopics = extractAllTopics(industryArticles);
  const orgTopics = extractAllTopics(orgArticles);
  
  // Find hot topics we're not covering
  industryTopics.forEach(topic => {
    if (!orgTopics.includes(topic)) {
      opportunities.push({
        type: 'narrative_vacuum',
        topic,
        description: `Industry discussing ${topic} but no ${org.name} perspective`,
        journalists_interested: identifyInterestedJournalists(industryArticles, topic),
        pr_angle: `Unique perspective on ${topic}`,
        urgency: 'high',
        effort: 'medium',
        potential_impact: 'high'
      });
    }
  });
  
  // Competitive response opportunities
  if (competitiveContext.competitors?.direct) {
    for (const competitor of competitiveContext.competitors.direct.slice(0, 2)) {
      const compArticles = await fetchNewsAPIArticles(`"${competitor.name}"`);
      
      if (compArticles.length > orgArticles.length) {
        opportunities.push({
          type: 'competitive_response',
          topic: `Counter ${competitor.name} narrative`,
          description: `${competitor.name} getting more coverage`,
          journalists_interested: extractJournalists(compArticles),
          pr_angle: 'Differentiation and unique value',
          urgency: 'immediate',
          effort: 'low',
          potential_impact: 'medium'
        });
      }
    }
  }
  
  // Trend-jacking opportunities
  const trendingIndustryTopics = identifyTrendingTopics(industryArticles);
  if (trendingIndustryTopics.length > 0) {
    opportunities.push({
      type: 'trend_jacking',
      topic: trendingIndustryTopics[0],
      description: `${trendingIndustryTopics[0]} is trending in media`,
      journalists_interested: 'Breaking news reporters',
      pr_angle: 'Expert commentary and insights',
      urgency: 'immediate',
      effort: 'low',
      potential_impact: 'high'
    });
  }
  
  return opportunities;
}

function identifyInterestedJournalists(articles: any[], topic: string): string[] {
  const journalists = new Set<string>();
  
  articles.forEach(article => {
    const topics = extractTopics(article);
    if (topics.includes(topic) && article.author) {
      journalists.add(`${article.author} (${article.source?.name})`);
    }
  });
  
  return Array.from(journalists).slice(0, 3);
}

function extractJournalists(articles: any[]): string[] {
  const journalists = new Set<string>();
  
  articles.forEach(article => {
    if (article.author) {
      journalists.add(`${article.author} (${article.source?.name})`);
    }
  });
  
  return Array.from(journalists).slice(0, 5);
}

/**
 * Identify real media risks based on actual coverage
 */
async function identifyRealMediaRisks(org: any, competitiveContext: any) {
  console.log(`⚠️ Identifying real media risks for ${org.name}...`);
  
  const risks = [];
  
  // Analyze recent coverage for risks
  const articles = await fetchNewsAPIArticles(`"${org.name}"`);
  
  // Check sentiment trend
  const sentiment = calculateOverallSentiment(articles);
  if (sentiment === 'negative' || sentiment === 'critical') {
    risks.push({
      type: 'negative_sentiment',
      description: 'Current media coverage is predominantly negative',
      likelihood: 'current',
      impact: 'high',
      mitigation: 'Immediate PR response and positive story placement'
    });
  }
  
  // Check competitive narrative dominance
  if (competitiveContext.competitors?.direct) {
    for (const competitor of competitiveContext.competitors.direct.slice(0, 2)) {
      const compArticles = await fetchNewsAPIArticles(`"${competitor.name}"`);
      
      if (compArticles.length > articles.length * 2) {
        risks.push({
          type: 'competitive_narrative',
          description: `${competitor.name} dominating media coverage`,
          likelihood: 'high',
          impact: 'medium',
          mitigation: 'Increase media engagement and unique story angles'
        });
      }
    }
  }
  
  // Check for crisis indicators
  const crisisKeywords = ['lawsuit', 'investigation', 'scandal', 'breach', 'layoff', 'controversy'];
  const hasCrisisIndicators = articles.some(article => {
    const combined = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
    return crisisKeywords.some(keyword => combined.includes(keyword));
  });
  
  if (hasCrisisIndicators) {
    risks.push({
      type: 'crisis_potential',
      description: 'Media coverage includes crisis-related keywords',
      likelihood: 'medium',
      impact: 'high',
      mitigation: 'Prepare crisis communication protocols and response team'
    });
  }
  
  // Low visibility risk
  if (articles.length < 3) {
    risks.push({
      type: 'low_visibility',
      description: 'Minimal media coverage makes narrative vulnerable',
      likelihood: 'high',
      impact: 'medium',
      mitigation: 'Proactive media outreach and story development'
    });
  }
  
  return risks;
}