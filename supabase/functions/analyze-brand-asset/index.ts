// Memory Vault V2: Brand Asset Analyzer
// Purpose: Extract intelligence from uploaded brand templates and guidelines
// Performance: Runs async in background after upload

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface AnalyzeAssetRequest {
  assetId: string
  fileUrl: string
  fileName: string
  assetType: string
}

interface AssetIntelligence {
  extracted_guidelines: any
  brand_voice_profile: any
  template_structure: any
  usage_instructions: string
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { assetId, fileUrl, fileName, assetType } = await req.json() as AnalyzeAssetRequest

    console.log(`🔍 Analyzing brand asset: ${fileName} (${assetType})`)

    // 1. Download file content
    const fileContent = await downloadFile(fileUrl)

    // 2. Extract text based on file type
    const extractedText = await extractTextFromFile(fileName, fileContent)

    if (!extractedText) {
      throw new Error('Could not extract text from file')
    }

    // 3. Use Claude to analyze
    const analysisPrompt = buildAnalysisPrompt(assetType, fileName, extractedText)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
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

    // 4. Parse analysis
    const intelligence = parseIntelligence(analysisText, assetType)

    // 5. Update brand_asset with intelligence
    const { error: updateError } = await supabase
      .from('brand_assets')
      .update({
        extracted_guidelines: intelligence.extracted_guidelines,
        brand_voice_profile: intelligence.brand_voice_profile,
        template_structure: intelligence.template_structure,
        usage_instructions: intelligence.usage_instructions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assetId)

    if (updateError) {
      throw updateError
    }

    console.log(`✅ Brand asset analysis complete: ${assetId}`)

    return new Response(
      JSON.stringify({
        success: true,
        assetId,
        intelligence,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Brand asset analysis failed:', error)

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

async function downloadFile(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`)
  }
  return await response.arrayBuffer()
}

async function extractTextFromFile(
  fileName: string,
  fileContent: ArrayBuffer
): Promise<string> {
  const lowerFileName = fileName.toLowerCase()

  // For now, we'll handle text-based files
  // TODO: Add PDF/DOCX/PPTX parsing libraries when needed

  if (lowerFileName.endsWith('.txt') || lowerFileName.endsWith('.md')) {
    const decoder = new TextDecoder()
    return decoder.decode(fileContent)
  }

  if (lowerFileName.endsWith('.pdf')) {
    // TODO: Add PDF parsing
    console.warn('PDF parsing not yet implemented, using filename analysis')
    return `PDF file: ${fileName}`
  }

  if (lowerFileName.endsWith('.docx')) {
    // TODO: Add DOCX parsing
    console.warn('DOCX parsing not yet implemented, using filename analysis')
    return `Word document: ${fileName}`
  }

  if (lowerFileName.endsWith('.pptx')) {
    // TODO: Add PPTX parsing
    console.warn('PPTX parsing not yet implemented, using filename analysis')
    return `PowerPoint presentation: ${fileName}`
  }

  // Fallback: try to decode as text
  try {
    const decoder = new TextDecoder()
    return decoder.decode(fileContent)
  } catch {
    return `Binary file: ${fileName}`
  }
}

function buildAnalysisPrompt(
  assetType: string,
  fileName: string,
  content: string
): string {
  const contentPreview = content.substring(0, 4000) // Limit to avoid token issues

  return `Analyze this brand asset and extract structured intelligence.

ASSET DETAILS:
Type: ${assetType}
File Name: ${fileName}
Content Preview: ${contentPreview}

TASK: Extract intelligence based on the asset type.

Return ONLY valid JSON in this exact format:

${getExpectedFormat(assetType)}

RULES:
1. Extract actual information from the content
2. If content is not readable (binary file), infer from filename and type
3. Be specific and actionable
4. Return ONLY JSON, no other text`
}

function getExpectedFormat(assetType: string): string {
  if (assetType.startsWith('template-')) {
    return `{
  "template_structure": {
    "sections": ["section1", "section2"],
    "placeholders": ["{{placeholder1}}", "{{placeholder2}}"],
    "format": "description of format requirements"
  },
  "usage_instructions": "When to use this template and how",
  "brand_voice_profile": {
    "tone": "professional",
    "adjectives": ["adjective1", "adjective2"],
    "patterns": ["pattern description"]
  },
  "extracted_guidelines": {
    "dos": ["guideline1", "guideline2"],
    "donts": ["avoid1", "avoid2"]
  }
}`
  } else if (assetType.startsWith('guidelines-')) {
    return `{
  "brand_voice_profile": {
    "tone": "professional/casual/formal",
    "adjectives": ["innovative", "trustworthy", "bold"],
    "patterns": ["always use active voice", "avoid jargon"],
    "examples": ["example phrase 1", "example phrase 2"]
  },
  "extracted_guidelines": {
    "tone": ["guideline about tone"],
    "style": ["guideline about style"],
    "dos": ["what to do"],
    "donts": ["what to avoid"],
    "voice_rules": ["voice-specific rules"]
  },
  "usage_instructions": "How to apply these guidelines across content",
  "template_structure": null
}`
  } else {
    return `{
  "usage_instructions": "How to use this asset",
  "brand_voice_profile": null,
  "extracted_guidelines": null,
  "template_structure": null
}`
  }
}

function parseIntelligence(text: string, assetType: string): AssetIntelligence {
  try {
    // Extract JSON from response
    let jsonText = text.trim()

    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\s*/g, '').replace(/```\s*$/g, '')
    }

    const parsed = JSON.parse(jsonText)

    return {
      extracted_guidelines: parsed.extracted_guidelines || null,
      brand_voice_profile: parsed.brand_voice_profile || null,
      template_structure: parsed.template_structure || null,
      usage_instructions: parsed.usage_instructions || 'No specific usage instructions provided.',
    }
  } catch (error) {
    console.error('Failed to parse intelligence:', error)

    // Return safe defaults
    return {
      extracted_guidelines: null,
      brand_voice_profile: null,
      template_structure: null,
      usage_instructions: 'Analysis failed. Please review manually.',
    }
  }
}
