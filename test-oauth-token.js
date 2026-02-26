// Test OAuth2 token generation for Vertex AI
const CLIENT_ID = '828236259059-bdelovhuc12rgtavs7c5j9o7ftjgtof1.apps.googleusercontent.com'

// For OAuth2, we need to:
// 1. Get authorization code from user
// 2. Exchange code for access token
// 3. Use access token with Vertex AI

async function getOAuthURL() {
  const REDIRECT_URI = 'http://localhost:3000/auth/callback' // or your actual redirect URI
  const SCOPES = [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/generative-language'
  ].join(' ')
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', SCOPES)
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  
  console.log('OAuth Authorization URL:')
  console.log(authUrl.toString())
  console.log('\n1. Open this URL in your browser')
  console.log('2. Authorize the application')
  console.log('3. Copy the authorization code from the redirect URL')
  console.log('4. Use the code to get an access token')
}

// This function would exchange the auth code for an access token
async function exchangeCodeForToken(authCode, clientSecret) {
  const tokenUrl = 'https://oauth2.googleapis.com/token'
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code: authCode,
      client_id: CLIENT_ID,
      client_secret: clientSecret, // You need the client secret
      redirect_uri: 'http://localhost:3000/auth/callback',
      grant_type: 'authorization_code'
    })
  })
  
  const data = await response.json()
  return data
}

getOAuthURL()

console.log('\n⚠️  NOTE: You also need the CLIENT_SECRET to complete OAuth2 flow')
console.log('The client secret should be available in your Google Cloud Console')
console.log('under APIs & Services > Credentials > OAuth 2.0 Client IDs')
