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
    situation_assessment?: any
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

      // Run research queries in parallel via fireplexity
      const triggerEvent = report.trigger_event
      const situationQuery = `${triggerEvent.title} latest developments analysis impact 2026`
      const stakeholderQuery = `${triggerEvent.title} key stakeholders actors positions interests`
      const impactQuery = `${triggerEvent.title} ${industry} sector impact implications risk assessment`

      const [situationResult, stakeholderResult, impactResult] = await Promise.allSettled([
        supabase.functions.invoke('niv-fireplexity', {
          body: {
            query: situationQuery,
            search_type: 'comprehensive',
            focus: 'geopolitical_intelligence',
            max_results: 15
          }
        }),
        supabase.functions.invoke('niv-fireplexity', {
          body: {
            query: stakeholderQuery,
            search_type: 'comprehensive',
            focus: 'stakeholder_analysis',
            max_results: 10
          }
        }),
        supabase.functions.invoke('niv-fireplexity', {
          body: {
            query: impactQuery,
            search_type: 'comprehensive',
            focus: 'impact_assessment',
            max_results: 10
          }
        })
      ])

      onProgress?.('intelligence-gathering', 'completed')
      onProgress?.('synthesis', 'running')

      // Extract results
      const situationData = situationResult.status === 'fulfilled' ? situationResult.value.data : null
      const stakeholderData = stakeholderResult.status === 'fulfilled' ? stakeholderResult.value.data : null
      const impactData = impactResult.status === 'fulfilled' ? impactResult.value.data : null

      // Synthesize into structured intelligence report via Claude
      const { data: synthesisResult, error: synthesisError } = await supabase.functions.invoke('generate-public-affairs-research', {
        body: {
          report_id: reportId,
          organization_id: organizationId,
          organization_name: organizationName,
          organization_profile: orgData?.company_profile || {},
          industry,
          trigger_event: triggerEvent,
          raw_research: {
            situation: situationData,
            stakeholders: stakeholderData,
            impact: impactData
          }
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

      if (researchData.situation_assessment) {
        savePromises.push(
          PublicAffairsService.saveToVault(
            organizationId,
            `${vaultFolder}/Situation Assessment`,
            'Situation Assessment',
            researchData.situation_assessment,
            reportId
          )
        )
      }
      if (researchData.stakeholder_map) {
        savePromises.push(
          PublicAffairsService.saveToVault(
            organizationId,
            `${vaultFolder}/Stakeholder Map`,
            'Stakeholder Map',
            researchData.stakeholder_map,
            reportId
          )
        )
      }
      if (researchData.impact_analysis) {
        savePromises.push(
          PublicAffairsService.saveToVault(
            organizationId,
            `${vaultFolder}/Impact Analysis`,
            'Impact Analysis',
            researchData.impact_analysis,
            reportId
          )
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
        .update({ status: 'research_complete' }) // revert to research_complete so they can retry
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

      const { data: result, error } = await supabase.functions.invoke('signaldeck-presentation', {
        body: {
          type: 'public_affairs',
          title: report.title,
          report_data: {
            trigger_event: report.trigger_event,
            research_data: report.research_data,
            blueprint_data: report.blueprint_data
          },
          organization_id: organizationId
        }
      })

      if (error) throw error

      await supabase
        .from('public_affairs_reports')
        .update({
          status: 'complete',
          presentation_url: result?.url || result?.presentation_url,
          presentation_metadata: result?.metadata || {}
        })
        .eq('id', reportId)

      // Save presentation link to vault
      if (result?.url || result?.presentation_url) {
        const vaultFolder = report.vault_folder || `Public Affairs/${report.title}`
        await PublicAffairsService.saveToVault(
          organizationId,
          `${vaultFolder}/Presentation`,
          'Intelligence Brief Presentation',
          `Presentation URL: ${result?.url || result?.presentation_url}`,
          reportId,
          { gamma_url: result?.url || result?.presentation_url, ...result?.metadata }
        )
      }

      onProgress?.('completed')
      return { success: true, url: result?.url || result?.presentation_url }
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
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2)

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

    if (report.blueprint_data?.executive_summary) {
      md += `## Executive Summary\n\n${report.blueprint_data.executive_summary}\n\n---\n\n`
    }

    if (report.research_data?.situation_assessment) {
      const sa = report.research_data.situation_assessment
      md += `## Situation Assessment\n\n`
      if (typeof sa === 'string') {
        md += `${sa}\n\n`
      } else {
        if (sa.what_happened) md += `### What Happened\n${sa.what_happened}\n\n`
        if (sa.context) md += `### Context\n${sa.context}\n\n`
        if (sa.key_actors) {
          md += `### Key Actors\n`
          if (Array.isArray(sa.key_actors)) {
            sa.key_actors.forEach((a: any) => {
              md += `- **${a.name || a}**: ${a.position || a.role || ''}\n`
            })
          } else {
            md += `${sa.key_actors}\n`
          }
          md += `\n`
        }
        if (sa.current_state) md += `### Current State of Play\n${sa.current_state}\n\n`
      }
      md += `---\n\n`
    }

    if (report.research_data?.stakeholder_map) {
      const sm = report.research_data.stakeholder_map
      md += `## Stakeholder Map\n\n`
      if (typeof sm === 'string') {
        md += `${sm}\n\n`
      } else if (Array.isArray(sm.stakeholders || sm)) {
        const stakeholders = sm.stakeholders || sm
        stakeholders.forEach((s: any) => {
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

    if (report.research_data?.impact_analysis) {
      const ia = report.research_data.impact_analysis
      md += `## Impact Analysis\n\n`
      if (typeof ia === 'string') {
        md += `${ia}\n\n`
      } else {
        if (ia.direct_impacts) md += `### Direct Impacts\n${typeof ia.direct_impacts === 'string' ? ia.direct_impacts : JSON.stringify(ia.direct_impacts, null, 2)}\n\n`
        if (ia.indirect_effects) md += `### Indirect Effects\n${typeof ia.indirect_effects === 'string' ? ia.indirect_effects : JSON.stringify(ia.indirect_effects, null, 2)}\n\n`
        if (ia.severity_assessment) md += `### Severity Assessment\n${typeof ia.severity_assessment === 'string' ? ia.severity_assessment : JSON.stringify(ia.severity_assessment, null, 2)}\n\n`
        if (ia.timeline) md += `### Timeline\n${typeof ia.timeline === 'string' ? ia.timeline : JSON.stringify(ia.timeline, null, 2)}\n\n`
      }
      md += `---\n\n`
    }

    if (report.blueprint_data?.scenario_tree) {
      const st = report.blueprint_data.scenario_tree
      md += `## Scenario Tree\n\n`
      if (typeof st === 'string') {
        md += `${st}\n\n`
      } else {
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
      md += `## Recommendations\n\n`
      if (typeof rec === 'string') {
        md += `${rec}\n\n`
      } else {
        if (rec.immediate) md += `### Immediate (This Week)\n${Array.isArray(rec.immediate) ? rec.immediate.map((r: string) => `- ${r}`).join('\n') : rec.immediate}\n\n`
        if (rec.short_term) md += `### Short-Term (30 Days)\n${Array.isArray(rec.short_term) ? rec.short_term.map((r: string) => `- ${r}`).join('\n') : rec.short_term}\n\n`
        if (rec.medium_term) md += `### Medium-Term (90 Days)\n${Array.isArray(rec.medium_term) ? rec.medium_term.map((r: string) => `- ${r}`).join('\n') : rec.medium_term}\n\n`
      }
      md += `---\n\n`
    }

    if (report.blueprint_data?.monitoring_framework) {
      const mf = report.blueprint_data.monitoring_framework
      md += `## Monitoring Framework\n\n`
      if (typeof mf === 'string') {
        md += `${mf}\n\n`
      } else if (Array.isArray(mf.indicators || mf)) {
        const indicators = mf.indicators || mf
        indicators.forEach((ind: any) => {
          md += `- **${ind.indicator || ind.name}**: ${ind.threshold || ''} ${ind.action ? `-> ${ind.action}` : ''}\n`
        })
      }
    }

    if (report.research_data?.sources_confidence) {
      md += `\n---\n\n## Sources & Confidence\n\n`
      const sc = report.research_data.sources_confidence
      if (typeof sc === 'string') {
        md += `${sc}\n`
      } else {
        if (sc.confidence_level) md += `**Overall Confidence:** ${sc.confidence_level}\n\n`
        if (sc.key_sources && Array.isArray(sc.key_sources)) {
          md += `**Key Sources:**\n`
          sc.key_sources.forEach((s: any) => md += `- ${typeof s === 'string' ? s : s.name || s.source}\n`)
        }
        if (sc.intelligence_gaps && Array.isArray(sc.intelligence_gaps)) {
          md += `\n**Intelligence Gaps:**\n`
          sc.intelligence_gaps.forEach((g: string) => md += `- ${g}\n`)
        }
      }
    }

    return md
  }
}
