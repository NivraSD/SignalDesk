// Test niv-geo-content-selector with 3 scenarios
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment')
  console.error('SUPABASE_URL:', SUPABASE_URL)
  process.exit(1)
}

async function testContentSelector(scenario) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Testing: ${scenario.name}`)
  console.log('='.repeat(80))
  console.log('Input:', JSON.stringify(scenario.input, null, 2))

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/niv-geo-content-selector`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(scenario.input)
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ Error:', error)
    return
  }

  const result = await response.json()

  console.log('\n📊 Results:')
  console.log(`Total Content Types: ${result.total_count}`)
  console.log(`Automated: ${result.automated.length}`)
  console.log(`User-Assisted: ${result.user_assisted.length}`)
  console.log(`Expected Impact: ${result.expected_impact}`)
  console.log(`Time Investment: ${result.time_investment}`)

  console.log('\n⚡ Automated Content Types:')
  result.automated.forEach(ct => {
    console.log(`  - ${ct.label} (${ct.citation_rate}% citation, ${ct.effort} effort)`)
  })

  if (result.user_assisted.length > 0) {
    console.log('\n🤝 User-Assisted Content Types:')
    result.user_assisted.forEach(ct => {
      console.log(`  - ${ct.label} (${ct.citation_rate}% citation, ${ct.time_per_week}h/week)`)
    })
  }

  if (result.recommendations.length > 0) {
    console.log('\n💡 Recommendations:')
    result.recommendations.forEach(rec => {
      console.log(`  - ${rec}`)
    })
  }

  // Validate expectations
  console.log('\n✅ Validation:')
  const expectations = scenario.expectations

  if (expectations.min_automated && result.automated.length < expectations.min_automated) {
    console.log(`  ❌ Expected at least ${expectations.min_automated} automated, got ${result.automated.length}`)
  } else if (expectations.min_automated) {
    console.log(`  ✅ Automated count: ${result.automated.length} >= ${expectations.min_automated}`)
  }

  if (expectations.max_user_assisted && result.user_assisted.length > expectations.max_user_assisted) {
    console.log(`  ❌ Expected at most ${expectations.max_user_assisted} user-assisted, got ${result.user_assisted.length}`)
  } else if (expectations.max_user_assisted) {
    console.log(`  ✅ User-assisted count: ${result.user_assisted.length} <= ${expectations.max_user_assisted}`)
  }

  if (expectations.should_include) {
    expectations.should_include.forEach(ct => {
      const found = [...result.automated, ...result.user_assisted].find(c => c.id === ct)
      if (found) {
        console.log(`  ✅ Includes ${ct}`)
      } else {
        console.log(`  ❌ Missing expected content type: ${ct}`)
      }
    })
  }

  if (expectations.should_not_include) {
    expectations.should_not_include.forEach(ct => {
      const found = [...result.automated, ...result.user_assisted].find(c => c.id === ct)
      if (!found) {
        console.log(`  ✅ Correctly excludes ${ct}`)
      } else {
        console.log(`  ❌ Should not include: ${ct}`)
      }
    })
  }
}

// Scenario 1: B2B SaaS Driving Sales (Limited Time)
const scenario1 = {
  name: 'B2B SaaS Driving Sales (2 hours/week)',
  input: {
    objective: 'drive_sales',
    industry: 'B2B SaaS',
    constraints: {
      time_per_week: 2,
      budget: 'medium',
      technical_capability: 'medium'
    },
    current_presence: {
      has_g2_profile: true,
      has_blog: true,
      has_youtube: false,
      has_technical_docs: false
    }
  },
  expectations: {
    min_automated: 7,
    max_user_assisted: 3,
    should_include: ['schema-optimization', 'case-study', 'comparison-copy'],
    should_not_include: ['stackoverflow-answer', 'podcast-pitch']
  }
}

// Scenario 2: Investment Firm Thought Leadership (More Time)
const scenario2 = {
  name: 'Investment Firm Thought Leadership (4 hours/week)',
  input: {
    objective: 'thought_leadership',
    industry: 'Investment',
    constraints: {
      time_per_week: 4,
      budget: 'high',
      technical_capability: 'low'
    },
    current_presence: {
      has_g2_profile: false,
      has_blog: true,
      has_youtube: false,
      has_technical_docs: false
    }
  },
  expectations: {
    min_automated: 7,
    max_user_assisted: 5,
    should_include: ['schema-optimization', 'thought-leadership', 'linkedin-post', 'whitepaper', 'media-pitch'],
    should_not_include: ['stackoverflow-answer', 'github-docs']
  }
}

// Scenario 3: Developer Tools Technical Adoption (High Technical Capability)
const scenario3 = {
  name: 'Developer Tools Technical Adoption (High Tech, 1 hour/week)',
  input: {
    objective: 'technical_adoption',
    industry: 'Developer Tools',
    constraints: {
      time_per_week: 1,
      budget: 'low',
      technical_capability: 'high'
    },
    current_presence: {
      has_g2_profile: false,
      has_blog: true,
      has_youtube: false,
      has_technical_docs: true,
      has_github: true
    }
  },
  expectations: {
    min_automated: 6,
    max_user_assisted: 3,
    should_include: ['schema-optimization', 'doc-outline', 'technical-blog', 'stackoverflow-answer'],
    should_not_include: ['media-pitch', 'podcast-pitch', 'quora-answer']
  }
}

// Run all scenarios
async function runAllTests() {
  console.log('🧪 Testing niv-geo-content-selector Edge Function')
  console.log('=' .repeat(80))

  await testContentSelector(scenario1)
  await testContentSelector(scenario2)
  await testContentSelector(scenario3)

  console.log('\n' + '='.repeat(80))
  console.log('✅ All tests complete!')
  console.log('='.repeat(80))
}

runAllTests().catch(console.error)
