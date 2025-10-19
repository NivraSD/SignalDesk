// Test if GOOGLE_API_KEY works with Gemini
const GOOGLE_API_KEY = 'AIzaSyBwiqy6i_fB_-u82B0tmJiBLGkg_Zu3lvc'

async function testGeminiWithAPIKey() {
  console.log('Testing Gemini with API key...')
  
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GOOGLE_API_KEY,
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
  console.log('Response:', JSON.stringify(data, null, 2))
}

testGeminiWithAPIKey()
