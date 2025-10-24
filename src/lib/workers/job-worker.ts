// Memory Vault V2: Background Job Worker
// Purpose: Process intelligence jobs asynchronously
// Performance: Runs separately from main app, doesn't block user requests

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const WORKER_ID = `worker-${process.pid}-${Date.now()}`

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface Job {
  id: string
  job_type: string
  payload: any
  attempts: number
  max_attempts: number
}

// Main worker loop
export async function startJobWorker() {
  console.log(`🚀 Job worker started: ${WORKER_ID}`)

  while (true) {
    try {
      // Get next pending job (with priority)
      const job = await getNextJob()

      if (job) {
        console.log(`📋 Processing job: ${job.id} (${job.job_type})`)
        await processJob(job)
      } else {
        // No jobs available, wait 2 seconds
        await sleep(2000)
      }
    } catch (error) {
      console.error('❌ Worker error:', error)
      await sleep(5000) // Wait 5s on error
    }
  }
}

// Get next job from queue
async function getNextJob(): Promise<Job | null> {
  try {
    // Use FOR UPDATE SKIP LOCKED to prevent race conditions
    const { data, error } = await supabase.rpc('get_next_job', {
      worker_id: WORKER_ID
    })

    if (error) {
      // If function doesn't exist, fall back to simple query
      const { data: jobs, error: queryError } = await supabase
        .from('job_queue')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)

      if (queryError || !jobs || jobs.length === 0) {
        return null
      }

      const job = jobs[0]

      // Mark as processing
      await supabase
        .from('job_queue')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
          worker_id: WORKER_ID
        })
        .eq('id', job.id)

      return job
    }

    return data?.[0] || null
  } catch (error) {
    console.error('Error getting next job:', error)
    return null
  }
}

// Process job based on type
async function processJob(job: Job): Promise<void> {
  const startTime = Date.now()

  try {
    switch (job.job_type) {
      case 'analyze-content':
        await processContentAnalysis(job)
        break

      case 'analyze-brand-asset':
        await processBrandAssetAnalysis(job)
        break

      case 'warm-cache':
        await processCacheWarming(job)
        break

      default:
        console.warn(`Unknown job type: ${job.job_type}`)
    }

    // Mark job as completed
    await supabase
      .from('job_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id)

    const processingTime = Date.now() - startTime
    console.log(`✅ Job completed in ${processingTime}ms: ${job.id}`)

    // Log performance
    await logMetric('intelligence_processing_time', processingTime)

  } catch (error) {
    console.error(`❌ Job failed: ${job.id}`, error)

    const attempts = job.attempts + 1

    if (attempts >= job.max_attempts) {
      // Max attempts reached, mark as failed
      await supabase
        .from('job_queue')
        .update({
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)

      console.error(`❌ Job failed permanently after ${attempts} attempts: ${job.id}`)
    } else {
      // Retry later
      await supabase
        .from('job_queue')
        .update({
          status: 'pending',
          attempts,
          error: error instanceof Error ? error.message : String(error)
        })
        .eq('id', job.id)

      console.log(`🔄 Job will be retried (attempt ${attempts}/${job.max_attempts}): ${job.id}`)
    }
  }
}

// Process content analysis job
async function processContentAnalysis(job: Job): Promise<void> {
  const { contentId } = job.payload

  // Call the niv-memory-intelligence Edge Function
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/niv-memory-intelligence`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ contentId })
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Intelligence function failed: ${error}`)
  }

  const result = await response.json()
  console.log(`✅ Content intelligence completed:`, result)
}

// Process brand asset analysis job
async function processBrandAssetAnalysis(job: Job): Promise<void> {
  const { assetId, fileUrl, fileName, assetType } = job.payload

  // Call the analyze-brand-asset Edge Function
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/analyze-brand-asset`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ assetId, fileUrl, fileName, assetType })
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Brand asset analysis failed: ${error}`)
  }

  const result = await response.json()
  console.log(`✅ Brand asset analysis completed:`, result)
}

// Process cache warming job
async function processCacheWarming(job: Job): Promise<void> {
  const { organizationId, contentTypes } = job.payload

  // This would warm the brand context cache
  // For now, just log it
  console.log(`🔥 Cache warming for org ${organizationId}:`, contentTypes)

  // TODO: Implement cache warming logic
  // This should query brand_assets and populate cache
}

// Log performance metrics
async function logMetric(metricType: string, metricValue: number): Promise<void> {
  try {
    await supabase
      .from('performance_metrics')
      .insert({
        metric_type: metricType,
        metric_value: metricValue,
        metadata: { worker_id: WORKER_ID },
        created_at: new Date().toISOString()
      })
  } catch (error) {
    // Don't fail on metrics logging
  }
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Job worker shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🛑 Job worker shutting down gracefully...')
  process.exit(0)
})

// Start worker if run directly
if (require.main === module) {
  startJobWorker().catch((error) => {
    console.error('💥 Worker crashed:', error)
    process.exit(1)
  })
}
