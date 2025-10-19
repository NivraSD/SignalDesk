const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const FIRECRAWL_KEY = 'fc-3048810124b640eb99293880a4ab25d0';

async function testFirecrawl48Hours() {
  console.log('🔍 Testing Firecrawl API with 48-hour time window...\n');

  const supabase = createClient(
    'https://zskaxjtyuaqazydouifp.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
  );

  // Get OpenAI profile
  const { data: profile } = await supabase
    .from('mcp_discovery')
    .select('*')
    .eq('organization_id', 'OpenAI')
    .single();

  if (!profile) {
    console.log('❌ No OpenAI profile found');
    return;
  }

  // Calculate date range
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
  const dateFilter = `after:${twoDaysAgo.toISOString().split('T')[0]}`;

  console.log(`📅 Time filter: Last 48 hours (after ${twoDaysAgo.toLocaleDateString()})`);
  console.log('================================================\n');

  // Build time-filtered queries
  const intelligenceQueries = [
    `Anthropic Claude latest news ${dateFilter}`,
    `Google DeepMind Gemini announcement ${dateFilter}`,
    `Meta Llama AI news today ${dateFilter}`,
    `Microsoft Copilot enterprise ${dateFilter}`,
    `AI regulation news today ${dateFilter}`,
    `Mistral xAI funding news ${dateFilter}`,
    `OpenAI competitors latest ${dateFilter}`,
    `AI market news today breaking ${dateFilter}`
  ];

  // Alternative: Add time-specific keywords to force recent results
  const timeFilteredQueries = [
    'Anthropic Claude latest news today breaking',
    'Google DeepMind Gemini announcement this week',
    'Meta AI Llama news latest 24 hours',
    'Microsoft Copilot news today enterprise',
    'AI regulation breaking news latest',
    'AI startup funding news today latest',
    'OpenAI competitors news breaking today',
    'AI industry news latest 48 hours'
  ];

  const allResults = [];

  console.log('🔍 Searching for recent competitive intelligence (48 hours)...\n');

  for (const query of timeFilteredQueries) {
    console.log(`Searching: "${query.substring(0, 50)}..."`);

    try {
      // Firecrawl v0 with search options
      const response = await fetch('https://api.firecrawl.dev/v0/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          pageOptions: {
            fetchPageContent: true
          },
          searchOptions: {
            limit: 10,
            // Try to add time filtering if supported
            tbs: 'qdr:d2', // Google's time filter for last 2 days
            dateRestrict: 'd2' // Alternative date restriction
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.data || [];

        // Filter results by date if we can
        const recentResults = results.filter(r => {
          // Check if there's a date field
          if (r.publishedDate || r.date || r.published_at) {
            const articleDate = new Date(r.publishedDate || r.date || r.published_at);
            return articleDate >= twoDaysAgo;
          }
          // If no date, include it but mark as uncertain
          return true;
        });

        console.log(`  ✅ Found ${results.length} results (${recentResults.length} confirmed recent)`);

        recentResults.forEach(r => {
          // Extract date from content if not in metadata
          let publishedDate = r.publishedDate || r.date || r.published_at;

          if (!publishedDate && r.markdown) {
            // Try to extract date from content
            const datePatterns = [
              /(\d{1,2})\s+(hours?|hrs?)\s+ago/i,
              /today/i,
              /yesterday/i,
              /(\d{4}-\d{2}-\d{2})/,
              /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i
            ];

            for (const pattern of datePatterns) {
              const match = r.markdown.match(pattern);
              if (match) {
                if (match[0].includes('hour')) {
                  const hoursAgo = parseInt(match[1]);
                  publishedDate = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000)).toISOString();
                } else if (match[0].toLowerCase() === 'today') {
                  publishedDate = now.toISOString();
                } else if (match[0].toLowerCase() === 'yesterday') {
                  publishedDate = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString();
                }
                break;
              }
            }
          }

          allResults.push({
            title: r.title || extractTitle(r.markdown) || '',
            description: r.description || r.snippet || extractDescription(r.markdown) || '',
            url: r.url || '',
            content: r.markdown || r.content || '',
            publishedAt: publishedDate || now.toISOString(),
            isRecent: !!publishedDate && new Date(publishedDate) >= twoDaysAgo,
            source_query: query
          });
        });
      }
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
    }
  }

  // Filter to only keep recent articles
  const recentArticles = allResults.filter(a => a.isRecent !== false);

  console.log(`\n📊 Results Summary:`);
  console.log(`  - Total articles found: ${allResults.length}`);
  console.log(`  - Recent articles (< 48 hours): ${recentArticles.length}`);
  console.log(`  - Older/undated articles filtered out: ${allResults.length - recentArticles.length}`);

  // Apply relevance scoring
  const scoredResults = recentArticles.map(article => {
    const text = `${article.title} ${article.description} ${article.content}`.toLowerCase();
    let score = 0;
    const factors = [];

    // Competitor mentions (high value)
    const competitors = profile.competition.direct_competitors || [];
    const competitorMentions = competitors.filter(c => text.includes(c.toLowerCase()));

    if (competitorMentions.length > 0) {
      score += 40 * Math.min(competitorMentions.length, 3);
      factors.push(`COMPETITORS:${competitorMentions.slice(0, 3).join(',')}`);
    }

    // Time bonus for very recent
    const articleAge = (now - new Date(article.publishedAt)) / (1000 * 60 * 60); // hours
    if (articleAge < 6) {
      score += 25;
      factors.push('BREAKING_6H');
    } else if (articleAge < 24) {
      score += 15;
      factors.push('RECENT_24H');
    } else if (articleAge < 48) {
      score += 10;
      factors.push('RECENT_48H');
    }

    // Intelligence topics
    const intelligenceTopics = [
      'launch', 'announce', 'release', 'funding', 'partnership',
      'acquisition', 'lawsuit', 'regulation', 'breakthrough', 'benchmark'
    ];
    const topicMatches = intelligenceTopics.filter(t => text.includes(t));

    score += topicMatches.length * 12;
    if (topicMatches.length > 0) {
      factors.push(`ACTION_SIGNALS:${topicMatches.length}`);
    }

    // Penalty for OpenAI-only content
    if ((text.includes('openai') || text.includes('chatgpt')) && competitorMentions.length === 0) {
      score = Math.floor(score * 0.3);
      factors.push('SELF_FOCUS_PENALTY');
    }

    return {
      ...article,
      relevance_score: Math.min(score, 100),
      relevance_factors: factors,
      hours_old: Math.round(articleAge)
    };
  });

  // Filter and sort
  const relevantResults = scoredResults
    .filter(a => a.relevance_score >= 30)
    .sort((a, b) => {
      // Sort by score, but prioritize very recent articles
      if (a.hours_old < 6 && b.hours_old >= 6) return -1;
      if (b.hours_old < 6 && a.hours_old >= 6) return 1;
      return b.relevance_score - a.relevance_score;
    });

  console.log(`\n✅ High-relevance recent articles: ${relevantResults.length}`);

  // Display results
  console.log('\n🏆 Top Recent Competitive Intelligence (Last 48 Hours):');
  relevantResults.slice(0, 10).forEach((article, i) => {
    console.log(`\n${i + 1}. [Score: ${article.relevance_score}] [${article.hours_old}h old]`);
    console.log(`   ${article.title?.substring(0, 80)}`);
    console.log(`   Factors: ${article.relevance_factors.join(', ')}`);
  });

  // Save to database
  console.log('\n💾 Saving recent intelligence to database...');

  const searchRecord = {
    query: `OpenAI Recent Intelligence (48h) - ${new Date().toISOString()}`,
    results: {
      articles: relevantResults,
      summary: `Real-time competitive intelligence for OpenAI: ${relevantResults.length} high-priority items from the last 48 hours. Breaking news: ${relevantResults.filter(a => a.hours_old < 6).length} items < 6 hours old. Key competitors: ${[...new Set(relevantResults.flatMap(r => r.relevance_factors.join(' ').match(/COMPETITORS:([^,\s]+)/g) || []).map(m => m.split(':')[1]))].join(', ')}`,
      totalResults: relevantResults.length,
      timestamp: new Date().toISOString(),
      metadata: {
        organization: 'OpenAI',
        perspective: 'real_time_intelligence',
        time_window: '48_hours',
        search_method: 'firecrawl_time_filtered',
        raw_count: allResults.length,
        recent_count: recentArticles.length,
        filtered_count: relevantResults.length,
        breaking_news: relevantResults.filter(a => a.hours_old < 6).length
      }
    },
    created_at: new Date().toISOString()
  };

  try {
    const { data: saved } = await supabase
      .from('fireplexity_searches')
      .insert([searchRecord])
      .select()
      .single();

    if (saved) {
      console.log(`✅ Saved with ID: ${saved.id}`);
      console.log(`   NIV now has access to fresh, time-filtered intelligence`);
    }
  } catch (e) {
    console.log('Save error:', e.message);
  }

  console.log('\n📊 Final Summary:');
  console.log(`  - Time window: Last 48 hours`);
  console.log(`  - Total results: ${allResults.length}`);
  console.log(`  - Recent articles: ${recentArticles.length}`);
  console.log(`  - High-relevance: ${relevantResults.length}`);
  console.log(`  - Breaking (<6h): ${relevantResults.filter(a => a.hours_old < 6).length}`);
  console.log(`  - Quality ratio: ${Math.round((relevantResults.length / recentArticles.length) * 100)}%`);
}

// Helper functions
function extractTitle(markdown) {
  if (!markdown) return '';
  const lines = markdown.split('\n');
  for (const line of lines) {
    if (line.startsWith('#') || line.length > 10 && line.length < 150) {
      return line.replace(/^#+\s*/, '').substring(0, 100);
    }
  }
  return '';
}

function extractDescription(markdown) {
  if (!markdown) return '';
  const lines = markdown.split('\n').filter(l => l.trim().length > 20);
  return lines[0]?.substring(0, 200) || '';
}

// Run the test
testFirecrawl48Hours();