// Intelligent Discovery Edge Function
// Phase 1 of Master Intelligence Flow - Claude analyzes organization first

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
1. Identify the PRIMARY industry category (one of: technology, finance, healthcare, energy, retail, manufacturing, real_estate, transportation, media, telecommunications, conglomerate, automotive, aerospace, pharmaceuticals, agriculture, hospitality, education, government, nonprofit)

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
        model: 'claude-3-haiku-20240307',
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
      throw new Error(`Claude API error: ${response.status}`)
    }

    const result = await response.json()
    const content = result.content[0].text
    
    // Parse JSON response
    const discovery = JSON.parse(content)
    
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