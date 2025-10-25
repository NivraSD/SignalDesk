/**
 * Check what Gamma API actually returns
 */

import 'dotenv/config'

const GAMMA_API_KEY = 'sk-gamma-zFOvUwGMpXZaDiB5sWkl3a5lakNfP19E90ZUZUdZM'
const GAMMA_API_URL = 'https://public-api.gamma.app/v0.2'

// Use the generation ID from the test
const GENERATION_ID = 'wPGCnCXGB32wO8UzVOrif'

async function checkGammaResponse() {
  console.log('🔍 Checking Gamma API response...\n')

  const response = await fetch(`${GAMMA_API_URL}/generations/${GENERATION_ID}`, {
    method: 'GET',
    headers: {
      'X-API-KEY': GAMMA_API_KEY
    }
  })

  if (!response.ok) {
    console.error(`❌ Request failed: ${response.status} ${response.statusText}`)
    const text = await response.text()
    console.error(text)
    return
  }

  const data = await response.json()

  console.log('📊 Full Gamma API Response:')
  console.log(JSON.stringify(data, null, 2))

  console.log('\n📋 Analysis:')
  console.log(`Status: ${data.status}`)
  console.log(`Gamma URL: ${data.gammaUrl || 'Not provided'}`)
  console.log(`PPTX Download URL: ${data.pptxDownloadUrl || '❌ NOT PROVIDED'}`)
  console.log(`PDF Download URL: ${data.pdfDownloadUrl || '❌ NOT PROVIDED'}`)

  if (!data.pptxDownloadUrl && !data.pdfDownloadUrl) {
    console.log('\n⚠️  Gamma is not providing export download URLs!')
    console.log('This means:')
    console.log('1. The exportAs parameter may not be supported in this Gamma API version')
    console.log('2. Or exports are only available through the Gamma web UI')
    console.log('3. Or we need to use a different endpoint to request exports')
  }

  // Check for any export-related fields
  console.log('\n🔍 All fields in response:')
  Object.keys(data).forEach(key => {
    console.log(`   ${key}: ${typeof data[key]}`)
  })
}

checkGammaResponse().catch(console.error)
