// Framework Builder Service
// Extracts structured campaign framework from NIV conversation

import { StrategicFramework, FrameworkValidation } from '@/types/strategic-framework'

export class FrameworkBuilder {
  private framework: Partial<StrategicFramework>
  private conversationHistory: any[]

  constructor() {
    this.framework = this.initializeFramework()
    this.conversationHistory = []
  }

  // Initialize empty framework
  private initializeFramework(): Partial<StrategicFramework> {
    return {
      id: `framework-${Date.now()}`,
      created: new Date(),
      version: 1,
      status: 'draft',
      foundation: {
        goal: '',
        vision: '',
        problemStatement: '',
        successMetrics: {
          primary: [],
          secondary: [],
          timeline: '',
          benchmarks: []
        },
        context: {
          marketConditions: '',
          triggers: [],
          constraints: [],
          opportunities: [],
          risks: []
        }
      },
      narrative: {
        coreThesis: '',
        positioning: {
          statement: '',
          differentiation: '',
          contrarian: [],
          defensible: []
        },
        messages: {
          elevator: '',
          headlines: [],
          soundbites: [],
          talkingPoints: [],
          dataPoints: []
        },
        narrativeVacuum: {
          identified: '',
          opportunity: '',
          firstMover: []
        }
      },
      audience: {
        primary: {
          segment: '',
          psychographics: [],
          painPoints: [],
          aspirations: [],
          objections: [],
          messaging: ''
        },
        secondary: {
          segment: '',
          role: '',
          messaging: ''
        },
        influencers: {
          journalists: [],
          analysts: [],
          thoughtLeaders: []
        }
      },
      intelligence: {
        userIntent: [],
        statedGoals: [],
        impliedNeeds: [],
        decisions: [],
        preferences: [],
        rejections: [],
        examples: [],
        constraints: [],
        context: []
      }
    }
  }

  // Parse NIV's response to extract framework elements
  parseNivResponse(response: string): void {
    // Extract thought leadership campaign elements
    this.extractGoal(response)
    this.extractNarrativeVacuum(response)
    this.extractContrarianPositions(response)
    this.extractInfluencers(response)
    this.extractTalkingPoints(response)
    this.extractCalendar(response)
    this.extractMetrics(response)
    this.extractCompetitiveIntel(response)
  }

  private extractGoal(text: string): void {
    // Look for goal indicators
    const goalPatterns = [
      /goal[:\s]+([^.\n]+)/i,
      /objective[:\s]+([^.\n]+)/i,
      /campaign for[:\s]+([^.\n]+)/i,
      /build[:\s]+([^.\n]+)/i
    ]

    for (const pattern of goalPatterns) {
      const match = text.match(pattern)
      if (match) {
        this.framework.foundation!.goal = match[1].trim()
        break
      }
    }
  }

