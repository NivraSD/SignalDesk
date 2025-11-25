// Memory Vault V2: Brand Asset Upload API
// Purpose: Upload templates, guidelines, and logos
// Performance: Upload fast, analyze async

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { invalidateBrandContextCache } from '@/lib/memory-vault/brand-context-cache'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'

// Lazy initialization to avoid build-time errors
function getSupabaseClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  return createClient(SUPABASE_URL, serviceKey)
}

// Max file sizes (in bytes)
const MAX_FILE_SIZES = {
  'template': 50 * 1024 * 1024, // 50MB
  'guidelines': 25 * 1024 * 1024, // 25MB
  'logo': 10 * 1024 * 1024, // 10MB
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const file = formData.get('file') as File
    const assetType = formData.get('assetType') as string
    const organizationId = formData.get('organizationId') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const tags = formData.get('tags') as string // Comma-separated
    const folder = formData.get('folder') as string | null

    // Validate required fields
    if (!file || !assetType || !organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: file, assetType, organizationId'
      }, { status: 400 })
    }

    // Validate file size
    const maxSize = getMaxFileSize(assetType)
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: `File too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`
      }, { status: 400 })
    }

    // Validate file type
    if (!isValidFileType(file.name, assetType)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type for asset type'
      }, { status: 400 })
    }

    console.log(`📤 Uploading brand asset: ${file.name} (${assetType})`)

    // 1. Upload file to Supabase Storage
    const supabase = getSupabaseClient()
    const fileName = `${organizationId}/${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('brand-assets')
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
      .from('brand-assets')
      .getPublicUrl(fileName)

    console.log(`📂 File uploaded to: ${publicUrl}`)

    // 3. Create database record
    const { data: asset, error: dbError } = await supabase
      .from('brand_assets')
      .insert({
        organization_id: organizationId,
        asset_type: assetType,
        file_name: file.name,
        file_path: uploadData.path,
        file_url: publicUrl, // ← ADD THIS: Save the public URL
        file_size: file.size,
        mime_type: file.type,
        name: name || file.name,
        description: description || null,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        folder: folder || null, // Store folder for organization
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error:', dbError)

      // Cleanup: delete uploaded file
      await supabase.storage
        .from('brand-assets')
        .remove([fileName])

      return NextResponse.json({
        success: false,
        error: `Database error: ${dbError.message}`
      }, { status: 500 })
    }

    console.log(`✅ Asset uploaded: ${asset.id}`)

    // 4. Queue background analysis job (fire-and-forget)
    queueAnalysisJob(asset.id, publicUrl, file.name, assetType).catch((err) => {
      console.error('Failed to queue analysis:', err)
    })

    // 5. Invalidate cache for this organization
    invalidateBrandContextCache(organizationId)

    // Return success immediately
    return NextResponse.json({
      success: true,
      asset: {
        id: asset.id,
        name: asset.name,
        assetType: asset.asset_type,
        fileName: asset.file_name,
        fileSize: asset.file_size,
        status: 'pending_analysis'
      },
      message: 'Asset uploaded successfully. Analysis in progress...'
    })

  } catch (error) {
    console.error('❌ Upload error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }, { status: 500 })
  }
}

// Queue analysis job
async function queueAnalysisJob(
  assetId: string,
  fileUrl: string,
  fileName: string,
  assetType: string
): Promise<void> {
  const supabase = getSupabaseClient()
  await supabase
    .from('job_queue')
    .insert({
      job_type: 'analyze-brand-asset',
      payload: { assetId, fileUrl, fileName, assetType },
      priority: 7, // High priority for user uploads
      status: 'pending'
    })

  console.log(`📋 Queued analysis job for asset: ${assetId}`)
}

// Get max file size for asset type
function getMaxFileSize(assetType: string): number {
  if (assetType.startsWith('template')) return MAX_FILE_SIZES.template
  if (assetType.startsWith('guidelines')) return MAX_FILE_SIZES.guidelines
  if (assetType === 'logo') return MAX_FILE_SIZES.logo
  return MAX_FILE_SIZES.guidelines // Default
}

// Validate file type
function isValidFileType(fileName: string, assetType: string): boolean {
  const lowerName = fileName.toLowerCase()

  if (assetType.startsWith('template')) {
    return lowerName.endsWith('.docx') ||
           lowerName.endsWith('.pptx') ||
           lowerName.endsWith('.pdf')
  }

  if (assetType.startsWith('guidelines')) {
    return lowerName.endsWith('.pdf') ||
           lowerName.endsWith('.docx') ||
           lowerName.endsWith('.txt') ||
           lowerName.endsWith('.md')
  }

  if (assetType === 'logo') {
    return lowerName.endsWith('.png') ||
           lowerName.endsWith('.jpg') ||
           lowerName.endsWith('.jpeg') ||
           lowerName.endsWith('.svg')
  }

  return false
}

// GET: List brand assets for organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const assetType = searchParams.get('assetType')

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'organizationId required'
      }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    let query = supabase
      .from('brand_assets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (assetType) {
      query = query.eq('asset_type', assetType)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      assets: data || []
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch assets'
    }, { status: 500 })
  }
}
