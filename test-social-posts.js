const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0MjYzNTYsImV4cCI6MjA0NjAwMjM1Nn0.JEn7zF7G7m8aNJr4HLABqKbVDbvvjugUZvQQg5TKD-o';

async function testSocialPosts() {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        tool: 'generate_social_posts',
        arguments: {
          message: 'Announcing our new AI-powered content creation platform',
          platforms: ['twitter', 'linkedin'],
          variations: 3
        },
        conversation: []
      })
    });

    console.log('Response status:', response.status);
    const data = await response.text();
    console.log('Response:', data);

    if (response.ok) {
      const jsonData = JSON.parse(data);
      console.log('\n✅ Social posts generated successfully!');
      console.log(JSON.stringify(jsonData, null, 2));
    } else {
      console.error('❌ Error:', data);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSocialPosts();