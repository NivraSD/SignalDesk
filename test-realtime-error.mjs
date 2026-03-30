import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('Testing real-time-alert-router with Mitsui...')

const { data, error } = await supabase.functions.invoke('real-time-alert-router', {
  body: {
    organization_name: 'Mitsui & Co.',
    organization_id: '4f9504ea-9ba3-4696-9e75-8f226f23f4ad',
    time_window: '6hours',
    route_to_opportunities: false,
    route_to_crisis: true,
    route_to_predictions: true
  }
})

if (error) {
  console.error('❌ Error:', error)
  console.error('Full error:', JSON.stringify(error, null, 2))
} else {
  console.log('✅ Success:', data)
}
