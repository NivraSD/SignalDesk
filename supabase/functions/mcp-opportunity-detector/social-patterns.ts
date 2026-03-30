/**
 * Social Opportunity Detection Patterns
 *
 * Detects PR opportunities from social media signals
 */

export interface SocialSignal {
  platform: string
  type: string
  content: string
  author?: string
  engagement?: number
  metrics?: any
  timestamp: string
  sentiment?: string
}

export interface SocialOpportunityPattern {
  id: string
  name: string
  description: string
  urgency: 'high' | 'medium' | 'low'
  detector: (signals: SocialSignal[], orgName: string) => SocialOpportunity | null
}

export interface SocialOpportunity {
  title: string
  description: string
  score: number
  urgency: 'high' | 'medium' | 'low'
  time_window: string
  category: string
  trigger_event: string
  pattern_matched: string
  signals: SocialSignal[]
  recommended_action: any
}

// Pattern 1: Viral Competitor Moment
export const viralCompetitorPattern: SocialOpportunityPattern = {
  id: 'viral_competitor',
  name: 'Viral Competitor Moment',
  description: 'Competitor content going viral - opportunity to counter-program',
  urgency: 'high',
  detector: (signals, orgName) => {
    // Find high-engagement posts from competitors
    const viralPosts = signals.filter(s => {
      const isHighEngagement = (s.engagement || 0) > 1000
      const isRecent = new Date(s.timestamp).getTime() > Date.now() - (6 * 60 * 60 * 1000) // 6 hours
      const notOurOrg = !s.content.toLowerCase().includes(orgName.toLowerCase())

      return isHighEngagement && isRecent && notOurOrg
    })

    if (viralPosts.length === 0) return null

    const topPost = viralPosts.sort((a, b) => (b.engagement || 0) - (a.engagement || 0))[0]

    return {
      title: `Competitor viral moment: ${topPost.engagement}+ engagements`,
      description: `Competitor content is going viral on ${topPost.platform}. Create counter-narrative to capitalize on the attention.`,
      score: 85,
      urgency: 'high',
      time_window: '2 hours',
      category: 'competitive_response',
      trigger_event: `High-engagement post on ${topPost.platform}`,
      pattern_matched: 'viral_competitor',
      signals: [topPost],
      recommended_action: {
        what: {
          primary_action: 'Create counter-narrative content',
          specific_tasks: [
            'Draft social posts highlighting your advantage',
            'Create supporting visual content',
            'Engage with conversations in comments'
          ],
          deliverables: ['social-post', 'infographic']
        },
        who: {
          owner: 'Social Media Manager',
          team: ['Content', 'Creative', 'PR']
        },
        when: {
          start_immediately: true,
          ideal_launch: 'Within 2 hours',
          duration: '4 hours'
        },
        where: {
          channels: ['social-media'],
          platforms: [topPost.platform, 'twitter', 'linkedin']
        }
      }
    }
  }
}

// Pattern 2: Negative Sentiment Spike
export const sentimentSpikePattern: SocialOpportunityPattern = {
  id: 'sentiment_spike',
  name: 'Negative Sentiment Spike',
  description: 'Rapid increase in negative sentiment - potential crisis',
  urgency: 'high',
  detector: (signals, orgName) => {
    // Check for negative sentiment about our org in past 3 hours
    const recentSignals = signals.filter(s => {
      const isRecent = new Date(s.timestamp).getTime() > Date.now() - (3 * 60 * 60 * 1000)
      const isAboutUs = s.content.toLowerCase().includes(orgName.toLowerCase())
      return isRecent && isAboutUs
    })

    if (recentSignals.length < 5) return null // Need at least 5 signals

    // Count negative indicators
    const negativeKeywords = ['fail', 'broken', 'terrible', 'worst', 'disappointed', 'angry', 'frustrated']
    const negativeCount = recentSignals.filter(s =>
      negativeKeywords.some(kw => s.content.toLowerCase().includes(kw))
    ).length

    const negativePercentage = (negativeCount / recentSignals.length) * 100

    if (negativePercentage < 40) return null // Less than 40% negative

    return {
      title: `⚠️ Negative sentiment spike: ${negativePercentage.toFixed(0)}% negative`,
      description: `Detected ${negativeCount} negative mentions in the past 3 hours. Potential crisis emerging.`,
      score: 95,
      urgency: 'high',
      time_window: '1 hour',
      category: 'crisis_response',
      trigger_event: 'Rapid negative sentiment increase',
      pattern_matched: 'sentiment_spike',
      signals: recentSignals.slice(0, 10),
      recommended_action: {
        what: {
          primary_action: 'Activate crisis monitoring and response',
          specific_tasks: [
            'Identify root cause of sentiment shift',
            'Prepare holding statement',
            'Alert executive team and legal',
            'Monitor for escalation'
          ],
          deliverables: ['executive-statement', 'qa-document']
        },
        who: {
          owner: 'Crisis Communications Lead',
          team: ['PR', 'Legal', 'Executive', 'Social']
        },
        when: {
          start_immediately: true,
          ideal_launch: 'Immediate',
          duration: 'Ongoing'
        },
        where: {
          channels: ['social-media', 'press', 'owned-channels'],
          platforms: ['all']
        }
      }
    }
  }
}

