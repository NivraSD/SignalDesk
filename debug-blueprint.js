// Debug script to check for duplicates in blueprint
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

async function checkForDuplicates() {
  // Get the most recent campaign with a blueprint
  const { data: sessions, error } = await supabase
    .from('campaign_builder_sessions')
    .select('id, blueprint')
    .not('blueprint', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching session:', error)
    return
  }

  if (!sessions || sessions.length === 0) {
    console.log('No sessions found with blueprints')
    return
  }

  const blueprint = sessions[0].blueprint
  const sessionId = sessions[0].id

  console.log(`\nAnalyzing session: ${sessionId}`)
  console.log('='.repeat(80))

  const plans = blueprint.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans || []

  console.log(`\nTotal stakeholders: ${plans.length}`)

  plans.forEach((plan, planIdx) => {
    const stakeholderName = plan.stakeholder?.name || 'Unknown'
    console.log(`\n${'─'.repeat(80)}`)
    console.log(`Stakeholder ${planIdx + 1}: ${stakeholderName}`)
    console.log(`  Priority: ${plan.stakeholder?.priority || 'N/A'}`)
    console.log(`  Influence Levers: ${plan.influenceLevers?.length || 0}`)

    plan.influenceLevers?.forEach((lever, leverIdx) => {
      console.log(`\n  Lever ${leverIdx + 1} (Priority ${lever.priority}): ${lever.leverName}`)

      const campaign = lever.campaign
      const mediaPitchCount = campaign?.mediaPitches?.length || 0
      const socialPostCount = campaign?.socialPosts?.length || 0
      const thoughtLeadershipCount = campaign?.thoughtLeadership?.length || 0
      const additionalTacticsCount = campaign?.additionalTactics?.length || 0

      console.log(`    Media Pitches: ${mediaPitchCount}`)
      console.log(`    Social Posts: ${socialPostCount}`)
      console.log(`    Thought Leadership: ${thoughtLeadershipCount}`)
      console.log(`    Additional Tactics: ${additionalTacticsCount}`)

      // Check for duplicate media pitches
      if (campaign?.mediaPitches && campaign.mediaPitches.length > 0) {
        const pitchSignatures = campaign.mediaPitches.map(p => `${p.who}|${p.outlet}|${p.what}`)
        const uniquePitches = new Set(pitchSignatures)
        if (pitchSignatures.length !== uniquePitches.size) {
          console.log(`    ⚠️  DUPLICATE MEDIA PITCHES DETECTED!`)
          console.log(`    Total: ${pitchSignatures.length}, Unique: ${uniquePitches.size}`)

          // Find and display duplicates
          const seen = new Set()
          const duplicates = []
          pitchSignatures.forEach((sig, idx) => {
            if (seen.has(sig)) {
              duplicates.push({ index: idx, signature: sig })
            }
            seen.add(sig)
          })
          duplicates.forEach(dup => {
            console.log(`      Duplicate at index ${dup.index}: ${dup.signature}`)
          })
        }
      }

      // Check for duplicate social posts
      if (campaign?.socialPosts && campaign.socialPosts.length > 0) {
        const postSignatures = campaign.socialPosts.map(p => `${p.who}|${p.platform}|${p.what}`)
        const uniquePosts = new Set(postSignatures)
        if (postSignatures.length !== uniquePosts.size) {
          console.log(`    ⚠️  DUPLICATE SOCIAL POSTS DETECTED!`)
          console.log(`    Total: ${postSignatures.length}, Unique: ${uniquePosts.size}`)
        }
      }

      // Check for duplicate thought leadership
      if (campaign?.thoughtLeadership && campaign.thoughtLeadership.length > 0) {
        const articleSignatures = campaign.thoughtLeadership.map(a => `${a.who}|${a.where}|${a.what}`)
        const uniqueArticles = new Set(articleSignatures)
        if (articleSignatures.length !== uniqueArticles.size) {
          console.log(`    ⚠️  DUPLICATE THOUGHT LEADERSHIP DETECTED!`)
          console.log(`    Total: ${articleSignatures.length}, Unique: ${uniqueArticles.size}`)
        }
      }
    })
  })

  console.log(`\n${'='.repeat(80)}`)
  console.log('\nSummary:')
  console.log(`Total stakeholders: ${plans.length}`)
  console.log(`Total influence levers: ${plans.reduce((sum, p) => sum + (p.influenceLevers?.length || 0), 0)}`)

  // Count total content items
  let totalMediaPitches = 0
  let totalSocialPosts = 0
  let totalThoughtLeadership = 0
  let totalAdditionalTactics = 0

  plans.forEach(plan => {
    plan.influenceLevers?.forEach(lever => {
      totalMediaPitches += lever.campaign?.mediaPitches?.length || 0
      totalSocialPosts += lever.campaign?.socialPosts?.length || 0
      totalThoughtLeadership += lever.campaign?.thoughtLeadership?.length || 0
      totalAdditionalTactics += lever.campaign?.additionalTactics?.length || 0
    })
  })

  console.log(`Total media pitches: ${totalMediaPitches}`)
  console.log(`Total social posts: ${totalSocialPosts}`)
  console.log(`Total thought leadership: ${totalThoughtLeadership}`)
  console.log(`Total additional tactics: ${totalAdditionalTactics}`)
  console.log(`Total content items: ${totalMediaPitches + totalSocialPosts + totalThoughtLeadership + totalAdditionalTactics}`)
}

checkForDuplicates().catch(console.error)
