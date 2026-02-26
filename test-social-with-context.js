const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0MjYzNTYsImV4cCI6MjA0NjAwMjM1Nn0.JEn7zF7G7m8aNJr4HLABqKbVDbvvjugUZvQQg5TKD-o';

async function testSocialWithContext() {
  console.log('🚀 Testing social post generation WITH context...\n');

  // Simulate conversation history
  const conversation = [
    {
      role: 'user',
      content: 'I want to announce that our company just raised $50M in Series B funding led by Sequoia Capital'
    },
    {
      role: 'assistant',
      content: 'That\'s fantastic news! I can help you create social posts for this announcement.'
    },
    {
      role: 'user',
      content: 'Focus on how we will use the funds to expand our AI capabilities and hire 100 new engineers'
    }
  ];

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
          message: 'Create announcement posts about our Series B funding',
          topic: 'Series B Funding Announcement',
          target_audience: 'Tech community, investors, potential employees',
          key_messages: [
            '$50M Series B led by Sequoia Capital',
            'Expanding AI capabilities',
            'Hiring 100 new engineers'
          ],
          tone: 'excited, professional',
          platforms: ['twitter', 'linkedin']
        },
        conversation: conversation
      })
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }

    const data = await response.json();

    if (data.posts) {
      console.log('\n✅ Social posts generated WITH context!\n');

      if (data.posts.twitter?.length > 0) {
        console.log('📱 Twitter Posts:');
        data.posts.twitter.forEach((post, i) => {
          console.log(`\nPost ${i + 1}:`);
          console.log(post);
          // Check if funding amount is mentioned
          if (post.includes('50M') || post.includes('Series B')) {
            console.log('✓ Contains funding context');
          }
          if (post.includes('engineer') || post.includes('AI')) {
            console.log('✓ Contains expansion context');
          }
        });
      }

      if (data.posts.linkedin?.length > 0) {
        console.log('\n💼 LinkedIn Posts:');
        data.posts.linkedin.forEach((post, i) => {
          console.log(`\nPost ${i + 1}:`);
          console.log(post.substring(0, 500) + '...');
          // Check context
          if (post.includes('50M') || post.includes('Series B')) {
            console.log('✓ Contains funding context');
          }
          if (post.includes('engineer') || post.includes('AI')) {
            console.log('✓ Contains expansion context');
          }
        });
      }
    } else {
      console.log('❌ Error:', data.error || 'No posts in response');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Wait for deployment to propagate
setTimeout(testSocialWithContext, 5000);