// Pattern 3: Trending Topic Alignment
export const trendingTopicPattern: SocialOpportunityPattern = {
  id: 'trending_topic',
  name: 'Trending Topic Alignment',
  description: 'Industry topic trending - join the conversation',
  urgency: 'medium',
  detector: (signals, orgName) => {
    // Group signals by topic keywords
    const topicClusters = new Map<string, SocialSignal[]>()

    signals.forEach(signal => {
      const words = signal.content.toLowerCase().split(/\s+/)
      const hashtags = words.filter(w => w.startsWith('#'))

      hashtags.forEach(tag => {
        if (!topicClusters.has(tag)) {
          topicClusters.set(tag, [])
        }
        topicClusters.get(tag)!.push(signal)
      })
    })

    // Find trending hashtags (5+ mentions in past 12 hours)
    const recentTime = Date.now() - (12 * 60 * 60 * 1000)
    const trendingTopics = Array.from(topicClusters.entries())
      .filter(([tag, sigs]) => {
        const recentCount = sigs.filter(s => new Date(s.timestamp).getTime() > recentTime).length
        return recentCount >= 5
      })
      .sort((a, b) => b[1].length - a[1].length)

    if (trendingTopics.length === 0) return null

    const [topTopic, topicSignals] = trendingTopics[0]

    return {
      title: `Trending topic: ${topTopic} (${topicSignals.length} mentions)`,
      description: `${topTopic} is trending with ${topicSignals.length} mentions. Opportunity to join the conversation with branded content.`,
      score: 70,
      urgency: 'medium',
      time_window: '6 hours',
      category: 'thought_leadership',
      trigger_event: `Trending hashtag: ${topTopic}`,
      pattern_matched: 'trending_topic',
      signals: topicSignals.slice(0, 5),
      recommended_action: {
        what: {
          primary_action: 'Create content aligned with trending topic',
          specific_tasks: [
            `Research ${topTopic} context and key voices`,
            'Draft thought leadership post',
            'Create supporting visuals',
            'Engage with top conversations'
          ],
          deliverables: ['social-post', 'thought-leadership']
        },
        who: {
          owner: 'Content Lead',
          team: ['Social', 'Creative']
        },
        when: {
          start_immediately: false,
          ideal_launch: 'Within 6 hours',
          duration: '12 hours'
        },
        where: {
          channels: ['social-media', 'blog'],
          platforms: ['twitter', 'linkedin']
        }
      }
    }
  }
}

