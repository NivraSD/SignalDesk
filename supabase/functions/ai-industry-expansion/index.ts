import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { organization_name, website, description, current_categories } = await req.json()
    
    console.log(`🧠 AI Industry Expansion for: ${organization_name}`)
    console.log(`🌐 Website: ${website}`)
    
    // Use Claude to analyze and expand industry categorization
    const industryAnalysis = await analyzeOrganizationWithAI(
      organization_name, 
      website, 
      description, 
      current_categories
    )
    
    return new Response(
      JSON.stringify({
        success: true,
        organization: organization_name,
        analysis: industryAnalysis,
        generated_at: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
    
  } catch (error) {
    console.error('AI Industry Expansion error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    )
  }
})

async function analyzeOrganizationWithAI(orgName: string, website: string, description: string, currentCategories: any[]) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const systemPrompt = `You are an expert business analyst specializing in industry categorization and competitive intelligence. Your task is to analyze organizations and provide comprehensive industry insights.

For each organization, provide:
1. Primary industry and 2-3 subcategories
2. Direct competitors (10-15 companies)
3. Adjacent/related competitors (5-10 companies)
4. Key stakeholder groups (8-12 groups)
5. Industry events and conferences (5-8 events)
6. Relevant media outlets and publications (8-12 sources)
7. Critical keywords for monitoring (15-20 keywords)
8. Trending topics in this industry (5-8 topics)
9. Regulatory bodies and key decision makers
10. Supply chain and ecosystem players

Be extremely specific and accurate. Avoid generic tech company defaults.

Return a valid JSON object with this exact structure:
{
  "primary_industry": "string",
  "subcategories": ["category1", "category2", "category3"],
  "direct_competitors": ["company1", "company2", ...],
  "adjacent_competitors": ["company1", "company2", ...],
  "stakeholder_groups": ["group1", "group2", ...],
  "industry_events": [
    {"name": "Event Name", "type": "conference", "frequency": "annual"},
    ...
  ],
  "media_outlets": [
    {"name": "Publication", "type": "trade", "focus": "industry_segment"},
    ...
  ],
  "monitoring_keywords": ["keyword1", "keyword2", ...],
  "trending_topics": ["topic1", "topic2", ...],
  "regulatory_bodies": ["body1", "body2", ...],
  "ecosystem_players": {
    "suppliers": ["supplier1", "supplier2", ...],
    "partners": ["partner1", "partner2", ...],
    "customers": ["customer_type1", "customer_type2", ...]
  }
}`

  const analysisPrompt = `Analyze this organization:

Organization: ${orgName}
Website: ${website || 'Not provided'}
Description: ${description || 'Not provided'}

Current categories detected: ${JSON.stringify(currentCategories, null, 2)}

Provide a comprehensive industry analysis for this organization. Focus on the specific industry this company operates in - DO NOT default to technology unless it's actually a tech company.

Examples:
- KARV Global (karv.global) = Public Relations/Communications agency
- Amplify (weareamplify.com) = Events/Experiential Marketing agency  
- McKinsey = Management consulting  
- Goldman Sachs = Investment banking
- Toyota = Automotive manufacturing
- Starbucks = Food & beverage retail

IMPORTANT: Be very careful with naming. Companies with names like "Amplify" are often marketing/events companies, NOT education companies. Always analyze the actual business model from the website/description.

Analyze the actual business model and industry, then provide the detailed JSON structure requested.`

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
        max_tokens: 2000,
        temperature: 0.1,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: analysisPrompt
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', errorText)
      throw new Error(`Claude API error: ${response.status}`)
    }

    const result = await response.json()
    const content = result.content[0].text
    
    // Parse the JSON response
    try {
      // Try to extract JSON from the response even if it has extra text
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const industryAnalysis = JSON.parse(jsonMatch[0]);
        console.log('✅ AI Industry Analysis completed');
        return industryAnalysis;
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', content);
      console.error('Parse error:', parseError.message);
      
      // Return a smart fallback based on organization name
      return getSmartFallback(orgName, website);
    }
  } catch (error) {
    console.error('Claude API call failed:', error)
    throw error
  }
}

