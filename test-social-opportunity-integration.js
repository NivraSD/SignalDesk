// Test Social Opportunity Integration
// Tests the complete flow: Monitor Stage 1 → Orchestrator → Opportunity Detector

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'

async function testIntegration() {
  console.log('🧪 Testing Social Opportunity Integration\n')
  console.log('Step 1: Call Monitor Stage 1 (should collect social signals)\n')

  try {
    const monitorResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/monitor-stage-1`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({
          organization_name: 'Tesla',
          profile: {
            organization_name: 'Tesla',
            industry: 'Electric Vehicles'
          }
        })
      }
    )

    if (!monitorResponse.ok) {
      console.error('❌ Monitor Stage 1 failed:', await monitorResponse.text())
      return
    }

    const monitorData = await monitorResponse.json()
    console.log('✅ Monitor Stage 1 complete:')
    console.log(`   Articles: ${monitorData.articles?.length || 0}`)
    console.log(`   Social signals: ${monitorData.social_signals?.length || 0}`)

    if (monitorData.social_sentiment) {
      console.log(`   Social sentiment: ${monitorData.social_sentiment.overall_sentiment}`)
    }

    if (!monitorData.social_signals || monitorData.social_signals.length === 0) {
      console.log('\n⚠️ No social signals collected. Twitter/Reddit may be rate limited or unavailable.')
      console.log('Testing with mock signals instead...\n')

      // Use mock signals for testing
      monitorData.social_signals = [
        {
          platform: 'twitter',
          type: 'mention',
          content: 'Tesla Cybertruck production is ramping up! Amazing progress. #EV #Tesla',
          author: 'evfan',
          engagement: 1500,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          platform: 'reddit',
          type: 'mention',
          content: 'Tesla quality issues are getting worse. Very disappointed with the build quality.',
          author: 'user1',
          engagement: 200,
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          platform: 'twitter',
          type: 'mention',
          content: 'Tesla service center was awful. Not happy.',
          author: 'user2',
          engagement: 120,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          platform: 'twitter',
          type: 'mention',
          content: 'Tesla delays again. Disappointed.',
          author: 'user3',
          engagement: 90,
          timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString()
        },
        {
          platform: 'twitter',
          type: 'mention',
          content: 'Tesla broke down today. Build quality issues.',
          author: 'user4',
          engagement: 80,
          timestamp: new Date(Date.now() - 2.8 * 60 * 60 * 1000).toISOString()
        }
      ]
    }

    console.log('\nStep 2: Call Opportunity Detector with social signals\n')

    const detectorResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/mcp-opportunity-detector`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
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
          social_signals: monitorData.social_signals
        })
      }
    )

    if (!detectorResponse.ok) {
      console.error('❌ Opportunity Detector failed:', await detectorResponse.text())
      return
    }

    const detectorData = await detectorResponse.json()
    console.log('✅ Opportunity Detector complete:')
    console.log(`   Total opportunities: ${detectorData.opportunities?.length || 0}\n`)

    // Show detected opportunities
    if (detectorData.opportunities && detectorData.opportunities.length > 0) {
      console.log('📊 Detected Opportunities:\n')
      detectorData.opportunities.forEach((opp, idx) => {
        console.log(`${idx + 1}. ${opp.title}`)
        console.log(`   Pattern: ${opp.pattern_matched}`)
        console.log(`   Score: ${opp.score}`)
        console.log(`   Urgency: ${opp.urgency}`)
        console.log(`   Source: ${opp.source || 'news'}`)
        if (opp.context?.source_platforms) {
          console.log(`   Platforms: ${opp.context.source_platforms.join(', ')}`)
        }
        console.log()
      })

      // Count social opportunities
      const socialOpps = detectorData.opportunities.filter(o => o.source === 'social_media')
      console.log(`✅ Success! Detected ${socialOpps.length} social opportunities out of ${detectorData.opportunities.length} total`)
    } else {
      console.log('⚠️ No opportunities detected')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testIntegration()
