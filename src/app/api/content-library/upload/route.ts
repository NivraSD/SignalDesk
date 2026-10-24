// Content Library Upload API
// Purpose: Upload files to content_library table with folder organization

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

export const maxDuration = 120

// Company documents (anything dropped into a Company/… folder that's a PDF, Word or PowerPoint
// file) go into NIV's knowledge base: private storage, full-text passages with citations, type and
// authority (guessed by the model for a person to confirm), dates and versions read from the text.
// The vault entry is created by the ingest step, so it appears under Company/<category>.
const COMPANY_DOC = /\.(pdf|docx|pptx)$/i
const FOLDER_TYPE: Record<string, string> = {
  policies: 'policy', precedent: 'precedent', memos: 'memo', playbooks: 'playbook', research: 'research',
  'board & finance': 'financial', brand: 'brand', reference: 'reference',
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient((SUPABASE_URL || 'https://placeholder.supabase.co'), (SUPABASE_SERVICE_KEY || 'placeholder-build-key'))
// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024

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

    // Signed-in members of the org only.
    const authed = await createServerSupabase()
    const { data: { user } } = await authed.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Not signed in' }, { status: 401 })
    const { data: membership } = await supabase.from('org_users').select('role').eq('organization_id', organizationId).eq('user_id', user.id).maybeSingle()
    if (!membership) return NextResponse.json({ success: false, error: 'Not a member of this organization' }, { status: 403 })

    if (/^company(\/|$)/i.test(folder) && COMPANY_DOC.test(file.name)) {
      const sub = folder.split('/')[1]?.toLowerCase() || ''
      const visibility = String(formData.get('visibility') || 'all').split(',').map((t) => t.trim()).filter(Boolean)
      const path = `${organizationId}/${Date.now()}-${file.name.replace(/[^\w.\- ]+/g, '_')}`
      const { error: upErr } = await supabase.storage.from('knowledge').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false })
      if (upErr) return NextResponse.json({ success: false, error: `Upload failed: ${upErr.message}` }, { status: 500 })
      const { data: doc, error: docErr } = await supabase.from('knowledge_documents').insert({
        organization_id: organizationId,
        title: (title || file.name).replace(/\.(pdf|docx|pptx)$/i, '').replace(/[_]+/g, ' ').trim(),
        doc_type: FOLDER_TYPE[sub] || 'reference',
        classified_by: FOLDER_TYPE[sub] ? 'uploader' : 'model',
        visibility: visibility.length ? visibility : ['all'],
        file_path: path, mime_type: file.type, file_size: file.size, created_by: user.id,
      }).select('id').single()
      if (docErr) return NextResponse.json({ success: false, error: docErr.message }, { status: 500 })
      const ing = await fetch(`${SUPABASE_URL}/functions/v1/knowledge-ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
        body: JSON.stringify({ document_id: doc.id }),
      })
      const result = await ing.json().catch(() => ({}))
      if (!ing.ok) return NextResponse.json({ success: false, error: result.error || 'Could not read the document' }, { status: 500 })
      return NextResponse.json({
        success: true,
        knowledge_document_id: doc.id,
        message: result.superseded?.length
          ? `Added. It replaces ${result.superseded.map((x: any) => `${x.title}${x.version ? ` v${x.version}` : ''}`).join(', ')}.`
          : 'Added to the company knowledge base.',
        effective_date: result.effective_date,
        passages: result.passages,
      })
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

    // 3. Determine content type based on file
    let contentType = 'document'
    if (folder.toLowerCase() === 'proposals') contentType = 'proposal'
    else if (folder.toLowerCase() === 'press releases') contentType = 'press-release'
    else if (folder.toLowerCase() === 'campaigns') contentType = 'campaign'
    else if (folder.toLowerCase() === 'strategies') contentType = 'strategy'
    else if (folder.toLowerCase() === 'media plans') contentType = 'media-plan'

    // 4. Create database record in content_library
    const { data: contentItem, error: dbError } = await supabase
      .from('content_library')
      .insert({
        id: randomUUID(),
        organization_id: organizationId,
        title: title || file.name,
        content_type: contentType,
        content: '', // Empty initially, can be extracted later
        folder: folder,
        file_url: publicUrl,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString()
        },
        status: 'completed',
        intelligence_status: 'pending',
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
