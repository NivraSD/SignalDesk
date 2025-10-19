// Direct test of intelligence-orchestrator-v2
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.1PWNlcSU5y75-J7eTGlwDslki1JSjyj1QQvx8LpJLcc';

async function testOrchestrator() {
  console.log('Testing Intelligence Orchestrator V2...');

  try {
    // Minimal test payload
    const payload = {
      organization_name: 'Tesla',
      organization: { name: 'Tesla', industry: 'Automotive' },
      profile: {
        organization_name: 'Tesla',
        competition: {
          direct_competitors: ['Ford', 'GM', 'Toyota']
        },
        stakeholders: {
          regulators: ['NHTSA', 'EPA']
        },
        topics: ['electric vehicles', 'autonomous driving']
      },
      monitoring_data: {
        findings: [
          {
            title: 'Test Article 1',
            description: 'Ford announces new EV model',
            url: 'https://example.com/1',
            source: 'Test',
            pr_relevance_score: 80
          },
          {
            title: 'Test Article 2',
            description: 'Tesla production update',
            url: 'https://example.com/2',
            source: 'Test',
            pr_relevance_score: 90
          }
        ]
      },
      skip_enrichment: false,
      skip_opportunity_engine: true, // Skip opportunity engine to isolate issue
      articles_limit: 2
    };

    console.log('Sending request to orchestrator...');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${SUPABASE_URL}/functions/v1/intelligence-orchestrator-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('Success! Result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testOrchestrator();
