// Monitor Stage 1: Smart Prioritized Intelligence Collection
// PRIORITIZES curated RSS feeds from source registry, uses APIs to fill gaps
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
// Environment variables
const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY') || '44466831285e41dfa4c1fb4bf6f1a92f';
// Use service role key for internal service-to-service calls
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
// ==================== RSS FETCHERS ====================
async function fetchFromRSS(feedUrl, sourceName = 'RSS Feed', authToken) {
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
    return articles.map((item)=>({
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
// ==================== GAP-FILLING API SEARCHES ====================
async function searchGoogleNews(query, authToken) {
  const encodedQuery = encodeURIComponent(query);
  const googleNewsUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
  const articles = await fetchFromRSS(googleNewsUrl, 'Google News Search', authToken);
  return articles.map((a)=>({
      ...a,
      api_source: 'google_news',
      search_query: query
    }));
}
async function searchNewsAPI(query, limit = 10) {
  if (!NEWS_API_KEY) return [];
  try {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7);
    const from = fromDate.toISOString().split('T')[0];
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${from}&sortBy=relevancy&pageSize=${limit}&language=en`;
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': NEWS_API_KEY
      }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.articles || []).slice(0, limit).map((article)=>({
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
async function searchHackerNews(query, limit = 5) {
  try {
    const response = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${limit}`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.hits || []).slice(0, limit).map((hit)=>({
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
async function getIndustrySources(industry, authToken) {
  try {
    const response = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/master-source-registry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}` // Always use service role key for internal calls
      },
      body: JSON.stringify({
        industry
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Registry error:', error);
    return null;
  }
}
// Use web scraper for direct competitor pages
async function scrapeCompetitorSite(url, authToken) {
  try {
    const response = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/web-scraper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}` // Always use service role key for internal calls
      },
      body: JSON.stringify({
        url
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  } catch (error) {
    return null;
  }
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { organization_name, profile } = await req.json();
    // Extract auth token from request to pass to other services
    const authHeader = req.headers.get('Authorization');
    const authToken = authHeader?.replace('Bearer ', '');
    console.log('🚀 MONITOR STAGE 1: Prioritized Intelligence Collection');
    console.log(`Organization: ${organization_name}`);
    console.log(`Industry: ${profile?.industry || 'unknown'}`);
    const articlesMap = new Map();
    const titleMap = new Map() // Track similar titles to avoid duplicates
    ;
    const entityCoverage = new Map() // Track how many articles per entity to ensure variety
    ;
    const topicCoverage = new Map() // Track topic coverage for balance
    ;
    const startTime = Date.now();
    // Helper to check if article is relevant enough - INTELLIGENT PR-FOCUSED
    // Different thresholds for different source types
    function isRelevantArticle(article, profile, sourceType = 'unknown') {
      const text = `${article.title || ''} ${article.description || ''} ${article.content || ''}`.toLowerCase();
      const titleText = (article.title || '').toLowerCase();
      // Core entities - these are most important
      // Handle both old format (organization.names) and new format (organization as string)
      const orgNames = profile?.organization?.names || (typeof profile?.organization === 'string' ? [
        profile.organization
      ] : []) || (profile?.organization_name ? [
        profile.organization_name
      ] : []);
      // Gather ALL competitors and market players
      const competitors = [
        ...profile?.competition?.direct_competitors || [],
        ...profile?.competition?.indirect_competitors || [],
        ...profile?.competition?.emerging_threats || []
      ].filter(Boolean);
      // Gather ALL stakeholders
      const stakeholders = [
        ...profile?.stakeholders?.regulators || [],
        ...profile?.stakeholders?.major_investors || [],
        ...profile?.stakeholders?.key_executives || [],
        ...profile?.stakeholders?.activists_critics || []
      ].filter(Boolean);
      // Debug logging for first article
      if (articlesMap.size === 0) {
        console.log('   🔍 Entity extraction:');
        console.log(`      Organization: ${orgNames.join(', ') || 'none'}`);
        console.log(`      All Competitors: ${competitors.length} total`);
        console.log(`      All Stakeholders: ${stakeholders.length} total`);
      }
      // PR Impact Keywords
      const crisisKeywords = [
        'scandal',
        'lawsuit',
        'sue',
        'investigation',
        'probe',
        'violation',
        'breach',
        'leak',
        'controversy',
        'backlash',
        'boycott',
        'protest',
        'fine',
        'penalty',
        'regulatory action',
        'whistleblower',
        'complaint'
      ];
      const opportunityKeywords = [
        'partnership',
        'acquisition',
        'funding',
        'investment',
        'launch',
        'announcement',
        'award',
        'recognition',
        'expansion',
        'milestone',
        'breakthrough',
        'innovation',
        'first',
        'leading',
        'pioneer'
      ];
      const dealKeywords = [
        'merger',
        'ipo',
        'joint venture',
        'billion',
        'million'
      ];
      // Check org mentions
      const orgMentioned = orgNames.some((name)=>name && text.includes(name.toLowerCase()));
      const orgInTitle = orgNames.some((name)=>name && titleText.includes(name.toLowerCase()));
      // Check competitor mentions  
      const competitorMentioned = competitors.some((comp)=>comp && text.includes(comp.toLowerCase()));
      const competitorInTitle = competitors.some((comp)=>comp && titleText.includes(comp.toLowerCase()));
      // Check stakeholder mentions (includes regulators, investors, executives, critics)
      const stakeholderMentioned = stakeholders.some((sh)=>sh && text.includes(sh.toLowerCase()));
      // PRIORITY 1: Organization crisis/opportunity in headline - ALWAYS RELEVANT
      if (orgInTitle) {
        const hasCrisis = crisisKeywords.some((kw)=>titleText.includes(kw));
        const hasOpp = opportunityKeywords.some((kw)=>titleText.includes(kw));
        if (hasCrisis || hasOpp) {
          if (articlesMap.size < 5) {
            console.log(`   🔥 ORG IN HEADLINE: "${article.title?.substring(0, 60)}..."`);
          }
          return true // Always take org headlines with crisis/opportunity
          ;
        }
        // Org in headline without crisis/opp - still high value
        return true;
      }
      // PRIORITY 2: Competitor crisis/opportunity in headline - HIGH VALUE
      if (competitorInTitle) {
        const hasCrisis = crisisKeywords.some((kw)=>titleText.includes(kw));
        const hasOpp = opportunityKeywords.some((kw)=>titleText.includes(kw));
        if (hasCrisis || hasOpp) {
          if (articlesMap.size < 10) {
            console.log(`   ⚔️ COMPETITOR NEWS: "${article.title?.substring(0, 60)}..."`);
          }
          return true;
        }
      }
      // PRIORITY 3: Stakeholder news with org/competitor mention
      if (stakeholderMentioned && (orgMentioned || competitorMentioned)) {
        return true;
      }
      // PRIORITY 4: Major deals/funding
      const hasDeal = dealKeywords.some((kw)=>text.includes(kw));
      if (hasDeal && (orgMentioned || competitorMentioned)) {
        return true;
      }
      // PRIORITY 5: For RSS feeds - more lenient but still intelligent
      if (sourceType === 'rss_primary' || sourceType === 'rss') {
        // If we have NO profile, take some RSS anyway
        if (!profile || orgNames.length === 0 && competitors.length === 0) {
          if (articlesMap.size < 30) {
            return true // Take first 30 RSS if no profile
            ;
          }
          return false;
        }
        // Check entity coverage to ensure variety
        const MAX_PER_ENTITY = 15 // Max articles per competitor/entity
        ;
        // Find which competitor is mentioned
        let mentionedEntity = null;
        for (const comp of competitors){
          if (comp && text.includes(comp.toLowerCase())) {
            mentionedEntity = comp;
            break;
          }
        }
        // If org is mentioned, track that
        if (orgMentioned) {
          mentionedEntity = orgNames[0] || 'organization';
        }
        if (mentionedEntity) {
          const currentCount = entityCoverage.get(mentionedEntity) || 0;
          if (currentCount < MAX_PER_ENTITY) {
            entityCoverage.set(mentionedEntity, currentCount + 1);
            return true;
          } else {
            // We have enough articles about this entity, skip unless it's REALLY important
            const hasCrisis = crisisKeywords.some((kw)=>text.includes(kw));
            const hasOpp = opportunityKeywords.some((kw)=>text.includes(kw));
            if (hasCrisis || hasOpp) {
              return true // Always take crisis/opportunity even if over limit
              ;
            }
            return false // Skip, we have enough about this entity
            ;
          }
        }
        // Industry trending topics and narratives
        const trendingTopics = [
          ...profile?.trending?.hot_topics || [],
          ...profile?.trending?.media_narratives || [],
          ...profile?.market?.market_events || [],
          ...profile?.forward_looking?.technology_disruptions || []
        ].filter(Boolean);
        const hasTrending = trendingTopics.some((topic)=>topic && text.includes(topic.toLowerCase()));
        if (hasTrending) {
          return true // Always take trending topics for RSS
          ;
        }
      }
      // PRIORITY 6: For API searches - very strict
      if (sourceType === 'api_gap_fill') {
        // Only take if org or competitor is explicitly mentioned
        return orgMentioned || competitorMentioned;
      }
      // Log rejections for debugging
      if (articlesMap.size < 20) {
        console.log(`   ❌ Filtered (no PR value): "${article.title?.substring(0, 50)}..."`);
      }
      return false;
    }
    // Helper to normalize title for duplicate detection
    function normalizeTitle(title) {
      // Less aggressive - only remove truly duplicate articles, not similar ones
      return title.toLowerCase().replace(/['"""'']/g, '') // Remove quotes only
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    // Don't substring - compare full title to avoid false matches
    }
    // ==================== PHASE 1: PRIMARY RSS SOURCES ====================
    console.log('\n📚 PHASE 1: PRIMARY SOURCE REGISTRY RSS FEEDS');
    console.log('='.repeat(50));
    const industrySources = await getIndustrySources(profile?.industry || 'technology', authToken);
    console.log(`Industry sources found:`, {
      competitive: industrySources?.competitive?.length || 0,
      regulatory: industrySources?.regulatory?.length || 0,
      market: industrySources?.market?.length || 0,
      media: industrySources?.media?.length || 0
    });
    if (industrySources) {
      // 1A. COMPETITIVE RSS FEEDS - Highest Priority
      if (industrySources.competitive?.length > 0) {
        console.log('\n🏆 Competitive Intelligence RSS (Priority 1):');
        const competitiveSources = industrySources.competitive.sort((a, b)=>{
          const priority = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1
          };
          return (priority[b.priority] || 0) - (priority[a.priority] || 0);
        }).slice(0, 15) // Take top 15 competitive sources
        ;
        for (const source of competitiveSources){
          console.log(`   📰 ${source.name} (${source.priority || 'medium'})`);
          const articles = await fetchFromRSS(source.url, source.name, authToken);
          articles.slice(0, 100).forEach((article)=>{
            // MUST filter RSS articles for relevance to our organization/competitors
            if (!isRelevantArticle(article, profile, 'rss_primary')) return;
            // Skip if duplicate URL
            if (article.url && articlesMap.has(article.url)) return;
            // Skip if similar title already exists (near-duplicate)
            const normalizedTitle = normalizeTitle(article.title);
            if (titleMap.has(normalizedTitle)) return;
            // Add the article - filtered for relevance
            articlesMap.set(article.url, {
              ...article,
              source_tier: source.priority || 'medium',
              source_category: 'competitive',
              source_type: 'rss_primary'
            });
            titleMap.set(normalizedTitle, article.url);
          });
        }
        console.log(`   ✓ Collected ${articlesMap.size} articles from competitive sources`);
      }
      // 1B. REGULATORY RSS FEEDS - High Priority
      if (industrySources.regulatory?.length > 0) {
        console.log('\n⚖️ Regulatory RSS (Priority 2):');
        const regSources = industrySources.regulatory.sort((a, b)=>{
          const priority = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1
          };
          return (priority[b.priority] || 0) - (priority[a.priority] || 0);
        }).slice(0, 20);
        for (const source of regSources){
          console.log(`   📰 ${source.name} (${source.priority || 'medium'})`);
          const articles = await fetchFromRSS(source.url, source.name, authToken);
          articles.slice(0, 80).forEach((article)=>{
            // MUST filter RSS articles for relevance
            if (!isRelevantArticle(article, profile, 'rss_primary')) return;
            if (article.url && articlesMap.has(article.url)) return;
            const normalizedTitle = normalizeTitle(article.title);
            if (titleMap.has(normalizedTitle)) return;
            articlesMap.set(article.url, {
              ...article,
              source_tier: source.priority || 'medium',
              source_category: 'regulatory',
              source_type: 'rss_primary'
            });
            titleMap.set(normalizedTitle, article.url);
          });
        }
      }
      // 1C. MARKET RSS FEEDS
      if (industrySources.market?.length > 0) {
        console.log('\n💹 Market Intelligence RSS (Priority 3):');
        const marketSources = industrySources.market.slice(0, 20);
        for (const source of marketSources){
          console.log(`   📰 ${source.name}`);
          const articles = await fetchFromRSS(source.url, source.name, authToken);
          articles.slice(0, 30).forEach((article)=>{
            // MUST filter RSS articles for relevance
            if (!isRelevantArticle(article, profile, 'rss_primary')) return;
            if (article.url && articlesMap.has(article.url)) return;
            const normalizedTitle = normalizeTitle(article.title);
            if (titleMap.has(normalizedTitle)) return;
            articlesMap.set(article.url, {
              ...article,
              source_tier: source.priority || 'medium',
              source_category: 'market',
              source_type: 'rss_primary'
            });
            titleMap.set(normalizedTitle, article.url);
          });
        }
      }
      // 1D. MEDIA/TRENDING RSS FEEDS
      if (industrySources.media?.length > 0) {
        console.log('\n📺 Media/Trending RSS (Priority 4):');
        const mediaSources = industrySources.media.slice(0, 15);
        for (const source of mediaSources){
          console.log(`   📰 ${source.name}`);
          const articles = await fetchFromRSS(source.url, source.name, authToken);
          articles.slice(0, 30).forEach((article)=>{
            // MUST filter RSS articles for relevance
            if (!isRelevantArticle(article, profile, 'rss_primary')) return;
            if (article.url && articlesMap.has(article.url)) return;
            const normalizedTitle = normalizeTitle(article.title);
            if (titleMap.has(normalizedTitle)) return;
            articlesMap.set(article.url, {
              ...article,
              source_tier: source.priority || 'medium',
              source_category: 'media',
              source_type: 'rss_primary'
            });
            titleMap.set(normalizedTitle, article.url);
          });
        }
      }
      console.log(`\n✅ Phase 1 Complete: ${articlesMap.size} articles from RSS feeds`);
      // Show entity coverage for variety check
      console.log('\n📊 Entity Coverage:');
      entityCoverage.forEach((count, entity)=>{
        console.log(`   ${entity}: ${count} articles`);
      });
    }
    // ==================== PHASE 2: GAP FILLING WITH TARGETED SEARCHES ====================
    // Only search for entities NOT well covered by RSS feeds
    console.log('\n🔍 PHASE 2: TARGETED GAP FILLING');
    console.log('='.repeat(50));
    // Analyze what we have vs what we need
    const coveredCompetitors = new Set();
    const coveredRegulators = new Set();
    // Check which entities are already covered in RSS articles
    articlesMap.forEach((article)=>{
      const text = `${article.title || ''} ${article.description || ''} ${article.content || ''}`.toLowerCase();
      profile?.competition?.direct_competitors?.forEach((comp)=>{
        if (comp && text.includes(comp.toLowerCase())) {
          coveredCompetitors.add(comp);
          console.log(`   ✓ Found ${comp} in RSS`);
        }
      });
      profile?.stakeholders?.regulators?.forEach((reg)=>{
        if (reg && text.includes(reg.toLowerCase())) {
          coveredRegulators.add(reg);
          console.log(`   ✓ Found ${reg} in RSS`);
        }
      });
    });
    console.log(`\nCoverage analysis:`);
    console.log(`   Competitors covered: ${coveredCompetitors.size}/${profile?.competition?.direct_competitors?.length || 0}`);
    console.log(`   Regulators covered: ${coveredRegulators.size}/${profile?.stakeholders?.regulators?.length || 0}`);
    // 2A. Search for UNCOVERED competitors only
    const uncoveredCompetitors = (profile?.competition?.direct_competitors || []).filter((comp)=>!coveredCompetitors.has(comp)).slice(0, 10) // Limit to 10 searches
    ;
    if (uncoveredCompetitors.length > 0) {
      console.log('\n🎯 Searching for uncovered competitors:');
      for (const competitor of uncoveredCompetitors){
        console.log(`   🔍 ${competitor} (not in RSS)`);
        // Quick targeted search
        const results = await Promise.all([
          searchGoogleNews(competitor),
          searchNewsAPI(competitor, 5),
          searchHackerNews(competitor, 3)
        ]);
        results.flat().forEach((article)=>{
          // Filter API results for relevance too
          if (!isRelevantArticle(article, profile, 'api_gap_fill')) return;
          if (article.url && !articlesMap.has(article.url)) {
            articlesMap.set(article.url, {
              ...article,
              entity_type: 'competitor',
              entity_name: competitor,
              source_category: 'competitive',
              source_type: 'api_gap_fill'
            });
          }
        });
      }
    }
    // 2B. Search for UNCOVERED regulators only
    const uncoveredRegulators = (profile?.stakeholders?.regulators || []).filter((reg)=>!coveredRegulators.has(reg)).slice(0, 5);
    if (uncoveredRegulators.length > 0) {
      console.log('\n⚖️ Searching for uncovered regulators:');
      for (const regulator of uncoveredRegulators){
        const searchQuery = `${regulator} ${profile.industry || 'technology'}`;
        console.log(`   🔍 ${searchQuery} (not in RSS)`);
        const results = await searchGoogleNews(searchQuery, authToken);
        results.forEach((article)=>{
          // Filter API results for relevance too
          if (!isRelevantArticle(article, profile, 'api_gap_fill')) return;
          if (article.url && !articlesMap.has(article.url)) {
            articlesMap.set(article.url, {
              ...article,
              entity_type: 'regulator',
              entity_name: regulator,
              source_category: 'regulatory',
              source_type: 'api_gap_fill'
            });
          }
        });
      }
    }
    // 2C. Hot topics if we need more trending content
    const trendingCount = Array.from(articlesMap.values()).filter((a)=>a.source_category === 'media' || a.source_category === 'trending').length;
    if (trendingCount < 30 && profile?.trending?.hot_topics?.length > 0) {
      console.log('\n🔥 Adding hot topics (low trending coverage):');
      const topics = profile.trending.hot_topics.slice(0, 5);
      for (const topic of topics){
        console.log(`   🔍 "${topic}"`);
        const results = await searchHackerNews(topic, 5);
        results.forEach((article)=>{
          // Filter API results for relevance too
          if (!isRelevantArticle(article, profile, 'api_gap_fill')) return;
          if (article.url && !articlesMap.has(article.url)) {
            articlesMap.set(article.url, {
              ...article,
              entity_type: 'topic',
              entity_name: topic,
              source_category: 'media',
              source_type: 'api_gap_fill'
            });
          }
        });
      }
    }
    console.log(`\n✅ Phase 2 Complete: Total ${articlesMap.size} articles`);
    // ==================== PHASE 3: WEB SCRAPING (if enabled) ====================
    // This is where Firecrawl would go - for now using our web-scraper
    if (profile?.monitoring_config?.track_urls?.length > 0) {
      console.log('\n🌐 PHASE 3: DIRECT WEB SCRAPING');
      console.log('='.repeat(50));
      const urlsToScrape = profile.monitoring_config.track_urls.slice(0, 3);
      console.log(`Scraping ${urlsToScrape.length} competitor sites...`);
      for (const url of urlsToScrape){
        const scraped = await scrapeCompetitorSite(url, authToken);
        if (scraped) {
          articlesMap.set(url, {
            title: scraped.title,
            url: url,
            description: scraped.description || scraped.content?.substring(0, 500),
            published_at: scraped.publishedDate || new Date().toISOString(),
            source: 'Direct Scrape',
            source_category: 'competitive',
            source_type: 'web_scrape',
            content: scraped.content
          });
        }
      }
    }
    // ==================== FINAL PREPARATION ====================
    let finalArticles = Array.from(articlesMap.values());
    console.log(`\n📊 Total articles collected: ${finalArticles.length}`);
    // Debug: Check what source_types we actually have
    const sourceTypes = [
      ...new Set(finalArticles.map((a)=>a.source_type))
    ];
    console.log(`   Source types present: ${sourceTypes.join(', ')}`);
    // Debug: Sample a few articles
    if (finalArticles.length > 0) {
      console.log(`   Sample article:`, {
        title: finalArticles[0].title?.substring(0, 50),
        source_type: finalArticles[0].source_type,
        source_category: finalArticles[0].source_category
      });
    }
    // Separate RSS and API articles for different handling
    const rssArticles = finalArticles.filter((a)=>a.source_type === 'rss_primary');
    const apiArticles = finalArticles.filter((a)=>a.source_type === 'api_gap_fill');
    const webScrapeArticles = finalArticles.filter((a)=>a.source_type === 'web_scrape');
    console.log(`\n📊 Article breakdown:`);
    console.log(`   RSS (trusted): ${rssArticles.length}`);
    console.log(`   API gap-fill: ${apiArticles.length}`);
    console.log(`   Web scrape: ${webScrapeArticles.length}`);
    // Apply relevance filtering ONLY to API articles, with minimum guarantee
    const MIN_API_ARTICLES = 10;
    let filteredApiArticles = apiArticles;
    if (apiArticles.length > 0) {
      // First try to filter for relevance
      const relevantApiArticles = apiArticles.filter((article)=>isRelevantArticle(article, profile, article.source_type || 'unknown'));
      console.log(`   API articles after relevance filter: ${relevantApiArticles.length}`);
      // Ensure minimum API articles get through
      if (relevantApiArticles.length < MIN_API_ARTICLES && apiArticles.length >= MIN_API_ARTICLES) {
        console.log(`   ⚠️ Taking top ${MIN_API_ARTICLES} API articles to meet minimum`);
        filteredApiArticles = apiArticles.slice(0, MIN_API_ARTICLES);
      } else {
        filteredApiArticles = relevantApiArticles;
      }
    }
    // Combine filtered articles - RSS is already filtered by isRelevantArticle
    finalArticles = [
      ...rssArticles,
      ...filteredApiArticles,
      ...webScrapeArticles
    ];
    console.log(`\n✅ Total articles after filtering: ${finalArticles.length}`);
    console.log(`   RSS passed through: ${rssArticles.length} (100%)`);
    console.log(`   API passed through: ${filteredApiArticles.length}/${apiArticles.length}`);
    console.log(`   Web scrapes passed through: ${webScrapeArticles.length}`);
    // Sort by priority: RSS primary > web scrape > API gap fill
    finalArticles.sort((a, b)=>{
      const typeOrder = {
        'rss_primary': 3,
        'web_scrape': 2,
        'api_gap_fill': 1
      };
      const typeDiff = (typeOrder[b.source_type] || 0) - (typeOrder[a.source_type] || 0);
      if (typeDiff !== 0) return typeDiff;
      // Then by tier
      const tierOrder = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
      };
      const tierDiff = (tierOrder[b.source_tier] || 1) - (tierOrder[a.source_tier] || 1);
      if (tierDiff !== 0) return tierDiff;
      // Then by date
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });
    const MAX_OUTPUT = 100 // Reduced to prevent overwhelming Stage 2
    ;
    const outputArticles = finalArticles.slice(0, MAX_OUTPUT);
    // Statistics
    const duration = Date.now() - startTime;
    const sourceBreakdown = {};
    const categoryBreakdown = {};
    outputArticles.forEach((a)=>{
      sourceBreakdown[a.source_type] = (sourceBreakdown[a.source_type] || 0) + 1;
      categoryBreakdown[a.source_category] = (categoryBreakdown[a.source_category] || 0) + 1;
    });
    console.log('\n📊 FINAL STATISTICS:');
    console.log(`Total collected: ${articlesMap.size}`);
    console.log(`Output: ${outputArticles.length}`);
    console.log('Source breakdown:', sourceBreakdown);
    console.log('Category breakdown:', categoryBreakdown);
    console.log(`Duration: ${duration}ms`);
    return new Response(JSON.stringify({
      success: true,
      stage: 1,
      organization: organization_name,
      articles: outputArticles,
      metadata: {
        total_collected: articlesMap.size,
        output_count: outputArticles.length,
        source_breakdown: sourceBreakdown,
        category_breakdown: categoryBreakdown,
        covered_competitors: Array.from(coveredCompetitors),
        uncovered_competitors: uncoveredCompetitors,
        duration_ms: duration
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Stage 1 error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
