import { supabase } from '@/lib/supabase/client'

export interface PublicAffairsReport {
  id: string
  organization_id: string
  title: string
  trigger_event: {
    title: string
    content: string
    source?: string
    url?: string
    published_at?: string
  }
  urgency: 'flash' | 'standard' | 'deep_dive'
  report_format: 'brief' | 'full_report' | 'deck' | 'brief_and_deck'
  status: string
  research_data?: {
    // New format (geopolitical intelligence)
    executive_summary?: string
    situation_assessment?: any
    geopolitical_context?: any
    stakeholder_analysis?: any
    scenario_analysis?: any
    impact_assessment?: any
    sources_and_confidence?: any
    // Legacy format fields
    stakeholder_map?: any
    impact_analysis?: any
    sources_confidence?: any
  }
  blueprint_data?: {
    scenario_tree?: any
    recommendations?: any
    monitoring_framework?: any
    executive_summary?: string
  }
  presentation_url?: string
  presentation_metadata?: any
  one_pager_data?: any
  vault_folder?: string
  created_at: string
  updated_at: string
}

/** Detect whether research_data uses the new geopolitical format */
function isNewFormat(data: any): boolean {
  return !!data?.situation_assessment?.current_situation || !!data?.scenario_analysis || !!data?.geopolitical_context
}

