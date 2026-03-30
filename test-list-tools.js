const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0MjYzNTYsImV4cCI6MjA0NjAwMjM1Nn0.JEn7zF7G7m8aNJr4HLABqKbVDbvvjugUZvQQg5TKD-o';

async function listTools() {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        tool: 'list_tools',
        arguments: {},
        conversation: []
      })
    });

    console.log('Response status:', response.status);
    const data = await response.text();

    try {
      const jsonData = JSON.parse(data);
      if (jsonData.tools) {
        console.log('\nAvailable tools:');
        jsonData.tools.forEach(tool => {
          console.log(`- ${tool.name}`);
        });

        // Check specifically for social posts
        const hasSocialPosts = jsonData.tools.some(t => t.name === 'generate_social_posts');
        console.log('\n✅ Has generate_social_posts:', hasSocialPosts);
      }
    } catch (e) {
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

listTools();