function getSmartFallback(orgName: string, website: string): any {
  const name = orgName.toLowerCase();
  const url = (website || '').toLowerCase();
  
  // PR/Communications agencies
  if (name.includes('karv') || name.includes('pr') || name.includes('communications') || 
      url.includes('pr') || url.includes('comm')) {
    return {
      primary_industry: 'public_relations',
      subcategories: ['communications', 'media_relations', 'crisis_communications'],
      direct_competitors: ['Edelman', 'Weber Shandwick', 'Ogilvy PR', 'FleishmanHillard', 'Ketchum'],
      adjacent_competitors: ['WPP', 'Omnicom', 'Publicis', 'IPG', 'Havas'],
      stakeholder_groups: ['clients', 'media', 'influencers', 'industry_analysts', 'employees'],
      industry_events: [
        {name: 'PRSA International Conference', type: 'conference', frequency: 'annual'},
        {name: 'Global Alliance Summit', type: 'summit', frequency: 'annual'}
      ],
      media_outlets: [
        {name: 'PR Week', type: 'trade', focus: 'public_relations'},
        {name: 'PR Daily', type: 'trade', focus: 'communications'}
      ],
      monitoring_keywords: ['public relations', 'PR agency', 'communications', 'media relations', 'crisis communications'],
      trending_topics: ['digital PR', 'influencer relations', 'crisis management', 'brand reputation'],
      regulatory_bodies: ['FTC', 'SEC'],
      ecosystem_players: {
        suppliers: ['media monitoring services', 'press release services'],
        partners: ['advertising agencies', 'marketing firms'],
        customers: ['corporations', 'nonprofits', 'government agencies']
      }
    };
  }
  
  // Events/Experiential Marketing
  if (name.includes('amplify') || name.includes('events') || name.includes('experiential') || 
      url.includes('event') || name.includes('activation') || name.includes('experience')) {
    return {
      primary_industry: 'events_marketing',
      subcategories: ['event_planning', 'experiential_marketing', 'brand_activation'],
      direct_competitors: ['Freeman', 'Encore', 'Cvent', 'George P. Johnson', 'Opus Agency', 'Sparks'],
      adjacent_competitors: ['Eventbrite', 'Bizzabo', 'Splash', 'Hopin', 'Aventri'],
      stakeholder_groups: ['event_organizers', 'brand_marketers', 'event_venues', 'event_sponsors', 'attendees'],
      industry_events: [
        {name: 'IMEX America', type: 'trade_show', frequency: 'annual'},
        {name: 'Event Tech Live', type: 'conference', frequency: 'annual'}
      ],
      media_outlets: [
        {name: 'BizBash', type: 'trade', focus: 'events_marketing'},
        {name: 'Event Manager Blog', type: 'trade', focus: 'event_planning'}
      ],
      monitoring_keywords: ['events marketing', 'experiential marketing', 'brand activation', 'event planning', 'event production'],
      trending_topics: ['hybrid events', 'virtual events', 'event technology', 'experiential campaigns'],
      regulatory_bodies: ['ILEA', 'PCMA', 'MPI'],
      ecosystem_players: {
        suppliers: ['event venues', 'AV providers', 'catering services'],
        partners: ['marketing agencies', 'brand activation firms'],
        customers: ['corporations', 'brands', 'associations']
      }
    };
  }
  
  // Management consulting
  if (name.includes('mckinsey') || name.includes('consulting') || name.includes('advisory')) {
    return {
      primary_industry: 'management_consulting',
      subcategories: ['strategy_consulting', 'operations_consulting', 'digital_transformation'],
      direct_competitors: ['McKinsey', 'BCG', 'Bain', 'Deloitte', 'PwC', 'EY', 'KPMG'],
      adjacent_competitors: ['Accenture', 'IBM Consulting', 'Capgemini'],
      stakeholder_groups: ['Fortune_500_companies', 'government_agencies', 'private_equity', 'consultants'],
      industry_events: [],
      media_outlets: [],
      monitoring_keywords: ['management consulting', 'strategy', 'digital transformation'],
      trending_topics: ['AI transformation', 'sustainability consulting', 'remote work strategy'],
      regulatory_bodies: [],
      ecosystem_players: { suppliers: [], partners: [], customers: [] }
    };
  }
  
  // Default fallback
  return {
    primary_industry: 'professional_services',
    subcategories: ['general'],
    direct_competitors: [],
    adjacent_competitors: [],
    stakeholder_groups: ['clients', 'employees', 'partners', 'regulators'],
    industry_events: [],
    media_outlets: [],
    monitoring_keywords: [name],
    trending_topics: [],
    regulatory_bodies: [],
    ecosystem_players: { suppliers: [], partners: [], customers: [] }
  };
}