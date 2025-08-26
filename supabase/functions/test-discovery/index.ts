import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { organizationName } = await req.json();
    console.log(`Testing discovery for: ${organizationName}`);

    // Return mock data to test the pipeline
    const mockOrganization = {
      id: organizationName.toLowerCase().replace(/\s+/g, '-'),
      name: organizationName,
      industry: 'Technology',
      description: `${organizationName} is a leading technology company.`,
      competitors: ['Anthropic', 'Google DeepMind', 'Microsoft', 'Cohere', 'Stability AI'],
      executives: [
        { name: 'Sam Altman', role: 'CEO' },
        { name: 'Greg Brockman', role: 'President' },
        { name: 'Mira Murati', role: 'CTO' }
      ],
      products: ['GPT-4', 'DALL-E 3', 'ChatGPT', 'Codex'],
      stakeholders: {
        regulators: ['FTC', 'SEC', 'EU Commission', 'UK CMA'],
        media: ['TechCrunch', 'The Information', 'Wired', 'MIT Tech Review', 'Reuters'],
        analysts: ['Gartner', 'Forrester', 'IDC', 'CB Insights'],
        investors: ['Microsoft', 'Khosla Ventures', 'Reid Hoffman', 'Thrive Capital'],
        partners: ['Microsoft', 'Bain & Company', 'Scale AI'],
        critics: ['Center for AI Safety', 'AI Now Institute', 'Future of Humanity Institute']
      },
      keywords: [organizationName, 'AI', 'artificial intelligence', 'machine learning', 'GPT'],
      recent_topics: [
        'GPT-4 Turbo launch',
        'Board governance changes',
        'Safety concerns',
        'Microsoft partnership',
        'EU AI Act compliance'
      ],
      market_position: 'Leader',
      headquarters: 'San Francisco, CA',
      founded: '2015',
      employee_range: '500-1000',
      key_narratives: [
        'AI safety and alignment',
        'Democratizing AI',
        'AGI development'
      ],
      vulnerabilities: [
        'Regulatory scrutiny',
        'Competition from open source',
        'Talent retention'
      ],
      opportunities: [
        'Enterprise AI adoption',
        'Vertical AI applications',
        'International expansion'
      ]
    };

    return new Response(JSON.stringify({
      success: true,
      organization: mockOrganization,
      source: 'mock_data'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});