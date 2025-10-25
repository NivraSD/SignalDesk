import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'

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

    const filePath = template.file_path
    if (!filePath) {
      return NextResponse.json(
        { error: 'Template has no file path' },
        { status: 400 }
      )
    }

    console.log('📥 Downloading template from path:', filePath)

    // 3. Download template from storage
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

    console.log('📄 Attaching content to template...')

    // Determine file type
    const isDocx = template.file_name?.toLowerCase().endsWith('.docx')

    // Prepare content text
    const contentText = typeof content.content === 'string'
      ? content.content
      : JSON.stringify(content.content, null, 2)

    // 4. Attach content based on file type
    if (isDocx) {
      try {
        // Load the template
        const arrayBuffer = await fileData.arrayBuffer()
        const zip = new PizZip(arrayBuffer)
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true
        })

        // Get the current XML document
        const fullText = doc.getFullText()

        // Create content section to append
        const contentSection = `

───────────────────────────────────────────
CONTENT FROM MEMORY VAULT
───────────────────────────────────────────

Title: ${content.title}
Type: ${content.content_type}
Date: ${new Date(content.created_at).toLocaleDateString()}
${content.folder ? `Folder: ${content.folder}` : ''}

${content.themes && content.themes.length > 0 ? `Themes: ${content.themes.join(', ')}` : ''}
${content.topics && content.topics.length > 0 ? `Topics: ${content.topics.join(', ')}` : ''}

CONTENT:
${contentText}

───────────────────────────────────────────
Added: ${new Date().toLocaleString()}
───────────────────────────────────────────`

        // Use a dummy template data to render (but it won't find any placeholders, so doc stays unchanged)
        doc.render({})

        // Now we need to manually append content
        // Get the document XML
        const documentXml = zip.files['word/document.xml'].asText()

        // Simple append by adding paragraphs before </w:body>
        const paragraphs = contentSection.split('\n').map(line =>
          `<w:p><w:r><w:t>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</w:t></w:r></w:p>`
        ).join('')

        const modifiedXml = documentXml.replace('</w:body>', `${paragraphs}</w:body>`)

        zip.file('word/document.xml', modifiedXml)

        // Generate the document
        const buffer = zip.generate({
          type: 'nodebuffer',
          compression: 'DEFLATE'
        })

        console.log('✅ Content attached to template')

        // Return modified DOCX
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${content.title.replace(/[^a-z0-9]/gi, '_')}_with_template.docx"`,
          },
        })
      } catch (error: any) {
        console.error('❌ DOCX attach error:', error)
        throw error
      }
    } else {
      // Fallback for non-DOCX - return text version
      console.log('⚠️ Non-DOCX template, generating text version')

      const attachedContent = `[YOUR COMPANY TEMPLATE CONTENT WOULD BE HERE]

───────────────────────────────────────────
CONTENT FROM MEMORY VAULT
───────────────────────────────────────────

Title: ${content.title}
Type: ${content.content_type}
Date: ${new Date(content.created_at).toLocaleDateString()}
${content.folder ? `Folder: ${content.folder}\n` : ''}
${content.themes ? `Themes: ${content.themes.join(', ')}\n` : ''}
${content.topics ? `Topics: ${content.topics.join(', ')}\n` : ''}

CONTENT:
${contentText}

───────────────────────────────────────────
Template: ${template.name}
Added: ${new Date().toLocaleString()}
───────────────────────────────────────────

NOTE: This template format (${template.file_name}) is not yet supported.
For best results, use .docx templates.
      `.trim()

      return new NextResponse(attachedContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${content.title.replace(/[^a-z0-9]/gi, '_')}_attached.txt"`,
        },
      })
    }

  } catch (error) {
    console.error('❌ Template attach error:', error)
    return NextResponse.json(
      { error: 'Failed to attach to template: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
