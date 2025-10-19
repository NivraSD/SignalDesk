// Test Google AI Studio API with API key (different from Vertex AI)
const API_KEY = 'AIzaSyBwiqy6i_fB_-u82B0tmJiBLGkg_Zu3lvc'

async function testGoogleAIStudio() {
  console.log('Testing Google AI Studio API with API key...')
  
  // This is the Google AI Studio endpoint, NOT Vertex AI
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + API_KEY,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Say hello'
          }]
        }]
      })
    }
  )
  
  console.log('Response status:', response.status)
  const data = await response.json()
  
  if (response.ok) {
    console.log('✅ API Key works with Google AI Studio!')
    console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text)
  } else {
    console.log('❌ Error:', data)
  }
}

testGoogleAIStudio()
