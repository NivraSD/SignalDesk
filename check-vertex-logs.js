const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2UiLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.RpKF1aZvCKJuVgyt-BimnILgMFDJMBm0mLTqnX0bSHU'

async function checkLogs() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data, error } = await supabase.functions.invokeRaw('logs', {
    method: 'POST',
    body: {
      function_name: 'vertex-ai-visual',
      limit: 10
    }
  })

  if (error) {
    console.error('Error fetching logs:', error)
    return
  }

  const logs = await data.text()
  console.log('Recent vertex-ai-visual logs:')
  console.log(logs)
}

checkLogs()