  private extractNarrativeVacuum(text: string): void {
    const vacuumSection = text.match(/narrative vacuum[:\s]+([\s\S]+?)(?=\n\n|\d\.)/i)
    if (vacuumSection) {
      this.framework.narrative!.narrativeVacuum!.identified = vacuumSection[1].trim()
    }

    // Look for gaps or opportunities
    const gapPatterns = [
      /gap[:\s]+([^.\n]+)/gi,
      /missing[:\s]+([^.\n]+)/gi,
      /opportunity[:\s]+([^.\n]+)/gi
    ]

    gapPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern)
      for (const match of matches) {
        this.framework.foundation!.context!.opportunities.push(match[1].trim())
      }
    })
  }

  private extractContrarianPositions(text: string): void {
    // Look for contrarian positions section
    const contrarianSection = text.match(/contrarian positions?[:\s]+([\s\S]+?)(?=\n\d\.|\n\n)/i)

    if (contrarianSection) {
      // Extract numbered points
      const positions = contrarianSection[1].match(/\d+\.\s+([^\n]+)/g)
      if (positions) {
        positions.forEach(pos => {
          const cleaned = pos.replace(/^\d+\.\s+/, '').trim()
          this.framework.narrative!.positioning!.contrarian.push(cleaned)
        })
      }
    }

    // Also look for "Position:" patterns
    const positionMatches = text.matchAll(/Position[:\s]+([^.\n]+)/gi)
    for (const match of positionMatches) {
      this.framework.narrative!.positioning!.contrarian.push(match[1].trim())
    }
  }

  private extractInfluencers(text: string): void {
    // Extract journalists
    const journalistSection = text.match(/journalists?[:\s]+([\s\S]+?)(?=\n\n|\d\..*influencers?)/i)

    if (journalistSection) {
      const names = journalistSection[1].match(/[-•]\s*([^(\n]+)(?:\(([^)]+)\))?/g)
      if (names) {
        names.forEach(nameStr => {
          const cleanName = nameStr.replace(/^[-•]\s*/, '').trim()
          const parts = cleanName.match(/([^(]+)(?:\(([^)]+)\))?/)

          if (parts) {
            this.framework.audience!.influencers!.journalists.push({
              name: parts[1].trim(),
              outlet: parts[2] || '',
              beat: this.extractBeat(parts[2] || ''),
              angle: '',
              priority: 'tier2'
            })
          }
        })
      }
    }

    // Extract thought leaders/influencers
    const influencerSection = text.match(/influencers?[:\s]+([\s\S]+?)(?=\n\n|\d\.)/i)
    if (influencerSection) {
      const names = influencerSection[1].match(/[-•]\s*([^\n]+)/g)
      if (names) {
        names.forEach(nameStr => {
          const cleanName = nameStr.replace(/^[-•]\s*/, '').trim()
          this.framework.audience!.influencers!.thoughtLeaders.push({
            name: cleanName,
            platform: '',
            audience: '',
            engagement: ''
          })
        })
      }
    }
  }

  private extractBeat(text: string): string {
    // Extract beat/focus area from outlet description
    const beatKeywords = ['AI', 'tech', 'business', 'startup', 'enterprise', 'innovation']
    for (const keyword of beatKeywords) {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        return keyword
      }
    }
    return 'general'
  }

  private extractTalkingPoints(text: string): void {
    const talkingPointsSection = text.match(/talking points?[:\s]+([\s\S]+?)(?=\n\n|\d\.)/i)

    if (talkingPointsSection) {
      const points = talkingPointsSection[1].match(/[-•]\s*([^\n]+)/g)
      if (points) {
        points.forEach(point => {
          const cleaned = point.replace(/^[-•]\s*/, '').trim()
          this.framework.narrative!.messages!.talkingPoints.push(cleaned)
        })
      }
    }

    // Extract data points
    const dataMatches = text.matchAll(/(\d+%?)[:\s]+([^.\n]+)/g)
    for (const match of dataMatches) {
      this.framework.narrative!.messages!.dataPoints.push({
        stat: match[1],
        source: '',
        context: match[2].trim()
      })
    }
  }

  private extractCalendar(text: string): void {
    const calendarSection = text.match(/calendar[:\s]+([\s\S]+?)(?=\n\n|success metrics)/i)

    if (calendarSection) {
      // Look for week patterns
      const weekMatches = calendarSection[1].matchAll(/week\s*(\d+)[:\s]+([\s\S]+?)(?=week\s*\d+|$)/gi)

      for (const match of weekMatches) {
        const weekNum = parseInt(match[1])
        const activities = match[2].match(/[-•]\s*([^\n]+)/g) || []

        const weekKey = `week${weekNum}` as 'week1' | 'week2' | 'week3' | 'week4'
        if (this.framework.content?.calendar?.[weekKey]) {
          activities.forEach(activity => {
            const cleaned = activity.replace(/^[-•]\s*/, '').trim()

            // Categorize activity
            if (cleaned.toLowerCase().includes('content') || cleaned.toLowerCase().includes('publish')) {
              this.framework.content!.calendar![weekKey].content.push(cleaned)
            } else if (cleaned.toLowerCase().includes('outreach') || cleaned.toLowerCase().includes('pitch')) {
              this.framework.content!.calendar![weekKey].outreach.push(cleaned)
            } else {
              this.framework.content!.calendar![weekKey].priority.push(cleaned)
            }
          })
        }
      }
    }
  }

  private extractMetrics(text: string): void {
    const metricsSection = text.match(/success metrics?[:\s]+([\s\S]+?)(?=\n\n|monitoring)/i)

    if (metricsSection) {
      const metrics = metricsSection[1].match(/[-•]\s*([^\n]+)/g)
      if (metrics) {
        metrics.forEach(metric => {
          const cleaned = metric.replace(/^[-•]\s*/, '').trim()
          this.framework.foundation!.successMetrics!.primary.push(cleaned)
        })
      }
    }

    // Extract monitoring triggers
    const triggersSection = text.match(/triggers?[:\s]+([\s\S]+?)(?=\n\n|$)/i)
    if (triggersSection) {
      const triggers = triggersSection[1].match(/[-•]\s*([^\n]+)/g)
      if (triggers) {
        triggers.forEach(trigger => {
          const cleaned = trigger.replace(/^[-•]\s*/, '').trim()
          if (!this.framework.monitoring) {
            this.framework.monitoring = {
              triggers: { success: [], warning: [], failure: [] },
              feedback: { channels: [], frequency: '', analysis: '' },
              optimization: { tests: [], iterations: [], pivots: [] }
            }
          }
          this.framework.monitoring.triggers.success.push(cleaned)
        })
      }
    }
  }

  private extractCompetitiveIntel(text: string): void {
    const competitorSection = text.match(/competitor responses?[:\s]+([\s\S]+?)(?=\n\n|$)/i)

    if (competitorSection) {
      if (!this.framework.competitive) {
        this.framework.competitive = {
          landscape: { direct: [], indirect: [], substitutes: [] },
          anticipation: { likelyResponses: [], counters: [], preemption: [] },
          differentiation: { unique: [], superior: [], different: [] }
        }
      }

      const responses = competitorSection[1].match(/[-•]\s*([^\n]+)/g)
      if (responses) {
        responses.forEach(response => {
          const cleaned = response.replace(/^[-•]\s*/, '').trim()

          // Separate likely responses and counters
          if (cleaned.toLowerCase().includes('counter') || cleaned.toLowerCase().includes('respond')) {
            this.framework.competitive.anticipation.counters.push(cleaned)
          } else {
            this.framework.competitive.anticipation.likelyResponses.push(cleaned)
          }
        })
      }
    }
  }

  // Add conversation context to framework
  addConversationContext(message: string, role: 'user' | 'niv'): void {
    this.conversationHistory.push({ message, role, timestamp: new Date() })

    if (role === 'user') {
      // Extract user intent and decisions
      this.extractUserIntent(message)
    }
  }

  private extractUserIntent(message: string): void {
    // Extract explicit goals
    if (message.toLowerCase().includes('want') || message.toLowerCase().includes('need')) {
      this.framework.intelligence!.statedGoals.push(message)
    }

    // Extract constraints
    if (message.toLowerCase().includes('can\'t') || message.toLowerCase().includes('don\'t')) {
      this.framework.intelligence!.constraints.push(message)
    }

    // Extract preferences
    if (message.toLowerCase().includes('prefer') || message.toLowerCase().includes('like')) {
      this.framework.intelligence!.preferences.push(message)
    }
  }

  // Validate framework completeness
  validate(): FrameworkValidation {
    const validation: FrameworkValidation = {
      isComplete: false,
      hasGoal: !!this.framework.foundation?.goal,
      hasAudience: !!this.framework.audience?.primary?.segment,
      hasNarrative: !!this.framework.narrative?.coreThesis,
      hasTimeline: !!this.framework.execution?.phases?.length,
      hasMeasurement: !!this.framework.foundation?.successMetrics?.primary?.length,
      missingCritical: [],
      missingOptional: [],
      score: 0
    }

    // Check critical elements
    if (!validation.hasGoal) validation.missingCritical.push('Campaign goal')
    if (!validation.hasAudience) validation.missingCritical.push('Target audience')
    if (!validation.hasNarrative) validation.missingCritical.push('Core narrative')
    if (!validation.hasTimeline) validation.missingCritical.push('Execution timeline')
    if (!validation.hasMeasurement) validation.missingCritical.push('Success metrics')

    // Calculate score
    const criticalScore = [
      validation.hasGoal,
      validation.hasAudience,
      validation.hasNarrative,
      validation.hasTimeline,
      validation.hasMeasurement
    ].filter(Boolean).length * 20

    validation.score = criticalScore
    validation.isComplete = validation.score >= 60 // 60% minimum for handoff

    return validation
  }

  // Get current framework
  getFramework(): Partial<StrategicFramework> {
    return this.framework
  }

  // Build framework from complete NIV response
  buildFromNivResponse(nivResponse: any): StrategicFramework {
    // If NIV provides structured data
    if (nivResponse.framework) {
      return this.mergeFrameworkData(nivResponse.framework)
    }

    // Otherwise parse from text
    if (nivResponse.message || nivResponse.text) {
      this.parseNivResponse(nivResponse.message || nivResponse.text)
    }

    return this.framework as StrategicFramework
  }

  private mergeFrameworkData(data: any): StrategicFramework {
    // Merge provided framework data with our structure
    return {
      ...this.framework,
      ...data,
      id: this.framework.id,
      created: this.framework.created,
      version: this.framework.version,
      status: this.framework.status
    } as StrategicFramework
  }

  // Export framework for downstream components
  exportForComponent(component: 'content' | 'campaign' | 'execution'): any {
    switch (component) {
      case 'content':
        return {
          topics: this.framework.content?.pillar?.themes || [],
          messages: this.framework.narrative?.messages?.talkingPoints || [],
          tone: this.framework.narrative?.positioning?.statement || '',
          calendar: this.framework.content?.calendar || {}
        }

      case 'campaign':
        return {
          targets: this.framework.audience?.influencers || {},
          angles: this.framework.channels?.earned?.angles || {},
          narrative: this.framework.narrative || {}
        }

      case 'execution':
        return {
          phases: this.framework.execution?.phases || [],
          resources: this.framework.execution?.resources || {},
          timeline: this.framework.foundation?.successMetrics?.timeline || ''
        }

      default:
        return this.framework
    }
  }
}

export const frameworkBuilder = new FrameworkBuilder()