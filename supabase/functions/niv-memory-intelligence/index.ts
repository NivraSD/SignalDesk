// Memory Vault V2: Content Intelligence Analyzer
// Purpose: Extract themes, entities, topics, and relationships from content
// Performance: Runs async in background, doesn't block saves

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface AnalysisRequest {
  contentId: string
}

interface AnalysisResult {
  suggestedFolder: string
  extractedThemes: string[]
  relatedContentIds: string[]
  contentSignature: string
  metadata: {
    entities: {
      companies: string[]
      people: string[]
      products: string[]
    }
    topics: string[]
    sentiment: number // -1 to 1
    complexity: 'simple' | 'moderate' | 'complex'
    keywords: string[]
  }
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Parse request
    const { contentId } = await req.json() as AnalysisRequest

    console.log(`🔍 Analyzing content: ${contentId}`)

    // 1. Fetch content from database
    const { data: content, error: fetchError } = await supabase
      .from('content_library')
      .select('*')
      .eq('id', contentId)
      .single()

    if (fetchError || !content) {
      throw new Error(`Content not found: ${contentId}`)
    }

    // 2. Use Claude to analyze content
    const analysisPrompt = buildAnalysisPrompt(content)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const claudeResult = await response.json()
    const analysisText = claudeResult.content[0].text

    // 3. Parse Claude's analysis
    const analysis = parseAnalysis(analysisText)

    // 4. Find similar content (simple keyword matching for now)
    const relatedContent = await findSimilarContent(
      supabase,
      content.organization_id,
      analysis.metadata.keywords,
      contentId
    )

    // 5. Update content with intelligence
    const { error: updateError } = await supabase
      .from('content_library')
      .update({
        themes: analysis.extractedThemes,
        entities: analysis.metadata.entities,
        topics: analysis.metadata.topics,
        content_signature: analysis.contentSignature,
        complexity: analysis.metadata.complexity,
        sentiment: analysis.metadata.sentiment,
        related_content_ids: relatedContent,
        folder: analysis.suggestedFolder,
        intelligence_status: 'complete',
        updated_at: new Date().toISOString(),
      })
      .eq('id', contentId)

    if (updateError) {
      throw updateError
    }

    // 6. Create relationship entries
    await createRelationships(supabase, contentId, relatedContent)

    // 7. Update folder index
    await updateFolderIndex(
      supabase,
      content.organization_id,
      analysis.suggestedFolder,
      content.content_type,
      analysis.extractedThemes
    )

    console.log(`✅ Intelligence complete for ${contentId}`)

