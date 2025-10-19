import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
)

const { data, error } = await supabase
  .from('presentation_generations')
  .select('*')
  .eq('id', '92a8040c-3683-4501-87f6-59193f69fab4')
  .single()

if (error) {
  console.error('Error:', error)
} else {
  console.log('Status:', data.status)
  console.log('Progress:', data.progress + '%')
  console.log('File URL:', data.file_url)
  console.log('Download URL:', data.download_url)
  
  if (data.file_url) {
    console.log('\n✅ Your presentation is ready!')
    console.log('📥 Download here:', data.file_url)
  }
}
