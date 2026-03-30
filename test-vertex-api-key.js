// Test Vertex AI API key directly
const VERTEX_AI_KEY = 'AQ.Ab8RN6JIq3SAITun6WEaIrODV66j88eNmzXlXVz2tnD1zDWsoA'
const PROJECT_ID = 'sigdesk-1753801804417'

async function testVertexAPIKey() {
  console.log('Testing Vertex AI API key...')
  
  // Try to list models to verify API key
  const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/models?key=${VERTEX_AI_KEY}`
  
  console.log('Testing endpoint:', endpoint)
  
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Response status:', response.status)
    const text = await response.text()
    console.log('Response:', text)
    
    if (response.ok) {
      console.log('✅ API key appears to be valid!')
    } else {
      console.log('❌ API key validation failed')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

testVertexAPIKey()
