// Creative Direction System for Opportunity Presentations
// Adds variance and narrative depth to Gamma presentations

export type NarrativeStyle =
  | 'urgency'        // Crisis, time-sensitive - "The Clock is Ticking"
  | 'conquest'       // Competitive advantage - "Seize the Advantage"
  | 'visionary'      // Thought leadership - "Lead the Conversation"
  | 'collaborative'  // Partnership - "Better Together"
  | 'momentum'       // Market shift/trend - "Ride the Wave"
  | 'transformation' // Major change - "The New Reality"

export type ToneStyle = 'bold' | 'urgent' | 'inspiring' | 'analytical' | 'conversational' | 'provocative'

export interface CreativeDirection {
  narrativeStyle: NarrativeStyle
  tone: ToneStyle
  imageModel: string
  visualStyle: string
  hookStrategy: string
  slideStructure: string[]
  colorMood: 'warm' | 'cool' | 'bold' | 'muted' | 'dynamic'
  openingHook: string
  closingCTA: string
}

// Image models with different visual characteristics
const IMAGE_MODELS = {
  cinematic: 'ideogram-v3',           // Rich, detailed, cinematic
  bold: 'flux-1-pro',                 // Strong, impactful visuals
  creative: 'leonardo-phoenix',        // Creative, artistic
  photorealistic: 'imagen-3-pro',     // Clean, photorealistic
  stylized: 'recraft-v3',             // Stylized, design-forward
  fast: 'flux-1-quick',               // Quick generation, good quality
}

// Analyze opportunity signals to determine creative direction
export function analyzeOpportunityForCreativeDirection(opportunity: any): CreativeDirection {
  const { strategic_context, execution_plan, title, category } = opportunity

  // Extract signals for analysis
  const timeWindow = strategic_context?.time_window?.toLowerCase() || ''
  const triggerEvents = strategic_context?.trigger_events || []
  const triggerText = triggerEvents.join(' ').toLowerCase()
  const titleLower = title?.toLowerCase() || ''
  const description = opportunity.description?.toLowerCase() || ''
  const whyNow = strategic_context?.why_now?.toLowerCase() || ''
  const competitiveAdvantage = strategic_context?.competitive_advantage?.toLowerCase() || ''
  const riskIfMissed = strategic_context?.risk_if_missed?.toLowerCase() || ''

  // Check execution plan for content types - this reveals the CLIENT'S intent
  const contentTypes = execution_plan?.stakeholder_campaigns
    ?.flatMap((c: any) => c.content_items?.map((i: any) => i.type) || []) || []
  const hasPRContent = contentTypes.some((t: string) =>
    ['media_pitch', 'press_release', 'thought_leadership', 'blog_post'].includes(t)
  )
  const hasPartnershipContent = contentTypes.some((t: string) =>
    ['partnership_outreach'].includes(t)
  )

  // Scoring system for narrative styles
  const scores: Record<NarrativeStyle, number> = {
    urgency: 0,
    conquest: 0,
    visionary: 0,
    collaborative: 0,
    momentum: 0,
    transformation: 0,
  }

  // IMPORTANT: Default boost for visionary/thought leadership for PR-focused opportunities
  // Most opportunities are about positioning the client as an expert, not forming partnerships
  if (hasPRContent && !hasPartnershipContent) {
    scores.visionary += 5  // Strong default for PR opportunities
  }

  // Detect thought leadership / positioning intent from TITLE and DESCRIPTION
  // These describe what the CLIENT wants to do, not what happened in the news
  if (titleLower.includes('position') || titleLower.includes('leadership') || titleLower.includes('leader')) scores.visionary += 4
  if (description.includes('position as') || description.includes('thought leader') || description.includes('expert')) scores.visionary += 4
  if (description.includes('can position') || description.includes('establish') || description.includes('authority')) scores.visionary += 3

  // Urgency signals - from time context, not news content
  if (timeWindow.includes('immediate') || timeWindow.includes('urgent') || timeWindow.includes('days')) scores.urgency += 3
  if (triggerText.includes('crisis') || triggerText.includes('breach') || triggerText.includes('scandal')) scores.urgency += 3
  if (triggerText.includes('deadline') || triggerText.includes('expires') || triggerText.includes('limited')) scores.urgency += 2
  if (riskIfMissed.includes('window') || riskIfMissed.includes('miss') || riskIfMissed.includes('lose')) scores.urgency += 2

  // Conquest/Competitive signals - when CLIENT is competing
  if (titleLower.includes('against') || titleLower.includes('compete') || titleLower.includes('vs ')) scores.conquest += 3
  if (competitiveAdvantage.includes('differentiat') || competitiveAdvantage.includes('unique')) scores.conquest += 2
  if (description.includes('beat') || description.includes('win') || description.includes('outperform')) scores.conquest += 2

  // Visionary/Thought Leadership signals - CLIENT's positioning intent
  if (triggerText.includes('research') || triggerText.includes('study') || triggerText.includes('report')) scores.visionary += 2
  if (titleLower.includes('future') || titleLower.includes('vision') || titleLower.includes('outlook')) scores.visionary += 3
  if (whyNow.includes('position') || whyNow.includes('establish') || whyNow.includes('lead')) scores.visionary += 2

  // Collaborative/Partnership signals - ONLY when CLIENT is forming a partnership
  // NOT when news mentions other companies' partnerships
  if (hasPartnershipContent) scores.collaborative += 5  // Client is doing partnership outreach
  if (titleLower.includes('our partner') || titleLower.includes('announce partnership')) scores.collaborative += 4
  if (description.includes('form a partnership') || description.includes('joint venture with')) scores.collaborative += 3
  // DO NOT score for news mentioning other companies' partnerships

  // Momentum/Trend signals
  if (triggerText.includes('trend') || triggerText.includes('momentum') || triggerText.includes('growth')) scores.momentum += 3
  if (triggerText.includes('surge') || triggerText.includes('rising') || triggerText.includes('emerging')) scores.momentum += 2
  if (whyNow.includes('timing') || whyNow.includes('moment') || whyNow.includes('wave')) scores.momentum += 2

  // Transformation signals - industry changes
  if (triggerText.includes('regulation') || triggerText.includes('policy') || triggerText.includes('law')) scores.transformation += 2
  if (triggerText.includes('disrupt') || triggerText.includes('shift') || triggerText.includes('change')) scores.transformation += 3
  if (triggerText.includes('new era') || triggerText.includes('paradigm') || triggerText.includes('revolution')) scores.transformation += 3

  // Find winning narrative style
  const narrativeStyle = (Object.entries(scores)
    .sort(([, a], [, b]) => b - a)[0][0]) as NarrativeStyle

  console.log('🎨 Creative direction scores:', scores, '→', narrativeStyle)

  // Build creative direction based on narrative style
  return buildCreativeDirection(narrativeStyle, opportunity)
}