export class PublicAffairsService {
  /**
   * Create a new public affairs report from a news story
   */
  static async createFromArticle(
    organizationId: string,
    article: {
      title: string
      content: string
      source?: string
      url?: string
      published_at?: string
    }
  ): Promise<PublicAffairsReport> {
    const folderName = article.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim().substring(0, 80)

    const { data, error } = await supabase
      .from('public_affairs_reports')
      .insert({
        organization_id: organizationId,
        title: article.title,
        trigger_event: article,
        urgency: 'standard',
        report_format: 'full_report',
        status: 'research_pending',
        vault_folder: `Public Affairs/${folderName}`
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create a new report from a user-entered topic
   */
  static async createFromTopic(
    organizationId: string,
    topic: string,
    focusAreas?: string[],
    urgency: 'flash' | 'standard' | 'deep_dive' = 'standard'
  ): Promise<PublicAffairsReport> {
    const focusText = focusAreas?.length
      ? `\n\nKey areas to cover:\n${focusAreas.map(a => `- ${a}`).join('\n')}`
      : ''

    const article = {
      title: topic,
      content: `Research request: ${topic}${focusText}`,
      source: 'User Research Request',
      published_at: new Date().toISOString(),
    }

    return this.createFromArticle(organizationId, article)
  }

  /**
   * Start the research pipeline for a report
   */
  static async startResearch(
    reportId: string,
    organizationId: string,
    organizationName: string,
    industry: string,
    onProgress?: (stage: string, status: 'running' | 'completed' | 'failed', data?: any) => void
  ): Promise<any> {
    // Update status
    await supabase
      .from('public_affairs_reports')
      .update({ status: 'research_in_progress' })
      .eq('id', reportId)

    onProgress?.('research', 'running')

    try {
      // Load org profile
      const { data: orgData } = await supabase
        .from('organizations')
        .select('company_profile, competitors, differentiators, market_position')
        .eq('id', organizationId)
        .single()

      // Load the report to get trigger event
      const { data: report } = await supabase
        .from('public_affairs_reports')
        .select('*')
        .eq('id', reportId)
        .single()

      if (!report) throw new Error('Report not found')

      onProgress?.('intelligence-gathering', 'running')

      // Run 5 focused research queries in parallel — each targets a distinct research stream
      const triggerEvent = report.trigger_event
      const title = triggerEvent.title
      const content = triggerEvent.content || ''

      const queries = [
        { key: 'situation', query: `${title} latest news developments what is happening now 2026` },
        { key: 'stakeholders', query: `${title} key players leaders companies governments who is involved positions reactions` },
        { key: 'context', query: `${title} broader implications competitive landscape industry dynamics regulatory response international reaction` },
        { key: 'impact', query: `${title} economic impact market consequences business effects industry disruption` },
        { key: 'historical', query: `${title} historical context background precedents how did this start timeline of events` },
      ]

      const queryResults = await Promise.allSettled(
        queries.map(q =>
          supabase.functions.invoke('niv-fireplexity', {
            body: {
              query: q.query,
              searchMode: 'comprehensive',
              organizationId,
              useCache: false
            }
          })
        )
      )

      onProgress?.('intelligence-gathering', 'completed')
      onProgress?.('synthesis', 'running')

      // Extract actual article content from fireplexity results, not just the summary
      const extractResearch = (i: number, charLimit = 6000): string => {
        const result = queryResults[i]?.status === 'fulfilled' ? queryResults[i].value.data : null
        if (!result) return 'No data available.'

        // Pull actual content from the top results, not just the summary
        const articles = result.results || result.data || []
        if (Array.isArray(articles) && articles.length > 0) {
          const contentParts: string[] = []
          let totalLen = 0
          for (const article of articles) {
            if (totalLen >= charLimit) break
            const title = article.title || ''
            const content = article.content || article.description || ''
            const source = article.source?.name || article.source || ''
            if (content.length < 30) continue // skip empty results
            const entry = `[${source}] ${title}\n${content.substring(0, 2000)}`
            contentParts.push(entry)
            totalLen += entry.length
          }
          if (contentParts.length > 0) return contentParts.join('\n\n---\n\n')
        }

        // Fallback to summary if no article content
        return result.summary || result.answer || JSON.stringify(result).substring(0, charLimit)
      }

      const rawResearch: Record<string, any> = {
        situation: { summary: extractResearch(0) },
        stakeholders: { summary: extractResearch(1) },
        geopolitical: { summary: extractResearch(2) },  // context/competitive/regulatory research — fed to stage2
        impact: { summary: extractResearch(3) },
        historical: { summary: extractResearch(4) },
        legal: { summary: extractResearch(2, 3000) },   // reuses context query for regulatory angle
        media: { summary: extractResearch(0, 3000) },   // reuses situation query for media narrative
      }

      // Stage 1: Situation Assessment + Stakeholder Analysis
      onProgress?.('synthesis-stage1', 'running')
      const { data: stage1Result, error: stage1Error } = await supabase.functions.invoke('pa-intel-stage1', {
        body: {
          organization_name: organizationName,
          organization_profile: orgData?.company_profile || {},
          industry,
          trigger_event: triggerEvent,
          raw_research: rawResearch
        }
      })
      if (stage1Error) throw stage1Error
      if (!stage1Result?.success) throw new Error(stage1Result?.error || 'Stage 1 failed')
      onProgress?.('synthesis-stage1', 'completed')

      // Extract event_type from Stage 1 classification
      const eventType = stage1Result.stage1.event_type || 'geopolitical'
      console.log(`[PA] Event classified as: ${eventType}`)

      // Stage 2: Scenarios + Impact (builds on Stage 1)
      onProgress?.('synthesis-stage2', 'running')
      const { data: stage2Result, error: stage2Error } = await supabase.functions.invoke('pa-intel-stage2', {
        body: {
          organization_name: organizationName,
          industry,
          trigger_event: triggerEvent,
          raw_research: rawResearch,
          stage1: stage1Result.stage1,
          event_type: eventType
        }
      })
      if (stage2Error) throw stage2Error
      if (!stage2Result?.success) throw new Error(stage2Result?.error || 'Stage 2 failed')
      onProgress?.('synthesis-stage2', 'completed')

      // Merge stages into unified research data
      // Stage 2 returns either geopolitical_context or contextual_analysis depending on event_type
      const contextSection = stage2Result.stage2.contextual_analysis || stage2Result.stage2.geopolitical_context
      const synthesisResult = {
        research_data: {
          event_type: eventType,
          situation_assessment: stage1Result.stage1.situation_assessment,
          stakeholder_analysis: stage1Result.stage1.stakeholder_analysis,
          contextual_analysis: contextSection,
          scenario_analysis: stage2Result.stage2.scenario_analysis,
          impact_assessment: stage2Result.stage2.impact_assessment,
          sources_and_confidence: stage2Result.stage2.sources_and_confidence
        }
      }

      // Update report with research data
      const researchData = synthesisResult?.research_data || {}

      await supabase
        .from('public_affairs_reports')
        .update({
          status: 'research_complete',
          research_data: researchData
        })
        .eq('id', reportId)

      onProgress?.('synthesis', 'completed')
      onProgress?.('saving', 'running')

      // Save one consolidated report to Memory Vault
      const vaultFolder = report.vault_folder || `Public Affairs/${triggerEvent.title}`

      // Build a temporary report object to compile the full markdown
      const tempReport: any = {
        title: triggerEvent.title,
        created_at: new Date().toISOString(),
        urgency: report.urgency || 'standard',
        trigger_event: triggerEvent,
        research_data: researchData,
      }
      const fullMarkdown = PublicAffairsService.compileFullReport(tempReport)

      await PublicAffairsService.saveToVault(
        organizationId,
        vaultFolder,
        `Geopolitical Intelligence: ${triggerEvent.title}`,
        fullMarkdown,
        reportId
      )
      onProgress?.('saving', 'completed')

      return { success: true, research_data: researchData }
    } catch (err) {
      await supabase
        .from('public_affairs_reports')
        .update({ status: 'failed' })
        .eq('id', reportId)

      onProgress?.('research', 'failed')
      throw err
    }
  }

  /**
   * Generate blueprint (scenario tree, recommendations, monitoring framework)
   */
  static async generateBlueprint(
    reportId: string,
    organizationId: string,
    organizationName: string,
    industry: string,
    onProgress?: (stage: string, status: 'running' | 'completed' | 'failed') => void
  ): Promise<any> {
    await supabase
      .from('public_affairs_reports')
      .update({ status: 'blueprint_in_progress' })
      .eq('id', reportId)

    onProgress?.('blueprint', 'running')

    try {
      const { data: report } = await supabase
        .from('public_affairs_reports')
        .select('*')
        .eq('id', reportId)
        .single()

      if (!report?.research_data) throw new Error('Research data required before generating blueprint')

      const { data: result, error } = await supabase.functions.invoke('generate-public-affairs-blueprint', {
        body: {
          report_id: reportId,
          organization_id: organizationId,
          organization_name: organizationName,
          industry,
          trigger_event: report.trigger_event,
          research_data: report.research_data
        }
      })

      if (error) throw error

      const blueprintData = result?.blueprint_data || {}

      await supabase
        .from('public_affairs_reports')
        .update({
          status: 'blueprint_complete',
          blueprint_data: blueprintData
        })
        .eq('id', reportId)

      onProgress?.('blueprint', 'completed')

      // Save blueprint sections to Memory Vault
      const vaultFolder = report.vault_folder || `Public Affairs/${report.title}`
      const savePromises = []

      if (blueprintData.scenario_tree) {
        savePromises.push(
          PublicAffairsService.saveToVault(organizationId, `${vaultFolder}/Scenario Tree`, 'Scenario Tree', blueprintData.scenario_tree, reportId)
        )
      }
      if (blueprintData.recommendations) {
        savePromises.push(
          PublicAffairsService.saveToVault(organizationId, `${vaultFolder}/Recommendations`, 'Recommendations', blueprintData.recommendations, reportId)
        )
      }
      if (blueprintData.executive_summary) {
        savePromises.push(
          PublicAffairsService.saveToVault(organizationId, `${vaultFolder}/Executive Summary`, 'Executive Summary', blueprintData.executive_summary, reportId)
        )
      }
      if (blueprintData.monitoring_framework) {
        savePromises.push(
          PublicAffairsService.saveToVault(organizationId, `${vaultFolder}/Monitoring Framework`, 'Monitoring Framework', blueprintData.monitoring_framework, reportId)
        )
      }

      await Promise.allSettled(savePromises)

      return { success: true, blueprint_data: blueprintData }
    } catch (err) {
      await supabase
        .from('public_affairs_reports')
        .update({ status: 'research_complete' }) // revert so they can retry
        .eq('id', reportId)
      onProgress?.('blueprint', 'failed')
      throw err
    }
  }

  /**
   * Generate presentation deck
   */
  static async generatePresentation(
    reportId: string,
    organizationId: string,
    onProgress?: (status: 'running' | 'completed' | 'failed') => void
  ): Promise<any> {
    await supabase
      .from('public_affairs_reports')
      .update({ status: 'presentation_in_progress' })
      .eq('id', reportId)

    onProgress?.('running')

    try {
      const { data: report } = await supabase
        .from('public_affairs_reports')
        .select('*')
        .eq('id', reportId)
        .single()

      if (!report) throw new Error('Report not found')

      // Compile the report into text content for Gamma
      const compiledContent = PublicAffairsService.compileFullReport(report)

      const { data: result, error } = await supabase.functions.invoke('gamma-presentation', {
        body: {
          title: `Public Affairs Brief: ${report.title}`,
          topic: report.title,
          content: compiledContent,
          organization_id: organizationId,
          capture: true,
          options: {
            numCards: 12,
            imageSource: 'ai',
            tone: 'professional',
            audience: 'executive leadership'
          }
        }
      })

      console.log('Gamma presentation response:', result)

      if (error) throw error

      // Gamma returns a generationId and requires polling
      const generationId = result?.generationId
      if (!generationId) {
        throw new Error('No generation ID returned from Gamma')
      }

      // Poll for completion (up to 90 seconds)
      let presentationUrl: string | null = null
      const maxAttempts = 18 // 18 * 5s = 90s
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 5000))

        const { data: statusResult, error: statusError } = await supabase.functions.invoke('gamma-presentation', {
          body: { generationId }
        })

        console.log(`Gamma poll attempt ${attempt + 1}:`, statusResult?.status)

        if (statusError) {
          console.error('Gamma status poll error:', statusError)
          continue
        }

        if (statusResult?.status === 'completed') {
          presentationUrl = statusResult?.gammaUrl || statusResult?.url || statusResult?.exportUrls?.view
          break
        }

        if (statusResult?.status === 'error') {
          throw new Error(statusResult?.error || 'Gamma generation failed')
        }
      }

      if (!presentationUrl) {
        throw new Error('Presentation generation timed out')
      }

      await supabase
        .from('public_affairs_reports')
        .update({
          status: 'complete',
          presentation_url: presentationUrl,
          presentation_metadata: { generationId }
        })
        .eq('id', reportId)

      // Save presentation link to vault
      const vaultFolder = report.vault_folder || `Public Affairs/${report.title}`
      await PublicAffairsService.saveToVault(
        organizationId,
        `${vaultFolder}/Presentation`,
        'Intelligence Brief Presentation',
        `Presentation URL: ${presentationUrl}`,
        reportId,
        { gamma_url: presentationUrl, generationId }
      )

      onProgress?.('completed')
      return { success: true, url: presentationUrl }
    } catch (err) {
      onProgress?.('failed')
      throw err
    }
  }

