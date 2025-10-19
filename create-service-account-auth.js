// Alternative: Use Service Account for server-side auth
// This is better for edge functions

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2UiLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.RpKF1aZvCKJuVgyt-BimnILgMFDJMBm0mLTqnX0bSHU'

async function setupServiceAccountAuth() {
  console.log('📝 Service Account Setup Instructions:')
  console.log('=' .repeat(50))
  
  console.log('\n1. Go to Google Cloud Console:')
  console.log('   https://console.cloud.google.com/apis/credentials?project=sigdesk-1753801804417')
  
  console.log('\n2. Create a Service Account:')
  console.log('   - Click "CREATE CREDENTIALS" > "Service account"')
  console.log('   - Name: "signaldesk-vertex-ai"')
  console.log('   - Grant role: "Vertex AI User"')
  
  console.log('\n3. Create JSON Key:')
  console.log('   - Click on the service account')
  console.log('   - Go to "Keys" tab')
  console.log('   - Add Key > Create new key > JSON')
  console.log('   - Download the JSON file')
  
  console.log('\n4. Add to Supabase (run this command):')
  console.log('   npx supabase secrets set GOOGLE_SERVICE_ACCOUNT="$(cat path/to/your-key.json)"')
  
  console.log('\n5. Or temporarily test with:')
  console.log('   export GOOGLE_APPLICATION_CREDENTIALS="path/to/your-key.json"')
  
  console.log('\n' + '=' .repeat(50))
  console.log('🔑 OAuth Client ID: 828236259059-bdelovhuc12rgtavs7c5j9o7ftjgtof1.apps.googleusercontent.com')
  console.log('\nNOTE: Service accounts are better for server-side apps like edge functions')
  console.log('OAuth2 with client IDs is better for user-facing apps')
}

setupServiceAccountAuth()