function buildCreativeDirection(style: NarrativeStyle, opportunity: any): CreativeDirection {
  const directions: Record<NarrativeStyle, CreativeDirection> = {
    urgency: {
      narrativeStyle: 'urgency',
      tone: 'urgent',
      imageModel: IMAGE_MODELS.bold,
      visualStyle: 'High contrast, dynamic angles, motion blur effects',
      hookStrategy: 'Start with the ticking clock - what happens if we wait?',
      colorMood: 'bold',
      slideStructure: [
        'hook_urgent',      // The countdown has started
        'stakes',           // What's at risk
        'window',           // The opportunity window
        'action_plan',      // Swift action required
        'timeline_urgent',  // Day-by-day execution
        'mobilize',         // Call to immediate action
      ],
      openingHook: generateUrgentHook(opportunity),
      closingCTA: 'The window is closing. Let\'s move now.',
    },

    conquest: {
      narrativeStyle: 'conquest',
      tone: 'bold',
      imageModel: IMAGE_MODELS.cinematic,
      visualStyle: 'Bold, powerful imagery. Chess pieces, mountain summits, finish lines',
      hookStrategy: 'Frame this as a battle for position - we have the advantage',
      colorMood: 'dynamic',
      slideStructure: [
        'hook_competitive', // The battlefield
        'landscape',        // Competitive landscape
        'our_edge',         // Our unique advantage
        'attack_plan',      // Strategy to win
        'execution',        // How we execute
        'victory',          // What winning looks like
      ],
      openingHook: generateConquestHook(opportunity),
      closingCTA: 'This is our moment to take the lead.',
    },

    visionary: {
      narrativeStyle: 'visionary',
      tone: 'inspiring',
      imageModel: IMAGE_MODELS.creative,
      visualStyle: 'Aspirational, futuristic, expansive horizons',
      hookStrategy: 'Paint a picture of the future we can create',
      colorMood: 'cool',
      slideStructure: [
        'hook_vision',      // Imagine this future
        'insight',          // The key insight
        'perspective',      // Our unique viewpoint
        'roadmap',          // How we get there
        'impact',           // The ripple effects
        'invitation',       // Join the journey
      ],
      openingHook: generateVisionaryHook(opportunity),
      closingCTA: 'Let\'s shape the conversation.',
    },

    collaborative: {
      narrativeStyle: 'collaborative',
      tone: 'conversational',
      imageModel: IMAGE_MODELS.photorealistic,
      visualStyle: 'Human connections, handshakes, bridges, interconnected networks',
      hookStrategy: 'Emphasize the power of partnership and mutual benefit',
      colorMood: 'warm',
      slideStructure: [
        'hook_together',    // Better together
        'synergy',          // Why this partnership
        'shared_goals',     // Common ground
        'combined_strength',// What we bring together
        'joint_plan',       // How we collaborate
        'mutual_win',       // Success for all
      ],
      openingHook: generateCollaborativeHook(opportunity),
      closingCTA: 'Together, we\'re stronger.',
    },

    momentum: {
      narrativeStyle: 'momentum',
      tone: 'bold',
      imageModel: IMAGE_MODELS.cinematic,
      visualStyle: 'Waves, arrows, upward trajectories, speed and motion',
      hookStrategy: 'Show the wave building - this is our moment to ride it',
      colorMood: 'dynamic',
      slideStructure: [
        'hook_wave',        // The wave is building
        'trend_analysis',   // The forces at play
        'timing',           // Why now is the moment
        'positioning',      // How to catch the wave
        'acceleration',     // Riding the momentum
        'destination',      // Where this takes us
      ],
      openingHook: generateMomentumHook(opportunity),
      closingCTA: 'The momentum is on our side. Let\'s ride it.',
    },

    transformation: {
      narrativeStyle: 'transformation',
      tone: 'provocative',
      imageModel: IMAGE_MODELS.stylized,
      visualStyle: 'Metamorphosis, before/after, butterflies, phoenixes, new dawns',
      hookStrategy: 'The old rules no longer apply - this is the new reality',
      colorMood: 'bold',
      slideStructure: [
        'hook_change',      // Everything has changed
        'old_world',        // How things were
        'catalyst',         // What triggered the shift
        'new_reality',      // The new landscape
        'adaptation',       // How we evolve
        'thrive',           // Thriving in the new world
      ],
      openingHook: generateTransformationHook(opportunity),
      closingCTA: 'The landscape has shifted. Let\'s lead the way forward.',
    },
  }

  return directions[style]
}

