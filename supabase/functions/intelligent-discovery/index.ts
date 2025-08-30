// Intelligent Discovery Edge Function
// Phase 1 of Master Intelligence Flow - Claude analyzes organization first

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Industry-specific RSS feeds from MasterSourceRegistry
const INDUSTRY_RSS_FEEDS = {
  technology: [
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml',
    'https://feeds.arstechnica.com/arstechnica/index',
    'https://www.wired.com/feed/rss',
    'https://feeds.feedburner.com/venturebeat/SZYF',
    'https://www.engadget.com/rss.xml'
  ],
  finance: [
    'https://www.ft.com/rss/home',
    'https://feeds.bloomberg.com/markets/news.rss',
    'https://feeds.reuters.com/reuters/businessNews',
    'https://feeds.wsj.com/wsj/xml/rss/3_7031.xml',
    'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    'https://finance.yahoo.com/rss/',
    'https://finance.yahoo.com/news/rssindex'
  ],
  healthcare: [
    'https://www.healthcareitnews.com/feed',
    'https://medcitynews.com/feed/',
    'https://www.statnews.com/feed/',
    'https://www.fiercepharma.com/rss/xml',
    'https://www.fiercebiotech.com/rss/xml'
  ],
  energy: [
    'https://oilprice.com/rss/main',
    'https://www.energyvoice.com/feed/',
    'https://www.renewableenergyworld.com/feed/',
    'https://cleantechnica.com/feed/'
  ],
  retail: [
    'https://www.retaildive.com/feeds/news/',
    'https://nrf.com/rss.xml',
    'https://retailwire.com/feed/',
    'https://chainstoreage.com/rss.xml'
  ],
  manufacturing: [
    'https://www.industryweek.com/rss.xml',
    'https://www.manufacturingnews.com/rss.xml',
    'https://www.automationworld.com/rss.xml'
  ],
  real_estate: [
    'https://www.inman.com/feed/',
    'https://therealdeal.com/feed/',
    'https://www.bisnow.com/rss'
  ],
  transportation: [
    'https://www.freightwaves.com/feed',
    'https://www.ttnews.com/rss.xml',
    'https://www.supplychaindive.com/feeds/news/'
  ],
  media: [
    'https://variety.com/feed/',
    'https://www.hollywoodreporter.com/feed/',
    'https://deadline.com/feed/',
    'https://www.adweek.com/feed/'
  ],
  telecommunications: [
    'https://www.fiercewireless.com/rss/xml',
    'https://www.lightreading.com/rss.xml',
    'https://www.rcrwireless.com/feed'
  ],
  agriculture: [
    'https://www.agriculture.com/rss/',
    'https://www.feedstuffs.com/rss.xml',
    'https://www.agweb.com/rss/'
  ],
  education: [
    'https://www.edsurge.com/rss',
    'https://www.insidehighered.com/rss.xml',
    'https://www.chronicle.com/section/News/6/rss'
  ],
  government: [
    'https://www.govtech.com/rss/',
    'https://fcw.com/rss.aspx',
    'https://www.nextgov.com/rss/'
  ],
  aerospace: [
    'https://aviationweek.com/rss.xml',
    'https://spacenews.com/feed/',
    'https://www.flightglobal.com/rss'
  ],
  automotive: [
    'https://www.autonews.com/feed',
    'https://insideevs.com/rss/news/',
    'https://www.motortrend.com/feed/',
    'https://www.autoblog.com/rss.xml'
  ],
  pharmaceuticals: [
    'https://www.fiercepharma.com/rss/xml',
    'https://www.pharmalive.com/feed/',
    'https://www.pharmaceutical-technology.com/feed/'
  ],
  conglomerate: [
    'https://www.ft.com/rss/home',
    'https://asia.nikkei.com/rss/feed',
    'https://feeds.bloomberg.com/markets/news.rss',
    'https://feeds.reuters.com/reuters/businessNews'
  ]
}

