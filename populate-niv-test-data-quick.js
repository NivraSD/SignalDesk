const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const FIRECRAWL_KEY = 'fc-3048810124b640eb99293880a4ab25d0';
const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function populateNIVTestDataQuick() {
  console.log('🚀 Quick NIV Test Data Population (Focused Searches)');
  console.log('================================================\n');

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

  console.log('✅ OpenAI profile loaded\n');

  // Focused search queries - only the most important ones
  const focusedQueries = [
    // Top competitive intelligence
    'Anthropic Claude 3.5 vs ChatGPT latest news today',
    'Google DeepMind Gemini Microsoft AI competition latest',

    // Critical market/regulatory
    'AI regulation FTC EU safety latest news breaking',

    // Technology developments
    'AI breakthroughs multimodal agents latest today',

    // General competitive landscape
    'OpenAI competitors AI market latest developments'
  ];

  const allResults = [];

  console.log('🔍 Performing focused searches...\n');

  for (const query of focusedQueries) {
    console.log(`Searching: "${query.substring(0, 50)}..."`);

    try {
      const response = await fetch('https://api.firecrawl.dev/v0/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `${query} 2024 2025`,
          pageOptions: {
            fetchPageContent: true
          },
          searchOptions: {
            limit: 15 // More per search since fewer searches
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.data || [];

        console.log(`  ✅ Found ${results.length} results`);

        results.forEach(r => {
          // Clean and structure the article
          const title = cleanTitle(r.title || r.markdown);
          const description = cleanDescription(r.description || r.snippet || r.markdown);

          if (title && title.length > 10 && title !== 'Article') {
            allResults.push({
              title,
              description,
              url: r.url || '',
              content: (r.markdown || r.content || '').substring(0, 5000), // Limit content size
              publishedAt: new Date().toISOString(), // Assume recent
              source_query: query
            });
          }
        });

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
    }
  }

  console.log(`\n📊 Total articles collected: ${allResults.length}`);

  // Apply relevance scoring
  console.log('\n🎯 Applying relevance scoring...');

  const scoredResults = allResults.map(article => {
    const text = `${article.title} ${article.description}`.toLowerCase();
    let score = 0;
    const factors = [];

    // Check for competitors
    const competitors = profile.competition.direct_competitors || [];
    const competitorMentions = competitors.filter(c =>
      c && text.includes(c.toLowerCase())
    );

    if (competitorMentions.length > 0) {
      score += 40 * Math.min(competitorMentions.length, 3);
      factors.push(`COMPETITORS:${competitorMentions.slice(0, 3).join(',')}`);
    }

    // Check for keywords
    const keywords = profile.keywords || [];
    const keywordMatches = keywords.filter(k =>
      k && text.includes(k.toLowerCase())
    );

    score += Math.min(keywordMatches.length * 10, 40);
    if (keywordMatches.length > 0) {
      factors.push(`KEYWORDS:${keywordMatches.length}`);
    }

    // Action signals
    const actionSignals = ['launch', 'announce', 'funding', 'partnership', 'regulation'];
    const actionMatches = actionSignals.filter(s => text.includes(s));

    score += actionMatches.length * 15;
    if (actionMatches.length > 0) {
      factors.push(`ACTIONS:${actionMatches.length}`);
    }

    // Recency bonus
    score += 20; // All assumed recent
    factors.push('RECENT');

    return {
      ...article,
      relevance_score: Math.min(score, 100),
      relevance_factors: factors,
      competitive_entities: competitorMentions
    };
  });

  // Filter and sort
  const relevantResults = scoredResults
    .filter(a => a.relevance_score >= 30)
    .sort((a, b) => b.relevance_score - a.relevance_score);

  console.log(`✅ Articles passing threshold: ${relevantResults.length}/${allResults.length}`);

  // Save to database
  console.log('\n💾 Saving NIV test dataset...');

  const nivDataset = {
    query: `NIV Quick Test Dataset - ${new Date().toISOString()}`,
    results: {
      articles: relevantResults,
      summary: `NIV test dataset with ${relevantResults.length} relevant articles for OpenAI competitive intelligence. Key competitors covered: ${[...new Set(relevantResults.flatMap(a => a.competitive_entities || []))].join(', ')}`,
      totalResults: relevantResults.length,
      timestamp: new Date().toISOString(),
      metadata: {
        organization: 'OpenAI',
        test_dataset: true,
        time_window: '48_hours',
        method: 'quick_focused'
      }
    },
    created_at: new Date().toISOString()
  };

  try {
    const { data: saved } = await supabase
      .from('fireplexity_searches')
      .insert([nivDataset])
      .select()
      .single();

    if (saved) {
      console.log(`✅ Saved with ID: ${saved.id}`);
      console.log(`   NIV can now use this dataset for testing\n`);

      // Display top articles
      console.log('🏆 Top Intelligence Items:');
      relevantResults.slice(0, 5).forEach((article, i) => {
        console.log(`\n${i + 1}. [Score: ${article.relevance_score}]`);
        console.log(`   ${article.title?.substring(0, 80)}`);
        console.log(`   ${article.relevance_factors.join(', ')}`);
      });
    }
  } catch (e) {
    console.log('Save error:', e.message);
  }

  console.log('\n✨ Done! NIV test data ready.');
}

// Helper functions
function cleanTitle(text) {
  if (!text) return '';

  // Remove common junk
  let title = text
    .replace(/^#+\s*/, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/^\s*(Skip to|Menu|Search|Sign in|Log in|Subscribe).*/i, '')
    .replace(/^[\s\-\*\|\/\\]+/, '')
    .split('\n')
    .find(line => line.trim().length > 15 && line.trim().length < 200) || '';

  // If still bad, try to extract something meaningful
  if (!title || title.length < 10) {
    const lines = text.split('\n').filter(l =>
      l.trim().length > 20 &&
      l.trim().length < 150 &&
      !l.match(/^(https?:|www\.|Skip|Menu|Search)/i)
    );
    title = lines[0] || 'Article';
  }

  return title.trim().substring(0, 150);
}

function cleanDescription(text) {
  if (!text) return '';

  const cleaned = text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/^#+\s*/, '')
    .split('\n')
    .filter(l =>
      l.trim().length > 30 &&
      !l.match(/^(Skip|Menu|Search|Sign|Subscribe|Cookie|Privacy)/i)
    )
    .slice(0, 3)
    .join(' ')
    .substring(0, 300)
    .trim();

  return cleaned || 'No description available';
}

// Run it
populateNIVTestDataQuick();