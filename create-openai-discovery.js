const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function createOpenAIDiscoveryProfile() {
  console.log('🔍 Creating OpenAI Discovery Profile...\n');

  // Create a comprehensive discovery profile for OpenAI
  // Based on what mcp-discovery would generate
  const openAIProfile = {
    organization_id: 'OpenAI',
    organization_name: 'OpenAI',
    industry: 'Artificial Intelligence',

    // Competition data (from competitor index)
    competition: {
      direct_competitors: [
        'Anthropic',
        'Google DeepMind',
        'Meta AI',
        'Microsoft AI',
        'Cohere',
        'Inflection AI',
        'Stability AI',
        'Hugging Face'
      ],
      indirect_competitors: [
        'Amazon Web Services',
        'Google Cloud AI',
        'IBM Watson',
        'Salesforce Einstein',
        'Adobe Firefly',
        'Midjourney'
      ],
      emerging_threats: [
        'xAI',
        'Mistral AI',
        'Aleph Alpha',
        'AI21 Labs',
        'Adept AI'
      ]
    },

    // Keywords for monitoring
    keywords: [
      'GPT',
      'ChatGPT',
      'GPT-4',
      'GPT-5',
      'DALL-E',
      'Whisper',
      'Codex',
      'artificial general intelligence',
      'AGI',
      'large language model',
      'LLM',
      'transformer',
      'reinforcement learning',
      'RLHF',
      'AI safety',
      'AI alignment',
      'multimodal AI',
      'generative AI',
      'foundation models'
    ],

    // Stakeholders to monitor
    stakeholders: {
      regulators: [
        'FTC',
        'SEC',
        'EU Commission',
        'UK CMA',
        'California CPPA'
      ],
      major_investors: [
        'Microsoft',
        'Reid Hoffman',
        'Khosla Ventures',
        'Thrive Capital',
        'Sequoia Capital'
      ],
      executives: [
        'Sam Altman',
        'Greg Brockman',
        'Ilya Sutskever',
        'Mira Murati',
        'Brad Lightcap'
      ],
      key_partners: [
        'Microsoft',
        'Azure',
        'Apple',
        'Bain & Company'
      ]
    },

    // Monitoring configuration
    monitoring_config: {
      keywords: [
        'OpenAI',
        'ChatGPT',
        'GPT-4',
        'Sam Altman',
        'AI regulation',
        'AI safety',
        'artificial general intelligence',
        'Microsoft OpenAI',
        'AI competition'
      ],
      all_sources: [
        // Tech news
        { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: 'rss', priority: 'critical' },
        { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', type: 'rss', priority: 'high' },
        { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', type: 'rss', priority: 'high' },

        // AI-specific sources
        { name: 'The Information AI', url: 'https://www.theinformation.com/feed', type: 'rss', priority: 'critical' },
        { name: 'VentureBeat AI', url: 'https://venturebeat.com/ai/feed/', type: 'rss', priority: 'high' },
        { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', type: 'rss', priority: 'high' },

        // Business news
        { name: 'Wall Street Journal Tech', url: 'https://feeds.wsj.com/wsj/xml/rss/3_7455.xml', type: 'rss', priority: 'critical' },
        { name: 'Financial Times', url: 'https://www.ft.com/technology?format=rss', type: 'rss', priority: 'high' },
        { name: 'Bloomberg Technology', url: 'https://feeds.bloomberg.com/technology/news.rss', type: 'rss', priority: 'high' },

        // Regulatory
        { name: 'SEC Press Releases', url: 'https://www.sec.gov/news/pressreleases.rss', type: 'rss', priority: 'medium' },
        { name: 'FTC Tech', url: 'https://www.ftc.gov/feeds/press-releases.xml', type: 'rss', priority: 'medium' }
      ],
      track_urls: [
        'https://openai.com/blog',
        'https://blog.anthropic.com',
        'https://deepmind.google/blog',
        'https://ai.meta.com/blog'
      ]
    },

    // Trending topics
    trending: {
      hot_topics: [
        'AGI timeline',
        'AI regulation',
        'compute scaling',
        'model capabilities',
        'AI safety research'
      ],
      emerging_technologies: [
        'multimodal models',
        'autonomous agents',
        'constitutional AI',
        'chain of thought',
        'retrieval augmented generation'
      ]
    },

    // Business focus areas
    business_focus: {
      products: ['ChatGPT', 'GPT-4 API', 'DALL-E 3', 'Whisper', 'GPT Store'],
      markets: ['Enterprise AI', 'Consumer AI', 'Developer Tools', 'AI Research'],
      revenue_models: ['API Usage', 'ChatGPT Plus/Team/Enterprise', 'Azure OpenAI Service']
    },

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // First, create the mcp_discovery table if it doesn't exist
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS mcp_discovery (
      organization_id TEXT PRIMARY KEY,
      organization_name TEXT,
      industry TEXT,
      competition JSONB,
      keywords TEXT[],
      stakeholders JSONB,
      monitoring_config JSONB,
      trending JSONB,
      business_focus JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  console.log('📊 Creating mcp_discovery table if needed...');

  // Try to create table via RPC (might not exist)
  try {
    const { error: createError } = await supabase.rpc('exec_sql', {
      query: createTableSQL
    });
    if (createError) {
      console.log('Note: Could not create table via RPC, it may already exist');
    }
  } catch (err) {
    // If RPC doesn't exist, that's okay - table might already exist
    console.log('Note: Could not create table via RPC, proceeding to insert data');
  }

  // Insert or update the OpenAI profile
  console.log('💾 Inserting OpenAI discovery profile...');
  const { data, error } = await supabase
    .from('mcp_discovery')
    .upsert(openAIProfile, {
      onConflict: 'organization_id'
    })
    .select();

  if (error) {
    console.error('❌ Error inserting profile:', error);

    // If table doesn't exist, try creating it differently
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n📦 Table does not exist. Please run this SQL in Supabase dashboard:');
      console.log(createTableSQL);
      console.log('\nThen run this script again.');
    }
    return;
  }

  console.log('✅ OpenAI discovery profile created successfully!');
  console.log('\n📋 Profile Summary:');
  console.log('  - Organization: OpenAI');
  console.log('  - Direct Competitors: ' + openAIProfile.competition.direct_competitors.length);
  console.log('  - Keywords: ' + openAIProfile.keywords.length);
  console.log('  - RSS Sources: ' + openAIProfile.monitoring_config.all_sources.length);
  console.log('  - Stakeholders tracked: ' + Object.keys(openAIProfile.stakeholders).reduce((acc, key) => acc + openAIProfile.stakeholders[key].length, 0));

  console.log('\n🔍 Sample search queries NIV can now use:');
  console.log('  - "What\'s the latest news on OpenAI?"');
  console.log('  - "Any updates on GPT-5?"');
  console.log('  - "What are OpenAI\'s competitors doing?"');
  console.log('  - "Search for Sam Altman news"');
  console.log('  - "Find AI regulation updates"');

  return openAIProfile;
}

// Now let's also create a sample web search result to store
async function createSampleWebSearchResults() {
  console.log('\n\n🌐 Creating sample web search results...');

  // Create table for storing Fireplexity search results
  const createSearchTableSQL = `
    CREATE TABLE IF NOT EXISTS fireplexity_searches (
      id SERIAL PRIMARY KEY,
      organization_id TEXT,
      query TEXT,
      results JSONB,
      strategy TEXT,
      cached BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Sample search results (simulating what Fireplexity would return)
  const sampleSearches = [
    {
      organization_id: 'OpenAI',
      query: 'OpenAI GPT-5 development',
      strategy: 'web_search',
      cached: false,
      results: {
        articles: [
          {
            title: 'OpenAI Reportedly Working on GPT-5 with Enhanced Reasoning',
            url: 'https://example.com/gpt5-development',
            description: 'Sources close to OpenAI suggest the company is making significant progress on GPT-5, focusing on improved reasoning capabilities and reduced hallucinations.',
            published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            source: 'TechCrunch'
          },
          {
            title: 'Sam Altman Hints at Major AI Breakthrough Coming Soon',
            url: 'https://example.com/altman-breakthrough',
            description: 'OpenAI CEO Sam Altman suggested in a recent interview that the company is on the verge of a significant advancement in artificial general intelligence.',
            published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
            source: 'The Information'
          }
        ],
        summary: 'OpenAI is reportedly making significant progress on GPT-5 with focus on enhanced reasoning and AGI capabilities. Sam Altman has hinted at major breakthroughs coming soon.'
      }
    },
    {
      organization_id: 'OpenAI',
      query: 'Anthropic Claude competition with ChatGPT',
      strategy: 'web_search',
      cached: false,
      results: {
        articles: [
          {
            title: 'Anthropic\'s Claude 3 Gains Enterprise Adoption, Challenging ChatGPT',
            url: 'https://example.com/claude-enterprise',
            description: 'Major enterprises are increasingly adopting Anthropic\'s Claude for internal use cases, citing better safety features and constitutional AI approach.',
            published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
            source: 'VentureBeat'
          },
          {
            title: 'OpenAI Responds to Competition with New Enterprise Features',
            url: 'https://example.com/openai-enterprise-update',
            description: 'OpenAI announces enhanced enterprise features for ChatGPT Team and Enterprise plans, including improved data privacy and admin controls.',
            published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
            source: 'Wall Street Journal'
          }
        ],
        summary: 'Competition heating up between OpenAI and Anthropic in the enterprise AI market, with both companies releasing new features to attract business customers.'
      }
    },
    {
      organization_id: 'OpenAI',
      query: 'AI regulation FTC investigation',
      strategy: 'news_search',
      cached: false,
      results: {
        articles: [
          {
            title: 'FTC Investigating Major AI Companies Over Competition Concerns',
            url: 'https://example.com/ftc-investigation',
            description: 'The Federal Trade Commission has opened investigations into several leading AI companies including OpenAI, examining potential anti-competitive practices.',
            published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            source: 'Reuters'
          },
          {
            title: 'EU Proposes Stricter AI Regulations for Foundation Models',
            url: 'https://example.com/eu-ai-regulation',
            description: 'European Union lawmakers propose new regulations specifically targeting large foundation models like GPT-4, requiring transparency and safety assessments.',
            published_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 1.5 days ago
            source: 'Financial Times'
          }
        ],
        summary: 'Regulatory scrutiny increasing on AI companies with FTC investigations and proposed EU regulations targeting foundation models.'
      }
    }
  ];

  console.log('💾 Inserting sample search results...');
  const { error } = await supabase
    .from('fireplexity_searches')
    .insert(sampleSearches);

  if (error) {
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n📦 Search results table does not exist. Please run this SQL in Supabase dashboard:');
      console.log(createSearchTableSQL);
    } else {
      console.log('❌ Error inserting search results:', error);
    }
  } else {
    console.log('✅ Sample search results created!');
    console.log('  - Created ' + sampleSearches.length + ' sample searches');
    console.log('  - Topics: GPT-5 development, Competition, AI Regulation');
  }
}

// Run both functions
async function main() {
  await createOpenAIDiscoveryProfile();
  await createSampleWebSearchResults();

  console.log('\n\n🎉 Setup complete! NIV can now:');
  console.log('  1. Query OpenAI discovery profile for context');
  console.log('  2. Access sample web search results');
  console.log('  3. Search for OpenAI-related topics using keywords');
  console.log('\nTest it in NIV with questions like:');
  console.log('  - "Search for OpenAI news"');
  console.log('  - "What are the latest updates on GPT-5?"');
  console.log('  - "Find information about AI regulation"');
}

main();