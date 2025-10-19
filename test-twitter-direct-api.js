// Test Twitter API directly to see what error we get

const BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAAPE63QEAAAAAGHKyYHaym491SNJi5V%2FNZJ2BEO4%3DaKL1YL3qbjxZCorT42VtIAjBMrDqXgMM7ma5bwCZa1iErPJ2qV'

async function testTwitterAPI() {
  console.log('🐦 Testing Twitter API directly...\n')

  const url = 'https://api.twitter.com/2/tweets/search/recent?query=Tesla&max_results=10'

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
      }
    })

    console.log('Status:', response.status)
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))

  } catch (error) {
    console.error('Error:', error.message)
  }
}

testTwitterAPI()