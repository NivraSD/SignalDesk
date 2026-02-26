const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0MjYzNTYsImV4cCI6MjA0NjAwMjM1Nn0.JEn7zF7G7m8aNJr4HLABqKbVDbvvjugUZvQQg5TKD-o';

async function testSocialGeneration() {
  console.log('🚀 Testing social post generation...\n');

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
          topic: "SignalDesk V3 launch - AI-powered PR platform",
          target_audience: "PR professionals and marketing teams",
          key_messages: [
            "Revolutionary AI-powered PR intelligence",
            "Real-time media monitoring and insights",
            "Automated content generation"
          ],
          tone: "professional, exciting",
          platforms: ["twitter", "linkedin"]
        },
        conversation: []
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
      console.log('\n✅ Social posts generated successfully!\n');

      if (data.posts.twitter?.length > 0) {
        console.log('📱 Twitter Posts:');
        data.posts.twitter.forEach((post, i) => {
          console.log(`\nPost ${i + 1} (${post.length} chars):`);
          console.log(post);
          console.log('-'.repeat(50));
        });
      }

      if (data.posts.linkedin?.length > 0) {
        console.log('\n💼 LinkedIn Posts:');
        data.posts.linkedin.forEach((post, i) => {
          console.log(`\nPost ${i + 1} (${post.length} chars):`);
          console.log(post);
          console.log('-'.repeat(50));
        });
      }

      // Test the format that ContentWorkspace expects
      const versions = [
        ...(data.posts.twitter || []).map(post => ({
          platform: 'Twitter',
          content: post,
          characterCount: post.length,
          limits: { min: 1, max: 280 }
        })),
        ...(data.posts.linkedin || []).map(post => ({
          platform: 'LinkedIn',
          content: post,
          characterCount: post.length,
          limits: { min: 1, max: 3000 }
        }))
      ];

      console.log('\n📊 Formatted for UI:');
      console.log('Total versions:', versions.length);
      versions.forEach(v => {
        console.log(`- ${v.platform}: ${v.characterCount} chars`);
      });

    } else {
      console.log('❌ Error:', data.error || 'No posts in response');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSocialGeneration();