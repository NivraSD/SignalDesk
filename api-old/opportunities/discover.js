// Vercel API Route: Discover Opportunities
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Opportunity templates for discovery
const opportunityTemplates = [
  {
    type: 'speaking_opportunity',
    title: 'Industry Conference Speaking Slot Available',
    description: 'Major tech conference seeking expert speakers on AI and PR',
    score: 85,
    urgency: 'high',
    suggested_action: 'Submit speaker proposal highlighting AI expertise'
  },
  {
    type: 'media_opportunity', 
    title: 'Journalist Seeking AI PR Expert Commentary',
    description: 'TechCrunch reporter needs expert quotes for upcoming article',
    score: 92,
    urgency: 'urgent',
    suggested_action: 'Respond within 2 hours with expert insights'
  },
  {
    type: 'trending_topic',
    title: 'AI Regulation Trending - Position as Thought Leader',
    description: 'EU AI Act discussions creating media opportunities',
    score: 78,
    urgency: 'medium',
    suggested_action: 'Prepare op-ed on responsible AI in PR'
  },
  {
    type: 'competitive_advantage',
    title: 'Competitor Facing Criticism - Differentiation Opportunity',
    description: 'Competitor receiving negative press for data practices',
    score: 70,
    urgency: 'low',
    suggested_action: 'Highlight your superior data privacy approach'
  },
  {
    type: 'partnership_opportunity',
    title: 'Potential Strategic Partnership with MarTech Leader',
    description: 'Leading marketing platform seeking AI integration partner',
    score: 88,
    urgency: 'medium',
    suggested_action: 'Schedule exploratory meeting with their BD team'
  }
]

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const organizationId = req.query.organizationId || req.body?.organizationId || 'demo-org'

    // Get existing opportunities from database
    const { data: existingOpps, error: fetchError } = await supabase
      .from('opportunity_queue')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('score', { ascending: false })
      .limit(20)

    if (fetchError) {
      console.error('Fetch error:', fetchError)
    }

    // If requested, discover new opportunities
    if (req.method === 'POST' || req.query.discover === 'true') {
      // Randomly select 2-3 new opportunities to "discover"
      const numNew = Math.floor(Math.random() * 2) + 2
      const newOpportunities = []
      
      for (let i = 0; i < numNew; i++) {
        const template = opportunityTemplates[Math.floor(Math.random() * opportunityTemplates.length)]
        const opportunity = {
          organization_id: organizationId,
          ...template,
          title: `${template.title} (${new Date().toLocaleDateString()})`,
          keywords: [template.type, 'ai', 'pr', 'opportunity'],
          deadline: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          relevant_stakeholders: {
            media: template.type === 'media_opportunity' ? ['TechCrunch', 'VentureBeat'] : [],
            investors: template.type === 'partnership_opportunity' ? ['Sequoia', 'a16z'] : [],
            customers: []
          }
        }
        newOpportunities.push(opportunity)
      }

      // Insert new opportunities
      if (newOpportunities.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('opportunity_queue')
          .insert(newOpportunities)
          .select()

        if (insertError) {
          console.error('Insert error:', insertError)
        } else if (inserted) {
          // Combine with existing
          const allOpps = [...(inserted || []), ...(existingOpps || [])]
            .sort((a, b) => b.score - a.score)
            .slice(0, 20)

          return res.status(200).json({
            success: true,
            opportunities: allOpps,
            newCount: inserted.length,
            message: `Discovered ${inserted.length} new opportunities`
          })
        }
      }
    }

    // Return existing opportunities
    return res.status(200).json({
      success: true,
      opportunities: existingOpps || [],
      message: 'Opportunities retrieved successfully'
    })

  } catch (error) {
    console.error('Discover opportunities error:', error)
    return res.status(500).json({ error: 'Failed to discover opportunities' })
  }
}