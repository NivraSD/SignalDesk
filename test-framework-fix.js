// Test that orchestrator doesn't search for "strategic framework" articles

async function testFrameworkFix() {
  console.log('🧪 Testing framework generation fix...\n')

  // First, let's simulate having some existing research in conceptState
  const conceptState = {
    articles: [
      {
        title: "OpenAI launches new Study Mode for education",
        content: "OpenAI announced a new Study Mode feature designed to help students learn more effectively...",
        url: "https://example.com/openai-study-mode"
      },
      {
        title: "How AI is transforming classroom learning",
        content: "Teachers are using AI tools like ChatGPT to personalize education...",
        url: "https://example.com/ai-classroom"
      }
    ],
    keyFindings: [
      "OpenAI has over 200 million weekly active users",
      "Study Mode is designed specifically for educational use cases",
      "Teachers report 40% time savings when using AI tools"
    ],
    synthesis: [
      "OpenAI is positioning itself as a leader in educational AI technology"
    ]
  }

  // Test the orchestrator with "generate a strategic framework"
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

  const response = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/niv-orchestrator-robust', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      message: 'generate a strategic framework',
      organizationId: '00000000-0000-0000-0000-000000000000',
      organizationName: 'OpenAI',
      conversationId: 'test-' + Date.now(),
      conceptState: conceptState, // Pass existing research
      messageHistory: [
        {
          role: 'user',
          content: 'I want to create a campaign about OpenAI study mode for education'
        },
        {
          role: 'assistant',
          content: 'I found information about OpenAI study mode and education trends'
        }
      ]
    })
  })

  const data = await response.json()

  console.log('📊 Response status:', response.status)
  console.log('\n🔍 Full response:', JSON.stringify(data, null, 2))
  console.log('\n🔍 Checking if orchestrator searched for "strategic framework":')

  // Check if the search happened
  if (data.searchResults) {
    console.log('❌ PROBLEM: Orchestrator still searched!')
    console.log('Search query used:', data.searchQuery)
    console.log('Articles found:', data.searchResults.articles?.length || 0)
    if (data.searchResults.articles?.[0]) {
      console.log('First article:', data.searchResults.articles[0].title)
    }
  } else {
    console.log('✅ Good: No search performed')
  }

  // Check what was sent to framework
  console.log('\n📦 What was sent to strategic framework:')
  if (data.strategicFramework) {
    console.log('Framework received research:', {
      articles: data.strategicFramework.intelligence?.supporting_data?.articles?.length || 0,
      keyFindings: data.strategicFramework.intelligence?.key_findings?.length || 0
    })

    if (data.strategicFramework.intelligence?.supporting_data?.articles?.[0]) {
      console.log('Sample article sent to framework:',
        data.strategicFramework.intelligence.supporting_data.articles[0])
    }

    console.log('\nFramework objective:', data.strategicFramework.strategy?.objective)
  }

  console.log('\n🎯 Summary:')
  if (data.searchResults) {
    console.log('❌ Fix not working - orchestrator is still searching for "strategic framework"')
  } else if (data.strategicFramework?.intelligence?.supporting_data?.articles?.[0]?.includes('framework')) {
    console.log('⚠️  Framework still has wrong articles about "frameworks"')
  } else {
    console.log('✅ Fix appears to be working - using existing research')
  }
}

testFrameworkFix().catch(console.error)