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

      // Run 7 research queries in parallel via fireplexity (same wall-clock time as 3)
      const triggerEvent = report.trigger_event
      const title = triggerEvent.title

      const queries = [
        { key: 'situation', query: `${title} latest developments timeline 2025 2026`, focus: 'geopolitical_intelligence', max_results: 15 },
        { key: 'stakeholders', query: `${title} key stakeholders actors positions interests power dynamics`, focus: 'stakeholder_analysis', max_results: 12 },
        { key: 'impact', query: `${title} ${industry} sector economic impact implications`, focus: 'impact_assessment', max_results: 10 },
        { key: 'geopolitical', query: `${title} geopolitical context regional power dynamics alliances`, focus: 'geopolitical_intelligence', max_results: 12 },
        { key: 'historical', query: `${title} historical precedents similar situations past outcomes`, focus: 'geopolitical_intelligence', max_results: 10 },
        { key: 'legal', query: `${title} legal regulatory framework policy implications`, focus: 'impact_assessment', max_results: 10 },
        { key: 'media', query: `${title} media coverage narrative analysis public opinion`, focus: 'stakeholder_analysis', max_results: 10 },
      ]

      const queryResults = await Promise.allSettled(
        queries.map(q =>
          supabase.functions.invoke('niv-fireplexity', {
            body: {
              query: q.query,
              search_type: 'comprehensive',
              focus: q.focus,
              max_results: q.max_results
            }
          })
        )
      )

      onProgress?.('intelligence-gathering', 'completed')
      onProgress?.('synthesis', 'running')

      // Extract results keyed by name
      const rawResearch: Record<string, any> = {}
      queries.forEach((q, i) => {
        const result = queryResults[i]
        rawResearch[q.key] = result.status === 'fulfilled' ? result.value.data : null
      })

      // Synthesize into deep geopolitical intelligence memo via Claude
      const { data: synthesisResult, error: synthesisError } = await supabase.functions.invoke('generate-geopolitical-intelligence', {
        body: {
          report_id: reportId,
          organization_id: organizationId,
          organization_name: organizationName,
          organization_profile: orgData?.company_profile || {},
          industry,
          trigger_event: triggerEvent,
          raw_research: rawResearch
        }
      })

      if (synthesisError) throw synthesisError

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

      // Save each section to Memory Vault
      const vaultFolder = report.vault_folder || `Public Affairs/${triggerEvent.title}`

      const savePromises = []

      // New format sections
      if (researchData.executive_summary) {
        savePromises.push(
          PublicAffairsService.saveToVault(organizationId, `${vaultFolder}/Executive Summary`, 'Executive Summary', researchData.executive_summary, reportId)
        )
      }
      if (researchData.situation_assessment) {
        savePromises.push(
          PublicAffairsService.saveToVault(organizationId, `${vaultFolder}/Situation Assessment`, 'Situation Assessment', researchData.situation_assessment, reportId)
        )
      }
      if (researchData.geopolitical_context) {
        savePromises.push(
          PublicAffairsService.saveToVault(organizationId, `${vaultFolder}/Geopolitical Context`, 'Geopolitical Context', researchData.geopolitical_context, reportId)
        )
      }
      if (researchData.stakeholder_analysis) {
        savePromises.push(
          PublicAffairsService.saveToVault(organizationId, `${vaultFolder}/Stakeholder Analysis`, 'Stakeholder Analysis', researchData.stakeholder_analysis, reportId)
        )
      }
      if (researchData.scenario_analysis) {
        savePromises.push(
          PublicAffairsService.saveToVault(organizationId, `${vaultFolder}/Scenario Analysis`, 'Scenario Analysis', researchData.scenario_analysis, reportId)
        )
      }
      if (researchData.impact_assessment) {
        savePromises.push(
          PublicAffairsService.saveToVault(organizationId, `${vaultFolder}/Impact Assessment`, 'Impact Assessment', researchData.impact_assessment, reportId)
        )
      }
      if (researchData.sources_and_confidence) {
        savePromises.push(
          PublicAffairsService.saveToVault(organizationId, `${vaultFolder}/Sources & Confidence`, 'Sources & Confidence', researchData.sources_and_confidence, reportId)
        )
      }
      // Legacy format fallbacks
      if (researchData.stakeholder_map) {
        savePromises.push(
          PublicAffairsService.saveToVault(organizationId, `${vaultFolder}/Stakeholder Map`, 'Stakeholder Map', researchData.stakeholder_map, reportId)
        )
      }
      if (researchData.impact_analysis) {
        savePromises.push(
          PublicAffairsService.saveToVault(organizationId, `${vaultFolder}/Impact Analysis`, 'Impact Analysis', researchData.impact_analysis, reportId)
        )
      }

      await Promise.allSettled(savePromises)
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

    // Geopolitical Context (new format only)
    if (rd?.geopolitical_context) {
      const gc = rd.geopolitical_context
      md += `## Geopolitical Context\n\n`
      if (typeof gc === 'string') { md += `${gc}\n\n` }
      else {
        if (gc.regional_dynamics) md += `### Regional Dynamics\n${gc.regional_dynamics}\n\n`
        if (gc.international_implications) md += `### International Implications\n${gc.international_implications}\n\n`
        if (gc.power_balance_analysis) md += `### Power Balance Analysis\n${gc.power_balance_analysis}\n\n`
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
          if (s.key_drivers) md += `**Key Drivers:** ${s.key_drivers}\n`
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
}