  /**
   * Generate a condensed 1-pager from a full research report
   */
  static async generateOnePager(
    reportId: string,
    organizationId: string,
    organizationName: string
  ): Promise<any> {
    const { data: report } = await supabase
      .from('public_affairs_reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (!report) throw new Error('Report not found')

    const compiledContent = PublicAffairsService.compileFullReport(report)

    const { data: result, error } = await supabase.functions.invoke('pa-one-pager', {
      body: {
        report_content: compiledContent,
        title: report.title,
        organization_name: organizationName,
        urgency: report.urgency
      }
    })

    if (error) throw error
    if (!result?.success) throw new Error(result?.error || 'One-pager generation failed')

    // Save one-pager data to the report
    await supabase
      .from('public_affairs_reports')
      .update({
        one_pager_data: result.one_pager,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    // Save to vault
    const vaultFolder = report.vault_folder || `Public Affairs/${report.title}`
    const onePagerMarkdown = PublicAffairsService.onePagerToMarkdown(report.title, result.one_pager)
    await PublicAffairsService.saveToVault(
      organizationId,
      `${vaultFolder}/One-Pager`,
      'Executive One-Pager',
      onePagerMarkdown,
      reportId,
      { type: 'one_pager' }
    )

    return result.one_pager
  }

  /**
   * Convert one-pager JSON to formatted markdown
   */
  private static onePagerToMarkdown(title: string, data: any): string {
    let md = `# ${title} — Executive One-Pager\n\n`
    md += `## ${data.headline}\n\n`
    md += `**BOTTOM LINE:** ${data.bottom_line}\n\n`
    md += `**Confidence:** ${data.confidence_level} | **Sources:** ${data.sources_count}\n\n---\n\n`

    if (data.key_facts?.length) {
      md += `### Key Facts\n`
      data.key_facts.forEach((f: string) => { md += `- ${f}\n` })
      md += `\n`
    }

    if (data.stakeholder_snapshot?.length) {
      md += `### Stakeholder Snapshot\n`
      data.stakeholder_snapshot.forEach((s: any) => { md += `- **${s.name}:** ${s.position}\n` })
      md += `\n`
    }

    if (data.scenarios?.length) {
      md += `### Scenarios\n`
      data.scenarios.forEach((s: any) => { md += `- **${s.label}** (${s.probability}): ${s.description}\n` })
      md += `\n`
    }

    if (data.recommended_actions?.length) {
      md += `### Recommended Actions\n`
      data.recommended_actions.forEach((a: string) => { md += `- ${a}\n` })
      md += `\n`
    }

    if (data.watch_indicators?.length) {
      md += `### Watch Indicators\n`
      data.watch_indicators.forEach((w: string) => { md += `- ${w}\n` })
    }

    return md
  }

  /**
   * Fetch all reports for an organization
   */
  static async getReports(organizationId: string): Promise<PublicAffairsReport[]> {
    const { data, error } = await supabase
      .from('public_affairs_reports')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Fetch a single report
   */
  static async getReport(reportId: string): Promise<PublicAffairsReport | null> {
    const { data, error } = await supabase
      .from('public_affairs_reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (error) return null
    return data
  }

  /**
   * Delete a report
   */
  static async deleteReport(reportId: string): Promise<void> {
    const { error } = await supabase
      .from('public_affairs_reports')
      .delete()
      .eq('id', reportId)

    if (error) throw error
  }

  /**
   * Save a section to Memory Vault via content library
   */
  private static async saveToVault(
    organizationId: string,
    folder: string,
    title: string,
    content: any,
    reportId: string,
    extraMetadata?: Record<string, any>
  ): Promise<void> {
    // Convert structured data to readable markdown instead of raw JSON
    const contentStr = typeof content === 'string' ? content : PublicAffairsService.dataToMarkdown(title, content)

    try {
      const response = await fetch('/api/content-library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            type: 'intelligence_report',
            title,
            content: contentStr,
            organization_id: organizationId,
            metadata: {
              public_affairs_report_id: reportId,
              section: title,
              source: 'public_affairs_engine',
              ...extraMetadata
            }
          },
          folder
        })
      })

      if (!response.ok) {
        console.error('Failed to save to vault:', await response.text())
      }
    } catch (err) {
      console.error('Error saving to vault:', err)
    }
  }

  /**
   * Convert structured data to readable markdown
   */
  private static dataToMarkdown(title: string, data: any): string {
    if (typeof data === 'string') return `# ${title}\n\n${data}`

    let md = `# ${title}\n\n`

    const renderValue = (key: string, value: any, depth: number = 2): string => {
      const heading = '#'.repeat(Math.min(depth, 4))
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      let result = ''

      if (typeof value === 'string') {
        result += `${heading} ${label}\n\n${value}\n\n`
      } else if (Array.isArray(value)) {
        result += `${heading} ${label}\n\n`
        value.forEach((item) => {
          if (typeof item === 'string') {
            result += `- ${item}\n`
          } else if (typeof item === 'object' && item !== null) {
            // Render object items as sub-entries
            const itemName = item.name || item.entity || item.indicator || ''
            if (itemName) result += `**${itemName}**\n`
            Object.entries(item).forEach(([k, v]) => {
              if (k === 'name' || k === 'entity' || k === 'indicator') return
              result += `- **${k.replace(/_/g, ' ')}:** ${v}\n`
            })
            result += '\n'
          }
        })
        result += '\n'
      } else if (typeof value === 'object' && value !== null) {
        result += `${heading} ${label}\n\n`
        Object.entries(value).forEach(([k, v]) => {
          result += renderValue(k, v, depth + 1)
        })
      }

      return result
    }

    Object.entries(data).forEach(([key, value]) => {
      md += renderValue(key, value)
    })

    return md
  }

  /**
   * Convert a section to markdown for export
   */
  static sectionToMarkdown(sectionName: string, data: any): string {
    if (typeof data === 'string') return `# ${sectionName}\n\n${data}`
    return `# ${sectionName}\n\n${JSON.stringify(data, null, 2)}`
  }

  /**
   * Compile full report to markdown
   */
  static compileFullReport(report: PublicAffairsReport): string {
    let md = `# ${report.title}\n\n`
    md += `**Date:** ${new Date(report.created_at).toLocaleDateString()}\n`
    md += `**Urgency:** ${report.urgency}\n`
    md += `**Source:** ${report.trigger_event.source || 'Intelligence Pipeline'}\n\n`
    md += `---\n\n`

    const rd = report.research_data
    const useNew = isNewFormat(rd)

    // Executive Summary — from research_data (new) or blueprint_data (legacy)
    const execSummary = rd?.executive_summary || report.blueprint_data?.executive_summary
    if (execSummary) {
      md += `## Executive Summary\n\n${execSummary}\n\n---\n\n`
    }

    // Situation Assessment
    if (rd?.situation_assessment) {
      const sa = rd.situation_assessment
      md += `## Situation Assessment\n\n`
      if (typeof sa === 'string') {
        md += `${sa}\n\n`
      } else if (useNew) {
        if (sa.current_situation) md += `### Current Situation\n${sa.current_situation}\n\n`
        if (sa.historical_context) md += `### Historical Context\n${sa.historical_context}\n\n`
        if (sa.key_developments && Array.isArray(sa.key_developments)) {
          md += `### Key Developments\n`
          sa.key_developments.forEach((d: any) => {
            md += `- **${d.date}** — ${d.event}: ${d.significance}\n`
          })
          md += `\n`
        }
        if (sa.key_actors && Array.isArray(sa.key_actors)) {
          md += `### Key Actors\n`
          sa.key_actors.forEach((a: any) => {
            md += `- **${a.name}** (${a.role}): ${a.position} [Influence: ${a.influence_level}]\n`
          })
          md += `\n`
        }
      } else {
        // Legacy format
        if (sa.what_happened) md += `### What Happened\n${sa.what_happened}\n\n`
        if (sa.context) md += `### Context\n${sa.context}\n\n`
        if (sa.key_actors) {
          md += `### Key Actors\n`
          if (Array.isArray(sa.key_actors)) {
            sa.key_actors.forEach((a: any) => { md += `- **${a.name || a}**: ${a.position || a.role || ''}\n` })
          } else { md += `${sa.key_actors}\n` }
          md += `\n`
        }
        if (sa.current_state) md += `### Current State of Play\n${sa.current_state}\n\n`
      }
      md += `---\n\n`
    }

    // Contextual Analysis (adaptive) or legacy Geopolitical Context
    const ctxData = rd?.contextual_analysis || rd?.geopolitical_context
    if (ctxData) {
      const et = rd?.event_type || 'geopolitical'
      const sectionTitles: Record<string, { title: string, sub1: string, sub2: string, sub3: string }> = {
        geopolitical: { title: 'Geopolitical Context', sub1: 'Regional Dynamics', sub2: 'International Implications', sub3: 'Power Balance Analysis' },
        corporate: { title: 'Industry & Competitive Analysis', sub1: 'Competitive Landscape', sub2: 'Governance & Talent Implications', sub3: 'Regulatory Exposure' },
        regulatory: { title: 'Regulatory & Policy Analysis', sub1: 'Regulatory Landscape', sub2: 'Industry Response', sub3: 'Political Dynamics' },
        economic: { title: 'Market & Economic Analysis', sub1: 'Market Dynamics', sub2: 'Supply Chain & Trade Implications', sub3: 'Policy Responses' },
      }
      const l = sectionTitles[et] || sectionTitles.geopolitical
      if (typeof ctxData === 'string') { md += `## ${l.title}\n\n${ctxData}\n\n` }
      else {
        md += `## ${l.title}\n\n`
        const f1 = ctxData.primary_analysis || ctxData.regional_dynamics
        const f2 = ctxData.secondary_analysis || ctxData.international_implications
        const f3 = ctxData.power_dynamics || ctxData.power_balance_analysis
        if (f1) md += `### ${l.sub1}\n${f1}\n\n`
        if (f2) md += `### ${l.sub2}\n${f2}\n\n`
        if (f3) md += `### ${l.sub3}\n${f3}\n\n`
      }
      md += `---\n\n`
    }

    // Stakeholder Analysis (new) or Stakeholder Map (legacy)
    if (rd?.stakeholder_analysis) {
      const sa = rd.stakeholder_analysis
      md += `## Stakeholder Analysis\n\n`
      if (sa.stakeholders && Array.isArray(sa.stakeholders)) {
        sa.stakeholders.forEach((s: any) => {
          md += `### ${s.name} (${s.type})\n`
          if (s.position) md += `- **Position:** ${s.position}\n`
          if (s.motivations) md += `- **Motivations:** ${s.motivations}\n`
          if (s.constraints) md += `- **Constraints:** ${s.constraints}\n`
          if (s.likely_moves) md += `- **Likely Moves:** ${s.likely_moves}\n`
          if (s.relationship_to_client) md += `- **Relationship:** ${s.relationship_to_client}\n`
          md += `\n`
        })
      }
      if (sa.alignment_map) md += `### Alignment Map\n${sa.alignment_map}\n\n`
      if (sa.pressure_points) md += `### Pressure Points\n${sa.pressure_points}\n\n`
      md += `---\n\n`
    } else if (rd?.stakeholder_map) {
      const sm = rd.stakeholder_map
      md += `## Stakeholder Map\n\n`
      if (typeof sm === 'string') { md += `${sm}\n\n` }
      else if (Array.isArray(sm.stakeholders || sm)) {
        (sm.stakeholders || sm).forEach((s: any) => {
          md += `### ${s.name || s.entity}\n`
          if (s.position) md += `- **Position:** ${s.position}\n`
          if (s.incentive) md += `- **Incentive:** ${s.incentive}\n`
          if (s.constraints) md += `- **Constraints:** ${s.constraints}\n`
          if (s.likely_next_move) md += `- **Likely Next Move:** ${s.likely_next_move}\n`
          md += `\n`
        })
      }
      md += `---\n\n`
    }

    // Scenario Analysis (new format — baked into research)
    if (rd?.scenario_analysis) {
      const sc = rd.scenario_analysis
      md += `## Scenario Analysis\n\n`
      if (sc.scenarios && Array.isArray(sc.scenarios)) {
        sc.scenarios.forEach((s: any) => {
          md += `### ${s.name} (${s.likelihood})\n`
          if (s.narrative) md += `${s.narrative}\n\n`
          if (s.key_drivers) md += `**Key Drivers:** ${Array.isArray(s.key_drivers) ? s.key_drivers.join(', ') : s.key_drivers}\n`
          if (s.leading_indicators) md += `**Leading Indicators:** ${Array.isArray(s.leading_indicators) ? s.leading_indicators.join(', ') : s.leading_indicators}\n`
          if (s.timeline) md += `**Timeline:** ${s.timeline}\n`
          if (s.client_impact) md += `**Client Impact:** ${s.client_impact}\n`
          md += `\n`
        })
      }
      if (sc.key_variables) md += `### Key Variables\n${sc.key_variables}\n\n`
      if (sc.wildcards) md += `### Wildcards\n${sc.wildcards}\n\n`
      md += `---\n\n`
    }

    // Impact Assessment (new) or Impact Analysis (legacy)
    if (rd?.impact_assessment) {
      const ia = rd.impact_assessment
      md += `## Impact Assessment\n\n`
      if (ia.direct_impacts) md += `### Direct Impacts\n${ia.direct_impacts}\n\n`
      if (ia.second_order_effects) md += `### Second-Order Effects\n${ia.second_order_effects}\n\n`
      if (ia.timeline_of_effects) md += `### Timeline of Effects\n${ia.timeline_of_effects}\n\n`
      if (ia.risk_matrix && Array.isArray(ia.risk_matrix)) {
        md += `### Risk Matrix\n`
        ia.risk_matrix.forEach((r: any) => {
          md += `- **${r.risk}** — Severity: ${r.severity}, Likelihood: ${r.likelihood} | Mitigation: ${r.mitigation}\n`
        })
        md += `\n`
      }
      md += `---\n\n`
    } else if (rd?.impact_analysis) {
      const ia = rd.impact_analysis
      md += `## Impact Analysis\n\n`
      if (typeof ia === 'string') { md += `${ia}\n\n` }
      else {
        if (ia.direct_impacts) md += `### Direct Impacts\n${typeof ia.direct_impacts === 'string' ? ia.direct_impacts : JSON.stringify(ia.direct_impacts, null, 2)}\n\n`
        if (ia.indirect_effects) md += `### Indirect Effects\n${typeof ia.indirect_effects === 'string' ? ia.indirect_effects : JSON.stringify(ia.indirect_effects, null, 2)}\n\n`
        if (ia.severity_assessment) md += `### Severity Assessment\n${typeof ia.severity_assessment === 'string' ? ia.severity_assessment : JSON.stringify(ia.severity_assessment, null, 2)}\n\n`
        if (ia.timeline) md += `### Timeline\n${typeof ia.timeline === 'string' ? ia.timeline : JSON.stringify(ia.timeline, null, 2)}\n\n`
      }
      md += `---\n\n`
    }

    // Blueprint sections (Strategize action — legacy or post-intelligence)
    if (report.blueprint_data?.scenario_tree) {
      const st = report.blueprint_data.scenario_tree
      md += `## Strategic Scenarios\n\n`
      if (typeof st === 'string') { md += `${st}\n\n` }
      else {
        const scenarios = st.scenarios || [st.base_case, st.upside, st.downside, st.black_swan].filter(Boolean)
        scenarios.forEach((s: any) => {
          md += `### ${s.name || s.label || 'Scenario'} (${s.probability || 'N/A'})\n`
          if (s.narrative) md += `${s.narrative}\n\n`
          if (s.key_driver) md += `**Key Driver:** ${s.key_driver}\n`
          if (s.indicators) md += `**Indicators:** ${Array.isArray(s.indicators) ? s.indicators.join(', ') : s.indicators}\n`
          if (s.client_impact) md += `**Impact:** ${s.client_impact}\n`
          md += `\n`
        })
      }
      md += `---\n\n`
    }

    if (report.blueprint_data?.recommendations) {
      const rec = report.blueprint_data.recommendations
      md += `## Strategic Recommendations\n\n`
      if (typeof rec === 'string') { md += `${rec}\n\n` }
      else {
        if (rec.immediate) md += `### Immediate (This Week)\n${Array.isArray(rec.immediate) ? rec.immediate.map((r: string) => `- ${r}`).join('\n') : rec.immediate}\n\n`
        if (rec.short_term) md += `### Short-Term (30 Days)\n${Array.isArray(rec.short_term) ? rec.short_term.map((r: string) => `- ${r}`).join('\n') : rec.short_term}\n\n`
        if (rec.medium_term) md += `### Medium-Term (90 Days)\n${Array.isArray(rec.medium_term) ? rec.medium_term.map((r: string) => `- ${r}`).join('\n') : rec.medium_term}\n\n`
      }
      md += `---\n\n`
    }

    if (report.blueprint_data?.monitoring_framework) {
      const mf = report.blueprint_data.monitoring_framework
      md += `## Monitoring Framework\n\n`
      if (typeof mf === 'string') { md += `${mf}\n\n` }
      else if (Array.isArray(mf.indicators || mf)) {
        (mf.indicators || mf).forEach((ind: any) => {
          md += `- **${ind.indicator || ind.name}**: ${ind.threshold || ''} ${ind.action ? `-> ${ind.action}` : ''}\n`
        })
      }
    }

    // Sources & Confidence (new or legacy)
    const sc = rd?.sources_and_confidence || rd?.sources_confidence
    if (sc) {
      md += `\n---\n\n## Sources & Confidence\n\n`
      if (typeof sc === 'string') { md += `${sc}\n` }
      else {
        if (sc.confidence_level) md += `**Overall Confidence:** ${sc.confidence_level}\n`
        if (sc.confidence_justification) md += `${sc.confidence_justification}\n\n`
        if (sc.key_sources && Array.isArray(sc.key_sources)) {
          md += `**Key Sources:**\n`
          sc.key_sources.forEach((s: any) => md += `- ${typeof s === 'string' ? s : `${s.source || s.name} (${s.reliability})`}\n`)
        }
        if (sc.intelligence_gaps && Array.isArray(sc.intelligence_gaps)) {
          md += `\n**Intelligence Gaps:**\n`
          sc.intelligence_gaps.forEach((g: string) => md += `- ${g}\n`)
        }
        if (sc.collection_priorities && Array.isArray(sc.collection_priorities)) {
          md += `\n**Collection Priorities:**\n`
          sc.collection_priorities.forEach((p: string) => md += `- ${p}\n`)
        }
      }
    }

    return md
  }

  /**
   * Compile report to a formatted HTML intelligence brief (printable / saveable as PDF)
   */
  static compileHtmlBrief(report: PublicAffairsReport): string {
    const rd = report.research_data
    const useNew = isNewFormat(rd)
    const date = new Date(report.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const esc = (s: string) => s?.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || ''
    const prose = (text: string) => text ? text.split('\n\n').map(p => `<p>${esc(p.trim())}</p>`).join('\n') : ''
    const badge = (text: string, color: string) => `<span style="display:inline-block;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:600;background:${color};color:#fff;letter-spacing:0.5px;">${esc(text)}</span>`

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(report.title)} — Intelligence Brief</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #1a1a2e; background: #fff; line-height: 1.7; }
  .page { max-width: 800px; margin: 0 auto; padding: 60px 48px; }
  @media print { .page { padding: 40px 32px; } .no-print { display: none !important; } }
  .header { border-bottom: 3px solid #1a1a2e; padding-bottom: 24px; margin-bottom: 40px; }
  .header h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 700; line-height: 1.3; margin-bottom: 8px; }
  .header .meta { font-size: 13px; color: #666; }
  .header .classification { display: inline-block; margin-top: 8px; padding: 4px 12px; border: 2px solid #1a1a2e; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; }
  .section { margin-bottom: 36px; }
  .section h2 { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0; color: #1a1a2e; }
  .section h3 { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #444; margin: 20px 0 8px; }
  .section p { font-size: 14.5px; color: #2a2a3e; margin-bottom: 12px; }
  .scenario-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0; }
  @media (max-width: 700px) { .scenario-grid { grid-template-columns: 1fr; } }
  .scenario-card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
  .scenario-card.green { border-left: 4px solid #22c55e; }
  .scenario-card.amber { border-left: 4px solid #f59e0b; }
  .scenario-card.red { border-left: 4px solid #ef4444; }
  .scenario-card h4 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
  .scenario-card .likelihood { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
  .scenario-card .likelihood.green { color: #16a34a; }
  .scenario-card .likelihood.amber { color: #d97706; }
  .scenario-card .likelihood.red { color: #dc2626; }
  .scenario-card p { font-size: 13px; color: #555; margin-bottom: 8px; }
  .stakeholder-card { background: #f8f8fa; border-radius: 6px; padding: 14px; margin-bottom: 10px; }
  .stakeholder-card strong { font-size: 14px; }
  .stakeholder-card .detail { font-size: 13px; color: #555; margin-top: 4px; }
  .risk-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
  .risk-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: #fff; }
  .confidence-badge { display: inline-block; padding: 4px 14px; border-radius: 4px; font-size: 13px; font-weight: 600; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; text-align: center; }
  .dev { font-size: 13px; color: #555; margin-bottom: 8px; }
</style>
</head>
<body>
<div class="page">

<div class="header">
  <h1>${esc(report.title)}</h1>
  <div class="meta">${date} &nbsp;|&nbsp; ${esc(report.trigger_event.source || 'Intelligence Pipeline')} &nbsp;|&nbsp; ${esc(report.urgency.toUpperCase())}</div>
  <div class="classification">GEOPOLITICAL INTELLIGENCE BRIEF</div>
</div>
`

    // Executive Summary
    const execSummary = rd?.executive_summary || report.blueprint_data?.executive_summary
    if (execSummary) {
      html += `<div class="section"><h2>Executive Summary</h2>${prose(execSummary)}</div>\n`
    }

    // Situation Assessment
    if (rd?.situation_assessment && useNew) {
      const sa = rd.situation_assessment
      html += `<div class="section"><h2>Situation Assessment</h2>\n`
      if (sa.current_situation) html += `<h3>Current Situation</h3>${prose(sa.current_situation)}`
      if (sa.historical_context) html += `<h3>Historical Context</h3>${prose(sa.historical_context)}`
      if (sa.key_developments?.length) {
        html += `<h3>Key Developments</h3>`
        sa.key_developments.forEach((d: any) => {
          html += `<div class="dev"><strong>${esc(d.date)}</strong> — ${esc(d.event)}: <em>${esc(d.significance)}</em></div>`
        })
      }
      if (sa.key_actors?.length) {
        html += `<h3>Key Actors</h3>`
        sa.key_actors.forEach((a: any) => {
          html += `<div class="dev"><strong>${esc(a.name)}</strong> (${esc(a.role)}) — ${esc(a.position)} ${badge(a.influence_level, a.influence_level === 'high' ? '#dc2626' : a.influence_level === 'medium' ? '#d97706' : '#6b7280')}</div>`
        })
      }
      html += `</div>\n`
    }

    // Contextual Analysis (adaptive) or legacy Geopolitical Context
    const ctxHtml = rd?.contextual_analysis || rd?.geopolitical_context
    if (ctxHtml) {
      const et = rd?.event_type || 'geopolitical'
      const htmlLabels: Record<string, { title: string, sub1: string, sub2: string, sub3: string }> = {
        geopolitical: { title: 'Geopolitical Context', sub1: 'Regional Dynamics', sub2: 'International Implications', sub3: 'Power Balance' },
        corporate: { title: 'Industry &amp; Competitive Analysis', sub1: 'Competitive Landscape', sub2: 'Governance &amp; Talent Implications', sub3: 'Regulatory Exposure' },
        regulatory: { title: 'Regulatory &amp; Policy Analysis', sub1: 'Regulatory Landscape', sub2: 'Industry Response', sub3: 'Political Dynamics' },
        economic: { title: 'Market &amp; Economic Analysis', sub1: 'Market Dynamics', sub2: 'Supply Chain &amp; Trade Implications', sub3: 'Policy Responses' },
      }
      const lh = htmlLabels[et] || htmlLabels.geopolitical
      const hf1 = ctxHtml.primary_analysis || ctxHtml.regional_dynamics
      const hf2 = ctxHtml.secondary_analysis || ctxHtml.international_implications
      const hf3 = ctxHtml.power_dynamics || ctxHtml.power_balance_analysis
      html += `<div class="section"><h2>${lh.title}</h2>\n`
      if (hf1) html += `<h3>${lh.sub1}</h3>${prose(hf1)}`
      if (hf2) html += `<h3>${lh.sub2}</h3>${prose(hf2)}`
      if (hf3) html += `<h3>${lh.sub3}</h3>${prose(hf3)}`
      html += `</div>\n`
    }

    // Stakeholder Analysis
    if (rd?.stakeholder_analysis?.stakeholders?.length) {
      html += `<div class="section"><h2>Stakeholder Analysis</h2>\n`
      rd.stakeholder_analysis.stakeholders.forEach((s: any) => {
        html += `<div class="stakeholder-card"><strong>${esc(s.name)}</strong> <span style="color:#888;font-size:12px;">${esc(s.type || '')}</span>`
        if (s.position) html += `<div class="detail"><strong>Position:</strong> ${esc(s.position)}</div>`
        if (s.motivations) html += `<div class="detail"><strong>Motivations:</strong> ${esc(s.motivations)}</div>`
        if (s.likely_moves) html += `<div class="detail"><strong>Likely Moves:</strong> ${esc(s.likely_moves)}</div>`
        html += `</div>`
      })
      if (rd.stakeholder_analysis.alignment_map) html += `<h3>Alignment Map</h3>${prose(rd.stakeholder_analysis.alignment_map)}`
      if (rd.stakeholder_analysis.pressure_points) html += `<h3>Pressure Points</h3>${prose(rd.stakeholder_analysis.pressure_points)}`
      html += `</div>\n`
    }

    // Scenario Analysis
    if (rd?.scenario_analysis?.scenarios?.length) {
      const scenarios = rd.scenario_analysis.scenarios
      html += `<div class="section"><h2>Scenario Analysis</h2>\n<div class="scenario-grid">`
      scenarios.forEach((s: any, i: number) => {
        const cls = i === 0 ? 'green' : i === 1 ? 'amber' : 'red'
        html += `<div class="scenario-card ${cls}">
          <h4>${esc(s.name)}</h4>
          <div class="likelihood ${cls}">${esc(s.likelihood)}</div>
          <p>${esc(typeof s.narrative === 'string' ? s.narrative.substring(0, 400) : '')}</p>
          ${s.key_drivers ? `<p style="font-size:12px;color:#777;"><strong>Drivers:</strong> ${esc((Array.isArray(s.key_drivers) ? s.key_drivers.join(', ') : String(s.key_drivers)).substring(0, 200))}</p>` : ''}
        </div>`
      })
      html += `</div>\n`
      // Full narratives
      scenarios.forEach((s: any) => {
        if (s.narrative && s.narrative.length > 400) {
          html += `<h3>${esc(s.name)} — Full Narrative</h3>${prose(s.narrative)}`
          if (s.timeline) html += `<p><strong>Timeline:</strong> ${esc(s.timeline)}</p>`
          if (s.client_impact) html += `<p><strong>Client Impact:</strong> ${esc(s.client_impact)}</p>`
        }
      })
      if (rd.scenario_analysis.key_variables) html += `<h3>Key Variables</h3>${prose(rd.scenario_analysis.key_variables)}`
      if (rd.scenario_analysis.wildcards) html += `<h3>Wildcards</h3>${prose(rd.scenario_analysis.wildcards)}`
      html += `</div>\n`
    }

    // Impact Assessment
    if (rd?.impact_assessment) {
      const ia = rd.impact_assessment
      html += `<div class="section"><h2>Impact Assessment</h2>\n`
      if (ia.direct_impacts) html += `<h3>Direct Impacts</h3>${prose(ia.direct_impacts)}`
      if (ia.second_order_effects) html += `<h3>Second-Order Effects</h3>${prose(ia.second_order_effects)}`
      if (ia.timeline_of_effects) html += `<h3>Timeline of Effects</h3>${prose(ia.timeline_of_effects)}`
      if (ia.risk_matrix?.length) {
        html += `<h3>Risk Matrix</h3>`
        ia.risk_matrix.forEach((r: any) => {
          const bg = r.severity === 'critical' ? '#dc2626' : r.severity === 'high' ? '#d97706' : r.severity === 'medium' ? '#eab308' : '#6b7280'
          html += `<div class="risk-row"><span class="risk-badge" style="background:${bg}">${esc(r.severity)}</span><span style="flex:1;">${esc(r.risk)}</span><span style="color:#888;font-size:12px;">L: ${esc(r.likelihood)}</span></div>`
        })
      }
      html += `</div>\n`
    }

    // Sources & Confidence
    const sc = rd?.sources_and_confidence || rd?.sources_confidence
    if (sc) {
      html += `<div class="section"><h2>Sources &amp; Confidence</h2>\n`
      if (sc.confidence_level) {
        const bg = sc.confidence_level === 'high' ? '#16a34a' : sc.confidence_level === 'medium' ? '#d97706' : '#dc2626'
        html += `<p><span class="confidence-badge" style="background:${bg};color:#fff;">${esc(sc.confidence_level.toUpperCase())}</span></p>`
      }
      if (sc.confidence_justification) html += prose(sc.confidence_justification)
      if (sc.intelligence_gaps?.length) {
        html += `<h3>Intelligence Gaps</h3><ul>${sc.intelligence_gaps.map((g: string) => `<li style="font-size:13px;color:#555;">${esc(g)}</li>`).join('')}</ul>`
      }
      if (sc.collection_priorities?.length) {
        html += `<h3>Collection Priorities</h3><ul>${sc.collection_priorities.map((p: string) => `<li style="font-size:13px;color:#555;">${esc(p)}</li>`).join('')}</ul>`
      }
      html += `</div>\n`
    }

    // Blueprint recommendations if present
    if (report.blueprint_data?.recommendations) {
      const rec = report.blueprint_data.recommendations
      html += `<div class="section"><h2>Strategic Recommendations</h2>\n`
      const tfs = [
        { key: 'immediate', label: 'Immediate (This Week)' },
        { key: 'short_term', label: 'Short-Term (30 Days)' },
        { key: 'medium_term', label: 'Medium-Term (90 Days)' },
      ]
      tfs.forEach(({ key, label }) => {
        const items = rec[key]
        if (!items) return
        html += `<h3>${label}</h3>`
        if (Array.isArray(items)) {
          html += `<ul>${items.map((r: string) => `<li style="font-size:14px;margin-bottom:6px;">${esc(r)}</li>`).join('')}</ul>`
        } else {
          html += prose(items)
        }
      })
      html += `</div>\n`
    }

    html += `<div class="footer">
  Generated by NIV Geopolitical Intelligence Engine &nbsp;|&nbsp; ${date}<br>
  <span style="font-size:11px;">This document is confidential and intended for authorized recipients only.</span>
</div>

</div>
</body>
</html>`

    return html
  }

  static compileOnePagerHtml(data: any, title: string): string {
    const esc = (s: string) => s?.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || ''
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} — Executive One-Pager</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #1a1a2e; background: #fff; line-height: 1.6; }
  .page { max-width: 800px; margin: 0 auto; padding: 48px; }
  @media print { .page { padding: 32px; } .no-print { display: none !important; } @page { size: A4; margin: 20mm; } }
  .header { border-bottom: 3px solid #1a1a2e; padding-bottom: 20px; margin-bottom: 32px; }
  .header h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; line-height: 1.3; margin-bottom: 6px; }
  .header .meta { font-size: 12px; color: #666; display: flex; align-items: center; gap: 8px; }
  .header .classification { display: inline-block; margin-top: 8px; padding: 3px 10px; border: 2px solid #0891b2; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #0891b2; }
  .headline { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 20px; line-height: 1.35; }
  .bluf { background: #f0fdfa; border-left: 4px solid #0891b2; padding: 16px 20px; margin-bottom: 24px; border-radius: 0 6px 6px 0; }
  .bluf .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #0891b2; margin-bottom: 6px; }
  .bluf p { font-size: 14px; color: #1a1a2e; line-height: 1.65; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  @media (max-width: 600px) { .two-col { grid-template-columns: 1fr; } }
  .col-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 10px; }
  .fact { display: flex; gap: 8px; margin-bottom: 8px; font-size: 13px; color: #2a2a3e; }
  .fact-dot { width: 6px; height: 6px; border-radius: 50%; background: #0891b2; margin-top: 6px; flex-shrink: 0; }
  .stakeholder { background: #f8f8fa; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; }
  .stakeholder strong { font-size: 13px; color: #1a1a2e; }
  .stakeholder .stance { font-size: 12px; color: #555; margin-top: 2px; }
  .scenario-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  @media (max-width: 600px) { .scenario-grid { grid-template-columns: 1fr; } }
  .scenario { border-radius: 8px; padding: 14px; }
  .scenario.likely { background: #f0fdfa; border: 1px solid #99f6e4; }
  .scenario.best { background: #f0fdf4; border: 1px solid #bbf7d0; }
  .scenario.worst { background: #fef2f2; border: 1px solid #fecaca; }
  .scenario .s-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .scenario.likely .s-label { color: #0891b2; }
  .scenario.best .s-label { color: #16a34a; }
  .scenario.worst .s-label { color: #dc2626; }
  .scenario .prob { font-size: 20px; font-weight: 700; margin: 4px 0; }
  .scenario.likely .prob { color: #0891b2; }
  .scenario.best .prob { color: #16a34a; }
  .scenario.worst .prob { color: #dc2626; }
  .scenario p { font-size: 12px; color: #555; }
  .action { display: flex; gap: 8px; margin-bottom: 6px; font-size: 13px; color: #2a2a3e; }
  .action-num { font-weight: 700; color: #0891b2; min-width: 16px; }
  .indicator { display: flex; gap: 8px; margin-bottom: 6px; font-size: 13px; color: #2a2a3e; }
  .indicator-icon { color: #d97706; font-weight: 700; }
  .confidence { display: inline-block; padding: 3px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
  .confidence.high { background: #dcfce7; color: #16a34a; }
  .confidence.medium { background: #fef3c7; color: #d97706; }
  .confidence.low { background: #fee2e2; color: #dc2626; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #999; text-align: center; }
</style>
</head>
<body>
<div class="page">

<div class="header">
  <h1>${esc(title)}</h1>
  <div class="meta">
    <span>${date}</span>
    <span>|</span>
    <span class="confidence ${(data.confidence_level || 'medium').toLowerCase()}">${esc((data.confidence_level || 'Medium').toUpperCase())} CONFIDENCE</span>
  </div>
  <div class="classification">Executive One-Pager</div>
</div>

<div class="headline">${esc(data.headline || '')}</div>

<div class="bluf">
  <div class="label">Bottom Line Up Front</div>
  <p>${esc(data.bottom_line || '')}</p>
</div>
`

    // Key Facts + Stakeholders
    html += `<div class="two-col">\n`
    if (data.key_facts?.length) {
      html += `<div><div class="col-label">Key Facts</div>\n`
      data.key_facts.forEach((f: string) => {
        html += `<div class="fact"><span class="fact-dot"></span><span>${esc(f)}</span></div>\n`
      })
      html += `</div>\n`
    }
    if (data.stakeholder_snapshot?.length) {
      html += `<div><div class="col-label">Stakeholder Snapshot</div>\n`
      data.stakeholder_snapshot.forEach((s: any) => {
        html += `<div class="stakeholder"><strong>${esc(s.name)}</strong><div class="stance">${esc(s.position)}</div></div>\n`
      })
      html += `</div>\n`
    }
    html += `</div>\n`

    // Scenarios
    if (data.scenarios?.length) {
      html += `<div class="col-label">Scenarios</div>\n<div class="scenario-grid">\n`
      const classes = ['likely', 'best', 'worst']
      data.scenarios.forEach((s: any, i: number) => {
        const cls = classes[i] || 'likely'
        html += `<div class="scenario ${cls}">
  <div class="s-label">${esc(s.label)}</div>
  <div class="prob">${esc(s.probability)}</div>
  <p>${esc(s.description)}</p>
</div>\n`
      })
      html += `</div>\n`
    }

    // Actions + Watch Indicators
    html += `<div class="two-col">\n`
    if (data.recommended_actions?.length) {
      html += `<div><div class="col-label">Recommended Actions</div>\n`
      data.recommended_actions.forEach((a: string, i: number) => {
        html += `<div class="action"><span class="action-num">${i + 1}.</span><span>${esc(a)}</span></div>\n`
      })
      html += `</div>\n`
    }
    if (data.watch_indicators?.length) {
      html += `<div><div class="col-label">Watch Indicators</div>\n`
      data.watch_indicators.forEach((w: string) => {
        html += `<div class="indicator"><span class="indicator-icon">◉</span><span>${esc(w)}</span></div>\n`
      })
      html += `</div>\n`
    }
    html += `</div>\n`

    html += `<div class="footer">
  Generated by NIV Intelligence Engine &nbsp;|&nbsp; ${date}<br>
  <span style="font-size:10px;">This document is confidential and intended for authorized recipients only.</span>
</div>

</div>
</body>
</html>`

    return html
  }
}