async function analyzeOrganization(orgName: string, industryHint?: string) {
  // Get API key - try multiple times
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
  
  console.log('🔑 API Key check:')
  console.log('  - Exists:', !!ANTHROPIC_API_KEY)
  console.log('  - Length:', ANTHROPIC_API_KEY?.length || 0)
  console.log('  - Starts with:', ANTHROPIC_API_KEY?.substring(0, 10))
  
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured in environment')
  }
  
  const prompt = `You are an expert business analyst. Analyze this organization and provide structured intelligence discovery data.

Organization: ${orgName}
Industry Hint: ${industryHint || 'Unknown'}

Your task:
1. Identify the PRIMARY industry category (one of: technology, finance, healthcare, energy, retail, manufacturing, real_estate, transportation, media, telecommunications, agriculture, education, government, aerospace, automotive, pharmaceuticals, conglomerate)

2. Identify SUB-CATEGORIES that apply (can be multiple)

3. For conglomerates like Japanese trading houses (sogo shosha), identify ALL their business areas

4. List their TOP COMPETITORS (especially important for companies like Mitsui, Mitsubishi, etc.)

5. Generate SEARCH KEYWORDS that will find relevant news

6. Identify WEBSITES to scrape (organization + competitors)

CRITICAL: For Japanese trading companies (Mitsui, Mitsubishi, Sumitomo, Itochu, Marubeni), you MUST:
- Set primary_category as "conglomerate"
- List all major sogo shosha as competitors
- Include sub_categories like trading, energy, infrastructure, chemicals, metals

Return ONLY a JSON object with this structure:
{
  "organization": "${orgName}",
  "primary_category": "conglomerate",
  "sub_categories": ["trading", "energy", "infrastructure"],
  "mapped_registry_categories": ["finance", "energy", "manufacturing"],
  "competitors": ["Company1", "Company2", "Company3"],
  "search_keywords": ["keyword1", "keyword2", "keyword3"],
  "scrape_targets": ["https://example.com", "https://competitor.com"],
  "industry_context": "Brief description of the industry",
  "intelligence_focus": ["What to look for", "Key areas of interest"]
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('❌ Claude API error:', response.status)
      console.error('❌ Error body:', errorBody)
      
      // Check if it's an authentication error
      if (response.status === 401) {
        console.error('🔑 API Key issue - the key might be invalid or expired')
        console.error('🔑 Key being used starts with:', ANTHROPIC_API_KEY?.substring(0, 20))
      }
      
      throw new Error(`Claude API error: ${response.status} - ${errorBody}`)
    }

    const result = await response.json()
    const content = result.content[0].text
    
    // Parse JSON response
    const discovery = JSON.parse(content)
    
    // Add industry-specific RSS feeds
    if (discovery.primary_category && INDUSTRY_RSS_FEEDS[discovery.primary_category]) {
      discovery.rss_feeds = INDUSTRY_RSS_FEEDS[discovery.primary_category]
    } else {
      // Default to business/finance feeds
      discovery.rss_feeds = INDUSTRY_RSS_FEEDS.finance || []
    }
    
    // Ensure we have good data for known companies
    if (orgName.toLowerCase().includes('mitsui')) {
      discovery.competitors = discovery.competitors?.length > 0 ? discovery.competitors : [
        'Mitsubishi Corporation',
        'Sumitomo Corporation',
        'Itochu Corporation',
        'Marubeni Corporation',
        'Sojitz Corporation'
      ]
      discovery.primary_category = 'conglomerate'
      discovery.scrape_targets = [
        'https://www.mitsui.com',
        'https://www.mitsubishicorp.com',
        'https://www.sumitomocorp.com',
        'https://www.itochu.co.jp/en',
        'https://www.marubeni.com/en'
      ]
    }
    
    return discovery
  } catch (error) {
    console.error('Discovery error:', error)
    
    // Fallback for known companies
    if (orgName.toLowerCase().includes('mitsui')) {
      return {
        organization: orgName,
        primary_category: 'conglomerate',
        sub_categories: ['trading', 'energy', 'infrastructure', 'chemicals', 'metals'],
        mapped_registry_categories: ['finance', 'energy', 'manufacturing', 'transportation'],
        competitors: [
          'Mitsubishi Corporation',
          'Sumitomo Corporation', 
          'Itochu Corporation',
          'Marubeni Corporation',
          'Sojitz Corporation'
        ],
        search_keywords: [
          'sogo shosha',
          'Japanese trading house',
          'Mitsui acquisition',
          'commodity trading',
          'infrastructure investment'
        ],
        scrape_targets: [
          'https://www.mitsui.com',
          'https://www.mitsubishicorp.com',
          'https://www.sumitomocorp.com',
          'https://www.itochu.co.jp/en',
          'https://www.marubeni.com/en'
        ],
        industry_context: 'Japanese general trading company (sogo shosha) with diversified business portfolio',
        intelligence_focus: [
          'New acquisitions and investments',
          'Commodity trading positions',
          'Infrastructure projects',
          'Partnership announcements'
        ]
      }
    }
    
    throw error
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const { organization, industry_hint } = await req.json()
    
    if (!organization) {
      throw new Error('Organization name is required')
    }
    
    console.log(`🔍 Intelligent Discovery for: ${organization}`)
    
    const discovery = await analyzeOrganization(organization, industry_hint)
    
    console.log(`✅ Discovery complete:`)
    console.log(`   - Category: ${discovery.primary_category}`)
    console.log(`   - Competitors: ${discovery.competitors?.length || 0}`)
    console.log(`   - Scrape targets: ${discovery.scrape_targets?.length || 0}`)
    
    return new Response(
      JSON.stringify({
        success: true,
        data: discovery,
        service: 'Intelligent Discovery',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('❌ Discovery error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        service: 'Intelligent Discovery',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})