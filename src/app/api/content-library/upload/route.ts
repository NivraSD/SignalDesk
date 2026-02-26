// Content Library Upload API
// Purpose: Upload files to content_library table with folder organization

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import officeparser from 'officeparser'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024

// File types that can be parsed for text extraction
const PARSEABLE_EXTENSIONS = ['.pptx', '.ppt', '.docx', '.doc', '.xlsx', '.xls', '.pdf', '.odt', '.odp', '.ods']

async function extractTextContent(file: File): Promise<string> {
  const fileName = file.name.toLowerCase()
  const isParseable = PARSEABLE_EXTENSIONS.some(ext => fileName.endsWith(ext))

  if (!isParseable) {
    return ''
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // officeparser.parseOfficeAsync returns extracted text
    const extractedText = await officeparser.parseOfficeAsync(buffer, {
      outputErrorToConsole: false
    })

    console.log(`📄 Extracted ${extractedText.length} characters from ${file.name}`)
    return extractedText || ''
  } catch (error) {
    console.error(`⚠️ Could not extract text from ${file.name}:`, error)
    return ''
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const file = formData.get('file') as File
    const organizationId = formData.get('organizationId') as string
    const folder = formData.get('folder') as string
    const title = formData.get('title') as string

    // Validate required fields
    if (!file || !organizationId || !folder) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: file, organizationId, folder'
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: `File too large. Max size: 50MB`
      }, { status: 400 })
    }

    console.log(`📤 Uploading to content library: ${file.name} (folder: ${folder})`)

    // 1. Upload file to Supabase Storage (content-library bucket)
    const fileName = `${organizationId}/${folder}/${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('content-library')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      return NextResponse.json({
        success: false,
        error: `Upload failed: ${uploadError.message}`
      }, { status: 500 })
    }

    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('content-library')
      .getPublicUrl(fileName)

    console.log(`📂 File uploaded to: ${publicUrl}`)

    // 3. Extract text content from Office files (PowerPoint, Word, Excel, PDF)
    console.log(`🔍 Attempting to extract text from: ${file.name}`)
    const extractedContent = await extractTextContent(file)

    // 4. Determine content type based on file/folder
    let contentType = 'document'
    const fileNameLower = file.name.toLowerCase()
    if (fileNameLower.endsWith('.pptx') || fileNameLower.endsWith('.ppt')) contentType = 'presentation'
    else if (fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc')) contentType = 'document'
    else if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) contentType = 'spreadsheet'
    else if (fileNameLower.endsWith('.pdf')) contentType = 'pdf'
    else if (folder.toLowerCase() === 'proposals') contentType = 'proposal'
    else if (folder.toLowerCase() === 'press releases') contentType = 'press-release'
    else if (folder.toLowerCase() === 'campaigns') contentType = 'campaign'
    else if (folder.toLowerCase() === 'strategies') contentType = 'strategy'
    else if (folder.toLowerCase() === 'media plans') contentType = 'media-plan'

    // 5. Create database record in content_library
    const { data: contentItem, error: dbError } = await supabase
      .from('content_library')
      .insert({
        id: randomUUID(),
        organization_id: organizationId,
        title: title || file.name,
        content_type: contentType,
        content: extractedContent, // Now includes extracted text!
        folder: folder,
        file_url: publicUrl,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          textExtracted: extractedContent.length > 0,
          extractedLength: extractedContent.length
        },
        status: 'completed',
        intelligence_status: extractedContent.length > 0 ? 'ready' : 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      console.error('❌ Error details:', JSON.stringify(dbError, null, 2))
      console.error('❌ Insert data was:', {
        id: randomUUID(),
        organization_id: organizationId,
        folder,
        contentType
      })

      // Cleanup: delete uploaded file
      await supabase.storage
        .from('content-library')
        .remove([fileName])

      return NextResponse.json({
        success: false,
        error: `Database error: ${dbError.message}`,
        details: dbError
      }, { status: 500 })
    }

    console.log(`✅ Content item created: ${contentItem.id}`)

    // Return success immediately
    return NextResponse.json({
      success: true,
      item: {
        id: contentItem.id,
        title: contentItem.title,
        contentType: contentItem.content_type,
        folder: contentItem.folder,
        fileUrl: publicUrl
      },
      message: 'File uploaded successfully to Content Library'
    })

  } catch (error) {
    console.error('❌ Upload error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }, { status: 500 })
  }
}
