const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0MjYzNTYsImV4cCI6MjA0NjAwMjM1Nn0.JEn7zF7G7m8aNJr4HLABqKbVDbvvjugUZvQQg5TKD-o';

async function testIntelligentOrchestrator() {
  console.log('🚀 Testing intelligent NIV Content Orchestrator...\n');

  // Test 1: Simple single content
  console.log('Test 1: Simple blog post generation');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        prompt: 'Write a blog post about the importance of AI in modern business',
        contentType: 'blog-post',
        organization: {
          id: 'test-org',
          name: 'Test Organization'
        },
        mode: 'single'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Response received');
      console.log('Full result:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Error:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n---\n');

  // Test 2: Media plan generation
  console.log('Test 2: Media plan generation');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        prompt: 'Create a media plan for our Series B funding announcement',
        contentType: 'media-plan',
        organization: {
          id: 'test-org',
          name: 'Test Organization'
        },
        mode: 'campaign'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Media plan generated:', {
        type: result.type,
        components: result.components ? Object.keys(result.components) : [],
        hasStrategy: !!result.strategy,
        hasAssets: !!result.assets
      });
    } else {
      console.log('❌ Error:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n---\n');

  // Test 3: Content suite generation
  console.log('Test 3: Content suite for product launch');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        prompt: 'Create a complete content suite for our new AI assistant product launch',
        contentType: 'product-launch',
        conversation: [
          { role: 'user', content: 'We need content for our AI assistant launch' },
          { role: 'assistant', content: 'I can help create comprehensive launch content.' },
          { role: 'user', content: 'Focus on developer audience and technical capabilities' }
        ],
        organization: {
          id: 'test-org',
          name: 'Test Organization'
        },
        mode: 'suite'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Content suite generated:', {
        type: result.type,
        contentItems: result.components?.length || 0,
        hasStrategy: !!result.strategy
      });

      if (result.components) {
        console.log('Generated assets:');
        result.components.forEach((item, i) => {
          console.log(`  ${i + 1}. ${item.type}: ${item.title || 'Generated'}`);
        });
      }
    } else {
      console.log('❌ Error:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run tests
testIntelligentOrchestrator();