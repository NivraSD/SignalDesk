// Test framework generation with actual research history

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'
const conversationId = 'test-' + Date.now()

async function testFrameworkGeneration() {
  console.log('🧪 Testing framework generation with research history...\n')

  // Step 1: Do actual research about OpenAI and education
  console.log('📚 Step 1: Research OpenAI and education...')
  const researchResponse = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/niv-orchestrator-robust', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      message: 'research how OpenAI is being used in education and their new study mode features',
      organizationId: '00000000-0000-0000-0000-000000000000',
      organizationName: 'OpenAI',
      conversationId: conversationId,
      messageHistory: []
    })
  })

  const researchData = await researchResponse.json()
  console.log('✅ Research complete:', {
    success: researchData.success,
    hasResults: !!researchData.toolResults
  })

  // Step 2: Now request a framework (which should use the research from Step 1)
  console.log('\n📋 Step 2: Generate strategic framework using research...')
  const frameworkResponse = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/niv-orchestrator-robust', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      message: 'generate a strategic framework',
      organizationId: '00000000-0000-0000-0000-000000000000',
      organizationName: 'OpenAI',
      conversationId: conversationId, // Same conversation ID to maintain context
      messageHistory: [
        {
          role: 'user',
          content: 'research how OpenAI is being used in education and their new study mode features'
        },
        {
          role: 'assistant',
          content: 'I researched OpenAI education usage and study mode features...'
        }
      ]
    })
  })

  const frameworkData = await frameworkResponse.json()

  console.log('\n🔍 Framework Generation Results:')
  console.log('Status:', frameworkResponse.status)
  console.log('Success:', frameworkData.success)
  console.log('Type:', frameworkData.type)

  if (frameworkData.framework) {
    const framework = frameworkData.framework

    console.log('\n📊 Framework Analysis:')
    console.log('Objective:', framework.strategy?.objective)

    console.log('\n🗞️ Articles in framework:')
    const articles = framework.intelligence?.supporting_data?.articles || []
    articles.slice(0, 5).forEach((article, i) => {
      console.log(`  ${i + 1}. ${article}`)
    })

    console.log('\n🔍 Key Findings:')
    const findings = framework.intelligence?.key_findings || []
    findings.slice(0, 5).forEach((finding, i) => {
      console.log(`  ${i + 1}. ${finding}`)
    })

    // Check if the content is about OpenAI/education or generic frameworks
    const hasOpenAIContent = JSON.stringify(framework).toLowerCase().includes('openai') ||
                            JSON.stringify(framework).toLowerCase().includes('education') ||
                            JSON.stringify(framework).toLowerCase().includes('study mode')

    const hasGenericFramework = JSON.stringify(framework).toLowerCase().includes('traditional frameworks') ||
                                JSON.stringify(framework).toLowerCase().includes('strategic planning')

    console.log('\n✅ Content Check:')
    console.log('Has OpenAI/Education content:', hasOpenAIContent)
    console.log('Has generic framework content:', hasGenericFramework)

    if (hasOpenAIContent && !hasGenericFramework) {
      console.log('\n🎉 SUCCESS: Framework uses actual OpenAI/education research!')
    } else if (hasGenericFramework && !hasOpenAIContent) {
      console.log('\n❌ PROBLEM: Framework still has generic "framework" content, not OpenAI research')
    } else {
      console.log('\n⚠️  MIXED: Framework has both types of content')
    }
  } else {
    console.log('\n❌ No framework returned')
  }
}

testFrameworkGeneration().catch(console.error)