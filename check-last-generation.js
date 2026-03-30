/**
 * Check the last test generation
 */

import 'dotenv/config'

const GAMMA_API_KEY = 'sk-gamma-zFOvUwGMpXZaDiB5sWkl3a5lakNfP19E90ZUZUdZM'
const GAMMA_API_URL = 'https://public-api.gamma.app/v0.2'
const GENERATION_ID = 'HuJmokGGoGwlCaQiMRw9D'  // From latest test

async function checkGeneration() {
  console.log('🔍 Checking generation:', GENERATION_ID)

  const response = await fetch(`${GAMMA_API_URL}/generations/${GENERATION_ID}`, {
    method: 'GET',
    headers: {
      'X-API-KEY': GAMMA_API_KEY
    }
  })

  if (!response.ok) {
    console.error(`❌ Request failed: ${response.status}`)
    const text = await response.text()
    console.error(text)
    return
  }

  const data = await response.json()

  console.log('\n📊 Full Response:')
  console.log(JSON.stringify(data, null, 2))

  console.log('\n📋 Key Fields:')
  console.log(`   status: ${data.status}`)
  console.log(`   gammaUrl: ${data.gammaUrl || 'NOT PROVIDED'}`)
  console.log(`   exportUrl: ${data.exportUrl || 'NOT PROVIDED'}`)
  console.log(`   pptxDownloadUrl: ${data.pptxDownloadUrl || 'NOT PROVIDED'}`)
  console.log(`   pdfDownloadUrl: ${data.pdfDownloadUrl || 'NOT PROVIDED'}`)
}

checkGeneration().catch(console.error)
