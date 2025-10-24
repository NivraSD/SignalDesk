#!/usr/bin/env ts-node

// Memory Vault V2: Job Worker Runner
// This script starts the background job worker

import { startJobWorker } from '../src/lib/workers/job-worker'

console.log('🚀 Starting Memory Vault V2 job worker...')
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`🔗 Supabase URL: ${process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}`)
console.log('')

// Start the worker
startJobWorker()
  .then(() => {
    console.log('✅ Job worker started successfully')
  })
  .catch((error) => {
    console.error('💥 Job worker crashed:', error)
    process.exit(1)
  })
