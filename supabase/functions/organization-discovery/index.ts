import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * ORGANIZATION DISCOVERY
 * Uses Claude to discover everything about an organization from just its name
 * This is the CRITICAL first step that populates all the data
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { organizationName, url } = await req.json();
    console.log(`🔍 Discovering everything about: ${organizationName}`);

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Call Claude to discover EVERYTHING
    const discoveryPrompt = `You are an elite business intelligence analyst. I need you to discover everything about ${organizationName}.

Based on your knowledge, provide a comprehensive profile in JSON format with these exact fields:

{
  "industry": "specific industry classification",
  "description": "2-3 sentence company description",
  "business_model": "B2B/B2C/B2B2C/Platform/etc",
  "competitors": ["list of 5-10 direct competitors"],
  "executives": [
    {"name": "exec name", "role": "title"}
  ],
  "products": ["main products/services"],
  "target_customers": ["customer segments"],
  "recent_topics": ["recent news topics, launches, controversies"],
  "stakeholders": {
    "regulators": ["specific regulatory bodies that oversee them"],
    "media": ["media outlets that frequently cover them"],
    "analysts": ["analyst firms that track them"],
    "investors": ["known major investors"],
    "partners": ["key technology or business partners"],
    "critics": ["known critics or watchdog groups"]
  },
  "keywords": ["keywords for monitoring"],
  "market_position": "Leader/Challenger/Innovator/Niche",
  "headquarters": "location",
  "founded": "year or approximate",
  "employee_range": "approximate employee count",
  "revenue_range": "if public, revenue range",
  "key_narratives": ["main narratives about the company"],
  "vulnerabilities": ["known challenges or criticisms"],
  "opportunities": ["growth areas or opportunities"]
}

For ${organizationName}, be as specific and accurate as possible. If it's a well-known company, use your knowledge. If unknown, make intelligent inferences based on the name.`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: discoveryPrompt
        }]
      })
    });

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const content = claudeData.content[0].text;
    
    // Parse Claude's JSON response
    let discoveredData;
    try {
      // Extract JSON from Claude's response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        discoveredData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in Claude response');
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', content);
      // Fallback to basic structure
      discoveredData = {
        industry: 'Technology',
        competitors: [],
        executives: [],
        stakeholders: {
          regulators: ['FTC', 'SEC'],
          media: ['TechCrunch', 'Reuters'],
          analysts: ['Gartner'],
          investors: [],
          partners: [],
          critics: []
        }
      };
    }

    // Build the complete organization profile
    const organization = {
      id: organizationName.toLowerCase().replace(/\s+/g, '-'),
      name: organizationName,
      url: url || `https://${organizationName.toLowerCase().replace(/\s+/g, '')}.com`,
      ...discoveredData,
      // Ensure all required fields exist
      competitors: discoveredData.competitors || [],
      stakeholders: {
        regulators: discoveredData.stakeholders?.regulators || ['FTC', 'SEC'],
        media: discoveredData.stakeholders?.media || ['Reuters', 'Bloomberg'],
        analysts: discoveredData.stakeholders?.analysts || ['Gartner'],
        investors: discoveredData.stakeholders?.investors || [],
        partners: discoveredData.stakeholders?.partners || [],
        activists: discoveredData.stakeholders?.critics || []
      },
      keywords: discoveredData.keywords || [organizationName],
      topics: discoveredData.recent_topics || [],
      sentiment_keywords: {
        positive: ['innovation', 'growth', 'leader', 'breakthrough'],
        negative: ['controversy', 'lawsuit', 'criticism', 'concern'],
        neutral: ['announcement', 'update', 'report']
      },
      monitoring: {
        enabled: true,
        frequency: 'realtime',
        alerts: true
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('✅ Discovery complete:', {
      name: organization.name,
      industry: organization.industry,
      competitors: organization.competitors.length,
      executives: organization.executives?.length || 0,
      media: organization.stakeholders.media.length
    });

    return new Response(JSON.stringify({
      success: true,
      organization
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Discovery Error:', error);
    
    // Return a basic structure even on error
    const fallbackOrg = {
      id: 'unknown',
      name: 'Unknown Organization',
      industry: 'Technology',
      competitors: [],
      stakeholders: {
        regulators: ['FTC', 'SEC'],
        media: ['Reuters', 'TechCrunch'],
        analysts: ['Gartner'],
        investors: [],
        partners: [],
        activists: []
      },
      keywords: [],
      topics: []
    };

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      organization: fallbackOrg
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});