    return new Response(
      JSON.stringify({
        success: true,
        contentId,
        analysis: {
          folder: analysis.suggestedFolder,
          themes: analysis.extractedThemes,
          topics: analysis.metadata.topics,
          relatedCount: relatedContent.length,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Intelligence analysis failed:', error)

    // Mark as failed in database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const body = await req.json().catch(() => ({}))

    if (body.contentId) {
      await supabase
        .from('content_library')
        .update({
          intelligence_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.contentId)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

function buildAnalysisPrompt(content: any): string {
  const contentText =
    typeof content.content === 'string'
      ? content.content
      : JSON.stringify(content.content).substring(0, 3000)

  return `Analyze this content for intelligent organization in a Memory Vault system.

CONTENT DETAILS:
Title: ${content.title}
Type: ${content.content_type}
Content: ${contentText}

TASK: Extract structured intelligence from this content.

Return ONLY valid JSON in this exact format:
{
  "suggestedFolder": "exact/folder/path",
  "themes": ["theme1", "theme2", "theme3"],
  "contentSignature": "brief description for similarity matching",
  "entities": {
    "companies": ["company1", "company2"],
    "people": ["person1", "person2"],
    "products": ["product1", "product2"]
  },
  "topics": ["topic1", "topic2", "topic3"],
  "sentiment": 0.5,
  "complexity": "moderate",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

FOLDER STRUCTURE OPTIONS:
- "Campaigns/Product Launches/[Product Name]"
- "Campaigns/Competitive Response"
- "Campaigns/Thought Leadership"
- "Content By Type/Press Releases"
- "Content By Type/Social Posts"
- "Content By Type/Blog Posts"
- "Themes/AI Safety"
- "Themes/Infrastructure"
- "Themes/Enterprise"
- "Entities/Competitors/[Company Name]"
- "Performance/High Performing"
- "Time-Based/${new Date().getFullYear()}/Q${Math.ceil((new Date().getMonth() + 1) / 3)}"
- "Unsorted" (fallback)

RULES:
1. themes: Max 5 thematic tags (ai-safety, competitive-response, product-launch, etc)
2. contentSignature: 1-2 sentence summary for finding similar content
3. entities: Extract mentioned companies, people, products
4. topics: Specific subjects discussed
5. sentiment: -1 (negative) to 1 (positive)
6. complexity: simple/moderate/complex based on technical depth
7. keywords: 5-10 important keywords for search
8. suggestedFolder: Choose the most appropriate folder from options above

Return ONLY the JSON, no other text.`
}

function parseAnalysis(text: string): AnalysisResult {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text.trim()

    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\s*/g, '').replace(/```\s*$/g, '')
    }

    const parsed = JSON.parse(jsonText)

    // Validate and structure
    return {
      suggestedFolder: parsed.suggestedFolder || 'Unsorted',
      extractedThemes: Array.isArray(parsed.themes) ? parsed.themes : [],
      relatedContentIds: [], // Will be populated by findSimilarContent
      contentSignature: parsed.contentSignature || '',
      metadata: {
        entities: parsed.entities || { companies: [], people: [], products: [] },
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
        sentiment: typeof parsed.sentiment === 'number' ? parsed.sentiment : 0,
        complexity: ['simple', 'moderate', 'complex'].includes(parsed.complexity)
          ? parsed.complexity
          : 'moderate',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      },
    }
  } catch (error) {
    console.error('Failed to parse analysis:', error)
    // Return safe defaults
    return {
      suggestedFolder: 'Unsorted',
      extractedThemes: [],
      relatedContentIds: [],
      contentSignature: '',
      metadata: {
        entities: { companies: [], people: [], products: [] },
        topics: [],
        sentiment: 0,
        complexity: 'moderate',
        keywords: [],
      },
    }
  }
}

async function findSimilarContent(
  supabase: any,
  organizationId: string,
  keywords: string[],
  currentContentId: string
): Promise<string[]> {
  if (!keywords || keywords.length === 0) return []

  try {
    // Simple keyword-based similarity (can be enhanced with vector search later)
    const { data, error } = await supabase
      .from('content_library')
      .select('id, title, content, themes, topics')
      .eq('organization_id', organizationId)
      .neq('id', currentContentId)
      .limit(50)

    if (error || !data) return []

    // Score content by keyword overlap
    const scored = data
      .map((item: any) => {
        const itemText = `${item.title} ${JSON.stringify(item.content)} ${item.themes?.join(' ')} ${item.topics?.join(' ')}`.toLowerCase()

        const matchCount = keywords.filter((keyword) =>
          itemText.includes(keyword.toLowerCase())
        ).length

        return { id: item.id, score: matchCount }
      })
      .filter((item: any) => item.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5)

    return scored.map((item: any) => item.id)
  } catch (error) {
    console.error('Error finding similar content:', error)
    return []
  }
}

async function createRelationships(
  supabase: any,
  sourceContentId: string,
  relatedContentIds: string[]
): Promise<void> {
  if (relatedContentIds.length === 0) return

  try {
    const relationships = relatedContentIds.map((targetId) => ({
      source_content_id: sourceContentId,
      target_content_id: targetId,
      relationship_type: 'similar',
      confidence: 0.75,
    }))

    await supabase.from('content_relationships').insert(relationships)
  } catch (error) {
    console.error('Error creating relationships:', error)
  }
}

async function updateFolderIndex(
  supabase: any,
  organizationId: string,
  folderPath: string,
  contentType: string,
  themes: string[]
): Promise<void> {
  try {
    // Upsert folder
    await supabase
      .from('folder_index')
      .upsert(
        {
          organization_id: organizationId,
          folder_path: folderPath,
          content_types: [contentType],
          themes: themes,
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: 'folder_path',
          ignoreDuplicates: false,
        }
      )
  } catch (error) {
    console.error('Error updating folder index:', error)
  }
}
