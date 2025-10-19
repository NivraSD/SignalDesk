// Test Social Opportunity Detection

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

// Mock social signals for testing
const mockSocialSignals = [
  // Scenario 1: Viral competitor post
  {
    platform: 'twitter',
    type: 'mention',
    content: 'Just saw SpaceX announce their new Starship launch date! Amazing progress. #Space #Innovation',
    author: 'techinfluencer',
    engagement: 5000,
    metrics: { likes: 3000, retweets: 1500, replies: 500 },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  // Scenario 2: Negative sentiment about our brand
  {
    platform: 'twitter',
    type: 'mention',
    content: 'Tesla autopilot failed again today. This is getting terrible. Very disappointed.',
    author: 'user1',
    engagement: 150,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    platform: 'reddit',
    type: 'mention',
    content: 'Another Tesla quality issue. The build quality is really frustrating.',
    author: 'user2',
    engagement: 200,
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
  },
  {
    platform: 'twitter',
    type: 'mention',
    content: 'Tesla service center experience was awful. So angry right now.',
    author: 'user3',
    engagement: 80,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    platform: 'twitter',
    type: 'mention',
    content: 'Tesla delays again. This is the worst customer experience.',
    author: 'user4',
    engagement: 120,
    timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString()
  },
  {
    platform: 'twitter',
    type: 'mention',
    content: 'Tesla broke down. Disappointed with the quality.',
    author: 'user5',
    engagement: 90,
    timestamp: new Date(Date.now() - 2.8 * 60 * 60 * 1000).toISOString()
  },
  // Scenario 3: Trending hashtag
  {
    platform: 'twitter',
    type: 'mention',
    content: 'The future of #EVs is here! #ElectricVehicles #CleanEnergy',
    author: 'user6',
    engagement: 50,
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    platform: 'twitter',
    type: 'mention',
    content: 'Just bought my first #EVs! Love the #ElectricVehicles movement',
    author: 'user7',
    engagement: 40,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    platform: 'twitter',
    type: 'mention',
    content: '#EVs are the future. #ElectricVehicles changing everything',
    author: 'user8',
    engagement: 60,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    platform: 'twitter',
    type: 'mention',
    content: 'Charging my #EVs at home! #ElectricVehicles',
    author: 'user9',
    engagement: 30,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    platform: 'twitter',
    type: 'mention',
    content: 'Road trip in my #EVs! #ElectricVehicles',
    author: 'user10',
    engagement: 35,
    timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
  },
  // Scenario 4: Influencer mention
  {
    platform: 'twitter',
    type: 'mention',
    content: 'The electric vehicle market is heating up. Lots of innovation happening. Thoughts on where the industry is headed?',
    author: 'elonmusk',
    author_verified: true,
    engagement: 15000,
    metrics: { likes: 10000, retweets: 3000, replies: 2000 },
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  // Scenario 5: Product launch
  {
    platform: 'twitter',
    type: 'mention',
    content: 'Rivian just announcing their new R2 platform! Launching next year. Excited to see more competition in the EV space.',
    author: 'autoblogger',
    engagement: 800,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    platform: 'reddit',
    type: 'mention',
    content: 'Rivian unveiling new vehicle lineup. The launch event was impressive.',
    author: 'reddituser',
    engagement: 600,
    timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString()
  },
  {
    platform: 'twitter',
    type: 'mention',
    content: 'Just watched the Rivian product reveal. Introducing some interesting features.',
    author: 'evfan',
    engagement: 400,
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
  }
]

async function testSocialOpportunityDetection() {
  console.log('🧪 Testing Social Opportunity Detection\n')
  console.log(`📊 Mock signals: ${mockSocialSignals.length}`)
  console.log('Scenarios:')
  console.log('  - Viral competitor post (5000 engagement)')
  console.log('  - Negative sentiment spike (5 negative mentions)')
  console.log('  - Trending hashtag #EVs (5 mentions)')
  console.log('  - Influencer mention (15000 engagement)')
  console.log('  - Competitor product launch (3 mentions)\n')

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/mcp-opportunity-detector`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          organization_id: 'tesla-test',
          organization_name: 'Tesla',
          enriched_data: {
            organized_intelligence: {
              events: [],
              entities: [],
              topic_clusters: []
            }
          },
          social_signals: mockSocialSignals
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Error:', data.error)
      return
    }

    console.log(`✅ Response received\n`)
    console.log(`📊 Total opportunities detected: ${data.opportunities.length}\n`)

    // Show each opportunity
    data.opportunities.forEach((opp, idx) => {
      console.log(`${'='.repeat(60)}`)
      console.log(`Opportunity ${idx + 1}: ${opp.title}`)
      console.log(`${'='.repeat(60)}`)
      console.log(`Pattern: ${opp.pattern_matched}`)
      console.log(`Score: ${opp.score}`)
      console.log(`Urgency: ${opp.urgency}`)
      console.log(`Time Window: ${opp.time_window}`)
      console.log(`Category: ${opp.category}`)
      console.log(`\nDescription:`)
      console.log(opp.description)
      console.log(`\nRecommended Action:`)
      console.log(`  Primary: ${opp.recommended_action.what.primary_action}`)
      console.log(`  Owner: ${opp.recommended_action.who.owner}`)
      console.log(`  Launch: ${opp.recommended_action.when.ideal_launch}`)
      console.log(`  Platforms: ${opp.recommended_action.where.platforms.join(', ')}`)

      if (opp.context?.source_platforms) {
        console.log(`\nSource Platforms: ${opp.context.source_platforms.join(', ')}`)
      }

      console.log('\n')
    })

    // Summary by pattern
    const patternCounts = {}
    data.opportunities.forEach(opp => {
      patternCounts[opp.pattern_matched] = (patternCounts[opp.pattern_matched] || 0) + 1
    })

    console.log(`${'='.repeat(60)}`)
    console.log('Summary by Pattern:')
    console.log(`${'='.repeat(60)}`)
    Object.entries(patternCounts).forEach(([pattern, count]) => {
      console.log(`  ${pattern}: ${count}`)
    })

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testSocialOpportunityDetection()