// Pattern 4: Influencer Mention
export const influencerMentionPattern: SocialOpportunityPattern = {
  id: 'influencer_mention',
  name: 'Influencer Mention',
  description: 'Industry influencer mentions relevant topic - engage opportunity',
  urgency: 'high',
  detector: (signals, orgName) => {
    // Find high-engagement posts from verified/influential accounts
    const influencerPosts = signals.filter(s => {
      const isVerified = s.author && (s as any).author_verified
      const isHighEngagement = (s.engagement || 0) > 500
      const isRecent = new Date(s.timestamp).getTime() > Date.now() - (24 * 60 * 60 * 1000)

      return (isVerified || isHighEngagement) && isRecent
    })

    if (influencerPosts.length === 0) return null

    const topInfluencer = influencerPosts.sort((a, b) => (b.engagement || 0) - (a.engagement || 0))[0]

    return {
      title: `Influencer conversation: @${topInfluencer.author}`,
      description: `Industry voice @${topInfluencer.author} discussing relevant topic. Engage within 1 hour for maximum visibility.`,
      score: 80,
      urgency: 'high',
      time_window: '1 hour',
      category: 'influencer_engagement',
      trigger_event: 'Influencer discussing industry topic',
      pattern_matched: 'influencer_mention',
      signals: [topInfluencer],
      recommended_action: {
        what: {
          primary_action: 'Engage with influencer conversation',
          specific_tasks: [
            'Craft thoughtful reply adding value',
            'Share with internal comment',
            'Monitor for follow-up opportunities'
          ],
          deliverables: ['social-post']
        },
        who: {
          owner: 'Executive/Thought Leader',
          team: ['PR', 'Social']
        },
        when: {
          start_immediately: true,
          ideal_launch: 'Within 1 hour',
          duration: '2 hours'
        },
        where: {
          channels: ['social-media'],
          platforms: [topInfluencer.platform]
        }
      }
    }
  }
}

// Pattern 5: Product Launch Buzz
export const productLaunchPattern: SocialOpportunityPattern = {
  id: 'product_launch',
  name: 'Competitor Product Launch',
  description: 'Competitor launching product - position against',
  urgency: 'medium',
  detector: (signals, orgName) => {
    // Detect launch-related keywords
    const launchKeywords = ['launch', 'announcing', 'introducing', 'reveal', 'unveil', 'new product', 'release']

    const launchSignals = signals.filter(s => {
      const hasLaunchKeyword = launchKeywords.some(kw => s.content.toLowerCase().includes(kw))
      const notOurOrg = !s.content.toLowerCase().includes(orgName.toLowerCase())
      const isRecent = new Date(s.timestamp).getTime() > Date.now() - (48 * 60 * 60 * 1000)

      return hasLaunchKeyword && notOurOrg && isRecent
    })

    if (launchSignals.length < 3) return null

    return {
      title: 'Competitor product launch detected',
      description: `Detected ${launchSignals.length} mentions of competitor product launch. Opportunity to position your advantages.`,
      score: 75,
      urgency: 'medium',
      time_window: '24 hours',
      category: 'competitive_positioning',
      trigger_event: 'Competitor product launch',
      pattern_matched: 'product_launch',
      signals: launchSignals.slice(0, 5),
      recommended_action: {
        what: {
          primary_action: 'Create competitive positioning content',
          specific_tasks: [
            'Analyze competitor product features',
            'Highlight your unique advantages',
            'Create comparison content',
            'Brief sales team on positioning'
          ],
          deliverables: ['blog-post', 'social-post', 'comparison-chart']
        },
        who: {
          owner: 'Product Marketing',
          team: ['PR', 'Product', 'Sales']
        },
        when: {
          start_immediately: false,
          ideal_launch: 'Within 24 hours',
          duration: '1 week'
        },
        where: {
          channels: ['social-media', 'blog', 'email'],
          platforms: ['linkedin', 'twitter', 'website']
        }
      }
    }
  }
}

// All patterns registry
export const SOCIAL_OPPORTUNITY_PATTERNS: SocialOpportunityPattern[] = [
  viralCompetitorPattern,
  sentimentSpikePattern,
  trendingTopicPattern,
  influencerMentionPattern,
  productLaunchPattern
]

/**
 * Detect opportunities from social signals
 */
export function detectSocialOpportunities(
  signals: SocialSignal[],
  orgName: string
): SocialOpportunity[] {
  const opportunities: SocialOpportunity[] = []

  for (const pattern of SOCIAL_OPPORTUNITY_PATTERNS) {
    const opportunity = pattern.detector(signals, orgName)
    if (opportunity) {
      opportunities.push(opportunity)
    }
  }

  // Sort by score
  opportunities.sort((a, b) => b.score - a.score)

  return opportunities
}