import { supabase } from '@/lib/supabase/client'
import type {
  ContentType,
  ContentItem,
  ContentGenerationRequest,
  ContentGenerationResponse,
  ContentVersion,
  AudienceType
} from '@/types/content'

export class ContentGenerationService {
  /**
   * Generate content using MCP Content edge function
   */
  static async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    try {
      const { type, context, options, prompt, template } = request

      // Map content type to appropriate MCP tool
      let tool = ''
      let mcpArgs: any = {}

      switch (type) {
        case 'press-release':
          tool = 'generate_press_release'
          mcpArgs = {
            headline: prompt || `${context.organization?.name} Announces Major Development`,
            keyPoints: context.framework?.proofPoints || [],
            tone: options.tone || 'formal'
          }
          break

        case 'social-post':
          tool = 'generate_social_posts'
          mcpArgs = {
            message: prompt || context.framework?.narrative || 'Share our latest news',
            platforms: ['twitter', 'linkedin'],
            variations: 3,
            includeHashtags: true,
            includeEmojis: options.tone === 'casual'
          }
          break

        case 'exec-statement':
          tool = 'generate_executive_talking_points'
          mcpArgs = {
            occasion: 'internal_meeting',
            topic: prompt || context.framework?.objective || 'Company update',
            audience: options.audience?.[0] || 'employees',
            duration: 5,
            keyMessages: context.framework?.proofPoints || []
          }
          break

        case 'email':
          tool = 'generate_email_campaign'
          mcpArgs = {
            campaignType: 'announcement',
            subject: prompt?.split('\n')[0] || 'Important Update',
            mainMessage: prompt || context.framework?.narrative || '',
            audience: options.audience?.[0] || 'general',
            personalization: true
          }
          break

        case 'thought-leadership':
          tool = 'generate_blog_post'
          mcpArgs = {
            title: prompt?.split('\n')[0] || 'Industry Insights',
            topic: context.framework?.objective || prompt || 'Industry trends',
            targetAudience: options.audience?.[0] || 'professional',
            wordCount: options.wordCount || 800,
            style: 'thought_leadership'
          }
          break

        default:
          // For other types, use blog post as fallback
          tool = 'generate_blog_post'
          mcpArgs = {
            title: prompt?.split('\n')[0] || `${type.replace('-', ' ')} Content`,
            topic: prompt || context.framework?.objective || 'General content',
            wordCount: options.wordCount || 600
          }
      }

      // Call MCP Content edge function
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mcp-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          tool,
          arguments: mcpArgs
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('MCP Content error:', errorText)
        throw new Error(`Content generation failed: ${response.statusText}`)
      }

      const data = await response.json()

      // Extract content based on tool type
      let generatedContent = ''
      if (tool === 'generate_social_posts' && data.posts) {
        // Format social posts
        generatedContent = Object.entries(data.posts)
          .map(([platform, posts]: [string, any]) =>
            `=== ${platform.toUpperCase()} ===\n${Array.isArray(posts) ? posts.join('\n\n') : posts}`
          )
          .join('\n\n')
      } else {
        generatedContent = data.content || data.htmlContent || data.talkingPoints || ''
      }

