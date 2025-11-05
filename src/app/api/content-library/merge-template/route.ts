import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'

function getSupabaseClient() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase environment variables are not configured')
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient()
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

    console.log('📄 Processing template merge...')

    // Determine file type from template name
    const isDocx = template.file_name?.toLowerCase().endsWith('.docx')
    const isPptx = template.file_name?.toLowerCase().endsWith('.pptx')

    // Prepare content text
    const contentText = typeof content.content === 'string'
      ? content.content
      : JSON.stringify(content.content, null, 2)

    // Prepare template data
    const templateData = {
      title: content.title,
      content: contentText,
      contentType: content.content_type,
      date: new Date().toLocaleDateString(),
      dateTime: new Date().toLocaleString(),
      folder: content.folder || 'Uncategorized',
      themes: content.themes?.join(', ') || 'N/A',
      topics: content.topics?.join(', ') || 'N/A',
      createdAt: new Date(content.created_at).toLocaleDateString(),
      templateName: template.name
    }

    // 4. Merge based on file type
    if (isDocx) {
      try {
        // Convert Blob to ArrayBuffer
        const arrayBuffer = await fileData.arrayBuffer()

        // Load the docx file as binary content
        const zip = new PizZip(arrayBuffer)
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          nullGetter: () => '' // Return empty string for undefined values
        })

        // Set the template data
        doc.render(templateData)

        // Generate the merged document
        const buffer = doc.getZip().generate({
          type: 'nodebuffer',
          compression: 'DEFLATE'
        })

        console.log('✅ DOCX merge complete')

        // Return merged DOCX
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${content.title.replace(/[^a-z0-9]/gi, '_')}_merged.docx"`,
          },
        })
      } catch (error: any) {
        console.error('❌ DOCX merge error:', error)

        // If template has errors, provide helpful message
        if (error.properties?.errors) {
          const errorDetails = error.properties.errors.map((e: any) =>
            `${e.name}: ${e.message} (${e.part})`
          ).join('; ')

          return NextResponse.json({
            error: `Template merge failed: ${errorDetails}. Make sure your template has placeholders like {{title}}, {{content}}, {{date}}, {{themes}}, {{topics}}.`
          }, { status: 400 })
        }

        throw error
      }
    } else {
      // Fallback for non-DOCX files (PDF, PPTX, etc.) - return text version
      console.log('⚠️ Non-DOCX template, generating text version')

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

NOTE: This template format (${template.file_name}) is not yet supported for merging.
For best results, use .docx templates with placeholders like {{title}}, {{content}}, etc.
      `.trim()

      // Return as downloadable file
      return new NextResponse(mergedContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${content.title.replace(/[^a-z0-9]/gi, '_')}_merged.txt"`,
        },
      })
    }

  } catch (error) {
    console.error('❌ Template merge error:', error)
    return NextResponse.json(
      { error: 'Failed to merge template: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
