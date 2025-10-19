// Test if GOOGLE_API_KEY works with Gemini 1.5
const GOOGLE_API_KEY = 'AIzaSyBwiqy6i_fB_-u82B0tmJiBLGkg_Zu3lvc'

async function testGemini15WithAPIKey() {
  console.log('Testing Gemini 1.5 Flash with API key...')
  
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GOOGLE_API_KEY,
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
    console.log('✅ API Key works!')
    console.log('Response:', data.candidates?.[0]?.content?.parts?.[0]?.text)
  } else {
    console.log('❌ Error:', data)
  }
}

testGemini15WithAPIKey()