      return {
        success: true,
        content: generatedContent,
        metadata: {
          generationTime: Date.now(),
          model: 'claude-sonnet-4',
          tokensUsed: generatedContent.length // Approximate
        },
        suggestions: {
          improvements: [],
          alternativesApproaches: [],
          riskFactors: []
        }
      }
    } catch (error) {
      console.error('Content generation error:', error)
      return {
        success: false,
        content: '',
        metadata: {
          generationTime: 0,
          model: 'error',
          tokensUsed: 0
        }
      }
    }
  }

  /**
   * Generate content variations for different audiences
   */
  static async generateAudienceVersions(
    content: string,
    audiences: AudienceType[],
    context?: any
  ): Promise<ContentVersion[]> {
    const versions: ContentVersion[] = []

    for (const audience of audiences) {
      try {
        // Use mcp-content to regenerate with different tone/style for each audience
        const audienceMap: Record<string, any> = {
          'investors': { tone: 'formal', style: 'educational' },
          'customers': { tone: 'conversational', style: 'how_to' },
          'employees': { tone: 'casual', style: 'educational' },
          'media': { tone: 'formal', style: 'news_analysis' },
          'regulators': { tone: 'formal', style: 'educational' },
          'partners': { tone: 'professional', style: 'thought_leadership' },
          'general-public': { tone: 'conversational', style: 'educational' },
          'technical': { tone: 'technical', style: 'educational' },
          'executives': { tone: 'formal', style: 'thought_leadership' },
          'board': { tone: 'formal', style: 'thought_leadership' }
        }

        const audienceConfig = audienceMap[audience] || { tone: 'professional', style: 'educational' }

        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mcp-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            tool: 'generate_blog_post',
            arguments: {
              title: `Content for ${audience}`,
              topic: content.substring(0, 200),
              targetAudience: audience,
              wordCount: content.split(' ').length,
              style: audienceConfig.style
            }
          })
        })

        if (response.ok) {
          const data = await response.json()
          versions.push({
            id: `version-${Date.now()}-${audience}`,
            audience,
            content: data.content || content,
            adaptations: {
              tone: audienceConfig.tone,
              language: audienceConfig.style as any,
              emphasis: [],
              omissions: [],
              additions: []
            },
            metadata: {
              readingLevel: 10,
              technicalDepth: audience === 'technical' ? 'advanced' : 'intermediate'
            }
          })
        }
      } catch (error) {
        console.error(`Failed to generate ${audience} version:`, error)
      }
    }

    return versions
  }

  /**
   * Save content to Memory Vault
   */
  static async saveToMemoryVault(content: ContentItem): Promise<boolean> {
    try {
      console.log('Attempting to save content to Memory Vault:', content.id)

      // First try to save to niv_strategies if it's NIV-generated content
      if (content.frameworkId) {
        const { data: strategy, error: strategyError } = await supabase
          .from('niv_strategies')
          .select('*')
          .eq('id', content.frameworkId)
          .single()

        if (strategy && !strategyError) {
          // Update strategy with generated content
          const updatedContent = strategy.generated_content || []
          updatedContent.push({
            id: content.id,
            title: content.title,
            type: content.type,
            content: content.content,
            created_at: new Date().toISOString()
          })

          const { error: updateError } = await supabase
            .from('niv_strategies')
            .update({ generated_content: updatedContent })
            .eq('id', content.frameworkId)

          if (!updateError) {
            console.log('Successfully saved to niv_strategies')
          }
        }
      }

      // Try to save to content_library - id is auto-increment, don't include it
      const contentLibraryData = {
        title: content.title || 'Untitled',
        content_type: content.contentType || 'generated',
        content_text: typeof content.content === 'string' ? content.content : JSON.stringify(content.content),
        target_audience: content.targetAudience || null,
        tone: content.tone || null,
        status: 'draft',
        metadata: {
          frameworkId: content.frameworkId,
          originalId: content.id,
          generatedAt: new Date().toISOString(),
          source: 'ContentGenerationService'
        }
      }

      const { data, error } = await supabase
        .from('content_library')
        .insert(contentLibraryData)
        .select()

      if (error) {
        console.error('Failed to save to content_library:', error)

        // If table doesn't exist, save to localStorage as fallback
        if (error.code === '42P01') {
          console.log('Table does not exist, using localStorage fallback')
          const storedContent = JSON.parse(localStorage.getItem('content_library') || '[]')
          storedContent.push({
            ...content,
            savedAt: new Date().toISOString()
          })
          localStorage.setItem('content_library', JSON.stringify(storedContent))
          console.log('Saved to localStorage successfully')
          return true
        }

        // Try even simpler insert without select
        const { error: simpleError } = await supabase
          .from('content_library')
          .insert(contentLibraryData)

        if (simpleError) {
          console.error('Simple insert also failed:', simpleError)

          // Final fallback: localStorage
          const storedContent = JSON.parse(localStorage.getItem('content_library') || '[]')
          storedContent.push({
            ...content,
            savedAt: new Date().toISOString()
          })
          localStorage.setItem('content_library', JSON.stringify(storedContent))
          console.log('Saved to localStorage as fallback')
          return true
        }
      }

      console.log('Successfully saved to content_library:', data)
      return true
    } catch (error) {
      console.error('Memory Vault save error:', error)

      // Last resort: save to localStorage
      try {
        const storedContent = JSON.parse(localStorage.getItem('content_library') || '[]')
        storedContent.push({
          ...content,
          savedAt: new Date().toISOString()
        })
        localStorage.setItem('content_library', JSON.stringify(storedContent))
        console.log('Error occurred, saved to localStorage instead')
        return true
      } catch (localError) {
        console.error('Even localStorage failed:', localError)
        return false
      }
    }
  }

  /**
   * Retrieve content from Memory Vault
   */
  static async getFromMemoryVault(organizationId: string, filters?: {
    type?: ContentType
    status?: string
    limit?: number
  }): Promise<ContentItem[]> {
    try {
      // First try to get from database
      let query = supabase
        .from('content_library')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.type) {
        query = query.eq('type', filters.type)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Failed to retrieve from Memory Vault:', error)

        // Fallback to localStorage
        const storedContent = JSON.parse(localStorage.getItem('content_library') || '[]')
        let filtered = storedContent

        if (filters?.type) {
          filtered = filtered.filter((item: any) => item.type === filters.type)
        }

        if (filters?.status) {
          filtered = filtered.filter((item: any) => item.status === filters.status)
        }

        if (filters?.limit) {
          filtered = filtered.slice(0, filters.limit)
        }

        return filtered
      }

      // Merge with localStorage data if any
      const localData = JSON.parse(localStorage.getItem('content_library') || '[]')
      const merged = [...(data || []), ...localData]

      // Remove duplicates based on ID
      const unique = merged.reduce((acc, item) => {
        if (!acc.find((i: any) => i.id === item.id)) {
          acc.push(item)
        }
        return acc
      }, [])

      return unique
    } catch (error) {
      console.error('Memory Vault retrieval error:', error)

      // Return localStorage data as fallback
      const storedContent = JSON.parse(localStorage.getItem('content_library') || '[]')
      return storedContent
    }
  }

  /**
   * Get content templates
   */
  static async getTemplates(type?: ContentType): Promise<any[]> {
    try {
      let query = supabase
        .from('content_templates')
        .select('*')
        .order('use_count', { ascending: false })

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error } = await query

      if (error) {
        console.error('Failed to get templates:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Template retrieval error:', error)
      return []
    }
  }

  /**
   * Export content to external platforms
   */
  static async exportContent(content: ContentItem, platform: string, config: any): Promise<{
    success: boolean
    url?: string
    error?: string
  }> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/content-export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          content,
          platform,
          config
        })
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Content export error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  }

  /**
   * Bulk generate content from framework
   */
  static async bulkGenerateFromFramework(
    frameworkId: string,
    contentTypes: ContentType[]
  ): Promise<ContentItem[]> {
    const generatedContent: ContentItem[] = []

    try {
      // Get framework details
      const { data: framework, error: frameworkError } = await supabase
        .from('niv_strategies')
        .select('*')
        .eq('id', frameworkId)
        .single()

      if (frameworkError || !framework) {
        console.error('Failed to get framework:', frameworkError)
        return []
      }

      // Generate each content type
      for (const type of contentTypes) {
        const request: ContentGenerationRequest = {
          type,
          context: {
            framework: framework.framework_data || framework.strategy
          },
          options: {
            tone: 'professional',
            includeData: true,
            generateVariations: true
          }
        }

        const response = await this.generateContent(request)

        if (response.success && response.content) {
          const contentItem: ContentItem = {
            id: `content-${Date.now()}-${type}`,
            title: `${type.replace('-', ' ')} - ${framework.strategy?.objective?.substring(0, 50)}`,
            type,
            content: response.content,
            status: 'review',
            priority: 'high',
            frameworkId,
            versions: response.variations,
            metadata: {
              createdAt: new Date(),
              ...response.metadata
            }
          }

          generatedContent.push(contentItem)

          // Save to Memory Vault
          await this.saveToMemoryVault(contentItem)
        }
      }

      return generatedContent
    } catch (error) {
      console.error('Bulk generation error:', error)
      return generatedContent
    }
  }

  /**
   * Update content status
   */
  static async updateContentStatus(
    contentId: string,
    status: ContentItem['status']
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('content_library')
        .update({
          status,
          updated_at: new Date()
        })
        .eq('id', contentId)

      if (error) {
        console.error('Failed to update content status:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Status update error:', error)
      return false
    }
  }

  /**
   * Search content library
   */
  static async searchContent(
    organizationId: string,
    query: string
  ): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabase
        .from('content_library')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Content search error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Search error:', error)
      return []
    }
  }
}