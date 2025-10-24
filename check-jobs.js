// Quick script to check job queue
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkJobs() {
  console.log('🔍 Checking job queue...\n')

  const { data: jobs, error } = await supabase
    .from('job_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`Found ${jobs.length} jobs:`)
  jobs.forEach(job => {
    console.log(`
ID: ${job.id}
Type: ${job.job_type}
Status: ${job.status}
Payload: ${JSON.stringify(job.payload)}
Created: ${job.created_at}
Attempts: ${job.attempts}/${job.max_attempts}
Error: ${job.error || 'none'}
---`)
  })
}

checkJobs().then(() => process.exit(0))
