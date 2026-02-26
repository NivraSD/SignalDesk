#!/usr/bin/env node

const pool = require('../src/config/db');

async function seedIntelligenceDatabase() {
  console.log('=====================================');
  console.log('🌱 SEEDING INTELLIGENCE DATABASE');
  console.log('=====================================\n');

  try {
    // Seed Industries
    console.log('📊 Seeding industries...');
    const industries = await seedIndustries();
    
    // Seed Companies
    console.log('🏢 Seeding companies...');
    const companies = await seedCompanies(industries);
    
    // Seed Topics
    console.log('📋 Seeding topics...');
    const topics = await seedTopics(industries);
    
    // Seed Sources
    console.log('📰 Seeding sources...');
    const sources = await seedSources();
    
    // Map relationships
    console.log('🔗 Mapping relationships...');
    await mapIndustrySources(industries, sources);
    
    console.log('\n=====================================');
    console.log('✅ SEEDING COMPLETE');
    console.log('=====================================');
    console.log(`Industries: ${industries.length}`);
    console.log(`Companies: ${companies.length}`);
    console.log(`Topics: ${topics.length}`);
    console.log(`Sources: ${sources.length}`);
    console.log('=====================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

async function seedIndustries() {
  const industries = [
    {
      name: 'Technology',
      description: 'Software, hardware, cloud computing, and IT services',
      market_size_billions: 5500,
      growth_rate_percent: 8.2,
      key_trends: ['AI/ML adoption', 'Cloud migration', 'Cybersecurity', 'Digital transformation', 'Remote work tech'],
      regulatory_bodies: ['FTC', 'FCC', 'SEC', 'EU Commission'],
      major_publications: ['TechCrunch', 'The Verge', 'Wired', 'Ars Technica', 'VentureBeat']
    },
    {
      name: 'Healthcare',
      description: 'Pharmaceuticals, biotechnology, medical devices, and healthcare services',
      market_size_billions: 12000,
      growth_rate_percent: 6.5,
      key_trends: ['Telemedicine', 'Personalized medicine', 'AI diagnostics', 'Drug discovery', 'Digital health'],
      regulatory_bodies: ['FDA', 'CMS', 'NIH', 'EMA'],
      major_publications: ['STAT News', 'FiercePharma', 'Modern Healthcare', 'Healthcare IT News']
    },
    {
      name: 'Finance',
      description: 'Banking, insurance, fintech, and investment services',
      market_size_billions: 22000,
      growth_rate_percent: 5.8,
      key_trends: ['Digital banking', 'Cryptocurrency', 'DeFi', 'Open banking', 'RegTech'],
      regulatory_bodies: ['SEC', 'FDIC', 'Federal Reserve', 'CFTC', 'OCC'],
      major_publications: ['Wall Street Journal', 'Financial Times', 'Bloomberg', 'Reuters', 'The Banker']
    },
    {
      name: 'Retail',
      description: 'E-commerce, traditional retail, and omnichannel commerce',
      market_size_billions: 27000,
      growth_rate_percent: 4.3,
      key_trends: ['E-commerce growth', 'Social commerce', 'Sustainability', 'Supply chain innovation', 'Personalization'],
      regulatory_bodies: ['FTC', 'CPSC', 'FDA (for food/cosmetics)'],
      major_publications: ['Retail Dive', 'Chain Store Age', 'Retail Week', 'WWD']
    },
    {
      name: 'Energy',
      description: 'Oil & gas, renewable energy, utilities, and energy technology',
      market_size_billions: 8500,
      growth_rate_percent: 3.7,
      key_trends: ['Renewable transition', 'Energy storage', 'Grid modernization', 'Carbon capture', 'Hydrogen economy'],
      regulatory_bodies: ['FERC', 'EPA', 'DOE', 'NRC'],
      major_publications: ['Energy News', 'Oil & Gas Journal', 'Renewable Energy World', 'Utility Dive']
    },
    {
      name: 'Automotive',
      description: 'Vehicle manufacturing, EVs, autonomous driving, and mobility services',
      market_size_billions: 3800,
      growth_rate_percent: 4.1,
      key_trends: ['Electric vehicles', 'Autonomous driving', 'Connected cars', 'Mobility as a service', 'Battery technology'],
      regulatory_bodies: ['NHTSA', 'EPA', 'CARB', 'EU Commission'],
      major_publications: ['Automotive News', 'Electrek', 'Auto Week', 'Motor Trend']
    },
    {
      name: 'Telecommunications',
      description: '5G networks, internet services, and communications infrastructure',
      market_size_billions: 1700,
      growth_rate_percent: 3.2,
      key_trends: ['5G deployment', 'Edge computing', 'Network virtualization', 'Satellite internet', 'IoT connectivity'],
      regulatory_bodies: ['FCC', 'ITU', 'Ofcom', 'EU Commission'],
      major_publications: ['Light Reading', 'RCR Wireless', 'Telecom Asia', 'FierceWireless']
    },
    {
      name: 'Media & Entertainment',
      description: 'Streaming services, gaming, content creation, and digital media',
      market_size_billions: 2300,
      growth_rate_percent: 5.4,
      key_trends: ['Streaming wars', 'Gaming growth', 'Creator economy', 'VR/AR content', 'AI-generated content'],
      regulatory_bodies: ['FCC', 'FTC', 'Copyright Office'],
      major_publications: ['Variety', 'Hollywood Reporter', 'Deadline', 'The Wrap']
    },
    {
      name: 'Real Estate',
      description: 'Property development, REITs, proptech, and construction',
      market_size_billions: 9500,
      growth_rate_percent: 3.8,
      key_trends: ['PropTech adoption', 'Remote work impact', 'Sustainable building', 'Smart cities', 'Housing affordability'],
      regulatory_bodies: ['HUD', 'EPA', 'Local zoning boards'],
      major_publications: ['Real Estate Weekly', 'The Real Deal', 'CoStar', 'Inman']
    },
    {
      name: 'Transportation & Logistics',
      description: 'Shipping, freight, airlines, and supply chain management',
      market_size_billions: 6200,
      growth_rate_percent: 4.5,
      key_trends: ['Supply chain digitization', 'Last-mile delivery', 'Autonomous vehicles', 'Sustainability', 'E-commerce logistics'],
      regulatory_bodies: ['DOT', 'FAA', 'FMC', 'STB'],
      major_publications: ['Transport Topics', 'FreightWaves', 'Journal of Commerce', 'Air Cargo News']
    },
    {
      name: 'Consumer Goods',
      description: 'CPG, food & beverage, personal care, and household products',
      market_size_billions: 15000,
      growth_rate_percent: 3.2,
      key_trends: ['D2C brands', 'Sustainability', 'Health & wellness', 'Personalization', 'Supply chain resilience'],
      regulatory_bodies: ['FDA', 'FTC', 'CPSC', 'USDA'],
      major_publications: ['CPG Digital Commerce', 'Food Dive', 'Beverage Industry', 'Consumer Goods Technology']
    },
    {
      name: 'Education',
      description: 'EdTech, online learning, universities, and corporate training',
      market_size_billions: 7000,
      growth_rate_percent: 5.1,
      key_trends: ['Online learning', 'AI tutoring', 'Micro-credentials', 'Skills-based learning', 'Corporate training'],
      regulatory_bodies: ['Department of Education', 'State education boards'],
      major_publications: ['EdSurge', 'The Chronicle of Higher Education', 'Education Week', 'eLearning Industry']
    },
    {
      name: 'Manufacturing',
      description: 'Industrial production, automation, and advanced manufacturing',
      market_size_billions: 14000,
      growth_rate_percent: 3.5,
      key_trends: ['Industry 4.0', 'Automation', '3D printing', 'Reshoring', 'Supply chain localization'],
      regulatory_bodies: ['OSHA', 'EPA', 'Commerce Department'],
      major_publications: ['IndustryWeek', 'Manufacturing.net', 'Modern Machine Shop', 'Assembly Magazine']
    },
    {
      name: 'Agriculture',
      description: 'Farming, AgTech, food production, and agricultural technology',
      market_size_billions: 5000,
      growth_rate_percent: 3.9,
      key_trends: ['Precision agriculture', 'Vertical farming', 'Alternative proteins', 'Climate resilience', 'Food traceability'],
      regulatory_bodies: ['USDA', 'EPA', 'FDA'],
      major_publications: ['AgFunder News', 'Modern Farmer', 'Agriculture.com', 'Farm Progress']
    },
    {
      name: 'Aerospace & Defense',
      description: 'Aviation, space exploration, defense contractors, and satellites',
      market_size_billions: 2100,
      growth_rate_percent: 4.2,
      key_trends: ['Space commercialization', 'Urban air mobility', 'Hypersonics', 'Satellite constellations', 'Defense modernization'],
      regulatory_bodies: ['FAA', 'DoD', 'NASA', 'Space Force'],
      major_publications: ['Aviation Week', 'SpaceNews', 'Defense News', 'Air & Space Magazine']
    }
  ];

  const results = [];
  for (const industry of industries) {
    const result = await pool.query(
      `INSERT INTO industries 
       (name, description, market_size_billions, growth_rate_percent, 
        key_trends, regulatory_bodies, major_publications)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (name) DO UPDATE SET
       description = EXCLUDED.description,
       market_size_billions = EXCLUDED.market_size_billions,
       growth_rate_percent = EXCLUDED.growth_rate_percent,
       key_trends = EXCLUDED.key_trends,
       regulatory_bodies = EXCLUDED.regulatory_bodies,
       major_publications = EXCLUDED.major_publications
       RETURNING id, name`,
      [
        industry.name,
        industry.description,
        industry.market_size_billions,
        industry.growth_rate_percent,
        industry.key_trends,
        industry.regulatory_bodies,
        industry.major_publications
      ]
    );
    results.push({ id: result.rows[0].id, ...industry });
    console.log(`  ✓ ${industry.name}`);
  }
  return results;
}

async function seedCompanies(industries) {
  // Sample companies for Technology industry
  const techIndustry = industries.find(i => i.name === 'Technology');
  if (!techIndustry) return [];

  const techCompanies = [
    { name: 'Microsoft', ticker: 'MSFT', website: 'https://microsoft.com', hq: 'Redmond, USA', employees: 221000, revenue: 211.9, market_cap: 2890 },
    { name: 'Apple', ticker: 'AAPL', website: 'https://apple.com', hq: 'Cupertino, USA', employees: 164000, revenue: 394.3, market_cap: 3000 },
    { name: 'Google (Alphabet)', ticker: 'GOOGL', website: 'https://google.com', hq: 'Mountain View, USA', employees: 190000, revenue: 307.4, market_cap: 1800 },
    { name: 'Amazon', ticker: 'AMZN', website: 'https://amazon.com', hq: 'Seattle, USA', employees: 1540000, revenue: 574.8, market_cap: 1700 },
    { name: 'Meta', ticker: 'META', website: 'https://meta.com', hq: 'Menlo Park, USA', employees: 86000, revenue: 134.9, market_cap: 1200 },
    { name: 'Oracle', ticker: 'ORCL', website: 'https://oracle.com', hq: 'Austin, USA', employees: 143000, revenue: 50.0, market_cap: 320 },
    { name: 'Salesforce', ticker: 'CRM', website: 'https://salesforce.com', hq: 'San Francisco, USA', employees: 73000, revenue: 34.9, market_cap: 260 },
    { name: 'Adobe', ticker: 'ADBE', website: 'https://adobe.com', hq: 'San Jose, USA', employees: 29000, revenue: 19.4, market_cap: 230 },
    { name: 'IBM', ticker: 'IBM', website: 'https://ibm.com', hq: 'Armonk, USA', employees: 288000, revenue: 61.9, market_cap: 170 },
    { name: 'Intel', ticker: 'INTC', website: 'https://intel.com', hq: 'Santa Clara, USA', employees: 131000, revenue: 63.1, market_cap: 150 },
    { name: 'NVIDIA', ticker: 'NVDA', website: 'https://nvidia.com', hq: 'Santa Clara, USA', employees: 26000, revenue: 60.9, market_cap: 1200 },
    { name: 'Tesla', ticker: 'TSLA', website: 'https://tesla.com', hq: 'Austin, USA', employees: 127000, revenue: 96.8, market_cap: 800 },
    { name: 'Netflix', ticker: 'NFLX', website: 'https://netflix.com', hq: 'Los Gatos, USA', employees: 13000, revenue: 33.7, market_cap: 200 },
    { name: 'PayPal', ticker: 'PYPL', website: 'https://paypal.com', hq: 'San Jose, USA', employees: 29000, revenue: 29.8, market_cap: 65 },
    { name: 'Spotify', ticker: 'SPOT', website: 'https://spotify.com', hq: 'Stockholm, Sweden', employees: 9000, revenue: 13.2, market_cap: 30 }
  ];

  const results = [];
  for (let i = 0; i < techCompanies.length; i++) {
    const company = techCompanies[i];
    const result = await pool.query(
      `INSERT INTO companies 
       (industry_id, name, ticker_symbol, website_url, headquarters_location,
        employee_count, revenue_billions, market_cap_billions, ranking_in_industry)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (industry_id, name) DO UPDATE SET
       ticker_symbol = EXCLUDED.ticker_symbol,
       market_cap_billions = EXCLUDED.market_cap_billions
       RETURNING id`,
      [
        techIndustry.id,
        company.name,
        company.ticker,
        company.website,
        company.hq,
        company.employees,
        company.revenue,
        company.market_cap,
        i + 1
      ]
    );
    results.push({ id: result.rows[0].id, ...company });
  }
  console.log(`  ✓ ${results.length} companies for Technology`);
  return results;
}

async function seedTopics(industries) {
  const techIndustry = industries.find(i => i.name === 'Technology');
  if (!techIndustry) return [];

  const techTopics = [
    { name: 'Artificial Intelligence Regulation', category: 'regulation', relevance: 0.95, trending: true, keywords: ['AI Act', 'AI governance', 'AI ethics'] },
    { name: 'Data Privacy Laws', category: 'regulation', relevance: 0.92, trending: true, keywords: ['GDPR', 'CCPA', 'data protection'] },
    { name: 'Cybersecurity Threats', category: 'technology', relevance: 0.94, trending: true, keywords: ['ransomware', 'zero-day', 'breach'] },
    { name: 'Cloud Migration', category: 'technology', relevance: 0.88, trending: false, keywords: ['AWS', 'Azure', 'GCP', 'multi-cloud'] },
    { name: 'Generative AI', category: 'technology', relevance: 0.96, trending: true, keywords: ['ChatGPT', 'LLM', 'GenAI', 'copilot'] },
    { name: 'Tech Layoffs', category: 'market', relevance: 0.85, trending: true, keywords: ['workforce reduction', 'restructuring', 'job cuts'] },
    { name: 'Antitrust Investigations', category: 'regulation', relevance: 0.87, trending: true, keywords: ['monopoly', 'FTC', 'competition law'] },
    { name: 'Quantum Computing', category: 'technology', relevance: 0.78, trending: false, keywords: ['quantum supremacy', 'qubits', 'quantum advantage'] },
    { name: 'ESG Compliance', category: 'social', relevance: 0.82, trending: true, keywords: ['sustainability', 'carbon neutral', 'DEI'] },
    { name: 'Supply Chain Resilience', category: 'economic', relevance: 0.86, trending: false, keywords: ['chip shortage', 'logistics', 'reshoring'] },
    { name: 'Remote Work Technology', category: 'market', relevance: 0.79, trending: false, keywords: ['hybrid work', 'collaboration tools', 'virtual office'] },
    { name: 'API Economy', category: 'technology', relevance: 0.83, trending: false, keywords: ['API-first', 'microservices', 'integration'] },
    { name: 'Edge Computing', category: 'technology', relevance: 0.81, trending: false, keywords: ['IoT', 'latency', 'distributed computing'] },
    { name: 'Tech M&A Activity', category: 'market', relevance: 0.88, trending: true, keywords: ['acquisition', 'merger', 'consolidation'] },
    { name: 'Developer Productivity', category: 'technology', relevance: 0.77, trending: false, keywords: ['DevOps', 'CI/CD', 'automation'] }
  ];

  const results = [];
  for (const topic of techTopics) {
    const result = await pool.query(
      `INSERT INTO industry_topics 
       (industry_id, topic_name, topic_category, relevance_score, is_trending, keywords)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (industry_id, topic_name) DO UPDATE SET
       relevance_score = EXCLUDED.relevance_score,
       is_trending = EXCLUDED.is_trending
       RETURNING id`,
      [
        techIndustry.id,
        topic.name,
        topic.category,
        topic.relevance,
        topic.trending,
        topic.keywords
      ]
    );
    results.push({ id: result.rows[0].id, ...topic });
  }
  console.log(`  ✓ ${results.length} topics for Technology`);
  return results;
}

async function seedSources() {
  const sources = [
    { name: 'TechCrunch', url: 'https://techcrunch.com', type: 'news', rss: 'https://techcrunch.com/feed/', quality: 0.9 },
    { name: 'The Verge', url: 'https://www.theverge.com', type: 'news', rss: 'https://www.theverge.com/rss/index.xml', quality: 0.88 },
    { name: 'Ars Technica', url: 'https://arstechnica.com', type: 'news', rss: 'https://feeds.arstechnica.com/arstechnica/index', quality: 0.87 },
    { name: 'VentureBeat', url: 'https://venturebeat.com', type: 'news', rss: 'https://feeds.feedburner.com/venturebeat/SZYF', quality: 0.85 },
    { name: 'Wired', url: 'https://www.wired.com', type: 'news', rss: 'https://www.wired.com/feed/rss', quality: 0.86 },
    { name: 'SEC EDGAR', url: 'https://www.sec.gov/edgar', type: 'regulatory', rss: null, quality: 0.95 },
    { name: 'PR Newswire Tech', url: 'https://www.prnewswire.com/news-releases/technology-latest-news/', type: 'news', rss: 'https://www.prnewswire.com/rss/technology-latest-news.rss', quality: 0.82 },
    { name: 'Hacker News', url: 'https://news.ycombinator.com', type: 'news', rss: 'https://news.ycombinator.com/rss', quality: 0.84 },
    { name: 'Bloomberg Technology', url: 'https://www.bloomberg.com/technology', type: 'news', rss: null, quality: 0.92 },
    { name: 'Reuters Technology', url: 'https://www.reuters.com/technology/', type: 'news', rss: 'https://www.reutersagency.com/feed/?best-topics=tech', quality: 0.91 },
    { name: 'MIT Technology Review', url: 'https://www.technologyreview.com', type: 'research', rss: 'https://www.technologyreview.com/feed/', quality: 0.89 },
    { name: 'Gartner', url: 'https://www.gartner.com', type: 'research', rss: null, quality: 0.93 },
    { name: 'Forrester', url: 'https://www.forrester.com', type: 'research', rss: null, quality: 0.92 },
    { name: 'IDC', url: 'https://www.idc.com', type: 'research', rss: null, quality: 0.91 },
    { name: 'TechRadar', url: 'https://www.techradar.com', type: 'news', rss: 'https://www.techradar.com/rss', quality: 0.83 }
  ];

  const results = [];
  for (const source of sources) {
    const result = await pool.query(
      `INSERT INTO intelligence_sources 
       (source_name, source_url, source_type, content_type, rss_feed_url, quality_score)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (source_url) DO UPDATE SET
       quality_score = EXCLUDED.quality_score
       RETURNING id`,
      [
        source.name,
        source.url,
        source.type,
        'articles',
        source.rss,
        source.quality
      ]
    );
    results.push({ id: result.rows[0].id, ...source });
    console.log(`  ✓ ${source.name}`);
  }
  return results;
}

async function mapIndustrySources(industries, sources) {
  const techIndustry = industries.find(i => i.name === 'Technology');
  if (!techIndustry) return;

  // Map all sources to technology industry
  for (const source of sources) {
    await pool.query(
      `INSERT INTO industry_sources 
       (industry_id, source_id, relevance_score, coverage_areas)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (industry_id, source_id) DO UPDATE SET
       relevance_score = EXCLUDED.relevance_score`,
      [
        techIndustry.id,
        source.id,
        source.quality || 0.8,
        ['technology', 'innovation', 'business']
      ]
    );
  }
  console.log(`  ✓ Mapped ${sources.length} sources to Technology industry`);
}

// Run if called directly
if (require.main === module) {
  seedIntelligenceDatabase();
}

module.exports = seedIntelligenceDatabase;