// Hook generators for each narrative style
function generateUrgentHook(opp: any): string {
  const timeWindow = opp.strategic_context?.time_window || 'limited time'
  const trigger = opp.strategic_context?.trigger_events?.[0] || 'This development'
  return `${trigger} has started a countdown. We have ${timeWindow} to act before this opportunity closes.`
}

function generateConquestHook(opp: any): string {
  const advantage = opp.strategic_context?.competitive_advantage || 'a unique position'
  return `The competitive landscape just shifted. We have ${advantage}. Here's how we capitalize.`
}

function generateVisionaryHook(opp: any): string {
  const trigger = opp.strategic_context?.trigger_events?.[0] || 'Recent developments'
  const advantage = opp.strategic_context?.competitive_advantage || ''

  // If there's a clear positioning angle, use it
  if (advantage && advantage.length > 20) {
    return `${trigger} - and we have a unique perspective to share. ${advantage.split('.')[0]}.`
  }

  return `${trigger} signals a shift in our industry. Here's what it means and why our perspective matters.`
}

function generateCollaborativeHook(opp: any): string {
  const trigger = opp.strategic_context?.trigger_events?.[0] || 'This announcement'
  return `${trigger} creates an opportunity for partnership. Together, we can achieve something neither could alone.`
}

function generateMomentumHook(opp: any): string {
  const whyNow = opp.strategic_context?.why_now || 'The timing couldn\'t be better'
  return `A wave is building in our market. ${whyNow}. Here's how we ride it.`
}

function generateTransformationHook(opp: any): string {
  const trigger = opp.strategic_context?.trigger_events?.[0] || 'This change'
  return `${trigger} isn't just news—it's a paradigm shift. The old playbook no longer applies.`
}

// Export utility to get Gamma API options based on creative direction
export function getGammaOptionsFromDirection(direction: CreativeDirection): {
  tone: string
  imageOptions: { model: string }
  textOptions: { tone: string }
} {
  return {
    tone: direction.tone,
    imageOptions: {
      model: direction.imageModel,
    },
    textOptions: {
      tone: direction.tone,
    },
  }
}
