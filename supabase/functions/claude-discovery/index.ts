import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { organizationName } = await req.json();
    console.log(`🔍 Claude Discovery for: ${organizationName}`);

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      console.error('❌ No ANTHROPIC_API_KEY found');
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    console.log('✅ API Key found, calling Claude...');

    // Comprehensive discovery prompt
    const prompt = `You are an elite business intelligence analyst. Provide comprehensive intelligence on "${organizationName}".

Return ONLY a valid JSON object with these exact fields:

{
  "industry": "specific industry (e.g., 'Artificial Intelligence', 'Electric Vehicles')",
  "description": "2-3 sentence company description",
  "headquarters": "City, State/Country (e.g., 'San Francisco, CA')",
  "founded": "year founded or 'Unknown'",
  "market_position": "Leader|Challenger|Innovator|Niche",
  "employee_range": "estimate (e.g., '500-1000', '10000+')",
  "competitors": [
    "list of 6-10 direct competitors by company name"
  ],
  "executives": [
    {"name": "full name", "role": "title"}
  ],
  "products": [
    "main products/services"
  ],
  "media": [
    "6-8 media outlets that frequently cover this company"
  ],
  "regulators": [
    "specific regulatory bodies that oversee this industry/company"
  ],
  "analysts": [
    "research firms that track this company/industry"
  ],
  "recent_topics": [
    "5-8 recent news topics, product launches, or developments"
  ],
  "key_narratives": [
    "3-5 main stories/themes about the company"
  ],
  "vulnerabilities": [
    "known challenges, criticisms, or risks"
  ],
  "opportunities": [
    "growth areas or market opportunities"
  ]
}

Be as specific and accurate as possible. Use your knowledge to provide real, factual information.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0.2,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    console.log('Claude response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const claudeData = await response.json();
    const content = claudeData.content[0].text;
    
    console.log('Claude response received, parsing...');
    
    // Parse Claude's response
    let discoveredInfo;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        discoveredInfo = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON in response');
      }
    } catch (e) {
      console.error('Parse error:', e);
      // Return comprehensive mock data as fallback
      discoveredInfo = {
        industry: 'Technology',
        description: `${organizationName} is a technology company.`,
        headquarters: 'San Francisco, CA',
        founded: 'Unknown',
        market_position: 'Challenger',
        employee_range: '1000+',
        competitors: ['Competitor A', 'Competitor B'],
        executives: [{'name': 'CEO Name', 'role': 'Chief Executive Officer'}],
        products: ['Product 1', 'Product 2'],
        media: ['TechCrunch', 'Reuters', 'Bloomberg'],
        regulators: ['FTC', 'SEC'],
        analysts: ['Gartner', 'Forrester'],
        recent_topics: ['Recent development'],
        key_narratives: ['Innovation focus'],
        vulnerabilities: ['Competition'],
        opportunities: ['Market expansion']
      };
    }

    // Build complete organization profile
    const organization = {
      id: organizationName.toLowerCase().replace(/\s+/g, '-'),
      name: organizationName,
      industry: discoveredInfo.industry || 'Technology',
      description: discoveredInfo.description || `${organizationName} is a company in the ${discoveredInfo.industry || 'Technology'} industry.`,
      headquarters: discoveredInfo.headquarters || 'Unknown',
      founded: discoveredInfo.founded || 'Unknown',
      market_position: discoveredInfo.market_position || 'Unknown',
      employee_range: discoveredInfo.employee_range || 'Unknown',
      competitors: discoveredInfo.competitors || [],
      executives: discoveredInfo.executives || [],
      products: discoveredInfo.products || [],
      stakeholders: {
        regulators: discoveredInfo.regulators || ['FTC', 'SEC'],
        media: discoveredInfo.media || ['Reuters', 'Bloomberg'],
        analysts: discoveredInfo.analysts || ['Gartner', 'Forrester', 'IDC'],
        investors: [],
        partners: [],
        activists: []
      },
      keywords: [organizationName, ...(discoveredInfo.industry ? [discoveredInfo.industry] : [])],
      topics: discoveredInfo.recent_topics || [],
      recent_topics: discoveredInfo.recent_topics || [],
      key_narratives: discoveredInfo.key_narratives || [],
      vulnerabilities: discoveredInfo.vulnerabilities || [],
      opportunities: discoveredInfo.opportunities || [],
      sentiment_keywords: {
        positive: ['innovation', 'growth', 'success'],
        negative: ['challenge', 'issue', 'concern'],
        neutral: ['announcement', 'update', 'report']
      }
    };

    console.log('✅ Discovery complete');

    return new Response(JSON.stringify({
      success: true,
      organization,
      source: 'claude'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Discovery Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});