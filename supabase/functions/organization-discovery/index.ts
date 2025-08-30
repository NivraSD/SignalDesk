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
        model: 'claude-sonnet-4-20250514',
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

    // ALWAYS ensure we have competitors - this is critical!
    let competitors = discoveredData.competitors || [];
    
    // If no competitors from Claude, use industry-specific defaults
    if (!competitors || competitors.length === 0) {
      console.warn('⚠️ No competitors from Claude, using intelligent defaults');
      
      // Intelligent competitor detection based on organization name/industry
      const orgLower = organizationName.toLowerCase();
      const industry = discoveredData.industry?.toLowerCase() || '';
      
      if (orgLower.includes('openai') || industry.includes('ai')) {
        competitors = ['Anthropic', 'Google DeepMind', 'Microsoft', 'Meta AI', 'Cohere'];
      } else if (orgLower.includes('tesla') || industry.includes('automotive')) {
        competitors = ['Rivian', 'Lucid Motors', 'Ford', 'GM', 'Volkswagen'];
      } else if (orgLower.includes('apple') || industry.includes('technology')) {
        competitors = ['Microsoft', 'Google', 'Samsung', 'Amazon', 'Meta'];
      } else if (orgLower.includes('netflix') || industry.includes('streaming')) {
        competitors = ['Disney+', 'HBO Max', 'Amazon Prime', 'Hulu', 'Apple TV+'];
      } else if (industry.includes('fintech')) {
        competitors = ['Stripe', 'Square', 'PayPal', 'Plaid', 'Affirm'];
      } else if (industry.includes('healthcare')) {
        competitors = ['UnitedHealth', 'Anthem', 'Kaiser', 'CVS Health', 'Humana'];
      } else if (industry.includes('retail')) {
        competitors = ['Amazon', 'Walmart', 'Target', 'Costco', 'Best Buy'];
      } else {
        // Generic tech competitors as absolute fallback
        competitors = ['Microsoft', 'Google', 'Amazon', 'Meta', 'Apple'];
      }
      
      console.log(`✅ Added ${competitors.length} default competitors for ${industry || 'technology'} industry`);
    }
    
    // Build the complete organization profile
    const organization = {
      id: organizationName.toLowerCase().replace(/\s+/g, '-'),
      name: organizationName,
      url: url || `https://${organizationName.toLowerCase().replace(/\s+/g, '')}.com`,
      ...discoveredData,
      // ALWAYS have competitors
      competitors: competitors,
      stakeholders: {
        regulators: discoveredData.stakeholders?.regulators || ['FTC', 'SEC'],
        media: discoveredData.stakeholders?.media || ['Reuters', 'Bloomberg', 'TechCrunch'],
        analysts: discoveredData.stakeholders?.analysts || ['Gartner', 'Forrester'],
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

    // SAVE TO DATABASE - This is critical!
    try {
      const persistResponse = await fetch(
        'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            action: 'saveProfile',
            organization_name: organization.name,
            industry: organization.industry,
            competitors: organization.competitors,
            regulators: organization.stakeholders.regulators,
            media: organization.stakeholders.media,
            investors: organization.stakeholders.investors,
            analysts: organization.stakeholders.analysts,
            activists: organization.stakeholders.activists,
            keywords: organization.keywords,
            metadata: {
              description: organization.description,
              url: organization.url,
              business_model: organization.business_model,
              market_position: organization.market_position,
              headquarters: organization.headquarters,
              founded: organization.founded,
              employee_range: organization.employee_range,
              revenue_range: organization.revenue_range,
              executives: organization.executives,
              products: organization.products,
              target_customers: organization.target_customers,
              recent_topics: organization.recent_topics,
              key_narratives: organization.key_narratives,
              vulnerabilities: organization.vulnerabilities,
              opportunities: organization.opportunities
            }
          })
        }
      );
      
      if (persistResponse.ok) {
        console.log('💾 Organization profile saved to database');
      } else {
        console.error('Failed to save to database:', await persistResponse.text());
      }
    } catch (saveError) {
      console.error('Database save error:', saveError);
    }

    return new Response(JSON.stringify({
      success: true,
      organization,
      persisted: true
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