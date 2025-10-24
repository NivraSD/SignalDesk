import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { contentId, templateId } = await req.json()

    if (!contentId || !templateId) {
      return NextResponse.json(
        { error: 'contentId and templateId are required' },
        { status: 400 }
      )
    }

    // 1. Fetch content
    const { data: content, error: contentError } = await supabase
      .from('content_library')
      .select('*')
      .eq('id', contentId)
      .single()

    if (contentError || !content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    // 2. Fetch template
    const { data: template, error: templateError } = await supabase
      .from('brand_assets')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Check if we have file_path (preferred) or file_url
    const filePath = template.file_path
    if (!filePath) {
      return NextResponse.json(
        { error: 'Template has no file path' },
        { status: 400 }
      )
    }

    console.log('📥 Downloading template from path:', filePath)

    // 3. Download template from storage using file_path
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('brand-assets')
      .download(filePath)

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: 'Failed to download template: ' + downloadError?.message },
        { status: 500 }
      )
    }

    // 4. For now, we'll return a simple merged document
    // In a production system, you'd use docxtemplater or similar to merge placeholders
    // This is a simplified version that just creates a text-based merge

    const contentText = typeof content.content === 'string'
      ? content.content
      : JSON.stringify(content.content, null, 2)

    // Create a simple merged text representation
    const mergedContent = `
===============================================
${content.title}
===============================================

Content Type: ${content.content_type}
Created: ${new Date(content.created_at).toLocaleString()}
Template: ${template.name}

${content.folder ? `Folder: ${content.folder}\n` : ''}
${content.themes ? `Themes: ${content.themes.join(', ')}\n` : ''}
${content.topics ? `Topics: ${content.topics.join(', ')}\n` : ''}

===============================================
CONTENT
===============================================

${contentText}

===============================================
Template: ${template.name}
Merged on: ${new Date().toLocaleString()}
===============================================
    `.trim()

    // Return as downloadable file
    return new NextResponse(mergedContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${content.title.replace(/[^a-z0-9]/gi, '_')}_merged.txt"`,
      },
    })

  } catch (error) {
    console.error('❌ Template merge error:', error)
    return NextResponse.json(
      { error: 'Failed to merge template: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
