import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  console.log('📊 Build presentation API called')

  try {
    const body = await request.json()
    const { presentationData, theme, organizationId } = body

    if (!presentationData) {
      return NextResponse.json(
        { success: false, error: 'No presentation data provided' },
        { status: 400 }
      )
    }

    console.log('📝 Presentation data:', {
      title: presentationData.title,
      slideCount: presentationData.slides?.length
    })

    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `presentation-${organizationId || 'default'}-${timestamp}.pptx`
    const tempDataPath = path.join('/tmp', `presentation-data-${timestamp}.json`)
    const outputPath = path.join(process.cwd(), 'presentation-builder', 'output', fileName)

    // Write presentation data to temp file
    await writeFile(tempDataPath, JSON.stringify({ ...presentationData, theme }))

    console.log('📂 Temp data file:', tempDataPath)
    console.log('📂 Output path:', outputPath)

    // Call the builder
    const builderPath = path.join(process.cwd(), 'presentation-builder', 'builder.js')
    const command = `cd ${path.join(process.cwd(), 'presentation-builder')} && node "${builderPath}" "${tempDataPath}" "${fileName}"`

    console.log('🔧 Executing:', command)

    const { stdout, stderr } = await execAsync(command, {
      env: {
        ...process.env,
        NODE_ENV: 'production'
      },
      timeout: 60000 // 60 second timeout
    })

    console.log('✅ Builder stdout:', stdout)
    if (stderr) {
      console.warn('⚠️ Builder stderr:', stderr)
    }

    // Read the generated file
    const fileBuffer = await readFile(outputPath)
    const base64File = fileBuffer.toString('base64')

    // Clean up temp file
    try {
      await unlink(tempDataPath)
    } catch (cleanupError) {
      console.warn('Failed to clean up temp file:', cleanupError)
    }

    console.log('✅ Presentation built successfully')

    // Return file data
    return NextResponse.json({
      success: true,
      fileName,
      filePath: outputPath,
      fileSize: fileBuffer.length,
      fileData: base64File, // Base64 encoded for transfer
      metadata: {
        title: presentationData.title,
        slideCount: presentationData.slides?.length,
        generated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Build presentation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'SignalDeck presentation builder API is running',
    version: '1.0.0',
    builderPath: path.join(process.cwd(), 'presentation-builder')
  })
}
